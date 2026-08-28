"use client";

import { useState } from "react";

export type TrackingLinkStatus = "active" | "disabled" | "expired" | "none";

const STATUS_STYLES: Record<TrackingLinkStatus, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  disabled: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  expired:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  none: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

const STATUS_LABEL: Record<TrackingLinkStatus, string> = {
  active: "Link active",
  disabled: "Link disabled",
  expired: "Link expired",
  none: "No link yet",
};

/**
 * Contractor-facing share control for a job's homeowner tracking link.
 * Read-only on purpose: generating, regenerating, disabling and reactivating
 * links stay in the Majestic admin console.
 */
export function TrackingLinkShare({
  url,
  status,
  compact = false,
}: {
  url: string | null;
  status: TrackingLinkStatus;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canCopy = status === "active" && !!url;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
      >
        {STATUS_LABEL[status]}
      </span>

      {canCopy ? (
        <button
          type="button"
          onClick={copy}
          className={
            compact
              ? "rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#0B1F3F] transition hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
              : "rounded-xl bg-[#0B1F3F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#152C56]"
          }
        >
          {copied ? "Copied" : "Copy homeowner update link"}
        </button>
      ) : (
        <span className="text-xs text-slate-500">
          Contact Majestic Permits to activate a homeowner update link.
        </span>
      )}
    </div>
  );
}
