"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DirectoryRow = { name: string; email: string; portal?: string };

export function JurisdictionForm({
  jobId,
  initial,
}: {
  jobId: string;
  initial: {
    jurisdiction: string | null;
    building_dept_url: string | null;
    noc_status: string | null;
  };
}) {
  const router = useRouter();
  const [jurisdiction, setJurisdiction] = useState(initial.jurisdiction || "");
  const [url, setUrl] = useState(initial.building_dept_url || "");
  const [email, setEmail] = useState("");
  const [directory, setDirectory] = useState<DirectoryRow[]>([]);
  const [noc, setNoc] = useState(initial.noc_status || "None");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");

  function loadDirectory() {
    fetch("/api/admin/jurisdictions")
      .then((r) => r.json())
      .then((data) => setDirectory(data.jurisdictions || []))
      .catch(() => null);
  }

  useEffect(() => {
    loadDirectory();
  }, []);

  useEffect(() => {
    const match = directory.find(
      (row) => row.name.toLowerCase() === jurisdiction.trim().toLowerCase()
    );
    if (match?.email) setEmail(match.email);
    if (match?.portal && !url) setUrl(match.portal);
  }, [jurisdiction, directory]);

  async function save() {
    setSaving(true);
    setOk("");
    setError("");
    const res = await fetch(`/api/admin/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jurisdiction: jurisdiction || null,
        building_dept_url: url || null,
        noc_status: noc,
      }),
    });
    if (res.ok) {
      setOk("Saved.");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not save");
    }
    setSaving(false);
    return res.ok;
  }

  async function addContact() {
    setAdding(true);
    setOk("");
    setError("");
    const res = await fetch("/api/admin/jurisdictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: jurisdiction,
        email,
        portal: url,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setDirectory(data.jurisdictions || []);
      setShowAdd(false);
      setOk(`Saved ${jurisdiction} contact.`);
      await save();
    } else {
      setError(data.error || "Could not add contact");
    }
    setAdding(false);
  }

  async function sendNoc() {
    setSending(true);
    setOk("");
    setError("");
    await save();
    const res = await fetch(`/api/admin/jobs/${jobId}/send-noc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNoc("Submitted");
      setOk(`NOC emailed to ${data.to}`);
      router.refresh();
    } else {
      setError(data.error || "Could not send NOC");
    }
    setSending(false);
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Jurisdiction
          </label>
          <input
            list="jurisdiction-list"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            placeholder="Village of Wellington"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#020202] dark:text-white"
          />
          <datalist id="jurisdiction-list">
            {directory.map((row) => (
              <option key={row.name} value={row.name} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Building dept. email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="permits@city.gov"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#020202] dark:text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Building dept. portal URL
          </label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://wellingtonfl.gov/permits"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#020202] dark:text-white"
          />
        </div>
      </div>
      {showAdd && (
        <p className="text-xs text-slate-500">
          This saves the city, email, and portal for every future job in that jurisdiction.
        </p>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          NOC status
        </label>
        <select
          value={noc}
          onChange={(e) => setNoc(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#020202] dark:text-white"
        >
          <option value="None">None</option>
          <option value="Pending">Pending</option>
          <option value="Recorded">Recorded</option>
          <option value="Submitted">Submitted</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1157b8] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => (showAdd ? addContact() : setShowAdd(true))}
          disabled={adding || !jurisdiction || !email}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-[#111] dark:text-white"
        >
          {adding ? "Adding..." : showAdd ? "Save contact" : "Add contact"}
        </button>
        <button
          onClick={sendNoc}
          disabled={sending || !email}
          className="rounded-xl bg-[#e2ba00] px-4 py-2 text-sm font-semibold text-[#156cdd] hover:bg-[#c9a227] disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send NOC"}
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-[#e2ba00] hover:underline dark:text-[#9CE824]"
          >
            Open portal ↗
          </a>
        )}
        {ok && <span className="text-xs text-green-600">{ok}</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
