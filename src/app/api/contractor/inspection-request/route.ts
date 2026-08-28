import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { validateRequestedDate } from "@/lib/inspection-cutoff";

/**
 * Contractor-initiated inspection request.
 *
 * Unlike /api/inspection-request (homeowner, token based) this route is
 * authenticated: the signed-in user must resolve to a contractor profile AND
 * the job must belong to that contractor. The noon cutoff is re-validated
 * server side so a tampered client cannot book an ineligible date.
 */
export async function POST(req: Request) {
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
        { error: "Your login is not linked to a contractor profile." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const jobId = String(body.job_id || "").trim();
    const requestType = body.request_type === "final" ? "final" : "general";
    const inspectionCode = String(body.inspection_code || "").trim();
    const notes = String(body.notes || "").trim();

    if (!jobId) {
      return NextResponse.json({ error: "Missing job." }, { status: 400 });
    }

    if (!inspectionCode) {
      return NextResponse.json(
        { error: "Please enter the inspection code or name." },
        { status: 400 }
      );
    }

    if (inspectionCode.length > 120) {
      return NextResponse.json(
        { error: "Inspection code or name is too long." },
        { status: 400 }
      );
    }

    const dateCheck = validateRequestedDate(body.preferred_date);
    if (!dateCheck.ok) {
      return NextResponse.json({ error: dateCheck.error }, { status: 400 });
    }

    // Authorization: the job must belong to this contractor.
    const service = createServiceClient();
    const { data: job } = await service
      .from("jobs")
      .select("id, contractor_id, property_address")
      .eq("id", jobId)
      .eq("contractor_id", contractor.id)
      .maybeSingle();

    if (!job) {
      return NextResponse.json(
        { error: "That project is not available on your account." },
        { status: 403 }
      );
    }

    // Duplicate guard: don't stack identical pending requests.
    const { data: existing } = await service
      .from("inspection_requests")
      .select("id")
      .eq("job_id", jobId)
      .eq("status", "Pending")
      .ilike("inspection_type", inspectionCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error:
            "You already have a pending request for that inspection. We will confirm the schedule shortly.",
        },
        { status: 409 }
      );
    }

    const { data: inserted, error } = await service
      .from("inspection_requests")
      .insert({
        job_id: jobId,
        requested_by: "contractor",
        request_type: requestType,
        inspection_type: inspectionCode,
        inspection_code: inspectionCode,
        preferred_date: dateCheck.date,
        requested_by_contractor_id: contractor.id,
        notes: notes || null,
        status: "Pending",
      })
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, request: inserted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
