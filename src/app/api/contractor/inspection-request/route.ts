import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "Rough-in",
  "Final",
  "Partial",
  "Re-inspection",
  "Other",
]);

/**
 * Contractor-side inspection request.
 *
 * The contractor must:
 *   - be signed in
 *   - have a linked contractor profile
 *   - own (contractor_id-match) the target job
 *
 * We insert into inspection_requests as `requested_by='contractor'` and stash
 * their contractor id in `requested_by_contractor_id` for admin visibility.
 * The button on the contractor detail page is intentionally NOT gated on the
 * job's stage — a contractor can request an inspection at any time until the
 * permit is fully closed (that page-level check is enforced in the UI).
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
        { error: "No contractor profile" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const jobId = typeof body?.job_id === "string" ? body.job_id : "";
    const inspectionType =
      typeof body?.inspection_type === "string"
        ? body.inspection_type.trim()
        : "Rough-in";
    const preferredDate =
      typeof body?.preferred_date === "string" && body.preferred_date
        ? body.preferred_date
        : null;
    const notes = typeof body?.notes === "string" ? body.notes.trim() : null;

    if (!jobId) {
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(inspectionType)) {
      return NextResponse.json(
        { error: "Invalid inspection type" },
        { status: 400 }
      );
    }

    // Confirm this contractor owns the job before we touch it
    const service = createServiceClient();
    const { data: job, error: lookupError } = await service
      .from("jobs")
      .select("id, contractor_id")
      .eq("id", jobId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 400 });
    }
    if (!job || job.contractor_id !== contractor.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const { error } = await service.from("inspection_requests").insert({
      job_id: jobId,
      requested_by: "contractor",
      requested_by_contractor_id: contractor.id,
      inspection_type: inspectionType,
      preferred_date: preferredDate,
      notes: notes || null,
      status: "Pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Request failed" },
      { status: 500 }
    );
  }
}
