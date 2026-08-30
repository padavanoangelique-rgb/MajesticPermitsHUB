"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PermitHeader } from "@/components/shared/permit-header";
import {
  STAGE_BUCKETS,
  bucketForStage,
  type BucketKey,
} from "@/lib/stage-buckets";

interface Job {
  id: string;
  property_address: string;
  stage: string | null;
  sub_status: string | null;
  permit_number: string | null;
  permit_eta: string | null;
  submitted_date: string | null;
  updated_at: string | null;
}

type Filter = "all" | BucketKey;

const STAGE_PILL_CLASS: Record<BucketKey, string> = {
  getting_ready:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  with_city:
    "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  ready_to_build:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  inspections:
    "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  final_and_closed:
    "bg-navy/10 text-navy dark:bg-gold/10 dark:text-gold",
};

export function ProjectsView({ jobs }: { jobs: Job[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  // Precompute the bucket per job once, and the count per bucket for tab badges.
  const { jobsByBucket, counts, totalActive } = useMemo(() => {
    const byBucket = new Map<BucketKey, Job[]>();
    for (const b of STAGE_BUCKETS) byBucket.set(b.key, []);

    let total = 0;
    for (const job of jobs) {
      const key = bucketForStage(job.stage);
      byBucket.get(key)!.push(job);
      if (key !== "final_and_closed") total++;
    }

    const c: Record<BucketKey, number> = {} as Record<BucketKey, number>;
    for (const b of STAGE_BUCKETS) c[b.key] = byBucket.get(b.key)!.length;

    return { jobsByBucket: byBucket, counts: c, totalActive: total };
  }, [jobs]);

  const activeBuckets = STAGE_BUCKETS.filter(
    (b) => (jobsByBucket.get(b.key) || []).length > 0
  );

  const visibleBuckets =
    filter === "all"
      ? activeBuckets
      : activeBuckets.filter((b) => b.key === filter);

  return (
    <>
      {/* Summary row */}
      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
        <span>
          <strong className="text-navy dark:text-white">
            {totalActive}
          </strong>{" "}
          active project{totalActive === 1 ? "" : "s"}
        </span>
        {counts.final_and_closed > 0 && (
          <span>
            <strong className="text-navy dark:text-white">
              {counts.final_and_closed}
            </strong>{" "}
            closed
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterTab
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
          count={jobs.length}
        />
        {STAGE_BUCKETS.map((b) => {
          const count = counts[b.key];
          if (count === 0) return null;
          return (
            <FilterTab
              key={b.key}
              active={filter === b.key}
              onClick={() => setFilter(b.key)}
              label={b.label}
              count={count}
            />
          );
        })}
      </div>

      {/* Grouped buckets */}
      <div className="mt-8 space-y-10">
        {visibleBuckets.map((bucket) => {
          const bucketJobs = jobsByBucket.get(bucket.key) || [];
          if (bucketJobs.length === 0) return null;
          return (
            <section key={bucket.key}>
              <header className="mb-4 flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3 dark:border-slate-700">
                <div>
                  <h2 className="text-base font-semibold text-navy dark:text-white">
                    {bucket.label}
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {bucketJobs.length}
                    </span>
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {bucket.description}
                  </p>
                </div>
              </header>
              <div className="grid gap-4 sm:grid-cols-2">
                {bucketJobs.map((job) => (
                  <JobCard key={job.id} job={job} bucketKey={bucket.key} />
                ))}
              </div>
            </section>
          );
        })}

        {visibleBuckets.length === 0 && jobs.length > 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#111827]">
            <p className="font-medium text-navy dark:text-white">
              Nothing in this category
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Try another filter or view all.
            </p>
          </div>
        )}

        {jobs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#111827]">
            <p className="font-medium text-navy dark:text-white">
              No projects assigned yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              As soon as Majestic Permits assigns a permit to your company, it
              will appear here with live status and inspection updates.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-navy text-white shadow-soft"
          : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      } border border-slate-200 dark:border-slate-700`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
          active
            ? "bg-white/20 text-white"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function JobCard({ job, bucketKey }: { job: Job; bucketKey: BucketKey }) {
  return (
    <Link
      href={`/dashboard/projects/${job.id}`}
      className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-navy/30 hover:shadow-soft dark:border-slate-700 dark:bg-[#111827]"
    >
      <p className="font-semibold text-navy dark:text-white">
        {job.property_address}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STAGE_PILL_CLASS[bucketKey]}`}
        >
          {job.stage}
        </span>
        {job.sub_status && (
          <span className="inline-flex rounded-full bg-navy/5 px-2.5 py-1 text-xs font-medium text-navy dark:bg-gold/15 dark:text-gold">
            {job.sub_status}
          </span>
        )}
      </div>
      <div className="mt-4">
        <PermitHeader
          variant="compact"
          permitNumber={job.permit_number}
          submittedDate={job.submitted_date}
          permitEta={job.permit_eta}
        />
      </div>
    </Link>
  );
}
