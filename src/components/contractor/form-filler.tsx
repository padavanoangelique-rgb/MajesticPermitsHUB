"use client";

import { useMemo, useState } from "react";
import type { PermitForm } from "@/lib/permit-forms";

type Job = { id: string; property_address: string; permit_number: string | null };

export function FormFiller({
  form,
  company,
  jobs,
}: {
  form: PermitForm;
  company: Record<string, string>;
  jobs: Job[];
}) {
  const starting = useMemo(() => {
    const fields: Record<string, string> = {};
    for (const field of form.fields) fields[field.key] = company[field.key] || "";
    return fields;
  }, [form, company]);
  const [fields, setFields] = useState(starting);
  const [email, setEmail] = useState("");
  const [jobId, setJobId] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  function applyJob(id: string) {
    setJobId(id);
    const job = jobs.find((item) => item.id === id);
    if (!job) return;
    setFields((current) => ({
      ...current,
      property_address: job.property_address || current.property_address,
    }));
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    setLink("");
    const res = await fetch("/api/contractor/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form_key: form.key, fields, signer_email: email, job_id: jobId }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error || "Could not create the form.");
      return;
    }
    setLink(`${window.location.origin}${data.path}`);
  }

  return (
    <form onSubmit={send} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        Pull an address from a job
        <select className="min-h-12 rounded-xl border border-border bg-card px-3" value={jobId} onChange={(e) => applyJob(e.target.value)}>
          <option value="">None</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.property_address}
            </option>
          ))}
        </select>
      </label>
      {form.fields.map((field) => (
        <label key={field.key} className="grid gap-1 text-sm">
          {field.label}
          {field.kind === "textarea" ? (
            <textarea className="min-h-24 rounded-xl border border-border bg-card px-3 py-2" value={fields[field.key] || ""} onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })} />
          ) : (
            <input className="min-h-12 rounded-xl border border-border bg-card px-3" value={fields[field.key] || ""} onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })} />
          )}
        </label>
      ))}
      <label className="grid gap-1 text-sm">
        Send the signature link to
        <input type="email" className="min-h-12 rounded-xl border border-border bg-card px-3" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional email, for your notes" />
      </label>
      <button disabled={sending} className="min-h-12 rounded-xl bg-primary font-semibold text-white">
        {sending ? "Creating..." : "Create signature link"}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {link && (
        <p className="break-all rounded-xl border border-violet-400/30 bg-card/80 p-3 text-sm">
          Send this link. The form is already filled. They only sign it.
          <a className="mt-2 block font-semibold text-violet-300" href={link}>
            {link}
          </a>
        </p>
      )}
    </form>
  );
}
