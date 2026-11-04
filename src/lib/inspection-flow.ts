/**
 * The inspection pipeline for one job, as plain functions: which phase a visit is in, which visit is the current one,
 * which jobs need an inspection, and what a failed inspection costs. No database, no framework, so it can be tested.
 *
 * A job has three visit slots. The default visits are "In progress" (slot 1) and "Final" (slot 3); slot 2 stays off
 * unless Majestic turns it on.
 */

export type InspectionRow = {
  id: string;
  job_id: string;
  slot: number;
  inspection_type: string | null;
  status: string;
  requested_date?: string | null;
  scheduled_date?: string | null;
  result_date?: string | null;
  confirmed_at?: string | null;
  inspection_time?: string | null;
  inspector_name?: string | null;
  inspector_number?: string | null;
  day_notes?: string | null;
  correction_notes?: string | null;
  reinspection_fee?: number | string | null;
  reinspection_fee_status?: string | null;
};

export type Phase =
  | "unavailable" // not a visit this job needs
  | "ready" // approved job, nothing asked for yet: ready to schedule
  | "requested" // asked for (by the contractor, or waiting after a failure): in the pending queue
  | "tentative" // put on the calendar, not confirmed yet: the contractor has not been told
  | "scheduled" // confirmed: on the contractor's schedule, the contractor was told
  | "passed"
  | "needs_reinspection"; // failed or partial pass: has to be scheduled again

export const DEFAULT_SLOT_TYPES: Record<number, string> = { 1: "In progress", 2: "Additional", 3: "Final" };

export const PHASE_LABEL: Record<Phase, string> = {
  unavailable: "Not needed",
  ready: "Ready to schedule",
  requested: "Pending",
  tentative: "On the calendar, not confirmed",
  scheduled: "Scheduled",
  passed: "Passed",
  needs_reinspection: "Needs reinspection",
};

export function phaseOf(row: Pick<InspectionRow, "status" | "confirmed_at">): Phase {
  switch (row.status) {
    case "not_requested":
    case "cancelled":
      return "ready";
    case "requested":
    case "reinspection_requested":
      return "requested";
    case "scheduled":
    case "reinspection_scheduled":
      return row.confirmed_at ? "scheduled" : "tentative";
    case "passed":
    case "closed":
      return "passed";
    case "failed":
    case "partial_pass":
      return "needs_reinspection";
    default:
      return "unavailable";
  }
}

export function visitName(row: Pick<InspectionRow, "slot" | "inspection_type">): string {
  return (row.inspection_type || "").trim() || DEFAULT_SLOT_TYPES[row.slot] || `Inspection ${row.slot}`;
}

export function isFinalVisit(row: Pick<InspectionRow, "slot" | "inspection_type">): boolean {
  return (row.inspection_type || "").toLowerCase().includes("final") || Number(row.slot) === 3;
}

/** The visit that is next for this job: the first one, in slot order, that is not off and not passed. */
export function currentVisit<T extends InspectionRow>(rows: T[]): T | null {
  const sorted = [...rows].sort((a, b) => a.slot - b.slot);
  return sorted.find((row) => phaseOf(row) !== "unavailable" && phaseOf(row) !== "passed") ?? null;
}

/** A job whose three visits were never touched: the standard visits are turned on once its permit is approved. */
export function slotsToActivate(rows: InspectionRow[]): Array<{ id: string; patch: { status: "not_requested"; inspection_type: string } }> {
  if (rows.length === 0) return [];
  const untouched = rows.every(
    (row) => row.status === "not_required" && !row.requested_date && !row.scheduled_date && !row.result_date
  );
  if (!untouched) return [];
  return rows
    .filter((row) => row.slot === 1 || row.slot === 3)
    .map((row) => ({ id: row.id, patch: { status: "not_requested" as const, inspection_type: DEFAULT_SLOT_TYPES[row.slot] } }));
}

export type NeedsEntry<J> = { job: J; visit: InspectionRow; phase: Phase };

/**
 * The jobs that need an inspection: the current visit is ready to schedule, was asked for, or failed and has to be
 * scheduled again. A visit already on the calendar, or passed, is not "needed". `eligible` says which jobs can have one.
 */
export function jobsNeedingInspection<J extends { id: string }>(
  jobs: J[],
  rowsByJob: Map<string, InspectionRow[]>,
  eligible: (job: J) => boolean
): NeedsEntry<J>[] {
  const out: NeedsEntry<J>[] = [];
  for (const job of jobs) {
    if (!eligible(job)) continue;
    const visit = currentVisit(rowsByJob.get(job.id) || []);
    if (!visit) continue;
    const phase = phaseOf(visit);
    if (phase === "ready" || phase === "requested" || phase === "needs_reinspection") out.push({ job, visit, phase });
  }
  return out;
}

/** The re-inspection fee in dollars, from the REINSPECTION_FEE_USD setting. Null while it has not been set. */
export function reinspectionFee(raw: string | undefined | null): number | null {
  const value = Number((raw ?? "").toString().replace(/[$,\s]/g, ""));
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

/** Status of a visit once it is put on the calendar: a visit that failed is scheduled again as a re-inspection. */
export function scheduledStatusFor(current: string): "scheduled" | "reinspection_scheduled" {
  return ["failed", "partial_pass", "reinspection_requested", "reinspection_scheduled"].includes(current) ? "reinspection_scheduled" : "scheduled";
}

export function isoDay(value: string | null | undefined): string {
  return value ? String(value).slice(0, 10) : "";
}
