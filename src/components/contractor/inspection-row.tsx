"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { InspectionDateOption } from "@/lib/next-inspection-day";
import { InspectionDateCalendar } from "@/components/contractor/inspection-date-calendar";
import { ContractorResultForm } from "@/components/contractor/contractor-result-form";
import { formatPhone, isValidUsPhone } from "@/lib/onsite-contact";
import { isFinalInspection } from "@/lib/inspection-final";

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

const FINAL_STATUSES = new Set([
  "scheduled",
  "passed",
  "reinspection_scheduled",
  "closed",
]);

const EDITABLE_STATUSES = new Set(["requested", "reinspection_requested"]);
const REPORTABLE = new Set(["scheduled", "reinspection_scheduled"]);

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
  onsiteContact?: string | null;
}

function labelDate(value: string | null | undefined) {
  if (!value) return "";
  const key = value.slice(0, 10);
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return format(new Date(y, m - 1, d), "MMM d, yyyy");
}

export function InspectionRow({
  jobId,
  inspection: i,
  dateOptions,
  permitClosed,
  onsiteContact,
}: InspectionRowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    i.requested_date?.slice(0, 10) || dateOptions[0]?.value || ""
  );
  const [phone, setPhone] = useState(onsiteContact || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState(i.status);
  const [localRequestedDate, setLocalRequestedDate] = useState<string | null>(
    i.requested_date ?? null
  );
  const [localPhone, setLocalPhone] = useState(onsiteContact || "");

  const canManage =
    !permitClosed && !FINAL_STATUSES.has(localStatus) && localStatus !== "closed";
  const isPendingRequest = EDITABLE_STATUSES.has(localStatus);
  const canOpen = canManage;
  const canReport = !permitClosed && REPORTABLE.has(localStatus);

  async function submit(action: "request" | "edit" | "cancel") {
    if (action !== "cancel" && !selectedDate) {
      setError("Pick an inspection date.");
      return;
    }
    if (action !== "cancel" && phone.trim() && !isValidUsPhone(phone)) {
      setError("Enter a 10-digit on-site contact number.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const method = action === "cancel" ? "DELETE" : action === "edit" ? "PATCH" : "POST";
      const res = await fetch(`/api/contractor/inspections/${i.slot}/request`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          requested_date: selectedDate,
          onsite_contact: phone.trim(),
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j?.error || `Request failed (${res.status})`);
        setLoading(false);
        return;
      }

      if (action === "cancel") {
        setLocalStatus("not_requested");
        setLocalRequestedDate(null);
        setLocalPhone("");
        setPhone("");
      } else {
        setLocalStatus(["failed", "partial_pass", "reinspection_requested"].includes(localStatus) ? "reinspection_requested" : "requested");
        setLocalRequestedDate(j.requested_date ?? selectedDate);
        setLocalPhone(j.onsite_contact || phone);
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Network error");
    }
    setLoading(false);
  }

  let subline: string;
  if (EDITABLE_STATUSES.has(localStatus) && localRequestedDate) {
    subline = `Requested for ${labelDate(localRequestedDate)}`;
  } else if (i.result_date && ["passed", "partial_pass", "failed", "closed"].includes(localStatus)) {
    subline = `Result ${labelDate(i.result_date)}`;
  } else if (i.scheduled_date) {
    subline = `Scheduled ${labelDate(i.scheduled_date)}`;
  } else {
    subline = "Not scheduled";
  }

  return (
    <li className="py-3">
      <div
        className={
          "flex items-center justify-between gap-3 px-1" +
          (canOpen ? " cursor-pointer" : "")
        }
        onClick={canOpen ? () => setOpen((o) => !o) : undefined}
        role={canOpen ? "button" : undefined}
        tabIndex={canOpen ? 0 : undefined}
        aria-expanded={canOpen ? open : undefined}
        onKeyDown={
          canOpen
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
          <p className="text-sm font-semibold text-primary dark:text-white">
            {i.inspection_type || "Inspection"}
          </p>
          <p className="text-xs text-muted-foreground">{subline}</p>
          {localPhone && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              On-site {formatPhone(localPhone)}
            </p>
          )}
          {canOpen && !open && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isPendingRequest
                ? "Click to edit, cancel, or change the date"
                : "Click to pick a date and request"}
            </p>
          )}
        </div>
        <span
          className={
            EDITABLE_STATUSES.has(localStatus)
              ? "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary dark:bg-primary/15 dark:text-primary"
              : "rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground dark:bg-secondary dark:text-foreground"
          }
        >
          {loading ? "Saving..." : STATUS_LABEL[localStatus] ?? localStatus}
        </span>
      </div>

      {canOpen && open && (
        <div
          className="mt-3 rounded-xl border border-border bg-secondary p-3 dark:border-border dark:bg-secondary/40"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Requested date
          </label>
          <InspectionDateCalendar
            dateOptions={dateOptions}
            value={selectedDate}
            onChange={setSelectedDate}
            disabled={loading}
          />

          <label className="mb-1.5 mt-4 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            On-site contact number
          </label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(954) 555-1212"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground dark:border-border dark:bg-background dark:text-white"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Who the inspector should call on site.
          </p>

          {error && (
            <p className="mt-2 rounded-lg bg-red-950/30 px-2 py-1 text-xs text-red-200 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isPendingRequest ? (
              <>
                <button
                  type="button"
                  onClick={() => submit("edit")}
                  disabled={loading || !selectedDate}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => submit("cancel")}
                  disabled={loading}
                  className="rounded-lg border border-red-800/40 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-950/30 disabled:opacity-60 dark:border-red-900 dark:text-red-300"
                >
                  Cancel request
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => submit("request")}
                disabled={loading || !selectedDate}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary disabled:opacity-60"
              >
                {loading ? "Sending..." : "Request inspection"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary dark:hover:bg-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {canReport && (
        <div className="mt-3 rounded-xl border border-border bg-secondary p-3 dark:border-border dark:bg-secondary/40">
          <ContractorResultForm
            inspectionId={i.id}
            isFinal={isFinalInspection(i)}
          />
        </div>
      )}

      {i.correction_notes && (
        <p className="mt-1 px-1 text-xs text-muted-foreground">
          Notes: {i.correction_notes}
        </p>
      )}
    </li>
  );
}
