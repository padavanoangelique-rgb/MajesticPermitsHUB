import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** Fixed columns writable through the admin inspection form. */
const ALLOWED = [
  "inspection_type",
  "status",
  "requested_date",
  "scheduled_date",
  "result_date",
  "inspector_name",
  "inspector_number",
  "correction_notes",
  "attachment_path",
  "visible_to_homeowner",
] as const;

const VALID_STATUS = new Set([
  "not_required",
  "not_requested",
  "requested",
  "scheduled",
  "passed",
  "partial_pass",
  "failed",
  "reinspection_requested",
  "reinspection_scheduled",
  "cancelled",
  "closed",
]);

function sanitize(body: Record<string, any>) {
  const patch: Record<string, any> = {};
  for (const key of ALLOWED) {
    if (!(key in body)) continue;
    let value = body[key];
    if (value === "") value = null;
    if (key === "status" && value != null && !VALID_STATUS.has(value)) {
      throw new Error(`Invalid inspection status: ${value}`);
    }
    patch[key] = value;
  }
  patch.updated_at = new Date().toISOString();
  return patch;
}

/** id here is the inspection row id (each job has three). */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patch = sanitize(await req.json());
    if (Object.keys(patch).length <= 1) {
      return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("job_inspections")
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
