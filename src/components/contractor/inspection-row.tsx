"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { InspectionDateOption } from "@/lib/next-inspection-day";

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
  dateOptions: InspectionDateOption[];
  permitClosed: boolean;
}

export function InspectionRow({
  jobId,
  inspection: i,
  dateOptions,
  permitClosed,
}: InspectionRowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.value ?? "");
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
          body: JSON.stringify({ job_id: jobId, requested_date: selectedDate }),
        }
      );

      if (res.ok) {
        const j = await res.json();
        setLocalStatus("requested");
        setLocalRequestedDate(j.requested_date ?? selectedDate);
        setOpen(false);
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

  return (
    <li className="py-3">
      <div
        className={
          "flex items-center justify-between gap-3 px-1" +
          (canRequest ? " cursor-pointer" : "")
        }
        onClick={canRequest ? () => setOpen((o) => !o) : undefined}
        role={canRequest ? "button" : undefined}
        tabIndex={canRequest ? 0 : undefined}
        aria-expanded={canRequest ? open : undefined}
        onKeyDown={
          canRequest
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen((o) => !o);
                }
              }
            : undefined
        }
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#156cdd] dark:text-white">
            Inspection {i.slot}
            {i.inspection_type ? ` · ${i.inspection_type}` : ""}
          </p>
          <p className="text-xs text-slate-500">{subline}</p>
          {canRequest && !open && (
            <p className="mt-0.5 text-xs text-slate-400">
              Click to choose a date and request
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

      {canRequest && open && (
        <div
          className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Inspection date
          </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
          >
            {dateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Earliest date reflects the noon cutoff — requests made after
            12:00pm push to the day after next, and weekends are skipped.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={loading || !selectedDate}
              className="rounded-lg bg-[#156cdd] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1157b8] disabled:opacity-60"
            >
              {loading ? "Sending..." : "Request inspection"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
