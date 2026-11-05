import type { createServiceClient } from "@/lib/supabase/service";
import { notifyAdmin } from "@/lib/admin-notify";
import { defaultSubStatus, stageKeyFromTitle, stageTitle, type StageKey } from "@/lib/stages";
import { alertChannel, effectiveWorkStatus, getWorkStatus, isWorkStatus, permitApproved, storedWorkStatus } from "@/lib/work-status";

type Db = ReturnType<typeof createServiceClient>;

export class WorkStatusError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/**
 * Set where the work is on the inspection bar. Majestic and the contractor can both do it. The permit's own status is
 * never touched here, and the bar only opens once the permit is approved. Final passed closes the whole job out.
 * When the contractor changes it, Majestic is told: a text if an inspection is needed, an email otherwise.
 */
export async function setWorkStatus(db: Db, args: { jobId: string; status: unknown; by: "admin" | "contractor"; actor?: string }) {
  if (!isWorkStatus(args.status)) throw new WorkStatusError("Choose a status from the list.");
  const requested = args.status;

  const { data: job, error } = await db.from("jobs").select("id, property_address, stage, work_status").eq("id", args.jobId).maybeSingle();
  if (error || !job) throw new WorkStatusError("Job not found.", 404);

  const stageKey = stageKeyFromTitle(job.stage);
  if (!permitApproved(stageKey)) throw new WorkStatusError("The inspection status opens once the permit is approved.", 409);
  if (stageKey === "closed" && args.by === "contractor") throw new WorkStatusError("This job is closed. Call the office to reopen it.", 409);

  const before = effectiveWorkStatus(stageKey, job.work_status);
  const stored = storedWorkStatus(requested);
  const target = getWorkStatus(stored)!;
  const stage = stageTitle(target.stageKey as StageKey);

  const patch: Record<string, unknown> = { work_status: stored, stage, sub_status: defaultSubStatus(stage) };
  if (stored === "permit_closed") {
    patch.next_step = "Permit closed after final inspection passed";
    patch.final_inspection_date = new Date().toISOString().slice(0, 10);
  }
  const { error: saveError } = await db.from("jobs").update(patch).eq("id", job.id);
  if (saveError) throw new WorkStatusError(saveError.message);

  if (args.by === "contractor" && before !== stored) {
    const closed = requested === "final_passed" || stored === "permit_closed";
    const label = closed ? "Final passed. The job is closed" : getWorkStatus(requested)!.label;
    const who = args.actor ? ` (${args.actor})` : "";
    const type = closed ? "job_closed" : alertChannel(stored) === "sms" ? "inspection_needed" : "job_status";
    await notifyAdmin(type, `${job.property_address}: contractor set the inspection status to "${label}"${who}.`, job.id);
  }
  return { work_status: stored, stage, closed: stored === "permit_closed" };
}

/**
 * Keep the inspection bar in step with what happens on the calendar (a visit requested, scheduled, passed or failed).
 * It only moves a job that is past approval and not closed, and it never notifies: the calendar flow already does.
 */
export async function markWorkStatus(db: Db, jobId: string, status: string) {
  if (!isWorkStatus(status)) return;
  const { data: job } = await db.from("jobs").select("stage").eq("id", jobId).maybeSingle();
  const stageKey = stageKeyFromTitle(job?.stage);
  if (!job || !permitApproved(stageKey) || stageKey === "closed") return;
  await db.from("jobs").update({ work_status: status }).eq("id", jobId);
}
