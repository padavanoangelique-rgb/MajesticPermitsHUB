"use client";

import { useMemo, useState } from "react";
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
import { ContractorResultForm } from "@/components/contractor/contractor-result-form";

export type CalendarEvent = {
  id: string;
  date: string;
  kind: "pending" | "scheduled" | "result";
  title: string;
  address: string;
  jobId: string;
  inspectionId: string;
  status: string;
  canReport: boolean;
  isFinal: boolean;
};

const KIND_CLASS: Record<CalendarEvent["kind"], string> = {
  pending: "bg-amber-100 text-amber-200 dark:bg-amber-900/40 dark:text-amber-200",
  scheduled: "bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary",
  result: "bg-secondary text-muted-foreground dark:bg-secondary dark:text-muted-foreground",
};

export function InspectionsMonth({ events }: { events: CalendarEvent[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => format(new Date(), "yyyy-MM-dd"));

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

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-border bg-card p-4 dark:border-border dark:bg-card">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, -1))}
            className="rounded-lg border border-border px-3 py-1 text-sm dark:border-border"
          >
            Prev
          </button>
          <p className="text-sm font-semibold text-primary dark:text-white">
            {format(cursor, "MMMM yyyy")}
          </p>
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, 1))}
            className="rounded-lg border border-border px-3 py-1 text-sm dark:border-border"
          >
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
                onClick={() => setSelected(key)}
                className={
                  "min-h-[72px] rounded-xl border p-1 text-left " +
                  (on
                    ? "border-primary bg-primary/5 dark:border-primary dark:bg-primary/10 "
                    : "border-transparent hover:bg-secondary dark:hover:bg-secondary/40 ") +
                  (isSameMonth(day, cursor) ? "" : "opacity-40 ") +
                  (isSameDay(day, new Date()) && !on ? "ring-1 ring-inset ring-primary/30 " : "")
                }
              >
                <span className="block text-xs font-semibold">{format(day, "d")}</span>
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className={`block truncate rounded px-1 py-0.5 text-[9px] font-semibold ${KIND_CLASS[ev.kind]}`}
                    >
                      {ev.kind === "pending" ? "Pending" : ev.kind === "scheduled" ? "Set" : ev.status}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-200">Pending request</span>
          <span className="rounded bg-primary/15 px-2 py-0.5 text-primary">Scheduled by Majestic</span>
          <span className="rounded bg-secondary px-2 py-0.5">Result on file</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 dark:border-border dark:bg-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {format(new Date(selected + "T12:00:00"), "EEEE, MMM d")}
        </p>
        {selectedEvents.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nothing on this day.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {selectedEvents.map((ev) => (
              <li key={ev.id} className="rounded-xl border border-border p-3 dark:border-border">
                <p className="text-sm font-semibold text-primary dark:text-white">{ev.title}</p>
                <p className="text-xs text-muted-foreground">{ev.address}</p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">{ev.kind} · {ev.status.replace(/_/g, " ")}</p>
                <a
                  href={`/dashboard/projects/${ev.jobId}`}
                  className="mt-2 inline-block text-xs font-medium text-primary underline"
                >
                  Open job
                </a>
                {ev.canReport && (
                  <ContractorResultForm inspectionId={ev.inspectionId} isFinal={ev.isFinal} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
