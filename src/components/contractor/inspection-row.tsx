"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { InspectionDateOption } from "@/lib/next-inspection-day";
import { InspectionDateCalendar } from "@/components/contractor/inspection-date-calendar";
import { formatPhone, isValidUsPhone } from "@/lib/onsite-contact";
import { phaseOf, visitName } from "@/lib/inspection-flow";

// What the contractor sees. A visit Majestic has put on the calendar but not confirmed reads as "Requested": the
// contractor is told the date when it is confirmed. Majestic records the results; the contractor only requests.
function chipLabel(status: string, confirmed: boolean) {
  switch (status) {
    case "not_requested":
    case "cancelled":
      return "Ready to request";
    case "requested":
      return "Requested";
    case "reinspection_requested":
      return "Reinspection requested";
    case "scheduled":
      return confirmed ? "Scheduled" : "Requested";
    case "reinspection_scheduled":
      return confirmed ? "Reinspection scheduled" : "Reinspection requested";
    case "passed":
    case "closed":
      return "Passed";
    case "partial_pass":
      return "Partial pass — reinspection needed";
    case "failed":
      return "Did not pass — reinspection needed";
    default:
      return "Not needed";
  }
}

const EDITABLE_STATUSES = new Set(["requested", "reinspection_requested"]);

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
    confirmed_at?: string | null;
    inspection_time?: string | null;
    inspector_name?: string | null;
    inspector_number?: string | null;
    day_notes?: string | null;
    reinspection_fee?: number | string | null;
    reinspection_fee_status?: string | null;
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

  const phase = phaseOf({ status: localStatus, confirmed_at: i.confirmed_at });
  const confirmed = phase === "scheduled";
  // A visit can be requested, edited or cancelled until Majestic puts it on the calendar.
  const canManage =
    !permitClosed && (phase === "ready" || phase === "requested" || phase === "needs_reinspection") && localStatus !== "closed";
  const isPendingRequest = EDITABLE_STATUSES.has(localStatus);
  const canOpen = canManage;
  const fee = Number(i.reinspection_fee);

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
  if (confirmed) {
    subline = `Scheduled ${labelDate(i.scheduled_date)}${i.inspection_time ? ` at ${i.inspection_time}` : ""}`;
  } else if (EDITABLE_STATUSES.has(localStatus) && localRequestedDate) {
    subline = `Requested for ${labelDate(localRequestedDate)}`;
  } else if (["scheduled", "reinspection_scheduled"].includes(localStatus)) {
    subline = `Requested${localRequestedDate ? ` for ${labelDate(localRequestedDate)}` : ""}. Majestic is scheduling it`;
  } else if (i.result_date && ["passed", "partial_pass", "failed", "closed"].includes(localStatus)) {
    subline = `Result ${labelDate(i.result_date)}`;
  } else if (phase === "ready") {
    subline = "Ready to request";
  } else {
    subline = "Not scheduled";
  }

  const chip = chipLabel(localStatus, confirmed);
  const chipTone =
    phase === "needs_reinspection"
      ? "bg-rose-500/15 text-rose-200"
      : phase === "scheduled"
        ? "bg-sky-500/15 text-sky-200"
        : phase === "passed"
          ? "bg-emerald-500/15 text-emerald-200"
          : phase === "requested" || phase === "tentative"
            ? "bg-amber-500/15 text-amber-200"
            : "bg-secondary text-foreground";

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
          <p className="text-sm font-semibold text-primary dark:text-white">{visitName(i)}</p>
          <p className="text-xs text-muted-foreground">{subline}</p>
          {localPhone && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              On-site {formatPhone(localPhone)}
            </p>
          )}
          {confirmed && (i.inspector_name || i.day_notes) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {i.inspector_name ? `Inspector ${i.inspector_name}${i.inspector_number ? ` (${i.inspector_number})` : ""}` : ""}
              {i.inspector_name && i.day_notes ? " · " : ""}
              {i.day_notes || ""}
            </p>
          )}
          {canOpen && !open && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isPendingRequest
                ? "Click to edit, cancel, or change the date"
                : phase === "needs_reinspection"
                  ? "Click to pick a date and request the re-inspection"
                  : "Click to pick a date and request"}
            </p>
          )}
        </div>
        <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + chipTone}>
          {loading ? "Saving..." : chip}
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
                {loading ? "Sending..." : phase === "needs_reinspection" ? "Request re-inspection" : "Request inspection"}
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

      {phase === "needs_reinspection" && i.reinspection_fee_status === "due" && fee > 0 && (
        <p className="mt-2 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-200">
          Re-inspection fee due: ${fee.toFixed(2)}
        </p>
      )}

      {i.correction_notes && (
        <p className="mt-1 px-1 text-xs text-muted-foreground">
          Inspector notes: {i.correction_notes}
        </p>
      )}
    </li>
  );
}
