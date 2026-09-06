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

export type InspectionRequestRow = {
  id: string;
  inspection_type: string | null;
  notes: string | null;
  status: string | null;
  requested_by: string | null;
  preferred_date: string | null;
  created_at: string;
  contractor_email: string | null;
  contractor_name: string | null;
  property_address: string | null;
  homeowner_name: string | null;
  job_id: string | null;
};

function dateKey(value: string | null, fallback: string) {
  const raw = value || fallback;
  return raw.slice(0, 10);
}

export function InspectionsCalendar({ requests }: { requests: InspectionRequestRow[] }) {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<InspectionRequestRow | null>(null);
  const [note, setNote] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, InspectionRequestRow[]>();
    for (const req of requests) {
      const key = dateKey(req.preferred_date, req.created_at);
      const list = map.get(key) || [];
      list.push(req);
      map.set(key, list);
    }
    return map;
  }, [requests]);

  function open(req: InspectionRequestRow) {
    setSelected(req);
    setNote(
      `Your ${req.inspection_type || "inspection"} for ${req.property_address || "the job"} is scheduled.`
    );
    setScheduledDate(dateKey(req.preferred_date, req.created_at));
    setNotify(Boolean(req.contractor_email));
    setMessage("");
  }

  async function markScheduled(checked: boolean) {
    if (!selected || !checked) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/inspection-requests/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Scheduled",
          handled_at: new Date().toISOString(),
          preferred_date: scheduledDate || null,
          contractor_note: note || null,
          notify_contractor: notify,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update request");
      setMessage(
        data.emailed
          ? "Marked scheduled and emailed the contractor."
          : data.email_error
          ? `Marked scheduled. Email did not send (${data.email_error}).`
          : "Marked scheduled."
      );
      router.refresh();
    } catch (err: any) {
      setMessage(err.message || "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((d) => addMonths(d, -1))}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700"
        >
          Prev
        </button>
        <p className="text-lg font-semibold text-[#156cdd] dark:text-[#b6ff2a]">
          {format(cursor, "MMMM yyyy")}
        </p>
        <button
          type="button"
          onClick={() => setCursor((d) => addMonths(d, 1))}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-800">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="bg-white px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-[#090909]"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const items = byDay.get(key) || [];
          const inMonth = isSameMonth(day, cursor);
          return (
            <div
              key={key}
              className={
                "min-h-[110px] bg-white p-2 dark:bg-[#090909] " +
                (inMonth ? "" : "opacity-40 ") +
                (isSameDay(day, new Date()) ? "ring-1 ring-inset ring-[#156cdd]" : "")
              }
            >
              <p className="text-xs font-semibold text-slate-500">{format(day, "d")}</p>
              <div className="mt-1 space-y-1">
                {items.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => open(req)}
                    className={
                      "block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium " +
                      (req.status === "Pending"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                        : req.status === "Scheduled"
                        ? "bg-[#156cdd]/10 text-[#156cdd] dark:bg-[#b6ff2a]/15 dark:text-[#b6ff2a]"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")
                    }
                  >
                    {req.property_address || req.inspection_type}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#090909]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[#156cdd] dark:text-[#b6ff2a]">
                {selected.property_address || "Inspection request"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {selected.inspection_type} · {selected.contractor_name || selected.requested_by}
                {selected.homeowner_name ? ` · ${selected.homeowner_name}` : ""}
              </p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="text-sm text-slate-400">
              Close
            </button>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={selected.status === "Scheduled"}
              disabled={busy || selected.status === "Scheduled"}
              onChange={(e) => markScheduled(e.target.checked)}
            />
            Scheduled
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scheduled date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contractor email
              </label>
              <p className="rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {selected.contractor_email || "No contractor email on file"}
              </p>
            </div>
          </div>

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Note back to contractor
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202]"
          />

          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Email this note when I mark it scheduled
          </label>

          {selected.status !== "Scheduled" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => markScheduled(true)}
              className="mt-4 rounded-xl bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1157b8] disabled:opacity-60 dark:bg-[#b6ff2a] dark:text-black"
            >
              {busy ? "Saving…" : "Mark scheduled + send note"}
            </button>
          )}
          {message && <p className="mt-3 text-sm text-slate-500">{message}</p>}
        </div>
      )}
    </div>
  );
}
