import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const BUCKET = "job-documents";

/** Toggle share flags or the label on a document. */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const patch: Record<string, any> = {};
    if ("visible_to_homeowner" in body) {
      patch.visible_to_homeowner = !!body.visible_to_homeowner;
    }
    if ("visible_to_contractor" in body) {
      patch.visible_to_contractor = !!body.visible_to_contractor;
    }
    if ("label" in body) {
      patch.label = body.label || null;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No changes" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("job_documents")
      .update(patch)
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();
    const { data: row } = await supabase
      .from("job_documents")
      .select("storage_path")
      .eq("id", params.id)
      .maybeSingle();

    if (row?.storage_path) {
      await supabase.storage.from(BUCKET).remove([row.storage_path]);
    }
    const { error } = await supabase
      .from("job_documents")
      .delete()
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Delete failed" },
      { status: 500 }
    );
  }
}
