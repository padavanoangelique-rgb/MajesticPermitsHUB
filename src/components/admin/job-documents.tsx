"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { JobDocumentUpload } from "@/components/job-document-upload";
import { DocDownload } from "@/components/contractor/doc-download";
import { DOCUMENT_CATEGORIES, documentSource } from "@/lib/job-document-files";

export interface JobDocument {
  id: string;
  category: string;
  label: string | null;
  file_name: string;
  storage_path?: string;
  visible_to_homeowner: boolean;
  visible_to_contractor: boolean;
  created_at: string;
}

export function JobDocuments({ jobId, documents }: { jobId: string; documents: JobDocument[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function change(doc: JobDocument, field?: "visible_to_homeowner" | "visible_to_contractor") {
    if (!field && !confirm(`Delete ${doc.file_name}? This removes it from the job for everyone.`)) return;
    setBusy(doc.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/documents/${doc.id}`, field ? {
        method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ [field]: !doc[field] }),
      } : { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Document could not be updated");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Document could not be updated"); }
    finally { setBusy(null); }
  }
  const groups = DOCUMENT_CATEGORIES.map(category => ({ ...category, docs: documents.filter(doc => doc.category === category.value) }));
  const unknown = documents.filter(doc => !DOCUMENT_CATEGORIES.some(category => category.value === doc.category));
  if (unknown.length) groups.push({ value: "legacy", label: "Other job files", docs: unknown });

  return <div className="space-y-5">
    <p className="text-sm text-muted-foreground">You and the assigned contractor exchange files here. New uploads are shared with the contractor; homeowner sharing is optional.</p>
    <JobDocumentUpload jobId={jobId} admin />
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p className="text-sm font-semibold">{documents.length} document{documents.length === 1 ? "" : "s"}</p>
    {groups.filter(group => group.docs.length).map(group => <section key={group.value}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</h3>
      <ul className="mt-2 divide-y divide-border">{group.docs.map(doc => <li key={doc.id} className="space-y-3 py-4">
        <div className="min-w-0">
          <p className="break-all text-sm font-semibold">{doc.label || doc.file_name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{documentSource(doc.storage_path)} · {format(new Date(doc.created_at), "MMM d, yyyy h:mm a")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{doc.visible_to_contractor ? "Shared with contractor" : "Hidden from contractor"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DocDownload id={doc.id} admin view label="View" />
          <DocDownload id={doc.id} admin label="Download" />
          <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" disabled={busy !== null} checked={doc.visible_to_contractor} onChange={() => change(doc, "visible_to_contractor")} />Share with contractor</label>
          <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" disabled={busy !== null} checked={doc.visible_to_homeowner} onChange={() => change(doc, "visible_to_homeowner")} />Share with homeowner</label>
          <button type="button" disabled={busy !== null} onClick={() => change(doc)} className="text-xs text-destructive">Delete</button>
        </div>
      </li>)}</ul>
    </section>)}
    {!documents.length && <p className="text-sm text-muted-foreground">No documents yet. Upload the first file above.</p>}
  </div>;
}
