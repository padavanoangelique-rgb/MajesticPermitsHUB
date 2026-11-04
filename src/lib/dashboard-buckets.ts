import { PERMIT_STAGES } from "@/lib/stages";

// Coarser grouping for the contractor dashboard. Order of how to proceed:
// pending permits → needs install → needs inspection → complete.
// Every PERMIT_STAGES title must appear in exactly one bucket.
export const CONTRACTOR_BUCKETS = [
  {
    key: "pending_permits",
    label: "Pending permits",
    stageTitles: [
      "Getting your project ready",
      "Submitted to the city",
      "Under review",
      "Corrections requested",
    ],
  },
  {
    key: "needs_install",
    label: "Needs install",
    stageTitles: ["Approved — ready to build"],
  },
  {
    key: "needs_inspection",
    label: "Needs inspection",
    stageTitles: ["Inspections in progress"],
  },
  {
    key: "complete",
    label: "Complete",
    stageTitles: ["Final inspection passed", "Permit closed — all done"],
  },
] as const;

const BUCKETED_TITLES = new Set<string>(
  CONTRACTOR_BUCKETS.flatMap((b) => b.stageTitles as readonly string[])
);
PERMIT_STAGES.forEach((s) => {
  if (!BUCKETED_TITLES.has(s.title)) {
    throw new Error(
      `dashboard-buckets.ts: PERMIT_STAGES title "${s.title}" is not assigned to any CONTRACTOR_BUCKETS bucket`
    );
  }
});
