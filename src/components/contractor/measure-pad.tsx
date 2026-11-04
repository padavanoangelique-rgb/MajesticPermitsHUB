"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

type Opening = { label: string; kind: "window" | "door"; width: string; height: string; x?: number; y?: number };
type Wall = { x1: number; y1: number; x2: number; y2: number };
type Job = { id: string; property_address: string };

export function MeasurePad({ jobs, initialJob, initialOpenings }: { jobs: Job[]; initialJob: string; initialOpenings: Opening[] }) {
  const [jobId, setJobId] = useState(initialJob);
  const [openings, setOpenings] = useState<Opening[]>(initialOpenings.map((o, i) => ({ ...o, x: o.x ?? 40 + (i % 4) * 60, y: o.y ?? 50 })));
  const [walls, setWalls] = useState<Wall[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [full, setFull] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [current, setCurrent] = useState<Wall | null>(null);
  const [uploadAddr, setUploadAddr] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function add(kind: "window" | "door") {
    const i = openings.length;
    setOpenings((c) => [...c, { label: `${kind === "door" ? "Door" : "Window"} ${i + 1}`, kind, width: "", height: "", x: 50 + (i % 3) * 70, y: 60 }]);
  }

  function update(index: number, key: keyof Opening, value: string | number) {
    setOpenings((c) => c.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  function snap(x1: number, y1: number, x2: number, y2: number): Wall {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    if (dx > dy * 1.5) return { x1, y1, x2, y2: y1 };
    if (dy > dx * 1.5) return { x1, y1, x2: x1, y2 };
    return { x1, y1, x2, y2 };
  }

  function pos(e: React.PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
  }

  function onDown(e: React.PointerEvent) {
    if (selected !== null) {
      const p = pos(e);
      update(selected, "x", Math.max(10, Math.min(290, p.x)));
      update(selected, "y", Math.max(20, Math.min(160, p.y)));
      setSelected(null);
      return;
    }
    setDrawing(true);
    const p = pos(e);
    setCurrent({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
  }

  function onMove(e: React.PointerEvent) {
    if (!drawing || !current) return;
    const p = pos(e);
    setCurrent({ ...current, x2: p.x, y2: p.y });
  }

  function onUp() {
    if (drawing && current) {
      const snapped = snap(current.x1, current.y1, current.x2, current.y2);
      if (Math.hypot(snapped.x2 - snapped.x1, snapped.y2 - snapped.y1) > 15) {
        setWalls((w) => [...w, snapped]);
      }
    }
    setDrawing(false);
    setCurrent(null);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1b1238";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 2;
    walls.forEach((wall) => {
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
    });
    if (current) {
      const s = snap(current.x1, current.y1, current.x2, current.y2);
      ctx.strokeStyle = "#fbbf24";
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    openings.forEach((o, i) => {
      const isSel = selected === i;
      const ww = Math.max(20, Math.min(50, Number(o.width) || 28));
      const hh = o.kind === "door" ? 50 : Math.max(16, Math.min(40, Number(o.height) || 22));
      const x = o.x ?? 40;
      const y = o.y ?? 50;
      ctx.fillStyle = isSel ? "#8b5cf6" : "#6d28d9";
      ctx.strokeStyle = isSel ? "#fbbf24" : "#ddd6fe";
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.fillRect(x, y, ww, hh);
      ctx.strokeRect(x, y, ww, hh);
      ctx.fillStyle = "#ddd6fe";
      ctx.font = "10px sans-serif";
      ctx.fillText(`${o.width || "—"}×${o.height || "—"}`, x, y + hh + 12);
    });
  }, [walls, current, openings, selected, drawing]);

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/contractor/measures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, openings: openings.map(({ x, y, ...rest }) => rest), walls }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setMessage(res.ok ? "Measurements saved." : data.error || "Could not save.");
  }

  async function sendPdfAsJob() {
    if (!uploadAddr.trim() || !uploadFile) {
      setUploadMsg("Address and PDF required.");
      return;
    }
    setUploading(true);
    setUploadMsg("");
    const form = new FormData();
    form.append("property_address", uploadAddr.trim());
    form.append("trade_type", "Windows");
    form.append("notes", "Floor plan PDF uploaded from Measure page.");
    form.append("files", uploadFile);
    try {
      const res = await fetch("/api/contractor/job-requests", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send");
      setUploadMsg("Sent. Majestic will review it.");
      setUploadAddr("");
      setUploadFile(null);
    } catch (err: any) {
      setUploadMsg(err.message || "Could not send.");
    }
    setUploading(false);
  }

  const canvas = (
    <div ref={wrapRef} className={full ? "fixed inset-0 z-50 bg-[#0c0618] flex flex-col" : "overflow-hidden rounded-2xl border border-violet-400/25 bg-[#120a28]"}>
      {full && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-violet-400/20">
          <span className="text-sm text-violet-200">Draw walls — release to snap straight</span>
          <button type="button" onClick={() => setFull(false)} className="text-xs px-3 py-1 rounded-lg border border-violet-400/40">Close</button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={320}
        height={full ? 420 : 200}
        className={full ? "flex-1 w-full touch-none" : "h-52 w-full touch-none"}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      />
      {!full && <p className="px-2 pb-2 text-[11px] text-violet-200">Finger-draw walls (snap straight). Tap an opening then the wall to place it.</p>}
    </div>
  );

  return (
    <div className="grid gap-3">
      <div className="flex items-end gap-2">
        <label className="grid flex-1 gap-1 text-sm">
          Job
          <select className="min-h-11 rounded-xl border border-border bg-card px-3" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            <option value="">Choose a job</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.property_address}</option>
            ))}
          </select>
        </label>
        <Link href="/dashboard/new" className="mb-0.5 inline-flex min-h-11 items-center justify-center rounded-xl border border-violet-400/40 px-3 text-sm whitespace-nowrap">+ Job</Link>
      </div>

      {canvas}

      <div className="flex gap-2">
        <button type="button" onClick={() => setFull(true)} className="min-h-10 flex-1 rounded-xl border border-violet-400/40 text-sm">Full screen draw</button>
        <button type="button" onClick={() => setWalls([])} className="min-h-10 rounded-xl border border-border px-3 text-sm">Clear walls</button>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => add("window")} className="min-h-10 flex-1 rounded-xl border border-violet-400/40 text-sm">+ Window</button>
        <button type="button" onClick={() => add("door")} className="min-h-10 flex-1 rounded-xl border border-violet-400/40 text-sm">+ Door</button>
      </div>

      <p className="text-xs text-muted-foreground">Tap an opening, then type the size. Width × Height.</p>
      <ul className="grid gap-2">
        {openings.map((opening, index) => (
          <li key={index} className={`grid grid-cols-2 gap-2 rounded-xl border p-2.5 ${selected === index ? "border-amber-400 bg-amber-950/20" : "border-border"}`} onClick={() => setSelected(index)}>
            <input className="col-span-2 min-h-10 rounded-lg border border-border bg-card px-2 text-sm" value={opening.label} onChange={(e) => update(index, "label", e.target.value)} placeholder="Label" />
            <label className="text-[11px] text-muted-foreground">Width<input inputMode="decimal" placeholder="e.g. 36" className="mt-0.5 min-h-10 w-full rounded-lg border border-border bg-card px-2 text-sm" value={opening.width} onChange={(e) => update(index, "width", e.target.value)} /></label>
            <label className="text-[11px] text-muted-foreground">Height<input inputMode="decimal" placeholder="e.g. 60" className="mt-0.5 min-h-10 w-full rounded-lg border border-border bg-card px-2 text-sm" value={opening.height} onChange={(e) => update(index, "height", e.target.value)} /></label>
          </li>
        ))}
      </ul>

      <button type="button" onClick={save} disabled={saving || !jobId} className="min-h-11 rounded-xl bg-primary font-semibold text-white text-sm disabled:opacity-50">
        {saving ? "Saving..." : "Save measurements"}
      </button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="mt-4 rounded-2xl border border-dashed border-violet-400/40 p-3">
        <p className="text-sm font-semibold">Or upload a floor plan PDF as a new job</p>
        <p className="mt-1 text-xs text-muted-foreground">Send the plan to Majestic. It appears after review.</p>
        <input
          placeholder="Property address"
          value={uploadAddr}
          onChange={(e) => setUploadAddr(e.target.value)}
          className="mt-2 min-h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
        />
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
          className="mt-2 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-white"
        />
        <button type="button" onClick={sendPdfAsJob} disabled={uploading} className="mt-2 min-h-10 w-full rounded-xl border border-violet-400/40 text-sm">
          {uploading ? "Sending…" : "Send PDF as new job"}
        </button>
        {uploadMsg && <p className="mt-1 text-xs text-muted-foreground">{uploadMsg}</p>}
      </div>
    </div>
  );
}
