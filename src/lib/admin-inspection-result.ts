import type { SupabaseClient } from "@supabase/supabase-js";

type Inspection = { id: string; job_id: string; slot: number; inspection_type: string | null; status: string; result_date?: string | null };
type CloseFinal = (options: { jobId: string; inspection: Inspection; treatAsFinal?: boolean }) => Promise<{ closed: boolean }>;

/** Update the actual inspection first; never report job closure without a saved job update. */
export async function recordAdminInspectionResult(
  db: SupabaseClient,
  id: string,
  body: { status: string; result_date?: string; contractor_note?: string; final?: boolean },
  closeFinal: CloseFinal,
) {
  const status = { Passed: "passed", Failed: "failed", Partial: "partial_pass" }[body.status];
  if (!status) throw new Error("Choose passed, failed, or partial pass");
  const date = body.result_date || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error("Enter a valid result date");
  }
  let inspection: Inspection;
  let request: any = null;
  if (id.startsWith("slot-")) {
    const { data, error } = await db.from("job_inspections")
      .select("id, job_id, slot, inspection_type, status").eq("id", id.slice(5)).single();
    if (error || !data) throw new Error(error?.message || "Inspection not found");
    inspection = data;
  } else {
    if (id.startsWith("notice-")) throw new Error("Open the job and choose the inspection to record its result");
    const { data, error } = await db.from("inspection_requests")
      .select("id, job_id, inspection_type, preferred_date, requested_by_contractor_id").eq("id", id).single();
    if (error || !data?.job_id) throw new Error(error?.message || "Inspection request has no job");
    request = data;
    const { data: slots, error: slotError } = await db.from("job_inspections")
      .select("id, job_id, slot, inspection_type, status").eq("job_id", request.job_id);
    if (slotError) throw new Error(slotError.message);
    const matches = (slots || []).filter((slot) =>
      (slot.inspection_type || `Inspection ${slot.slot}`).trim().toLowerCase() === (request.inspection_type || "").trim().toLowerCase());
    if (matches.length !== 1) throw new Error("Open the job and choose the matching inspection; this request is not uniquely linked");
    inspection = matches[0];
  }
  const patch: Record<string, unknown> = { status, result_date: date, updated_at: new Date().toISOString() };
  if (body.contractor_note?.trim()) patch.correction_notes = body.contractor_note.trim();
  // Persist an explicitly identified final so retries and other views agree on its type.
  if (body.final === true && !(inspection.inspection_type || "").toLowerCase().includes("final")) {
    patch.inspection_type = `${inspection.inspection_type || "Inspection"} — Final`;
  }
  const { data: updated, error } = await db.from("job_inspections").update(patch).eq("id", inspection.id)
    .select("id, job_id, slot, inspection_type, status, result_date").single();
  if (error || !updated) throw new Error(error?.message || "Inspection result was not saved");
  if (request) {
    const { data: saved, error: requestError } = await db.from("inspection_requests")
      .update({ status: body.status, result: status, result_date: date, correction_notes: body.contractor_note?.trim() || null,
        inspection_type: updated.inspection_type, handled_at: new Date().toISOString() }).eq("id", request.id).select("id").single();
    if (requestError || !saved) throw new Error(`Inspection result saved; request update failed: ${requestError?.message || "request missing"}`);
  }
  const closed = await closeFinal({ jobId: updated.job_id, inspection: updated, treatAsFinal: body.final === true ? true : undefined });
  const { data: job, error: jobError } = await db.from("jobs")
    .select("id, property_address, contractor_id").eq("id", updated.job_id).single();
  if (jobError || !job) throw new Error(jobError?.message || "Job not found");
  return { closed: closed.closed, job, inspection: updated, request };
}
