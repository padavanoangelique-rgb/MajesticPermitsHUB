import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** Only these columns may be written from the admin UI. */
const ALLOWED_FIELDS = [
  "property_address",
  "homeowner_name",
  "homeowner_email",
  "homeowner_phone",
  "client_type",
  "brand",
  "contractor_id",
  "stage",
  "sub_status",
  "permit_number",
  "permit_eta",
  "submitted_date",
  "next_step",
  "notes",
  "homeowner_note",
  "internal_notes",
  "trade_type",
  "jurisdiction",
  "building_dept_url",
  "noc_status",
] as const;

function sanitize(body: Record<string, any>) {
  const patch: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if (!(key in body)) continue;
    let value = body[key];
    // Empty strings should clear the column, not fail a uuid/date cast
    if (value === "") value = null;
    patch[key] = value;
  }
  return patch;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const patch = sanitize(body);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No updatable fields provided" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("jobs")
      .update(patch)
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Update failed" },
      { status: 500 }
    );
  }
}

/**
 * Permanently deletes a job and everything hanging off it.
 *
 * job_documents, job_inspections, job_fees, time_entries, quotes,
 * homeowner_links, and inspection_requests all reference jobs(id) with
 * ON DELETE CASCADE, so those rows are cleaned up automatically.
 *
 * mph_stage_history and mph_email_queue are informational tables without
 * a foreign-key constraint, so we clean those up explicitly first.
 *
 * Storage: uploaded document files in the 'job-documents' bucket are also
 * removed, since without their rows there would be no way to reach them.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();

    // Verify the job actually exists first so the caller gets a clean 404
    const { data: job, error: lookupError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", params.id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 400 });
    }
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Remove any uploaded document blobs before we lose the paths
    const { data: docs } = await supabase
      .from("job_documents")
      .select("storage_path")
      .eq("job_id", params.id);

    const paths = (docs || [])
      .map((d: any) => d.storage_path)
      .filter(Boolean);

    if (paths.length > 0) {
      // Best-effort — don't block deletion if storage cleanup fails
      await supabase.storage.from("job-documents").remove(paths);
    }

    // Clean up tables without a cascading foreign key
    await supabase.from("mph_stage_history").delete().eq("job_id", params.id);
    await supabase.from("mph_email_queue").delete().eq("job_id", params.id);

    // Everything else cascades from jobs(id)
    const { error } = await supabase.from("jobs").delete().eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Delete failed" },
      { status: 500 }
    );
  }
}
