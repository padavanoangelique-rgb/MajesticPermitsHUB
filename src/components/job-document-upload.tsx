"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_ACCEPT, DOCUMENT_CATEGORIES, documentFileError } from "@/lib/job-document-files";

export function JobDocumentUpload({ jobId, admin = false }: { jobId: string; admin?: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("intake");
  const [homeowner, setHomeowner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!files.length || files.length > 5) { setError("Choose between 1 and 5 files."); return; }
    const invalid = files.map(documentFileError).filter(Boolean);
    if (invalid.length) { setError(invalid.join(" ")); return; }
    setBusy(true);
    let saved = 0;
    try {
      // One file per request prevents a batch exceeding the request body limit.
      for (const file of files) {
        setProgress(`Uploading ${saved + 1} of ${files.length}: ${file.name}`);
        const body = new FormData();
        body.set("category", category);
        if (admin) {
          body.set("job_id", jobId);
          body.set("visible_to_homeowner", String(homeowner));
        }
        body.append(admin ? "file" : "files", file);
        const response = await fetch(admin ? "/api/admin/documents" : `/api/contractor/jobs/${jobId}/documents`, { method: "POST", body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(`${file.name}: ${data.error || "Upload could not be confirmed. Refresh the documents before retrying."}`);
        saved += 1;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload could not be confirmed. Refresh the documents before retrying.");
    } finally {
      if (saved) {
        setSuccess(`${saved} file${saved === 1 ? "" : "s"} saved on this job and available to ${admin ? "the contractor" : "Majestic"}.`);
        setFiles(files.slice(saved));
        if (input.current) input.current.value = "";
        router.refresh();
      }
      setProgress("");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-secondary/20 p-4">
      <p className="text-sm font-semibold">{admin ? "Upload for contractor" : "Upload to Majestic"}</p>
      <p className="text-xs text-muted-foreground">Files stay with this job. Up to 5 files, 4 MB each. PDF, photos, Word, Excel, or ZIP.</p>
      <label className="block text-sm">Document category
        <select value={category} disabled={busy} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2">
          {DOCUMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>
      <label className="block text-sm">Choose documents
        <input ref={input} type="file" multiple disabled={busy} accept={DOCUMENT_ACCEPT} onChange={e => { setFiles(Array.from(e.target.files || [])); setError(""); setSuccess(""); }} className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground" />
      </label>
      {files.length > 0 && <ul className="space-y-1 text-xs text-muted-foreground">{files.map((file, i) => <li key={i} className="break-all">{file.name}</li>)}</ul>}
      {admin && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={homeowner} disabled={busy} onChange={e => setHomeowner(e.target.checked)} />Also share with homeowner</label>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="text-sm text-primary">{success}</p>}
      {progress && <p role="status" className="break-all text-sm text-muted-foreground">{progress}</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={busy || !files.length} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Uploading…" : "Upload documents"}</button>
        <button type="button" disabled={busy} onClick={() => router.refresh()} className="rounded-xl border border-border px-4 py-2 text-sm">Refresh documents</button>
      </div>
    </form>
  );
}
