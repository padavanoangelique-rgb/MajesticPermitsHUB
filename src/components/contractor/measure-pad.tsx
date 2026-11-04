"use client";

import { useState } from "react";

type Opening = { label: string; kind: "window" | "door"; width: string; height: string; x?: number; y?: number };
type Job = { id: string; property_address: string };

export function MeasurePad({ jobs, initialJob, initialOpenings }: { jobs: Job[]; initialJob: string; initialOpenings: Opening[] }) {
  const [jobId, setJobId] = useState(initialJob);
  const [openings, setOpenings] = useState<Opening[]>(initialOpenings.map((o, i) => ({ ...o, x: o.x ?? 20 + (i % 4) * 70, y: o.y ?? (o.kind === "door" ? 50 : 40) })));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  function add(kind: "window" | "door") {
    const i = openings.length;
    setOpenings((current) => [
      ...current,
      { label: `${kind === "door" ? "Door" : "Window"} ${i + 1}`, kind, width: "", height: "", x: 30 + (i % 3) * 80, y: kind === "door" ? 60 : 45 },
    ]);
  }

  function update(index: number, key: keyof Opening, value: string | number) {
    setOpenings((current) => current.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  function onSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (selected === null) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 320;
    const y = ((e.clientY - rect.top) / rect.height) * 180;
    update(selected, "x", Math.max(10, Math.min(280, x)));
    update(selected, "y", Math.max(20, Math.min(140, y)));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/contractor/measures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, openings: openings.map(({ x, y, ...rest }) => rest) }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setMessage(res.ok ? "Measurements saved." : data.error || "Could not save.");
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        Job
        <select className="min-h-11 rounded-xl border border-border bg-card px-3" value={jobId} onChange={(e) => setJobId(e.target.value)}>
          <option value="">Choose a job</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>{job.property_address}</option>
          ))}
        </select>
      </label>

      <div className="overflow-hidden rounded-2xl border border-violet-400/25 bg-[#120a28] p-2">
        <svg viewBox="0 0 320 180" className="h-48 w-full cursor-crosshair" onClick={onSvgClick}>
          <rect x="10" y="20" width="300" height="140" rx="6" fill="#1b1238" stroke="#a78bfa" strokeWidth="1.5" />
          <text x="160" y="16" textAnchor="middle" fill="#c4b5fd" fontSize="10">Tap an opening then click wall to move</text>
          {openings.map((opening, index) => {
            const w = Math.max(24, Math.min(70, Number(opening.width) || 36));
            const h = opening.kind === "door" ? 100 : Math.max(24, Math.min(70, Number(opening.height) || 40));
            const x = opening.x ?? 20;
            const y = opening.y ?? 40;
            const isSel = selected === index;
            return (
              <g key={index} onClick={(e) => { e.stopPropagation(); setSelected(index); }} className="cursor-pointer">
                <rect x={x} y={y} width={w * 0.55} height={h} rx="2" fill={isSel ? "#8b5cf6" : "#6d28d9"} stroke={isSel ? "#fbbf24" : "#ddd6fe"} strokeWidth={isSel ? 2 : 1} />
                <text x={x + (w * 0.55) / 2} y={y + h + 12} textAnchor="middle" fill="#ddd6fe" fontSize="9">
                  {opening.width || "—"}×{opening.height || "—"}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="px-1 pt-1 text-[11px] text-violet-200">Select opening below, then click the wall to place it.</p>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => add("window")} className="min-h-10 flex-1 rounded-xl border border-violet-400/40 text-sm">+ Window</button>
        <button type="button" onClick={() => add("door")} className="min-h-10 flex-1 rounded-xl border border-violet-400/40 text-sm">+ Door</button>
      </div>

      <ul className="grid gap-2">
        {openings.map((opening, index) => (
          <li key={index} className={`grid grid-cols-2 gap-2 rounded-xl border p-2.5 ${selected === index ? "border-amber-400 bg-amber-950/20" : "border-border"}`} onClick={() => setSelected(index)}>
            <input className="col-span-2 min-h-10 rounded-lg border border-border bg-card px-2 text-sm" value={opening.label} onChange={(e) => update(index, "label", e.target.value)} />
            <input inputMode="decimal" placeholder="W" className="min-h-10 rounded-lg border border-border bg-card px-2 text-sm" value={opening.width} onChange={(e) => update(index, "width", e.target.value)} />
            <input inputMode="decimal" placeholder="H" className="min-h-10 rounded-lg border border-border bg-card px-2 text-sm" value={opening.height} onChange={(e) => update(index, "height", e.target.value)} />
          </li>
        ))}
      </ul>

      <button type="button" onClick={save} disabled={saving || !jobId} className="min-h-11 rounded-xl bg-primary font-semibold text-white text-sm disabled:opacity-50">
        {saving ? "Saving..." : "Save measurements"}
      </button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
