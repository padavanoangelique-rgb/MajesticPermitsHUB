import { PERMIT_STAGES } from "@/lib/stages";

/**
 * Buckets group the 8 permit stages into 5 higher-level categories that
 * match how contractors think about work: getting a permit, waiting on
 * the city, ready to build, doing inspections, and closed.
 *
 * Each stage.title from `stages.ts` maps to exactly one bucket. Anything
 * that doesn't match (e.g. legacy free-text stages like "Need Permit
 * Submittal") falls into the closest bucket by keyword match, otherwise
 * "In progress" as a safe default.
 */

export const STAGE_BUCKETS = [
  {
    key: "getting_ready",
    label: "Getting ready",
    description: "Preparing the permit package.",
    stageKeys: ["getting_ready"],
  },
  {
    key: "with_city",
    label: "With the city",
    description: "Submitted, in review, or in corrections.",
    stageKeys: ["submitted", "under_review", "corrections"],
  },
  {
    key: "ready_to_build",
    label: "Ready to build",
    description: "Permit approved. Work can start.",
    stageKeys: ["approved"],
  },
  {
    key: "inspections",
    label: "Inspections",
    description: "Inspections in progress until final sign-off.",
    stageKeys: ["inspections"],
  },
  {
    key: "final_and_closed",
    label: "Final & closed",
    description: "Final inspection passed and permit closed out.",
    stageKeys: ["final_passed", "closed"],
  },
] as const;

export type BucketKey = (typeof STAGE_BUCKETS)[number]["key"];

/**
 * Given a job.stage value (which is the free-text `title` in the DB),
 * return the bucket key it belongs to.
 */
export function bucketForStage(stage?: string | null): BucketKey {
  if (!stage) return "getting_ready";
  const needle = stage.toLowerCase().trim();

  // Exact / canonical match first
  for (const bucket of STAGE_BUCKETS) {
    for (const stageKey of bucket.stageKeys) {
      const canonical = PERMIT_STAGES.find((s) => s.key === stageKey);
      if (!canonical) continue;
      if (
        needle === canonical.title.toLowerCase() ||
        needle === canonical.short.toLowerCase() ||
        needle === canonical.key
      ) {
        return bucket.key;
      }
    }
  }

  // Keyword fallback for legacy free-text stages
  if (needle.includes("clos")) return "final_and_closed";
  if (needle.includes("final")) return "final_and_closed";
  if (needle.includes("inspect")) return "inspections";
  if (needle.includes("approv") || needle.includes("ready to build"))
    return "ready_to_build";
  if (
    needle.includes("submit") ||
    needle.includes("review") ||
    needle.includes("correct") ||
    needle.includes("with the city")
  )
    return "with_city";
  if (
    needle.includes("ready") ||
    needle.includes("getting") ||
    needle.includes("need permit") ||
    needle.includes("prepar")
  )
    return "getting_ready";

  // Safe default
  return "with_city";
}

export function bucketMeta(key: BucketKey) {
  return STAGE_BUCKETS.find((b) => b.key === key)!;
}
