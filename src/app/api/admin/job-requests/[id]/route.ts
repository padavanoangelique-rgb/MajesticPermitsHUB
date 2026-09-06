import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth-guard";
import { DECLINED_REQUEST_SUB, PENDING_REQUEST_SUB } from "@/lib/job-request";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "decline" ? "decline" : "approve";

    const supabase = createServiceClient();
    const { data: job, error } = await supabase
      .from("jobs")
      .select("id, sub_status")
      .eq("id", params.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!job) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (job.sub_status !== PENDING_REQUEST_SUB) {
      return NextResponse.json({ error: "Already handled" }, { status: 409 });
    }

    if (action === "decline") {
      const { error: updErr } = await supabase
        .from("jobs")
        .update({
          sub_status: DECLINED_REQUEST_SUB,
          next_step: "Contractor request declined",
        })
        .eq("id", job.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
      return NextResponse.json({ ok: true, status: "declined" });
    }

    const { error: updErr } = await supabase
      .from("jobs")
      .update({
        sub_status: "Need to Submit",
        stage: "Getting your project ready",
        next_step: "Intake review of contractor documents",
      })
      .eq("id", job.id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
    return NextResponse.json({ ok: true, status: "approved", job_id: job.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 500 });
  }
}
