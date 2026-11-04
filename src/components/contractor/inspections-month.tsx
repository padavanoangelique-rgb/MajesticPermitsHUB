"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

// pending = asked for, waiting for Majestic · scheduled = confirmed by Majestic · passed / failed = the result on file
export type CalendarEvent = {
  id: string;
  date: string;
  kind: "pending" | "scheduled" | "passed" | "failed";
  title: string;
  address: string;
  jobId: string;
  detail: string;
};

/** A job whose next inspection can be requested: ready to schedule, or failed and needing a re-inspection. */
export type NeedsInspection = {
  jobId: string;
  address: string;
  slot: number;
  title: string;
  reinspection: boolean;
  note: string;
};

const KIND_CLASS: Record<CalendarEvent["kind"], string> = {
  pending: "bg-amber-500/20 text-amber-200",
  scheduled: "bg-sky-500/20 text-sky-200",
  passed: "bg-emerald-500/20 text-emerald-200",
  failed: "bg-rose-500/20 text-rose-200",
};
const KIND_LABEL: Record<CalendarEvent["kind"], string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  passed: "Passed",
  failed: "Failed",
};

export function InspectionsMonth({
  events,
  needs,
  allowedDates,
}: {
  events: CalendarEvent[];
  needs: NeedsInspection[];
  /** The days an inspection can be requested for (weekdays after the noon cutoff). */
  allowedDates: string[];
}) {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const allowed = useMemo(() => new Set(allowedDates), [allowedDates]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      if (!ev.date) continue;
      const key = ev.date.slice(0, 10);
      const list = map.get(key) || [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const selectedEvents = byDate.get(selected) || [];
  const selectedLabel = format(new Date(selected + "T12:00:00"), "EEEE, MMM d");
  const canRequestOnDay = allowed.has(selected);

  async function request(job: NeedsInspection) {
    setBusy(job.jobId);
    setMessage(null);
    try {
      const res = await fetch(`/api/contractor/inspections/${job.slot}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.jobId, requested_date: selected, onsite_contact: "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setMessage({ text: `${job.title} inspection requested for ${selectedLabel}. Majestic will confirm it.`, error: false });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err?.message || "Could not send the request.", error: true });
    }
    setBusy(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => setCursor((d) => addMonths(d, -1))} className="rounded-lg border border-border px-3 py-1 text-sm">
            Prev
          </button>
          <p className="text-sm font-semibold text-primary dark:text-white">{format(cursor, "MMMM yyyy")}</p>
          <button type="button" onClick={() => setCursor((d) => addMonths(d, 1))} className="rounded-lg border border-border px-3 py-1 text-sm">
            Next
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const items = byDate.get(key) || [];
            const on = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelected(key);
                  setMessage(null);
                }}
                className={
                  "min-h-[72px] rounded-xl border p-1 text-left " +
                  (on ? "border-primary bg-primary/5 " : "border-transparent hover:bg-secondary ") +
                  (isSameMonth(day, cursor) ? "" : "opacity-40 ") +
                  (isSameDay(day, new Date()) && !on ? "ring-1 ring-inset ring-primary/30 " : "")
                }
              >
                <span className="block text-xs font-semibold">{format(day, "d")}</span>
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 3).map((ev) => (
                    <span key={ev.id} className={`block truncate rounded px-1 py-0.5 text-[9px] font-semibold ${KIND_CLASS[ev.kind]}`}>
                      {KIND_LABEL[ev.kind]}
                    </span>
                  ))}
                  {items.length > 3 && <span className="block text-[9px] text-muted-foreground">+{items.length - 3} more</span>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className={`rounded px-2 py-0.5 ${KIND_CLASS.pending}`}>Pending request</span>
          <span className={`rounded px-2 py-0.5 ${KIND_CLASS.scheduled}`}>Scheduled by Majestic</span>
          <span className={`rounded px-2 py-0.5 ${KIND_CLASS.passed}`}>Passed</span>
          <span className={`rounded px-2 py-0.5 ${KIND_CLASS.failed}`}>Failed</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{selectedLabel}</p>

        {selectedEvents.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing on this day.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {selectedEvents.map((ev) => (
              <li key={ev.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-semibold text-primary dark:text-white">{ev.title}</p>
                <p className="text-xs text-muted-foreground">{ev.address}</p>
                <p className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${KIND_CLASS[ev.kind]}`}>{KIND_LABEL[ev.kind]}</p>
                {ev.detail && <p className="mt-1 text-xs text-muted-foreground">{ev.detail}</p>}
                <a href={`/dashboard/projects/${ev.jobId}#inspections`} className="mt-2 inline-block text-xs font-medium text-primary underline">
                  Open job
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jobs that need an inspection</p>
          {needs.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Every approved job already has its next inspection requested or scheduled.</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                {canRequestOnDay
                  ? `Request one for ${selectedLabel}. Majestic confirms it, then it lands on your schedule.`
                  : "Pick a weekday from tomorrow on (requests close at noon for the next day) to request an inspection."}
              </p>
              <ul className="mt-3 space-y-2">
                {needs.map((job) => (
                  <li key={job.jobId} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary dark:text-white">{job.address}</p>
                      <p className={"text-xs " + (job.reinspection ? "text-rose-200" : "text-muted-foreground")}>
                        {job.title}
                        {job.reinspection ? " · re-inspection" : ""}
                        {job.note ? ` · ${job.note}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canRequestOnDay || busy !== null}
                      onClick={() => request(job)}
                      className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {busy === job.jobId ? "Sending…" : "Add to this day"}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {message && (
            <p role={message.error ? "alert" : "status"} className={"mt-3 text-xs " + (message.error ? "text-rose-300" : "text-emerald-300")}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
