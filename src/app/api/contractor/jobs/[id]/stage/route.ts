import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { PERMIT_STAGES } from "@/lib/stages";

export const dynamic = "force-dynamic";

/**
 * Contractor-scoped stage bump.
 *
 * Only:
 *   - the signed-in user's own contractor record can update
 *   - a job whose contractor_id matches that record
 *   - to a stage.title from the canonical PERMIT_STAGES list
 *
 * We use the service-role client after the ownership check so RLS on jobs
 * (which today only lets admins update) doesn't block the write.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
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
      return NextResponse.json({ error: "No contractor profile" }, { status: 403 });
    }

    const body = await req.json();
    const stage = typeof body?.stage === "string" ? body.stage.trim() : "";
    const allowed = new Set(PERMIT_STAGES.map((s) => s.title));
    if (!allowed.has(stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }

    // Confirm this contractor owns the job before we touch it
    const service = createServiceClient();
    const { data: job, error: lookupError } = await service
      .from("jobs")
      .select("id, contractor_id")
      .eq("id", params.id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 400 });
    }
    if (!job || job.contractor_id !== contractor.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const { error } = await service
      .from("jobs")
      .update({ stage })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Update failed" },
      { status: 500 }
    );
  }
}
