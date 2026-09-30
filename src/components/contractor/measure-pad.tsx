"use client";

import { useState } from "react";

type Opening = { label: string; kind: "window" | "door"; width: string; height: string };
type Job = { id: string; property_address: string };

export function MeasurePad({ jobs, initialJob, initialOpenings }: { jobs: Job[]; initialJob: string; initialOpenings: Opening[] }) {
  const [jobId, setJobId] = useState(initialJob);
  const [openings, setOpenings] = useState<Opening[]>(initialOpenings);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function add(kind: "window" | "door") {
    setOpenings((current) => [
      ...current,
      { label: `${kind === "door" ? "Door" : "Window"} ${current.length + 1}`, kind, width: "", height: "" },
    ]);
  }

  function update(index: number, key: keyof Opening, value: string) {
    setOpenings((current) => current.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/contractor/measures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, openings }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setMessage(res.ok ? "Measurements saved on the job." : data.error || "Could not save.");
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-1 text-sm">
        Job
        <select className="min-h-12 rounded-xl border border-border bg-card px-3" value={jobId} onChange={(e) => setJobId(e.target.value)}>
          <option value="">Choose a job</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>{job.property_address}</option>
          ))}
        </select>
      </label>

      <div className="overflow-hidden rounded-2xl border border-violet-400/25 bg-[#120a28] p-3">
        <svg viewBox="0 0 320 180" className="h-44 w-full">
          <rect x="8" y="16" width="304" height="148" rx="8" fill="#1b1238" stroke="#a78bfa" />
          {openings.map((opening, index) => {
            const width = Math.max(28, Math.min(90, Number(opening.width) || 36));
            const height = opening.kind === "door" ? 110 : Math.max(28, Math.min(80, Number(opening.height) || 40));
            const x = 20 + (index % 4) * 74;
            const y = opening.kind === "door" ? 40 : 36;
            return (
              <g key={index}>
                <rect x={x} y={y} width={width * 0.6} height={height} rx="2" fill="#6d28d9" stroke="#ddd6fe" />
                <text x={x} y={y + height + 14} fill="#ddd6fe" fontSize="10">
                  {opening.width || "—"} x {opening.height || "—"}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="px-1 text-xs text-violet-200">Tap an opening below. The wall updates as you type the size.</p>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => add("window")} className="min-h-11 flex-1 rounded-xl border border-violet-400/40">Add window</button>
        <button type="button" onClick={() => add("door")} className="min-h-11 flex-1 rounded-xl border border-violet-400/40">Add door</button>
      </div>

      <ul className="grid gap-3">
        {openings.map((opening, index) => (
          <li key={index} className="grid grid-cols-2 gap-2 rounded-2xl border border-border p-3">
            <input className="col-span-2 min-h-11 rounded-xl border border-border bg-card px-3" value={opening.label} onChange={(e) => update(index, "label", e.target.value)} />
            <input inputMode="decimal" placeholder="Width" className="min-h-11 rounded-xl border border-border bg-card px-3" value={opening.width} onChange={(e) => update(index, "width", e.target.value)} />
            <input inputMode="decimal" placeholder="Height" className="min-h-11 rounded-xl border border-border bg-card px-3" value={opening.height} onChange={(e) => update(index, "height", e.target.value)} />
          </li>
        ))}
      </ul>

      <button type="button" onClick={save} disabled={saving || !jobId} className="min-h-12 rounded-xl bg-primary font-semibold text-white disabled:opacity-50">
        {saving ? "Saving..." : "Save measurements"}
      </button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
