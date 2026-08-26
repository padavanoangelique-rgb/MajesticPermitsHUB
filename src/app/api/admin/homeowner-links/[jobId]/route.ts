import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** Ensure a homeowner_link row exists for the job and return it. */
async function ensureLink(jobId: string) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("homeowner_links")
    .select("*")
    .eq("job_id", jobId)
    .maybeSingle();
  if (existing) return existing;

  const token = randomBytes(24).toString("hex");
  const { data: created, error } = await supabase
    .from("homeowner_links")
    .insert({ job_id: jobId, token, enabled: true })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return created;
}

/** Update sharing controls (enabled, expires_at) or regenerate the token. */
export async function PATCH(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();

    // Make sure a row exists before we update it
    await ensureLink(params.jobId);

    const patch: Record<string, any> = {};
    if ("enabled" in body) patch.enabled = !!body.enabled;
    if ("expires_at" in body) {
      patch.expires_at = body.expires_at ? new Date(body.expires_at).toISOString() : null;
    }
    if (body.regenerate === true) {
      patch.token = randomBytes(24).toString("hex");
      patch.regenerated_at = new Date().toISOString();
      patch.view_count = 0;
      patch.last_viewed_at = null;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No changes" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("homeowner_links")
      .update(patch)
      .eq("job_id", params.jobId)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, link: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Update failed" },
      { status: 500 }
    );
  }
}
