"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ContractorResultForm({
  inspectionId,
  isFinal,
}: {
  inspectionId: string;
  isFinal?: boolean;
}) {
  const router = useRouter();
  const [result, setResult] = useState("passed");
  const [notes, setNotes] = useState("");
  const [final, setFinal] = useState(Boolean(isFinal));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    setDone("");
    try {
      const res = await fetch("/api/contractor/inspection-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspection_id: inspectionId,
          result,
          notes,
          final: result === "passed" && final,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save result");
      setDone(data.closed ? "Final passed — job closed." : "Result sent to Majestic.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Result (if you have it first)
      </p>
      <select
        value={result}
        onChange={(e) => setResult(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202] dark:text-white"
      >
        <option value="passed">Passed</option>
        <option value="partial_pass">Partial pass</option>
        <option value="failed">Failed — corrections</option>
      </select>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Inspector notes, if any"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202] dark:text-white"
      />
      {result === "passed" && (
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={final} onChange={(e) => setFinal(e.target.checked)} />
          This is the final inspection — close the job
        </label>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {done && <p className="text-xs text-green-600">{done}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="rounded-lg bg-[#156cdd] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save result"}
      </button>
    </div>
  );
}
