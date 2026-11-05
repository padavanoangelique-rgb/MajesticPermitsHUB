import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser, ownsJob } from "@/lib/contractor";
import { setWorkStatus, WorkStatusError } from "@/lib/work-status-actions";

export const dynamic = "force-dynamic";

/** A contractor sets where the work is on the inspection bar. The permit's own status is Majestic's and is not touched. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const contractor = await getContractorForUser(user);
  if (!contractor) return NextResponse.json({ error: "No contractor profile" }, { status: 403 });

  const service = createServiceClient();
  const { data: job } = await service.from("jobs").select("id, contractor_id").eq("id", params.id).maybeSingle();
  if (!job || !ownsJob(contractor, job.contractor_id)) return NextResponse.json({ error: "That job is not yours" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  try {
    const result = await setWorkStatus(service, { jobId: params.id, status: body.status, by: "contractor", actor: contractor.company_name || contractor.name || undefined });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof WorkStatusError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not save the status" }, { status: 500 });
  }
}
