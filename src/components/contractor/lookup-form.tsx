"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PARCEL_COUNTIES, type ParcelCounty, type ParcelResult } from "@/lib/parcel";

type LookupJob = { id: string; property_address: string };

const OFFICIAL: Record<ParcelCounty, { name: string; url: string }> = {
  "palm-beach": { name: "Palm Beach County Property Appraiser", url: "https://pbcpao.gov/" },
  broward: { name: "Broward County Property Appraiser", url: "https://web.bcpa.net/bcpaclient/#/Record-Search" },
  "miami-dade": { name: "Miami-Dade Property Appraiser", url: "https://www.miamidade.gov/Apps/PA/propertysearch/" },
};

export function LookupForm({ jobs }: { jobs: LookupJob[] }) {
  const [county, setCounty] = useState<ParcelCounty>("palm-beach");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ParcelResult[]>([]);
  const [status, setStatus] = useState<"idle" | "searching" | "none" | "error">("idle");
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<ParcelResult | null>(null);
  const [jobId, setJobId] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 4) {
      setResults([]);
      setStatus("idle");
      return;
    }
    const ticket = ++latest.current;
    setStatus("searching");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/contractor/parcel-lookup?county=${county}&q=${encodeURIComponent(q)}`);
        const data = await res.json().catch(() => ({}));
        if (ticket !== latest.current) return;
        if (!res.ok) {
          setError(data.error || "Lookup failed");
          setStatus("error");
          setResults([]);
          return;
        }
        setResults(data.results || []);
        setStatus((data.results || []).length ? "idle" : "none");
      } catch {
        if (ticket !== latest.current) return;
        setError("Lookup failed");
        setStatus("error");
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, county]);

  function pick(hit: ParcelResult) {
    setPicked(hit);
    setSaved("");
    setError("");
    // Offer the job whose address matches the parcel's street.
    const street = hit.address.toLowerCase().split(",")[0].trim();
    const match = street ? jobs.find((job) => job.property_address.toLowerCase().includes(street)) : undefined;
    if (match) setJobId(match.id);
  }

  async function save() {
    if (!picked || !jobId) return;
    setSaving(true);
    setError("");
    setSaved("");
    const res = await fetch("/api/contractor/parcel-lookup/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, hit: picked }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save to the job.");
      return;
    }
    setSaved("Saved to the job: folio, legal description, city and jurisdiction.");
  }

  const box = "min-h-12 rounded-xl border border-border bg-card px-3";
  const official = OFFICIAL[county];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <label className="grid gap-1 text-sm">
          County
          <select className={box} value={county} onChange={(e) => setCounty(e.target.value as ParcelCounty)}>
            {PARCEL_COUNTIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Address, owner or folio
          <input className={box} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="4410 Haddon Pkwy" autoComplete="off" />
        </label>
      </div>

      {status === "searching" && <p className="text-sm text-muted-foreground">Searching the property appraiser...</p>}
      {status === "none" && <p className="text-sm text-muted-foreground">No match. Try the street number and name only, or the folio.</p>}
      {status === "error" && <p className="text-sm text-red-300">{error}</p>}

      {results.length > 0 && !picked && (
        <ul className="grid gap-2">
          {results.slice(0, 8).map((hit) => (
            <li key={hit.folio + hit.address}>
              <button type="button" onClick={() => pick(hit)} className="block w-full rounded-xl border border-violet-400/25 px-4 py-3 text-left hover:border-violet-300">
                <p className="font-semibold">{hit.address || "(no street address)"}</p>
                <p className="text-sm text-muted-foreground">
                  {[hit.owner, hit.city, hit.folio && `Folio ${hit.folio}`].filter(Boolean).join(" · ")}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {picked && (
        <section className="grid gap-3 rounded-2xl border border-violet-400/30 bg-card/80 p-4">
          <div className="rounded-xl bg-violet-500/10 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Jurisdiction</p>
            <p className="text-lg font-bold">{picked.jurisdiction}</p>
            <p className="text-xs text-muted-foreground">
              {picked.countyLabel}
              {picked.inDirectory ? "" : ". Not in your department directory yet, so there is no email or portal saved for it."}
            </p>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {(
              [
                ["Address", [picked.address, picked.city, picked.zip].filter(Boolean).join(", ")],
                ["Owner of record", picked.owner],
                ["Folio", picked.folio],
              ] as Array<[string, string]>
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value || "—"}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Legal description</dt>
              <dd className="font-medium">
                {picked.legalDescription || (picked.countyKey === "miami-dade" ? "Miami-Dade does not publish it in this lookup. Copy it from their record." : "None on file.")}
              </dd>
            </div>
          </dl>

          <label className="grid gap-1 text-sm">
            Save this to which job?
            <select className={box} value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">Pick a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.property_address}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={save} disabled={!jobId || saving} className="min-h-12 rounded-xl bg-primary px-5 font-semibold text-white disabled:opacity-50">
              {saving ? "Saving..." : "Save to the job"}
            </button>
            <button type="button" onClick={() => setPicked(null)} className="min-h-12 rounded-xl border border-border px-5 font-semibold">
              Back to the results
            </button>
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {saved && (
            <p className="text-sm">
              {saved}{" "}
              <Link href={`/dashboard/forms?job=${jobId}`} className="font-semibold text-violet-300">
                Fill a county form for it
              </Link>
            </p>
          )}
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Straight from the county. To double-check, open the{" "}
        <a className="text-violet-300 underline" href={official.url} target="_blank" rel="noopener noreferrer">
          {official.name}
        </a>
        .
      </p>
    </div>
  );
}
