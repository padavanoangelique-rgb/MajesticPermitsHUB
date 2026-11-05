import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/admin";
import { textClientStatusChange } from "@/lib/job-status-sms";
import { setWorkStatus, WorkStatusError } from "@/lib/work-status-actions";

export const dynamic = "force-dynamic";

/** Majestic sets where the work is on the inspection bar. The contractor sees the change on their dashboard. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const service = createServiceClient();
  try {
    const result = await setWorkStatus(service, { jobId: params.id, status: body.status, by: "admin", actor: user.email || undefined });
    await textClientStatusChange({ jobId: params.id, stage: result.stage, subStatus: undefined }).catch((err) => console.error("status sms failed", err));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof WorkStatusError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not save the status" }, { status: 500 });
  }
}
