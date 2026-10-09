"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InspectionResultForm({ id, isFinal = false }: { id: string; isFinal?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState("Passed");
  const [final, setFinal] = useState(isFinal);
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function save() {
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const response = await fetch(`/api/admin/inspection-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, result_date: date, contractor_note: notes, final, notify_contractor: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save result");
      setMessage(`${data.closed ? "Final passed — job closed." : "Inspection result saved."}${data.email_error ? ` Notification: ${data.email_error}.` : ""}`);
      router.refresh();
    } catch (err: any) {
      setError(true);
      setMessage(err?.message || "Could not save result");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-border p-4">
      <p className="text-sm font-semibold">Record inspection result</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Result
          <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={busy} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2">
            <option value="Passed">Passed</option><option value="Partial">Partial pass</option><option value="Failed">Failed — corrections needed</option>
          </select>
        </label>
        <label className="text-sm">Result date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={busy} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2" />
        </label>
      </div>
      <label className="block text-sm">Inspector / correction notes
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={final} onChange={(e) => setFinal(e.target.checked)} disabled={busy || isFinal} />
        Final inspection — close job when passed
      </label>
      <button type="button" onClick={save} disabled={busy || !date} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Saving…" : status === "Passed" && final ? "Save final pass + close job" : "Save inspection result"}
      </button>
      {message && <p role={error ? "alert" : "status"} className={error ? "text-sm text-red-600" : "text-sm text-muted-foreground"}>{message}</p>}
    </div>
  );
}
