export const PERMIT_STAGES = [
  {
    id: 1,
    key: "getting_ready",
    title: "Getting your project ready",
    short: "Getting ready",
    description:
      "We're gathering documents and preparing your permit package so everything is correct before it goes to the city.",
    next: "Once the package is complete, we will submit it to the building department.",
  },
  {
    id: 2,
    key: "submitted",
    title: "Submitted to the city",
    short: "Submitted",
    description:
      "Your permit has been officially filed with the city. The waiting period for their review has started.",
    next: "The city will review the plans. This stage can take anywhere from a few days to several weeks depending on the jurisdiction.",
  },
  {
    id: 3,
    key: "under_review",
    title: "Under review",
    short: "Under review",
    description:
      "The city is actively reviewing your permit application and plans.",
    next: "If everything is in order they will approve it. If they need changes, they will issue a correction notice.",
  },
  {
    id: 4,
    key: "corrections",
    title: "Corrections requested",
    short: "Corrections",
    description:
      "The city asked for changes or additional information. We are handling the corrections for you.",
    next: "Once the requested items are resolved we will resubmit and move back into review.",
  },
  {
    id: 5,
    key: "approved",
    title: "Approved — ready to build",
    short: "Approved",
    description:
      "Your permit is approved. Construction work can legally begin.",
    next: "Keep the permit documents on site. Inspections will be scheduled as work progresses.",
  },
  {
    id: 6,
    key: "install_scheduled",
    title: "Install scheduled",
    short: "Install scheduled",
    description:
      "The installation is on the schedule.",
    next: "The installer will arrive on the scheduled day. Keep the permit documents on site.",
  },
  {
    id: 7,
    key: "installing",
    title: "Being installed",
    short: "Installing",
    description:
      "The work is underway on site.",
    next: "When the installation is complete we schedule the inspection.",
  },
  {
    id: 8,
    key: "inspection_scheduled",
    title: "Inspection scheduled",
    short: "Inspection set",
    description:
      "An inspection is scheduled with the building department.",
    next: "The inspector visits on the scheduled day. We track the result and handle anything that comes up.",
  },
  {
    id: 9,
    key: "inspections",
    title: "Inspections in progress",
    short: "Inspections",
    description:
      "Inspectors are visiting the job site as different phases of work are completed.",
    next: "We coordinate each inspection and track the results until the final sign-off.",
  },
  {
    id: 10,
    key: "ready_for_final",
    title: "Ready for final",
    short: "Ready for final",
    description:
      "The earlier inspections passed. The job is ready for its final inspection.",
    next: "We schedule the final inspection with the building department.",
  },
  {
    id: 11,
    key: "final_passed",
    title: "Final inspection passed",
    short: "Final passed",
    description:
      "The city has signed off on the completed work. Everything meets code.",
    next: "We will close out the permit paperwork with the jurisdiction.",
  },
  {
    id: 12,
    key: "closed",
    title: "Permit closed — all done",
    short: "Closed",
    description:
      "Your project is officially complete and the permit has been closed with the city.",
    next: "No further action is required. Thank you for trusting Majestic Permits.",
  },
] as const;

export type StageKey = (typeof PERMIT_STAGES)[number]["key"];

export function getStageByKey(key: string) {
  return PERMIT_STAGES.find((s) => s.key === key) ?? PERMIT_STAGES[0];
}

export function getStageIndex(key: string) {
  const idx = PERMIT_STAGES.findIndex((s) => s.key === key);
  return idx >= 0 ? idx : 0;
}

// jobs.stage stores the title string, not the key. Used to sort jobs in
// canonical pipeline order instead of alphabetically. Unrecognized/legacy
// free-text values sort last rather than crashing the sort.
export function getStageOrderByTitle(title: string | null | undefined) {
  if (!title) return PERMIT_STAGES.length;
  const idx = PERMIT_STAGES.findIndex((s) => s.title === title);
  return idx >= 0 ? idx : PERMIT_STAGES.length;
}

// Explicit aliases prevent “ready to build” and “not submitted” substring errors.
export function canonicalStageTitle(value: string | null | undefined): string {
  const text = (value || "").trim().toLowerCase();
  const exact = PERMIT_STAGES.find(s => s.title.toLowerCase() === text || s.key === text);
  if (exact) return exact.title;
  const aliases: Record<string, string> = {
    "need permit submittal": PERMIT_STAGES[0].title,
    "need to submit": PERMIT_STAGES[0].title,
    "not submitted": PERMIT_STAGES[0].title,
    "submitted": PERMIT_STAGES[1].title,
    "in review": PERMIT_STAGES[2].title,
    "approved": PERMIT_STAGES[4].title,
    "approved and printed": PERMIT_STAGES[4].title,
    "closed": PERMIT_STAGES[PERMIT_STAGES.length - 1].title,
    "complete": PERMIT_STAGES[PERMIT_STAGES.length - 1].title,
    "inspection scheduled": "Inspection scheduled",
    "ready for final": "Ready for final",
    "install scheduled": "Install scheduled",
    "being installed": "Being installed",
    "installing": "Being installed",
  };
  return aliases[text] || value || "";
}
export function stageIndexFromTitle(value: string | null | undefined) {
  return PERMIT_STAGES.findIndex(s => s.title === canonicalStageTitle(value));
}
export function stageKeyFromTitle(value: string | null | undefined): StageKey | "" {
  const title = canonicalStageTitle(value);
  return PERMIT_STAGES.find((s) => s.title === title)?.key ?? "";
}
/** The title of a stage by its key, so callers never depend on where a stage sits in the list. */
export function stageTitle(key: StageKey): string {
  return PERMIT_STAGES.find((s) => s.key === key)!.title;
}

// Inspections can be requested from the moment the permit is approved until the final has passed.
const INSPECTION_STAGE_KEYS: readonly string[] = ["approved", "install_scheduled", "installing", "inspection_scheduled", "inspections", "ready_for_final"];
export function inspectionsAllowed(stage: string | null | undefined) {
  return INSPECTION_STAGE_KEYS.includes(stageKeyFromTitle(stage));
}
export const JOB_SUB_STATUSES = ["Need to Submit", "In Review", "Approved", "Approved and Printed", "Complete", "Pending approval", "Request declined", "Closed"];
export function defaultSubStatus(stage: string) {
  const key = stageKeyFromTitle(stage);
  if (key === "closed") return "Closed";
  if (key === "final_passed") return "Complete";
  if (INSPECTION_STAGE_KEYS.includes(key)) return "Approved";
  if (key === "submitted" || key === "under_review" || key === "corrections") return "In Review";
  return "Need to Submit";
}

/**
 * Where a job's stage goes when an inspection is confirmed on the calendar, or null to leave it alone.
 * Only a job that is somewhere between approval and its final moves; a closed job never goes backwards.
 */
export function stageAfterInspectionConfirmed(stage: string | null | undefined): string | null {
  const key = stageKeyFromTitle(stage);
  if (["approved", "install_scheduled", "installing", "inspections", "ready_for_final"].includes(key)) return stageTitle("inspection_scheduled");
  return null;
}

/**
 * Where a job's stage goes when an inspection result is recorded, or null to leave it alone.
 * A final that passes is closed by the closing step, not here.
 */
export function stageAfterInspectionResult(
  stage: string | null | undefined,
  result: "passed" | "partial_pass" | "failed",
  isFinal: boolean
): string | null {
  const key = stageKeyFromTitle(stage);
  if (!INSPECTION_STAGE_KEYS.includes(key)) return null;
  if (result === "passed") return isFinal ? null : stageTitle("ready_for_final");
  return stageTitle("inspections");
}

export type StageTone = "permit" | "corrections" | "install" | "inspection" | "done" | "unknown";

/** The colour family of a stage, so a list of jobs can be read at a glance. */
export function stageTone(stage: string | null | undefined): StageTone {
  switch (stageKeyFromTitle(stage)) {
    case "getting_ready":
    case "submitted":
    case "under_review":
      return "permit";
    case "corrections":
      return "corrections";
    case "approved":
    case "install_scheduled":
    case "installing":
      return "install";
    case "inspection_scheduled":
    case "inspections":
    case "ready_for_final":
      return "inspection";
    case "final_passed":
    case "closed":
      return "done";
    default:
      return "unknown";
  }
}

export type InstallGroup = "scheduled_install" | "installing" | "needs_inspection" | "needs_reinspection";

/**
 * Which column of the install board a job belongs in, or null when it is not on the board (permit not approved yet,
 * or the final inspection already passed). A failed inspection puts the job under re-inspection whatever its stage.
 */
export function installBoardGroup(stage: string | null | undefined, needsReinspection: boolean): InstallGroup | null {
  const key = stageKeyFromTitle(stage);
  if (!INSPECTION_STAGE_KEYS.includes(key)) return null;
  if (needsReinspection) return "needs_reinspection";
  if (key === "installing") return "installing";
  if (key === "approved" || key === "install_scheduled") return "scheduled_install";
  return "needs_inspection";
}
