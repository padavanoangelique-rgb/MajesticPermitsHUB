import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const contractor = await getContractorForUser(user);
  if (!contractor) return NextResponse.json({ error: "No contractor profile" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const jobId = typeof body.job_id === "string" ? body.job_id : "";
  if (!jobId) return NextResponse.json({ error: "Pick a job" }, { status: 400 });

  const service = createServiceClient();
  const { data: job } = await service
    .from("jobs")
    .select("id, contractor_id")
    .eq("id", jobId)
    .maybeSingle();
  if (!job || job.contractor_id !== contractor.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const openings = Array.isArray(body.openings)
    ? body.openings.slice(0, 40).map((item: any) => ({
        label: String(item?.label || "Opening").slice(0, 40),
        kind: item?.kind === "door" ? "door" : "window",
        width: String(item?.width || "").slice(0, 12),
        height: String(item?.height || "").slice(0, 12),
      }))
    : [];

  const { error } = await service.from("job_measures").upsert({
    job_id: jobId,
    contractor_id: contractor.id,
    openings,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
