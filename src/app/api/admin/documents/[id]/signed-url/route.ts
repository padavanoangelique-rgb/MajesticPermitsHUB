import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const BUCKET = "job-documents";

/** Generate a short-lived signed URL to view/download a job document. */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("job_documents")
    .select("storage_path, file_name")
    .eq("id", params.id)
    .maybeSingle();
  if (error || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { data: signed, error: sErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.storage_path, 60 * 10, {
      download: row.file_name,
    });
  if (sErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: sErr?.message || "Signing failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ url: signed.signedUrl });
}
