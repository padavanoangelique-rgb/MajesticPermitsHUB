import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const BUCKET = "job-documents";

/**
 * Homeowner-facing document download.
 *
 * Requires:
 *  - a valid, enabled, non-expired homeowner_links row for `token`
 *  - the document belongs to that link's job
 *  - the document is flagged visible_to_homeowner
 *
 * Returns a redirect to a short-lived signed URL.
 */
export async function GET(
  _req: Request,
  { params }: { params: { token: string; id: string } }
) {
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from("homeowner_links")
    .select("job_id, enabled, expires_at")
    .eq("token", params.token)
    .maybeSingle();
  if (!link || link.enabled === false) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 404 });
  }

  const { data: doc } = await supabase
    .from("job_documents")
    .select("id, job_id, storage_path, file_name, visible_to_homeowner")
    .eq("id", params.id)
    .maybeSingle();
  if (
    !doc ||
    doc.job_id !== link.job_id ||
    doc.visible_to_homeowner !== true
  ) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { data: signed, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 60 * 5, { download: doc.file_name });
  if (error || !signed?.signedUrl) {
    return NextResponse.json(
      { error: error?.message || "Signing failed" },
      { status: 500 }
    );
  }
  return NextResponse.redirect(signed.signedUrl);
}
