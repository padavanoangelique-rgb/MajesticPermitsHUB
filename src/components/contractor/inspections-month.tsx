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
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  scheduled: "bg-[#156cdd]/15 text-[#156cdd] dark:bg-[#9CE824]/20 dark:text-[#9CE824]",
  result: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#090909]">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, -1))}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm dark:border-slate-600"
          >
            Prev
          </button>
          <p className="text-sm font-semibold text-[#156cdd] dark:text-white">
            {format(cursor, "MMMM yyyy")}
          </p>
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, 1))}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm dark:border-slate-600"
          >
            Next
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
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
                    ? "border-[#156cdd] bg-[#156cdd]/5 dark:border-[#9CE824] dark:bg-[#9CE824]/10 "
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 ") +
                  (isSameMonth(day, cursor) ? "" : "opacity-40 ") +
                  (isSameDay(day, new Date()) && !on ? "ring-1 ring-inset ring-[#156cdd]/30 " : "")
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
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">Pending request</span>
          <span className="rounded bg-[#156cdd]/15 px-2 py-0.5 text-[#156cdd]">Scheduled by Majestic</span>
          <span className="rounded bg-slate-100 px-2 py-0.5">Result on file</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#090909]">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {format(new Date(selected + "T12:00:00"), "EEEE, MMM d")}
        </p>
        {selectedEvents.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nothing on this day.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {selectedEvents.map((ev) => (
              <li key={ev.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-[#156cdd] dark:text-white">{ev.title}</p>
                <p className="text-xs text-slate-500">{ev.address}</p>
                <p className="mt-1 text-xs capitalize text-slate-500">{ev.kind} · {ev.status.replace(/_/g, " ")}</p>
                <a
                  href={`/dashboard/projects/${ev.jobId}`}
                  className="mt-2 inline-block text-xs font-medium text-[#156cdd] underline"
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
