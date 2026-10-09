"use client";
import { useState } from "react";

export function DocDownload({ id, label, admin = false, view = false }: { id: string; label: string; admin?: boolean; view?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function open() {
    // Open during the click so mobile browsers do not block the preview.
    const preview = view ? window.open("about:blank", "_blank") : null;
    if (preview) preview.opener = null;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/${admin ? "admin/" : ""}documents/${id}/signed-url${view ? "?view=1" : ""}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Document unavailable. Please retry.");
      if (preview) preview.location.href = data.url;
      else window.location.assign(data.url);
    } catch (err) {
      preview?.close();
      setError(err instanceof Error ? err.message : "Could not open document. Please retry.");
    } finally { setBusy(false); }
  }
  return <span className="inline-flex flex-col items-start gap-1">
    <button type="button" disabled={busy} onClick={open} className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-60">{busy ? "Opening…" : label}</button>
    {error && <span role="alert" className="max-w-52 text-xs text-destructive">{error}</span>}
  </span>;
}
