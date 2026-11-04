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

export type PlannerPhase = "requested" | "tentative" | "scheduled" | "passed" | "needs_reinspection";

export type PlannerVisit = {
  id: string;
  jobId: string;
  address: string;
  contractor: string;
  name: string;
  isFinal: boolean;
  phase: PlannerPhase;
  requestedDate: string;
  scheduledDate: string;
  resultDate: string;
  time: string;
  inspector: string;
  inspectorNumber: string;
  dayNotes: string;
  resultNotes: string;
  fee: number | null;
  feeStatus: string | null;
};

export type PlannerNeed = {
  visitId: string;
  jobId: string;
  address: string;
  contractor: string;
  name: string;
  /** ready = nothing asked for yet · requested = the contractor asked · needs_reinspection = failed */
  phase: "ready" | "requested" | "needs_reinspection";
  requestedDate: string;
};

const CHIP: Record<string, string> = {
  requested: "bg-amber-500/20 text-amber-200",
  tentative: "border border-dashed border-sky-400/60 bg-sky-500/10 text-sky-200",
  scheduled: "bg-sky-500/25 text-sky-100",
  passed: "bg-emerald-500/25 text-emerald-100",
  needs_reinspection: "bg-rose-500/25 text-rose-100",
};
const CHIP_LABEL: Record<string, string> = {
  requested: "Asked",
  tentative: "Unconfirmed",
  scheduled: "Set",
  passed: "Passed",
  needs_reinspection: "Failed",
};

function calendarDate(v: PlannerVisit): string {
  if (v.phase === "requested") return v.requestedDate;
  if (v.phase === "tentative" || v.phase === "scheduled") return v.scheduledDate;
  return v.resultDate || v.scheduledDate;
}

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

async function act(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/inspections/${id}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function noticeText(notice: { emails?: number; texts?: number; errors?: string[] } | null | undefined) {
  if (!notice) return "";
  const sent = [notice.emails ? `emailed ${notice.emails}` : "", notice.texts ? `texted ${notice.texts}` : ""].filter(Boolean).join(" and ");
  const errors = notice.errors?.length ? ` (${notice.errors.join("; ")})` : "";
  return sent ? `Contractor ${sent}.${errors}` : `No notice went out${errors}.`;
}

export function InspectionPlanner({ visits, needs }: { visits: PlannerVisit[]; needs: PlannerNeed[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(today);
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const router = useRouter();

  const byDate = useMemo(() => {
    const map = new Map<string, PlannerVisit[]>();
    for (const v of visits) {
      const key = calendarDate(v);
      if (!key) continue;
      map.set(key, [...(map.get(key) || []), v]);
    }
    return map;
  }, [visits]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor)), end: endOfWeek(endOfMonth(cursor)) }),
    [cursor]
  );

  const onDay = visits.filter((v) => ["tentative", "scheduled"].includes(v.phase) && v.scheduledDate === selected);
  const resultsOnDay = visits.filter((v) => ["passed", "needs_reinspection"].includes(v.phase) && (v.resultDate || v.scheduledDate) === selected);
  const needsResult = visits.filter((v) => v.phase === "scheduled" && v.scheduledDate && v.scheduledDate <= today());
  const weekAgo = format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd");
  const lastWeek = visits
    .filter((v) => ["passed", "needs_reinspection"].includes(v.phase) && (v.resultDate || "") >= weekAgo)
    .sort((a, b) => b.resultDate.localeCompare(a.resultDate));

  async function addToDay(need: PlannerNeed) {
    setBusy(need.visitId);
    setMessage(null);
    try {
      await act(need.visitId, { action: "schedule", date: selected, time });
      setMessage({ text: `${need.address}: ${need.name} put on ${format(new Date(selected + "T12:00:00"), "EEE, MMM d")}. Confirm it to tell the contractor.`, error: false });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err?.message || "Could not schedule it.", error: true });
    }
    setBusy(null);
  }

  const dayLabel = format(new Date(selected + "T12:00:00"), "EEEE, MMM d");

  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setCursor((d) => addMonths(d, -1))} className="rounded-lg border border-border px-3 py-1 text-sm">Prev</button>
            <p className="text-lg font-semibold text-primary">{format(cursor, "MMMM yyyy")}</p>
            <button type="button" onClick={() => setCursor((d) => addMonths(d, 1))} className="rounded-lg border border-border px-3 py-1 text-sm">Next</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={`${d}-${i}`} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const items = byDate.get(key) || [];
              const on = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setSelected(key); setMessage(null); }}
                  className={
                    "min-h-[78px] rounded-xl border p-1 text-left " +
                    (on ? "border-primary bg-primary/10 " : "border-transparent hover:bg-secondary ") +
                    (isSameMonth(day, cursor) ? "" : "opacity-40 ") +
                    (isSameDay(day, new Date()) && !on ? "ring-1 ring-inset ring-primary/30 " : "")
                  }
                >
                  <span className="block text-xs font-semibold">{format(day, "d")}</span>
                  <div className="mt-1 space-y-0.5">
                    {items.slice(0, 3).map((v) => (
                      <span key={v.id} className={`block truncate rounded px-1 py-0.5 text-[9px] font-semibold ${CHIP[v.phase]}`}>
                        {CHIP_LABEL[v.phase]} · {v.address.split(",")[0]}
                      </span>
                    ))}
                    {items.length > 3 && <span className="block text-[9px] text-muted-foreground">+{items.length - 3} more</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            {Object.keys(CHIP_LABEL).map((k) => (
              <span key={k} className={`rounded px-2 py-0.5 ${CHIP[k]}`}>{CHIP_LABEL[k]}</span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dayLabel}</p>

          <div className="mt-4">
            <p className="text-sm font-semibold">Jobs that need an inspection <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{needs.length}</span></p>
            <label className="mt-2 block text-xs text-muted-foreground">
              Time for this day (optional)
              <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 8–12" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
            </label>
            {needs.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No approved job is waiting on an inspection.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {needs.map((n) => (
                  <li key={n.visitId} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{n.address}</p>
                      <p className={"text-xs " + (n.phase === "needs_reinspection" ? "text-rose-300" : "text-muted-foreground")}>
                        {n.contractor} · {n.name}
                        {n.phase === "needs_reinspection" ? " · re-inspection" : ""}
                        {n.phase === "requested" && n.requestedDate ? ` · asked for ${format(new Date(n.requestedDate + "T12:00:00"), "MMM d")}` : ""}
                        {n.phase === "ready" ? " · not asked for yet" : ""}
                      </p>
                    </div>
                    <button type="button" disabled={busy !== null} onClick={() => addToDay(n)} className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                      {busy === n.visitId ? "Adding…" : "Add to this day"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {message && <p role={message.error ? "alert" : "status"} className={"mt-3 text-xs " + (message.error ? "text-rose-300" : "text-emerald-300")}>{message.text}</p>}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-sm font-semibold">On this day</p>
            {onDay.length === 0 && resultsOnDay.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {[...onDay, ...resultsOnDay].map((v) => <VisitCard key={v.id} visit={v} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-primary">Needs a result <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{needsResult.length}</span></h2>
        <p className="mt-1 text-sm text-muted-foreground">Confirmed inspections whose day has come. Record pass or fail; a fail goes back to the pending list with the re-inspection fee.</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {needsResult.length === 0 && <p className="text-sm text-muted-foreground">Nothing is waiting on a result.</p>}
          {needsResult.map((v) => <VisitCard key={v.id} visit={v} showDate />)}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-primary">Results, last 7 days <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{lastWeek.length}</span></h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {lastWeek.length === 0 && <p className="text-sm text-muted-foreground">No results recorded this week.</p>}
          {lastWeek.map((v) => <VisitCard key={v.id} visit={v} showDate />)}
        </div>
      </section>
    </div>
  );
}

function VisitCard({ visit: v, showDate = false }: { visit: PlannerVisit; showDate?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [dayTime, setDayTime] = useState(v.time);
  const [inspector, setInspector] = useState(v.inspector);
  const [inspectorNumber, setInspectorNumber] = useState(v.inspectorNumber);
  const [dayNotes, setDayNotes] = useState(v.dayNotes);
  const [result, setResult] = useState("passed");
  const [resultDate, setResultDate] = useState(() => today());
  const [resultNotes, setResultNotes] = useState("");
  const [fee, setFee] = useState("");
  const [showResult, setShowResult] = useState(false);

  async function run(body: Record<string, unknown>, done: (data: any) => string) {
    setBusy(true);
    setMessage(null);
    try {
      const data = await act(v.id, body);
      setMessage({ text: done(data), error: false });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err?.message || "Could not save.", error: true });
    }
    setBusy(false);
  }

  const when = v.scheduledDate ? format(new Date(v.scheduledDate + "T12:00:00"), "EEE, MMM d") : "";
  const tone = CHIP[v.phase];

  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{v.address}</p>
          <p className="text-xs text-muted-foreground">
            {v.contractor} · {v.name}
            {v.isFinal ? " (final)" : ""}
            {showDate && when ? ` · ${when}` : ""}
            {v.time ? ` · ${v.time}` : ""}
          </p>
        </div>
        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
          {v.phase === "tentative" ? "On calendar, not confirmed" : v.phase === "scheduled" ? "Confirmed" : v.phase === "passed" ? "Passed" : "Did not pass"}
        </span>
      </div>

      {v.phase === "tentative" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => run({ action: "confirm" }, (d) => `Confirmed. ${noticeText(d.notice)}`)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            Confirm &amp; tell the contractor
          </button>
          <button type="button" disabled={busy} onClick={() => run({ action: "unschedule" }, () => "Taken off the calendar.")} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
            Take off calendar
          </button>
        </div>
      )}

      {v.phase === "scheduled" && (
        <>
          <details className="mt-3 rounded-lg border border-border p-2" open={Boolean(v.time || v.inspector) === false}>
            <summary className="cursor-pointer text-xs font-semibold">Morning-of details</summary>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <label className="text-xs">Time<input value={dayTime} onChange={(e) => setDayTime(e.target.value)} placeholder="8–12" className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" /></label>
              <label className="text-xs">Inspector<input value={inspector} onChange={(e) => setInspector(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" /></label>
              <label className="text-xs">Inspector phone<input value={inspectorNumber} onChange={(e) => setInspectorNumber(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" /></label>
            </div>
            <label className="mt-2 block text-xs">Notes for the contractor<textarea rows={2} value={dayNotes} onChange={(e) => setDayNotes(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" /></label>
            <button type="button" disabled={busy} onClick={() => run({ action: "day_of", time: dayTime, inspector_name: inspector, inspector_number: inspectorNumber, notes: dayNotes }, (d) => `Saved. ${noticeText(d.notice)}`)} className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              Save &amp; tell the contractor
            </button>
          </details>

          {!showResult ? (
            <button type="button" onClick={() => setShowResult(true)} className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">Record the result</button>
          ) : (
            <div className="mt-3 space-y-2 rounded-lg border border-border p-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs">Result
                  <select value={result} onChange={(e) => setResult(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm">
                    <option value="passed">Passed</option>
                    <option value="failed">Failed — needs a re-inspection</option>
                    <option value="partial_pass">Partial pass — needs a re-inspection</option>
                  </select>
                </label>
                <label className="text-xs">Result date<input type="date" value={resultDate} onChange={(e) => setResultDate(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" /></label>
              </div>
              {result === "failed" && (
                <label className="block text-xs">Re-inspection fee ($) — leave empty for the standard fee
                  <input inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="standard fee" className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
                </label>
              )}
              <label className="block text-xs">Inspector notes<textarea rows={2} value={resultNotes} onChange={(e) => setResultNotes(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" /></label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !resultDate}
                  onClick={() =>
                    run({ action: "result", result, date: resultDate, notes: resultNotes, fee: result === "failed" ? fee : undefined, inspector_name: inspector }, (d) =>
                      `${d.closed ? "Final passed. The job is closed. " : d.status === "passed" ? "Passed. " : "Back in the pending list for a re-inspection. "}${d.fee ? `Fee $${Number(d.fee).toFixed(2)} due. ` : ""}${noticeText(d.notice)}`
                    )
                  }
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Save result &amp; tell the contractor
                </button>
                <button type="button" onClick={() => setShowResult(false)} className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground">Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      {(v.phase === "passed" || v.phase === "needs_reinspection") && (
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {v.resultDate && <p>Result {format(new Date(v.resultDate + "T12:00:00"), "MMM d")}{v.inspector ? ` · inspector ${v.inspector}` : ""}</p>}
          {v.resultNotes && <p>Notes: {v.resultNotes}</p>}
          {v.phase === "needs_reinspection" && (
            <p className="text-rose-300">
              Back in the pending list.{v.fee ? ` Re-inspection fee $${v.fee.toFixed(2)} ${v.feeStatus || "due"}.` : " Re-inspection fee: amount not set."}
            </p>
          )}
        </div>
      )}

      {message && <p role={message.error ? "alert" : "status"} className={"mt-2 text-xs " + (message.error ? "text-rose-300" : "text-emerald-300")}>{message.text}</p>}
    </div>
  );
}
