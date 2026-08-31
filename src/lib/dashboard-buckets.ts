import { PERMIT_STAGES } from "@/lib/stages";

// Coarser grouping than PERMIT_STAGES for the contractor dashboard's list
// view — one section per bucket instead of one per granular stage. Every
// PERMIT_STAGES title must appear in exactly one bucket so no job is ever
// silently dropped from the list.
export const CONTRACTOR_BUCKETS = [
  {
    key: "getting_ready",
    label: "Getting ready",
    stageTitles: ["Getting your project ready"],
  },
  {
    key: "in_review",
    label: "In review",
    stageTitles: [
      "Submitted to the city",
      "Under review",
      "Corrections requested",
    ],
  },
  {
    key: "approved",
    label: "Approved",
    stageTitles: ["Approved — ready to build"],
  },
  {
    key: "needs_inspection",
    label: "Needs inspection",
    stageTitles: ["Inspections in progress"],
  },
  {
    key: "permit_closed",
    label: "Permit closed",
    stageTitles: ["Final inspection passed", "Permit closed — all done"],
  },
] as const;

const BUCKETED_TITLES = new Set<string>(
  CONTRACTOR_BUCKETS.flatMap((b) => b.stageTitles as readonly string[])
);
// Every canonical stage title must be covered by a bucket above. Iterating
// with .forEach avoids needing downlevelIteration for Set<>.
PERMIT_STAGES.forEach((s) => {
  if (!BUCKETED_TITLES.has(s.title)) {
    throw new Error(
      `dashboard-buckets.ts: PERMIT_STAGES title "${s.title}" is not assigned to any CONTRACTOR_BUCKETS bucket`
    );
  }
});
