import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const BUCKET = "job-documents";

/**
 * Contractor-facing signed URL. Only issues a URL when the requesting user
 * is signed in AND the document belongs to a job assigned to their
 * contractor profile AND the document is visible to contractors.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: doc } = await service
    .from("job_documents")
    .select("id, job_id, storage_path, file_name, visible_to_contractor")
    .eq("id", params.id)
    .maybeSingle();
  if (!doc || !doc.visible_to_contractor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: job } = await service
    .from("jobs")
    .select("contractor_id")
    .eq("id", doc.job_id)
    .maybeSingle();
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: contractor } = await service
    .from("contractors")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!contractor || contractor.id !== job.contractor_id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { data: signed, error } = await service.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 60 * 10, { download: doc.file_name });
  if (error || !signed?.signedUrl) {
    return NextResponse.json(
      { error: error?.message || "Signing failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ url: signed.signedUrl });
}
