import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { nextInspectionDate, isValidInspectionDate } from "@/lib/next-inspection-day";
import { sendAdminSms } from "@/lib/sms";
import { notifyAdmin } from "@/lib/admin-notify";
import {
  buildRequestNotes,
  formatPhone,
  isValidUsPhone,
} from "@/lib/onsite-contact";

export const dynamic = "force-dynamic";

const EDITABLE = new Set(["requested", "reinspection_requested"]);
const BLOCKED = new Set([
  "scheduled",
  "passed",
  "partial_pass",
  "reinspection_scheduled",
  "closed",
]);

async function requireContractorJob(jobId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }

  const contractor = await getContractorForUser(user);
  if (!contractor) {
    return {
      error: NextResponse.json({ error: "No contractor profile" }, { status: 403 }),
    };
  }

  if (!jobId) {
    return { error: NextResponse.json({ error: "Missing job_id" }, { status: 400 }) };
  }

  const service = createServiceClient();
  const { data: job, error: lookupError } = await service
    .from("jobs")
    .select("id, contractor_id, property_address")
    .eq("id", jobId)
    .maybeSingle();

  if (lookupError) {
    return { error: NextResponse.json({ error: lookupError.message }, { status: 400 }) };
  }
  if (!job || job.contractor_id !== contractor.id) {
    return { error: NextResponse.json({ error: "Job not found" }, { status: 404 }) };
  }

  return { contractor, job, service };
}

function parseBodyDate(input: string) {
  return isValidInspectionDate(input) ? input : nextInspectionDate();
}

function parsePhone(raw: unknown) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return "";
  if (!isValidUsPhone(value)) {
    throw new Error("Enter a 10-digit on-site contact number.");
  }
  return formatPhone(value);
}

async function loadSlot(service: ReturnType<typeof createServiceClient>, jobId: string, slot: number) {
  const { data: inspection } = await service
    .from("job_inspections")
    .select("id, slot, status, inspection_type, requested_date")
    .eq("job_id", jobId)
    .eq("slot", slot)
    .maybeSingle();
  return inspection;
}

async function upsertPendingRequest(
  service: ReturnType<typeof createServiceClient>,
  args: {
    jobId: string;
    contractorId: string;
    inspectionType: string;
    requestedDate: string;
    phone: string;
    status?: string;
  }
) {
  const notes = buildRequestNotes(args.phone);
  const { data: existing } = await service
    .from("inspection_requests")
    .select("id")
    .eq("job_id", args.jobId)
    .eq("status", "Pending")
    .eq("inspection_type", args.inspectionType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await service
      .from("inspection_requests")
      .update({
        preferred_date: args.requestedDate,
        notes,
        status: args.status || "Pending",
      })
      .eq("id", existing.id);
    return;
  }

  if ((args.status || "Pending") === "Cancelled") return;

  await service.from("inspection_requests").insert({
    job_id: args.jobId,
    requested_by: "contractor",
    requested_by_contractor_id: args.contractorId,
    inspection_type: args.inspectionType,
    preferred_date: args.requestedDate,
    notes,
    status: "Pending",
    request_type: "slot_request",
  });
}

/**
 * Contractor-side inspection request for a specific slot.
 * POST create, PATCH edit date/phone, DELETE cancel while still pending.
 */
export async function POST(
  req: Request,
  { params }: { params: { slot: string } }
) {
  return handleWrite(req, params.slot, "request");
}

export async function PATCH(
  req: Request,
  { params }: { params: { slot: string } }
) {
  return handleWrite(req, params.slot, "edit");
}

export async function DELETE(
  req: Request,
  { params }: { params: { slot: string } }
) {
  return handleWrite(req, params.slot, "cancel");
}

async function handleWrite(
  req: Request,
  slotParam: string,
  action: "request" | "edit" | "cancel"
) {
  try {
    const slot = Number(slotParam);
    if (!Number.isInteger(slot) || slot < 1 || slot > 3) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const jobId = typeof body?.job_id === "string" ? body.job_id : "";
    const auth = await requireContractorJob(jobId);
    if ("error" in auth && auth.error) return auth.error;
    const { contractor, job, service } = auth as Exclude<typeof auth, { error: NextResponse }>;

    const inspection = await loadSlot(service, jobId, slot);
    if (!inspection) {
      return NextResponse.json(
        { error: `Inspection slot ${slot} not found for this job` },
        { status: 404 }
      );
    }

    if (BLOCKED.has(inspection.status)) {
      return NextResponse.json(
        { error: "This inspection is already on the calendar. Call the office to change it." },
        { status: 409 }
      );
    }

    if (action !== "request" && !EDITABLE.has(inspection.status)) {
      return NextResponse.json(
        { error: "Nothing to edit or cancel on this slot." },
        { status: 409 }
      );
    }

    const inspectionLabel = inspection.inspection_type || `Inspection ${slot}`;
    const company = contractor.company_name || contractor.name;

    if (action === "cancel") {
      const { error: slotError } = await service
        .from("job_inspections")
        .update({
          status: "not_requested",
          requested_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", inspection.id);
      if (slotError) {
        return NextResponse.json({ error: slotError.message }, { status: 400 });
      }

      await service
        .from("inspection_requests")
        .update({ status: "Cancelled", handled_at: new Date().toISOString() })
        .eq("job_id", jobId)
        .eq("status", "Pending");

      const notice = `${job.property_address}: ${inspectionLabel} request cancelled (${company}).`;
      await notifyAdmin("inspection_needed", notice, jobId);
      await sendAdminSms(`Inspection cancelled — ${notice}`);

      return NextResponse.json({ ok: true, slot, status: "not_requested" });
    }

    let phone = "";
    try {
      phone = parsePhone(body?.onsite_contact);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    const requestedDate = parseBodyDate(
      typeof body?.requested_date === "string" ? body.requested_date : ""
    );
    const nextStatus =
      inspection.status === "failed" || inspection.status === "reinspection_requested"
        ? "reinspection_requested"
        : "requested";

    const { error: slotError } = await service
      .from("job_inspections")
      .update({
        status: nextStatus,
        requested_date: requestedDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inspection.id);

    if (slotError) {
      return NextResponse.json({ error: slotError.message }, { status: 400 });
    }

    await upsertPendingRequest(service, {
      jobId,
      contractorId: contractor.id,
      inspectionType: inspectionLabel,
      requestedDate,
      phone,
    });

    const contactBit = phone ? `; on-site ${phone}` : "";
    const verb = action === "edit" ? "updated" : "requested";
    const noticeMessage = `${job.property_address}: ${inspectionLabel} ${verb} for ${requestedDate}${contactBit} (${company}).`;
    await notifyAdmin("inspection_needed", noticeMessage, jobId);
    await sendAdminSms(`Inspection ${verb} — ${noticeMessage}`);

    return NextResponse.json({
      ok: true,
      slot,
      requested_date: requestedDate,
      onsite_contact: phone,
      status: nextStatus,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Request failed" },
      { status: 500 }
    );
  }
}
