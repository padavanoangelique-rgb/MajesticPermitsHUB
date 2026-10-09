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
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { parseOnsiteFromNotes } from "@/lib/onsite-contact";
import { InspectionResultForm } from "@/components/admin/inspection-result-form";

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
  is_final?: boolean;
};

export function dateKey(value: string | null, fallback?: string) {
  const raw = (value || fallback || "").trim();
  if (!raw) return format(new Date(), "yyyy-MM-dd");
  const iso = raw.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const us = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) {
    return `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  }
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return format(new Date(parsed), "yyyy-MM-dd");
  try {
    return format(parseISO(raw), "yyyy-MM-dd");
  } catch {
    return format(new Date(), "yyyy-MM-dd");
  }
}

export function InspectionsCalendar({ requests }: { requests: InspectionRequestRow[] }) {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = requests.find((request) => request.id === selectedId) || null;
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
    setSelectedId(req.id);
    setNote(
      `Your ${req.inspection_type || "inspection"} for ${req.property_address || "the job"} is scheduled.`
    );
    setScheduledDate(dateKey(req.preferred_date, req.created_at));
    setNotify(true);
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
          : data.texted
          ? "Marked scheduled and texted the contractor."
          : data.email_error
          ? `Marked scheduled. Notify failed (${data.email_error}).`
          : "Marked scheduled."
      );
      router.refresh();
    } catch (err: any) {
      setMessage(err.message || "Failed");
    }
    setBusy(false);
  }

  const selectedOnsite = selected ? parseOnsiteFromNotes(selected.notes).phone : "";

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((d) => addMonths(d, -1))}
          className="rounded-xl border border-border px-3 py-1.5 text-sm dark:border-border"
        >
          Prev
        </button>
        <p className="text-lg font-semibold text-primary dark:text-primary">
          {format(cursor, "MMMM yyyy")}
        </p>
        <button
          type="button"
          onClick={() => setCursor((d) => addMonths(d, 1))}
          className="rounded-xl border border-border px-3 py-1.5 text-sm dark:border-border"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-border bg-secondary dark:border-border dark:bg-secondary">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="bg-card px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:bg-card"
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
                "min-h-[110px] bg-card p-2 dark:bg-card " +
                (inMonth ? "" : "opacity-40 ") +
                (isSameDay(day, new Date()) ? "ring-1 ring-inset ring-primary" : "")
              }
            >
              <p className="text-xs font-semibold text-muted-foreground">{format(day, "d")}</p>
              <div className="mt-1 space-y-1">
                {items.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => open(req)}
                    className={
                      "block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium " +
                      (String(req.status).toLowerCase() === "pending" || String(req.status).toLowerCase() === "requested"
                        ? "bg-amber-100 text-amber-200 dark:bg-amber-900/40 dark:text-amber-200"
                        : String(req.status).toLowerCase() === "scheduled"
                        ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary"
                        : "bg-secondary text-muted-foreground dark:bg-secondary dark:text-muted-foreground")
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
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 dark:border-border dark:bg-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-primary dark:text-primary">
                {selected.property_address || "Inspection request"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.inspection_type} · {selected.contractor_name || selected.requested_by}
                {selected.homeowner_name ? ` · ${selected.homeowner_name}` : ""}
              </p>
              {selectedOnsite && (
                <p className="mt-2 text-sm font-medium text-foreground dark:text-foreground">
                  On-site contact:{" "}
                  <a href={`tel:${selectedOnsite.replace(/\D/g, "")}`} className="text-primary underline">
                    {selectedOnsite}
                  </a>
                </p>
              )}
            </div>
            <button type="button" onClick={() => setSelectedId(null)} className="text-sm text-muted-foreground">
              Close
            </button>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={String(selected.status).toLowerCase() === "scheduled"}
              disabled={busy || String(selected.status).toLowerCase() === "scheduled"}
              onChange={(e) => markScheduled(e.target.checked)}
            />
            Scheduled
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Scheduled date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-background"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contractor email
              </label>
              <p className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground dark:border-border dark:text-muted-foreground">
                {selected.contractor_email || "No contractor email on file"}
              </p>
            </div>
          </div>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Note back to contractor
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-background"
          />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Email / text this note when I mark it scheduled
          </label>
          {String(selected.status).toLowerCase() !== "scheduled" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => markScheduled(true)}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary disabled:opacity-60 dark:bg-primary dark:text-primary-foreground"
            >
              {busy ? "Saving…" : "Schedule + notify contractor"}
            </button>
          )}
          {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
          {["scheduled", "reinspection_scheduled"].includes(String(selected.status).toLowerCase()) && (
            <InspectionResultForm key={selected.id} id={selected.id} isFinal={selected.is_final} />
          )}
          {selected.job_id && <a href={`/admin/jobs/${selected.job_id}#inspections`} className="mt-4 inline-block text-sm text-primary underline">Open job inspections</a>}
        </div>
      )}
    </div>
  );
}
