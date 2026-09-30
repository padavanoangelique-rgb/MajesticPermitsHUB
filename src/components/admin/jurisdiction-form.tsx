"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DirectoryRow = { name: string; email: string; portal?: string };
type JobDoc = { id: string; file_name: string | null; label: string | null; category: string | null };

export function JurisdictionForm({
  jobId,
  permitNumber,
  contractorEmail,
  documents,
  initial,
}: {
  jobId: string;
  permitNumber?: string | null;
  contractorEmail?: string | null;
  documents: JobDoc[];
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
  const [docId, setDocId] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPortal, setNewPortal] = useState("");
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");

  const contacts = useMemo(
    () => directory.filter((row) => row.email && row.email.includes("@")),
    [directory]
  );

  useEffect(() => {
    fetch("/api/admin/jurisdictions")
      .then((r) => r.json())
      .then((data) => setDirectory(data.jurisdictions || []))
      .catch(() => null);
  }, []);

  useEffect(() => {
    const match = directory.find(
      (row) => row.name.toLowerCase() === jurisdiction.trim().toLowerCase()
    );
    if (match?.email) setEmail(match.email);
    if (match?.portal && !url) setUrl(match.portal);
  }, [jurisdiction, directory]);

  useEffect(() => {
    if (docId) return;
    const auto = documents.find((d) => {
      const blob = `${d.file_name || ""} ${d.label || ""} ${d.category || ""}`.toLowerCase();
      return blob.includes("noc") || blob.includes("notice of commencement");
    });
    if (auto) setDocId(auto.id);
    else if (documents[0]) setDocId(documents[0].id);
  }, [documents, docId]);

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
    const name = (newName || jurisdiction).trim();
    const contactEmail = (newEmail || email).trim();
    const res = await fetch("/api/admin/jurisdictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: contactEmail,
        portal: newPortal || url,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setDirectory(data.jurisdictions || []);
      setJurisdiction(name);
      setEmail(contactEmail);
      setShowAdd(false);
      setNewName("");
      setNewEmail("");
      setNewPortal("");
      setOk(`Saved ${name} contact.`);
      await save();
    } else {
      setError(data.error || "Could not add contact");
    }
    setAdding(false);
  }

  async function sendNoc() {
    if (!email || !email.includes("@")) {
      setError("Enter or pick a building department email first.");
      return;
    }
    if (!docId) {
      setError("Choose the NOC file from this job.");
      return;
    }
    setSending(true);
    setOk("");
    setError("");
    await save();
    const res = await fetch(`/api/admin/jobs/${jobId}/send-noc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        documentId: docId,
        contractorEmail: contractorEmail || "",
      }),
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
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Jurisdiction
          </label>
          <input
            list="jurisdiction-list"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            placeholder="Village of Wellington"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground dark:border-border dark:bg-background dark:text-white"
          />
          <datalist id="jurisdiction-list">
            {directory.map((row) => (
              <option key={row.name} value={row.name} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Building dept. portal URL
          </label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://wellingtonfl.gov/permits"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground dark:border-border dark:bg-background dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Send to contact
        </label>
        <select
          value={contacts.some((row) => row.email === email) ? email : ""}
          onChange={(e) => {
            const next = e.target.value;
            setEmail(next);
            const match = contacts.find((row) => row.email === next);
            if (match) setJurisdiction(match.name);
          }}
          className="mb-2 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground dark:border-border dark:bg-background dark:text-white"
        >
          <option value="">Select a saved contact…</option>
          {contacts.map((row) => (
            <option key={`${row.name}-${row.email}`} value={row.email}>
              {row.name} — {row.email}
            </option>
          ))}
        </select>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="or type permits@city.gov"
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground dark:border-border dark:bg-background dark:text-white"
        />
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-border bg-secondary p-4 dark:border-border dark:bg-secondary">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            New building department contact
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="City / department name"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-background dark:text-white"
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="permits@city.gov"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-background dark:text-white"
            />
            <input
              value={newPortal}
              onChange={(e) => setNewPortal(e.target.value)}
              placeholder="Portal URL (optional)"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm sm:col-span-2 dark:border-border dark:bg-background dark:text-white"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Attach from this job
        </label>
        <select
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground dark:border-border dark:bg-background dark:text-white"
        >
          <option value="">
            {documents.length ? "Choose a file…" : "Upload a NOC on this job first"}
          </option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.label || doc.file_name || "Untitled file"}
              {doc.category ? ` · ${doc.category}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          NOC status
        </label>
        <select
          value={noc}
          onChange={(e) => setNoc(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground dark:border-border dark:bg-background dark:text-white"
        >
          <option value="None">None</option>
          <option value="Pending">Pending</option>
          <option value="Recorded">Recorded</option>
          <option value="Submitted">Submitted</option>
        </select>
      </div>

      <p className="rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground dark:bg-secondary dark:text-muted-foreground">
        Email preview: Please see attached NOC for permit Number{" "}
        <strong>{permitNumber || "(add permit # on this job)"}</strong>.
        {contractorEmail ? ` CC ${contractorEmail} and angelique@majesticpermits.com.` : " CC angelique@majesticpermits.com."}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => (showAdd ? addContact() : setShowAdd(true))}
          disabled={adding || (showAdd && !(newName || jurisdiction) && !(newEmail || email))}
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-60 dark:border-border dark:bg-secondary dark:text-white"
        >
          {adding ? "Adding..." : showAdd ? "Save contact" : "Add contact"}
        </button>
        <button
          type="button"
          onClick={sendNoc}
          disabled={sending || !email.includes("@") || !docId}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send NOC"}
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-primary hover:underline dark:text-primary"
          >
            Open portal ↗
          </a>
        )}
        {ok && <span className="text-xs text-green-600">{ok}</span>}
        {error && <span className="text-xs text-red-200">{error}</span>}
      </div>
    </div>
  );
}
