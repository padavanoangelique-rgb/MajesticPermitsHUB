"use client";

import { useRef, useState } from "react";

export function SignPad({ token }: { token: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = point(event);
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = point(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  async function submit() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const res = await fetch(`/api/sign/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, signature: canvas.toDataURL("image/png") }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Could not save the signature.");
      return;
    }
    setDone(true);
  }

  if (done) return <p className="text-lg font-semibold">Signed. You can close this page.</p>;

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        Your name
        <input className="min-h-12 rounded-xl border border-border bg-white px-3 text-slate-900" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <canvas
        ref={canvasRef}
        width={640}
        height={220}
        className="h-40 w-full touch-none rounded-xl border border-border bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={() => { drawing.current = false; }}
        onPointerLeave={() => { drawing.current = false; }}
      />
      <button type="button" onClick={submit} className="min-h-12 rounded-xl bg-primary font-semibold text-white">
        Sign this form
      </button>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
