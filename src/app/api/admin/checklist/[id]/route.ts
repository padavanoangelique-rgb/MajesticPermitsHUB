import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const STATUSES = new Set([
  "not_started",
  "sent_to_contractor",
  "uploaded",
  "signed",
  "notarized",
  "accepted",
  "waived",
]);

/** Update a single checklist item (status, attached document, notes). */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const patch: Record<string, any> = {};

    if ("status" in body) {
      if (!STATUSES.has(body.status)) {
        return NextResponse.json(
          { error: `Invalid status: ${body.status}` },
          { status: 400 }
        );
      }
      patch.status = body.status;
    }
    if ("document_id" in body) patch.document_id = body.document_id || null;
    if ("notes" in body) patch.notes = body.notes || null;
    if ("waived_reason" in body) patch.waived_reason = body.waived_reason || null;
    if ("required" in body) patch.required = !!body.required;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No changes" }, { status: 400 });
    }
    patch.updated_at = new Date().toISOString();

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("job_form_checklist")
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
