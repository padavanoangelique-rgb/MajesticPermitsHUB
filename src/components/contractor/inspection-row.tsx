"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

const STATUS_LABEL: Record<string, string> = {
  not_required: "Not required",
  not_requested: "Not requested",
  requested: "Requested",
  scheduled: "Scheduled",
  passed: "Passed",
  partial_pass: "Partial pass",
  failed: "Failed — corrections",
  reinspection_requested: "Reinspection requested",
  reinspection_scheduled: "Reinspection scheduled",
  cancelled: "Cancelled",
  closed: "Closed",
};

// Statuses that mean the slot is already active/finalized — clicking the row
// shouldn't reopen the request flow for them (admin has already scheduled or
// there's a result on record).
const LOCKED_STATUSES = new Set([
  "requested",
  "scheduled",
  "passed",
  "partial_pass",
  "reinspection_scheduled",
  "closed",
]);

interface InspectionRowProps {
  jobId: string;
  inspection: {
    id: string;
    slot: number;
    inspection_type: string | null;
    status: string;
    scheduled_date: string | null;
    result_date: string | null;
    correction_notes: string | null;
    requested_date?: string | null;
  };
  nextDayLabel: string;
  nextDayReason: "after_noon_cutoff" | "weekend_skip" | null;
  permitClosed: boolean;
}

export function InspectionRow({
  jobId,
  inspection: i,
  nextDayLabel,
  nextDayReason,
  permitClosed,
}: InspectionRowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState(i.status);
  const [localRequestedDate, setLocalRequestedDate] = useState<string | null>(
    i.requested_date ?? null
  );

  const canRequest = !permitClosed && !LOCKED_STATUSES.has(localStatus);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/contractor/inspections/${i.slot}/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: jobId }),
        }
      );

      if (res.ok) {
        const j = await res.json();
        setLocalStatus("requested");
        setLocalRequestedDate(j.requested_date ?? null);
        // Refresh server components so admin-side / other rows also update
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || `Request failed (${res.status})`);
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    }
    setLoading(false);
  }

  // Line 2 under the title: schedule / result / requested state
  let subline: string;
  if (localStatus === "requested" && localRequestedDate) {
    subline = `Requested for ${format(new Date(localRequestedDate), "MMM d, yyyy")}`;
  } else if (i.scheduled_date) {
    subline = `Scheduled ${format(new Date(i.scheduled_date), "MMM d, yyyy")}`;
  } else if (i.result_date) {
    subline = `Result ${format(new Date(i.result_date), "MMM d, yyyy")}`;
  } else {
    subline = "Not scheduled";
  }

  const rowClass = canRequest
    ? "cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
    : "";

  return (
    <li
      className={`py-3 ${rowClass}`}
      onClick={canRequest && !loading ? submit : undefined}
      role={canRequest ? "button" : undefined}
      tabIndex={canRequest ? 0 : undefined}
      onKeyDown={
        canRequest && !loading
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                submit();
              }
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#156cdd] dark:text-white">
            Inspection {i.slot}
            {i.inspection_type ? ` · ${i.inspection_type}` : ""}
          </p>
          <p className="text-xs text-slate-500">{subline}</p>
          {canRequest && (
            <p className="mt-0.5 text-xs text-slate-400">
              Click to request for{" "}
              <span className="font-medium text-[#156cdd] dark:text-[#e2ba00]">
                {nextDayLabel}
              </span>
              {nextDayReason === "after_noon_cutoff" && (
                <span className="ml-1">
                  (past the noon cutoff — next available)
                </span>
              )}
              {nextDayReason === "weekend_skip" && (
                <span className="ml-1">(skipping the weekend)</span>
              )}
            </p>
          )}
        </div>
        <span
          className={
            localStatus === "requested"
              ? "rounded-full bg-[#156cdd]/10 px-2.5 py-1 text-xs font-semibold text-[#156cdd] dark:bg-[#e2ba00]/15 dark:text-[#e2ba00]"
              : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200"
          }
        >
          {loading ? "Sending..." : STATUS_LABEL[localStatus] ?? localStatus}
        </span>
      </div>
      {i.correction_notes && (
        <p className="mt-1 px-1 text-xs text-slate-500">
          Notes: {i.correction_notes}
        </p>
      )}
      {error && (
        <p className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}
    </li>
  );
}
