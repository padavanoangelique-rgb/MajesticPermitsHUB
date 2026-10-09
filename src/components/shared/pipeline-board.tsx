"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { canonicalStageTitle, PERMIT_STAGES } from "@/lib/stages";
import { format } from "date-fns";

export interface PipelineJob {
  id: string;
  property_address: string;
  stage: string;
  sub_status?: string | null;
  homeowner_name?: string | null;
  permit_number?: string | null;
  permit_eta?: string | null;
  contractor_label?: string | null;
  updated_at?: string | null;
}

/**
 * Draggable kanban board grouped by canonical stage.
 *
 * Uses native HTML5 drag-and-drop (no library). When a card is dropped on a
 * new column we PATCH jobs.stage to that column's title and refresh the
 * server component. If the API call fails we revert the optimistic move.
 *
 * `updateHref` is the endpoint that accepts a PATCH with `{ stage }`. It's
 * passed in so the same board can be reused for the admin surface and the
 * contractor portal (both endpoints happen to point at /api/admin/jobs/[id]
 * today since contractors can already open the same job records, but the
 * abstraction keeps future contractor-specific routes clean).
 */
export function PipelineBoard({
  jobs,
  jobHrefPrefix,
  updateHrefTemplate,
  canDrag,
}: {
  jobs: PipelineJob[];
  /**
   * Path prefix for the card link. The job id is appended, so
   * "/admin/jobs" becomes "/admin/jobs/<id>".
   */
  jobHrefPrefix: string;
  /**
   * Endpoint template containing the literal string "{id}" which will be
   * replaced with the job id before the PATCH request. Example:
   * "/api/admin/jobs/{id}".
   * We pass a template instead of a function because a Server Component
   * can't serialize a function prop into a Client Component.
   */
  updateHrefTemplate: string;
  /** If false, cards render read-only. */
  canDrag: boolean;
}) {
  const router = useRouter();

  // Local optimistic copy so drag reorders feel instant
  const [localJobs, setLocalJobs] = useState<PipelineJob[]>(jobs);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Regroup when server-side data changes (after router.refresh)
  useEffect(() => setLocalJobs(jobs), [jobs]);

  const columns = useMemo(() => {
    const byStage = new Map<string, PipelineJob[]>();
    for (const stage of PERMIT_STAGES) byStage.set(stage.title, []);
    const unknown: PipelineJob[] = [];
    for (const job of localJobs) {
      const bucket = byStage.get(canonicalStageTitle(job.stage));
      if (bucket) bucket.push(job);
      else unknown.push(job);
    }
    return { byStage, unknown };
  }, [localJobs]);

  async function moveJob(jobId: string, toStageTitle: string) {
    const current = localJobs.find((j) => j.id === jobId);
    if (!current || current.stage === toStageTitle) return;

    const previous = localJobs;
    setSavingJobId(jobId);
    setError(null);
    setLocalJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, stage: toStageTitle } : j))
    );

    try {
      const res = await fetch(updateHrefTemplate.replace("{id}", jobId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: toStageTitle }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update stage");
      }
      router.refresh();
    } catch (err: any) {
      setLocalJobs(previous);
      setError(err.message || "Could not update stage");
    } finally {
      setSavingJobId(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-xl border border-red-800/40 bg-red-950/30 px-4 py-2 text-sm text-red-200 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {PERMIT_STAGES.map((stage) => {
          const items = columns.byStage.get(stage.title) ?? [];
          const isDropTarget = dragOverStage === stage.title;
          return (
            <div
              key={stage.key}
              className={
                "flex w-72 shrink-0 flex-col rounded-2xl border p-3 transition " +
                (isDropTarget
                  ? "border-primary bg-primary/5 dark:border-primary dark:bg-primary/10"
                  : "border-border bg-secondary/50 dark:border-border dark:bg-background/40")
              }
              onDragOver={(e) => {
                if (!canDrag || savingJobId) return;
                e.preventDefault();
                setDragOverStage(stage.title);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => {
                if (!canDrag || savingJobId) return;
                e.preventDefault();
                setDragOverStage(null);
                const jobId = e.dataTransfer.getData("text/plain");
                if (jobId) moveJob(jobId, stage.title);
              }}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
                    {stage.short}
                  </p>
                </div>
                <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground dark:bg-secondary dark:text-muted-foreground">
                  {items.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {items.map((job) => (
                  <PipelineCard
                    key={job.id}
                    job={job}
                    href={`${jobHrefPrefix}/${job.id}`}
                    draggable={canDrag}
                    saving={savingJobId === job.id}
                  />
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground dark:border-border">
                    No jobs
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {columns.unknown.length > 0 && (
          <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-amber-800/40 bg-amber-950/20 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-200 dark:text-amber-400">
                Other / legacy
              </p>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-amber-200 dark:bg-secondary dark:text-amber-300">
                {columns.unknown.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {columns.unknown.map((job) => (
                <PipelineCard
                  key={job.id}
                  job={job}
                  href={`${jobHrefPrefix}/${job.id}`}
                  draggable={canDrag}
                  saving={savingJobId === job.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineCard({
  job,
  href,
  draggable,
  saving,
}: {
  job: PipelineJob;
  href: string;
  draggable: boolean;
  saving: boolean;
}) {
  return (
    <Link
      href={href}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("text/plain", job.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={
        "block rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-border hover:shadow-md dark:border-border dark:bg-card " +
        (saving ? "opacity-60" : "") +
        (draggable ? " cursor-grab active:cursor-grabbing" : "")
      }
    >
      <p className="line-clamp-2 text-sm font-semibold text-primary dark:text-white">
        {job.property_address}
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
        {job.contractor_label && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-muted-foreground dark:bg-secondary dark:text-muted-foreground">
            {job.contractor_label}
          </span>
        )}
        {job.sub_status && (
          <span className="rounded-full bg-primary/5 px-2 py-0.5 text-primary dark:bg-primary/15 dark:text-primary">
            {job.sub_status}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{job.permit_number || "No permit #"}</span>
        {job.permit_eta && (
          <span>ETA {format(new Date(job.permit_eta), "MMM d")}</span>
        )}
      </div>
    </Link>
  );
}
