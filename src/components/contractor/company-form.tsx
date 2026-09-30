"use client";

import { useState } from "react";

type Record = {
  license_number: string;
  license_expires: string;
  coi_carrier: string;
  coi_policy: string;
  coi_expires: string;
};

export function CompanyForm({ initial }: { initial: Record }) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function set(key: keyof Record, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/contractor/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setMessage(res.ok ? "Saved." : data.error || "Could not save.");
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        License number
        <input className="min-h-12 rounded-xl border border-border bg-card px-3" value={form.license_number} onChange={(e) => set("license_number", e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        License expiration
        <input type="date" className="min-h-12 rounded-xl border border-border bg-card px-3" value={form.license_expires} onChange={(e) => set("license_expires", e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Insurance carrier
        <input className="min-h-12 rounded-xl border border-border bg-card px-3" value={form.coi_carrier} onChange={(e) => set("coi_carrier", e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Policy number
        <input className="min-h-12 rounded-xl border border-border bg-card px-3" value={form.coi_policy} onChange={(e) => set("coi_policy", e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Insurance expiration
        <input type="date" className="min-h-12 rounded-xl border border-border bg-card px-3" value={form.coi_expires} onChange={(e) => set("coi_expires", e.target.value)} />
      </label>
      <button disabled={saving} className="min-h-12 rounded-xl bg-primary font-semibold text-white">
        {saving ? "Saving..." : "Save company file"}
      </button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}
