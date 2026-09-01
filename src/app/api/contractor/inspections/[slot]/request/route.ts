import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { nextInspectionDate, isValidInspectionDate } from "@/lib/next-inspection-day";
import { sendAdminSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

/**
 * Contractor-side inspection request for a specific slot.
 *
 * Sets job_inspections.status='requested' and requested_date to the date the
 * contractor picked, so the admin can see the ask and later fill in
 * scheduled_date + inspector info. The picked date must be on/after the next
 * available Miami business day (noon cutoff — see next-inspection-day.ts);
 * if the client didn't send one, or sent an invalid one, we fall back to
 * that computed minimum rather than rejecting the request outright.
 *
 * Also inserts a row into inspection_requests for the admin's requests queue,
 * and texts the admin that an inspection is needed.
 *
 * URL: POST /api/contractor/inspections/[slot]/request
 * Body: { job_id: string, requested_date?: string (YYYY-MM-DD) }
 */
export async function POST(
  req: Request,
  { params }: { params: { slot: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const contractor = await getContractorForUser(user);
    if (!contractor) {
      return NextResponse.json(
        { error: "No contractor profile" },
        { status: 403 }
      );
    }

    const slot = Number(params.slot);
    if (!Number.isInteger(slot) || slot < 1 || slot > 3) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const jobId = typeof body?.job_id === "string" ? body.job_id : "";
    if (!jobId) {
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
    }

    const requestedDateInput =
      typeof body?.requested_date === "string" ? body.requested_date : "";
    const requestedDate = isValidInspectionDate(requestedDateInput)
      ? requestedDateInput
      : nextInspectionDate();

    // Confirm this contractor owns the job before we touch it
    const service = createServiceClient();
    const { data: job, error: lookupError } = await service
      .from("jobs")
      .select("id, contractor_id, property_address")
      .eq("id", jobId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 400 });
    }
    if (!job || job.contractor_id !== contractor.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Find the specific inspection slot on this job
    const { data: inspection } = await service
      .from("job_inspections")
      .select("id, slot, status, inspection_type")
      .eq("job_id", jobId)
      .eq("slot", slot)
      .maybeSingle();

    if (!inspection) {
      return NextResponse.json(
        { error: `Inspection slot ${slot} not found for this job` },
        { status: 404 }
      );
    }

    // Flip the slot to 'requested' with the chosen date
    const { error: slotError } = await service
      .from("job_inspections")
      .update({
        status: "requested",
        requested_date: requestedDate,
      })
      .eq("id", inspection.id);

    if (slotError) {
      return NextResponse.json({ error: slotError.message }, { status: 400 });
    }

    // Also insert an admin-visible request row (so this shows up in the
    // /admin/inspection-requests queue with metadata about who asked when)
    await service.from("inspection_requests").insert({
      job_id: jobId,
      requested_by: "contractor",
      requested_by_contractor_id: contractor.id,
      inspection_type: inspection.inspection_type || `Inspection ${slot}`,
      preferred_date: requestedDate,
      status: "Pending",
      request_type: "slot_request",
    });

    await sendAdminSms(
      `Inspection needed — ${job.property_address}. ${
        inspection.inspection_type || `Inspection ${slot}`
      } requested for ${requestedDate} (${contractor.company_name || contractor.name}).`
    );

    return NextResponse.json({
      ok: true,
      slot,
      requested_date: requestedDate,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Request failed" },
      { status: 500 }
    );
  }
}
