import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set([
  "intake",
  "submitted_package",
  "corrections",
  "approved_permit",
  "inspections",
  "closeout",
  "other",
]);

const BUCKET = "job-documents";

/** Upload a file and record it in job_documents. */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const jobId = form.get("job_id") as string | null;
    const category = (form.get("category") as string | null) || "other";
    const label = (form.get("label") as string | null) || null;
    const visibleToHomeowner = form.get("visible_to_homeowner") === "true";
    const file = form.get("file") as File | null;

    if (!jobId || !file) {
      return NextResponse.json(
        { error: "job_id and file are required" },
        { status: 400 }
      );
    }
    if (!CATEGORIES.has(category)) {
      return NextResponse.json(
        { error: `Invalid category: ${category}` },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const storagePath = `${jobId}/${category}/${Date.now()}_${safeName}`;
    const bytes = await file.arrayBuffer();

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, Buffer.from(bytes), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    const { data: row, error: insErr } = await supabase
      .from("job_documents")
      .insert({
        job_id: jobId,
        category,
        label,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
        visible_to_contractor: true,
        visible_to_homeowner: visibleToHomeowner,
      })
      .select("id")
      .single();

    if (insErr) {
      // best-effort cleanup
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }

    return NextResponse.json({ id: row.id, storage_path: storagePath });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
