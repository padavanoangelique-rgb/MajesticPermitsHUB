"use client";

import { useMemo, useState } from "react";
import { startingValues, stillBlank, VALUE_FIELDS, type CompanyDetails, type JobDetails, type ValueGroup } from "@/lib/forms/county-forms";

export type FillerJob = JobDetails & { id: string };

const GROUPS: Array<{ key: ValueGroup; title: string }> = [
  { key: "property", title: "Property" },
  { key: "owner", title: "Owner" },
  { key: "job", title: "The work" },
  { key: "contractor", title: "Your company" },
  { key: "more", title: "More details, if the county asks" },
];

const JOB_GROUPS: ValueGroup[] = ["property", "owner", "job"];

export function CountyFormFiller({
  form,
  keys,
  company,
  licenseNumber,
  jobs,
  initialJobId,
}: {
  form: { slug: string; name: string; kind: "application" | "noc" };
  keys: string[];
  company: CompanyDetails;
  licenseNumber: string;
  jobs: FillerJob[];
  initialJobId: string;
}) {
  const start = jobs.find((job) => job.id === initialJobId)?.id || "";
  const [jobId, setJobId] = useState(start);
  const [values, setValues] = useState<Record<string, string>>(() =>
    startingValues({ company, licenseNumber, job: jobs.find((job) => job.id === start) || null }),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const blank = useMemo(() => stillBlank(form.slug, values), [form.slug, values]);

  function pickJob(id: string) {
    setJobId(id);
    const fresh = startingValues({ company, licenseNumber, job: jobs.find((job) => job.id === id) || null });
    // The job's own details replace what was there. The company's stay as they were typed.
    setValues((current) => {
      const next = { ...current };
      for (const key of Object.keys(VALUE_FIELDS)) {
        if (JOB_GROUPS.includes(VALUE_FIELDS[key].group)) next[key] = fresh[key] || "";
      }
      return next;
    });
  }

  async function download() {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/contractor/forms/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: form.slug, job_id: jobId, values }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not make the form.");
        return;
      }
      const attached = decodeURIComponent(res.headers.get("X-Attached") || "").split("|").filter(Boolean);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = (res.headers.get("Content-Disposition") || "").match(/filename="([^"]+)"/)?.[1] || `${form.slug}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setNote(
        (attached.length ? `Too long for its box, so it is on the last page: ${attached.join(", ")}. ` : "") +
          (jobId ? "The property, owner and work details are saved to the job." : "Your company details are saved for next time."),
      );
    } catch {
      setError("Could not make the form.");
    } finally {
      setBusy(false);
    }
  }

  const input = "min-h-12 rounded-xl border border-border bg-card px-3";

  function field(key: string) {
    const meta = VALUE_FIELDS[key];
    return (
      <label key={key} className="grid gap-1 text-sm">
        {meta.label}
        {meta.textarea ? (
          <textarea className="min-h-24 rounded-xl border border-border bg-card px-3 py-2" value={values[key] || ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
        ) : (
          <input className={input} value={values[key] || ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
        )}
      </label>
    );
  }

  return (
    <div className="grid gap-5">
      <label className="grid gap-1 text-sm">
        Which job is this for?
        <select className={input} value={jobId} onChange={(e) => pickJob(e.target.value)}>
          <option value="">None, I will type the property</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.property_address}
            </option>
          ))}
        </select>
      </label>

      {blank.length > 0 && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Still blank on the form: {blank.map((key) => VALUE_FIELDS[key].label.toLowerCase()).join(", ")}.
          {blank.includes("folio_number") || blank.includes("legal_description") ? " The folio and legal description come from the property appraiser. Type them once and they are saved to the job." : ""}
        </p>
      )}

      {GROUPS.map((group) => {
        const shown = keys.filter((key) => VALUE_FIELDS[key]?.group === group.key);
        if (!shown.length) return null;
        const body = <div className="grid gap-3 sm:grid-cols-2">{shown.map(field)}</div>;
        return group.key === "more" ? (
          <details key={group.key} className="rounded-2xl border border-border p-4">
            <summary className="cursor-pointer text-sm font-semibold">{group.title}</summary>
            <div className="mt-3">{body}</div>
          </details>
        ) : (
          <section key={group.key} className="grid gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-violet-300">{group.title}</h2>
            {body}
          </section>
        );
      })}

      <button type="button" onClick={download} disabled={busy} className="min-h-12 rounded-xl bg-primary font-semibold text-white">
        {busy ? "Filling the form..." : "Download the filled PDF"}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {note && <p className="rounded-xl border border-violet-400/30 bg-card/80 p-3 text-sm">{note}</p>}
      <p className="text-xs text-muted-foreground">
        The PDF is the county&apos;s own form, still editable. Signature, notary and date lines are left for the people signing.
      </p>
    </div>
  );
}
