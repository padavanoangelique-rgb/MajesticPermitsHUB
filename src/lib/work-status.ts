// The inspection status bar: where the work is, from "install ready to start" to "permit closed". It sits beside the
// permit bar, which is the permit's own status. Pure: no @/ imports, so the tests run it directly.

export type WorkTone = "install" | "inspection" | "failed" | "done";

export type WorkStatus = {
  key: string;
  label: string;
  /** Short enough for a narrow card. */
  short: string;
  tone: WorkTone;
  /** An inspection has to be requested or scheduled. This is the only kind of change that texts Majestic. */
  needsInspection: boolean;
  /** The older job stage this status keeps in step, so the install board, tracking page and reports still work. */
  stageKey: string;
};

export const WORK_STATUSES: WorkStatus[] = [
  { key: "install_ready", label: "Install ready to start", short: "Ready to start", tone: "install", needsInspection: false, stageKey: "approved" },
  { key: "install_started", label: "Install started", short: "Install started", tone: "install", needsInspection: false, stageKey: "installing" },
  { key: "needs_inspection_progress", label: "Needs inspection (in progress)", short: "Needs inspection", tone: "inspection", needsInspection: true, stageKey: "inspections" },
  { key: "needs_inspection_final", label: "Needs inspection (final)", short: "Needs final inspection", tone: "inspection", needsInspection: true, stageKey: "ready_for_final" },
  { key: "inspection_failed", label: "Inspection failed", short: "Failed", tone: "failed", needsInspection: false, stageKey: "inspections" },
  { key: "needs_reinspection", label: "Needs re-inspection", short: "Needs re-inspection", tone: "failed", needsInspection: true, stageKey: "inspections" },
  { key: "in_progress_passed", label: "In progress passed", short: "Passed", tone: "inspection", needsInspection: false, stageKey: "ready_for_final" },
  { key: "needs_final", label: "Needs final", short: "Needs final", tone: "inspection", needsInspection: true, stageKey: "ready_for_final" },
  { key: "final_scheduled", label: "Final scheduled", short: "Final scheduled", tone: "inspection", needsInspection: false, stageKey: "inspection_scheduled" },
  { key: "final_passed", label: "Final passed", short: "Final passed", tone: "done", needsInspection: false, stageKey: "final_passed" },
  { key: "permit_closed", label: "Permit closed", short: "Closed", tone: "done", needsInspection: false, stageKey: "closed" },
];

const BY_KEY = new Map(WORK_STATUSES.map((status) => [status.key, status]));

export function isWorkStatus(key: unknown): key is string {
  return typeof key === "string" && BY_KEY.has(key);
}

export function getWorkStatus(key: string | null | undefined): WorkStatus | null {
  return (key && BY_KEY.get(key)) || null;
}

export function workStatusIndex(key: string | null | undefined) {
  return WORK_STATUSES.findIndex((status) => status.key === key);
}

/** Permit stages from approval on. The inspection bar only runs after the permit is approved. */
const APPROVED_AND_LATER = ["approved", "install_scheduled", "installing", "inspection_scheduled", "inspections", "ready_for_final", "final_passed", "closed"];

export function permitApproved(stageKey: string | null | undefined) {
  return APPROVED_AND_LATER.includes(stageKey || "");
}

/** The permit's own steps, for the permit bar. Everything from approval on is the last one. */
export const PERMIT_BAR_KEYS = ["getting_ready", "submitted", "under_review", "corrections", "approved"] as const;

export function permitBarIndex(stageKey: string | null | undefined) {
  if (permitApproved(stageKey)) return PERMIT_BAR_KEYS.length - 1;
  const index = PERMIT_BAR_KEYS.indexOf((stageKey || "") as (typeof PERMIT_BAR_KEYS)[number]);
  return index >= 0 ? index : 0;
}

/** The status an older job (stage only) is at, for jobs saved before the inspection bar existed. */
export function workStatusFromStageKey(stageKey: string | null | undefined): string | null {
  switch (stageKey) {
    case "approved":
    case "install_scheduled":
      return "install_ready";
    case "installing":
      return "install_started";
    case "inspection_scheduled":
    case "inspections":
      return "needs_inspection_progress";
    case "ready_for_final":
      return "needs_final";
    case "final_passed":
      return "final_passed";
    case "closed":
      return "permit_closed";
    default:
      return null;
  }
}

/** The status shown for a job: the saved one, or the one its stage implies. Null before the permit is approved. */
export function effectiveWorkStatus(stageKey: string | null | undefined, saved: string | null | undefined): string | null {
  if (!permitApproved(stageKey)) return null;
  return isWorkStatus(saved) ? saved : workStatusFromStageKey(stageKey);
}

/** Final passed closes the whole job out, so it is stored as the closed status. */
export function storedWorkStatus(requested: string) {
  return requested === "final_passed" ? "permit_closed" : requested;
}

export type AlertChannel = "sms" | "email";

/** How Majestic hears about a contractor's change: a text when an inspection is needed, an email for everything else. */
export function alertChannel(next: string): AlertChannel {
  return getWorkStatus(next)?.needsInspection ? "sms" : "email";
}
