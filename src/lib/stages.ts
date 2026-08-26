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
    key: "inspections",
    title: "Inspections in progress",
    short: "Inspections",
    description:
      "Inspectors are visiting the job site as different phases of work are completed.",
    next: "We coordinate each inspection and track the results until the final sign-off.",
  },
  {
    id: 7,
    key: "final_passed",
    title: "Final inspection passed",
    short: "Final passed",
    description:
      "The city has signed off on the completed work. Everything meets code.",
    next: "We will close out the permit paperwork with the jurisdiction.",
  },
  {
    id: 8,
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
