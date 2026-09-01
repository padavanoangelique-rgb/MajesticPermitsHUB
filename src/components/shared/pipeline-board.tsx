"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PERMIT_STAGES } from "@/lib/stages";
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
  // Per-column collapse state, keyed by stage title ("Other" for the
  // legacy/unknown-stage column). Collapsed columns stay valid drop
  // targets — you can still drag a card onto one to move a job there.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleCollapsed(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Regroup when server-side data changes (after router.refresh)
  useMemo(() => setLocalJobs(jobs), [jobs]);

  const columns = useMemo(() => {
    const byStage = new Map<string, PipelineJob[]>();
    for (const stage of PERMIT_STAGES) byStage.set(stage.title, []);
    const unknown: PipelineJob[] = [];
    for (const job of localJobs) {
      const bucket = byStage.get(job.stage);
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
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {PERMIT_STAGES.map((stage) => {
          const items = columns.byStage.get(stage.title) ?? [];
          const isDropTarget = dragOverStage === stage.title;
          const isCollapsed = collapsed.has(stage.title);
          return (
            <div
              key={stage.key}
              className={
                "flex shrink-0 flex-col rounded-2xl border transition " +
                (isCollapsed ? "w-12 p-2" : "w-72 p-3") +
                " " +
                (isDropTarget
                  ? "border-[#156cdd] bg-[#156cdd]/5 dark:border-[#9CE824] dark:bg-[#9CE824]/10"
                  : "border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/40")
              }
              onDragOver={(e) => {
                if (!canDrag) return;
                e.preventDefault();
                setDragOverStage(stage.title);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => {
                if (!canDrag) return;
                e.preventDefault();
                setDragOverStage(null);
                const jobId = e.dataTransfer.getData("text/plain");
                if (jobId) moveJob(jobId, stage.title);
              }}
            >
              {isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleCollapsed(stage.title)}
                  aria-expanded={false}
                  title={`Expand ${stage.short}`}
                  className="flex flex-1 flex-col items-center gap-2 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {items.length}
                  </span>
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                  >
                    {stage.short}
                  </span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(stage.title)}
                    aria-expanded={true}
                    title={`Collapse ${stage.short}`}
                    className="mb-3 flex w-full items-center justify-between px-1 text-left"
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      {stage.short}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {items.length}
                    </span>
                  </button>

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
                      <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
                        No jobs
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {columns.unknown.length > 0 && (() => {
          const isCollapsed = collapsed.has("__other__");
          return (
            <div
              className={
                "flex shrink-0 flex-col rounded-2xl border border-amber-200 bg-amber-50/70 transition dark:border-amber-900/50 dark:bg-amber-950/20 " +
                (isCollapsed ? "w-12 p-2" : "w-72 p-3")
              }
            >
              {isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleCollapsed("__other__")}
                  aria-expanded={false}
                  title="Expand Other / legacy"
                  className="flex flex-1 flex-col items-center gap-2 py-1 text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-slate-800 dark:text-amber-300">
                    {columns.unknown.length}
                  </span>
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                  >
                    Other
                  </span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => toggleCollapsed("__other__")}
                    aria-expanded={true}
                    title="Collapse Other / legacy"
                    className="mb-3 flex w-full items-center justify-between px-1 text-left"
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      Other / legacy
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-slate-800 dark:text-amber-300">
                      {columns.unknown.length}
                    </span>
                  </button>
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
                </>
              )}
            </div>
          );
        })()}
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
        "block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-[#090909] " +
        (saving ? "opacity-60" : "") +
        (draggable ? " cursor-grab active:cursor-grabbing" : "")
      }
    >
      <p className="line-clamp-2 text-sm font-semibold text-[#156cdd] dark:text-white">
        {job.property_address}
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
        {job.contractor_label && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {job.contractor_label}
          </span>
        )}
        {job.sub_status && (
          <span className="rounded-full bg-[#156cdd]/5 px-2 py-0.5 text-[#156cdd] dark:bg-[#9CE824]/15 dark:text-[#9CE824]">
            {job.sub_status}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>{job.permit_number || "No permit #"}</span>
        {job.permit_eta && (
          <span>ETA {format(new Date(job.permit_eta), "MMM d")}</span>
        )}
      </div>
    </Link>
  );
}
