"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DOC_TYPES, defaultEmailBody, docTypeLabel, expiryStatus, expiryText, type ExpiryState } from "@/lib/company-docs";

export type CompanyDoc = {
  id: string;
  doc_type: string;
  label: string | null;
  doc_number: string | null;
  expires_on: string | null;
  file_name: string;
  size_bytes: number | null;
};

export type SentEmail = {
  id: string;
  ref_code: string;
  department: string | null;
  to_email: string;
  status: "sent" | "replied" | "confirmed";
  sent_at: string;
  replied_at: string | null;
  last_reply: string | null;
  document_count: number;
};

const TONE: Record<ExpiryState, string> = {
  none: "text-muted-foreground",
  ok: "text-emerald-300",
  soon: "text-amber-300",
  expired: "text-rose-300",
};

const FIELD = "min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm";

function sizeText(bytes: number | null) {
  if (!bytes) return "";
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function dayText(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function CompanyDocs({ companyName, docs, emails, today }: { companyName: string; docs: CompanyDoc[]; emails: SentEmail[]; today: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // upload form
  const [docType, setDocType] = useState("license");
  const [label, setLabel] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [expires, setExpires] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // email form
  const [toEmail, setToEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const chosen = useMemo(() => docs.filter((d) => selected.has(d.id)), [docs, selected]);
  const defaultBody = useMemo(
    () => defaultEmailBody(companyName, chosen.map((d) => d.label || docTypeLabel(d.doc_type)), department.trim()),
    [companyName, chosen, department]
  );

  function say(text: string, error = false) {
    setMessage({ text, error });
  }

  async function call(key: string, url: string, init: RequestInit, done: string) {
    setBusy(key);
    setMessage(null);
    try {
      const res = await fetch(url, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      say(data.warning ? `${done} ${data.warning}` : done);
      router.refresh();
      return data;
    } catch (err: any) {
      say(err?.message || "Something went wrong.", true);
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return say("Choose a file to upload.", true);
    const form = new FormData();
    form.set("file", file);
    form.set("doc_type", docType);
    form.set("label", label);
    form.set("doc_number", docNumber);
    form.set("expires_on", expires);
    const data = await call("upload", "/api/contractor/company/documents", { method: "POST", body: form }, "Document saved.");
    if (data) {
      setFile(null);
      setLabel("");
      setDocNumber("");
      setExpires("");
      (document.getElementById("company-doc-file") as HTMLInputElement | null)?.value && ((document.getElementById("company-doc-file") as HTMLInputElement).value = "");
    }
  }

  function send(event: React.FormEvent) {
    event.preventDefault();
    return call(
      "email",
      "/api/contractor/company/email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: Array.from(selected), to_email: toEmail, department, subject, body: body || defaultBody }),
      },
      "Sent. When the department replies, the reply shows below."
    ).then((data) => {
      if (data) {
        setSelected(new Set());
        setSubject("");
        setBody("");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Company documents</h2>
        {docs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing saved yet. Add the license, the certificate of insurance and anything else a building department asks for.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {docs.map((doc) => {
              const status = expiryStatus(doc.expires_on, today);
              return (
                <li key={doc.id} className="rounded-xl border border-border bg-card/60 p-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${doc.label || docTypeLabel(doc.doc_type)} to email`}
                      className="mt-1 h-5 w-5"
                      checked={selected.has(doc.id)}
                      onChange={(e) =>
                        setSelected((current) => {
                          const next = new Set(current);
                          if (e.target.checked) next.add(doc.id);
                          else next.delete(doc.id);
                          return next;
                        })
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{doc.label || docTypeLabel(doc.doc_type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {docTypeLabel(doc.doc_type)}
                        {doc.doc_number ? ` · #${doc.doc_number}` : ""} · {doc.file_name} {sizeText(doc.size_bytes) && `(${sizeText(doc.size_bytes)})`}
                      </p>
                      <p className={"mt-1 text-xs font-semibold " + TONE[status.state]}>{expiryText(status.state, status.days)}</p>
                      <div className="mt-2 flex flex-wrap items-end gap-3">
                        <label className="text-xs text-muted-foreground">
                          Expires
                          <input
                            type="date"
                            defaultValue={(doc.expires_on || "").slice(0, 10)}
                            disabled={busy === doc.id}
                            onBlur={(e) => {
                              const value = e.target.value;
                              if (value !== (doc.expires_on || "").slice(0, 10)) {
                                void call(doc.id, `/api/contractor/company/documents/${doc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expires_on: value }) }, "Expiration date saved.");
                              }
                            }}
                            className="ml-2 min-h-9 rounded-lg border border-border bg-card px-2 text-sm text-foreground"
                          />
                        </label>
                        <a className="text-xs font-semibold text-violet-300 underline" href={`/api/contractor/company/documents/${doc.id}`} target="_blank" rel="noreferrer">View</a>
                        <a className="text-xs font-semibold text-violet-300 underline" href={`/api/contractor/company/documents/${doc.id}?download=1`}>Download</a>
                        <button
                          type="button"
                          className="text-xs font-semibold text-rose-300 underline"
                          onClick={() => {
                            if (confirm(`Delete ${doc.label || doc.file_name}?`)) void call(doc.id, `/api/contractor/company/documents/${doc.id}`, { method: "DELETE" }, "Document deleted.");
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Add a document</h2>
        <form onSubmit={upload} className="mt-3 grid gap-3">
          <label className="grid gap-1 text-sm">
            What it is
            <select className={FIELD} value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Name (optional)
            <input className={FIELD} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Broward license" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              License or policy number
              <input className={FIELD} value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              Expiration date
              <input type="date" className={FIELD} value={expires} onChange={(e) => setExpires(e.target.value)} />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            File (PDF or image, up to 10 MB)
            <input id="company-doc-file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp,image/heic" className={FIELD + " py-2.5"} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <button disabled={busy === "upload"} className="min-h-12 rounded-xl bg-primary font-semibold text-white disabled:opacity-60">
            {busy === "upload" ? "Saving…" : "Save document"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Email documents to a building department</h2>
        {chosen.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Tick the documents above you want to send.</p>
        ) : (
          <form onSubmit={send} className="mt-3 grid gap-3">
            <p className="text-sm">Sending: {chosen.map((d) => d.label || docTypeLabel(d.doc_type)).join(", ")}</p>
            <label className="grid gap-1 text-sm">
              Department email
              <input type="email" required className={FIELD} value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="permits@city.gov" />
            </label>
            <label className="grid gap-1 text-sm">
              Department or city (for the subject)
              <input className={FIELD} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="City of Miramar Building Department" />
            </label>
            <label className="grid gap-1 text-sm">
              Subject (optional — the reference code is added)
              <input className={FIELD} value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              Message
              <textarea rows={8} className="rounded-xl border border-border bg-card px-3 py-2 text-sm" value={body || defaultBody} onChange={(e) => setBody(e.target.value)} />
            </label>
            <button disabled={busy === "email"} className="min-h-12 rounded-xl bg-primary font-semibold text-white disabled:opacity-60">
              {busy === "email" ? "Sending…" : "Send email"}
            </button>
          </form>
        )}
      </section>

      {emails.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sent</h2>
          <ul className="mt-3 grid gap-3">
            {emails.map((mail) => (
              <li key={mail.id} className="rounded-xl border border-border bg-card/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{mail.department || mail.to_email}</p>
                  <span
                    className={
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                      (mail.status === "confirmed" ? "bg-emerald-500/15 text-emerald-200" : mail.status === "replied" ? "bg-amber-500/15 text-amber-200" : "bg-secondary text-muted-foreground")
                    }
                  >
                    {mail.status === "confirmed" ? "File updated" : mail.status === "replied" ? "Replied — needs a look" : "Waiting for a reply"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {mail.document_count} {mail.document_count === 1 ? "document" : "documents"} · {mail.ref_code} · sent {dayText(mail.sent_at)}
                  {mail.replied_at ? ` · reply ${dayText(mail.replied_at)}` : ""}
                </p>
                {mail.last_reply && <p className="mt-2 whitespace-pre-line rounded-lg bg-secondary/50 p-2 text-xs">{mail.last_reply.slice(0, 600)}</p>}
                <div className="mt-2">
                  {mail.status === "confirmed" ? (
                    <button type="button" className="text-xs font-semibold text-muted-foreground underline" onClick={() => call(mail.id, `/api/contractor/company/email/${mail.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "sent" }) }, "Marked as not confirmed.")}>
                      Undo
                    </button>
                  ) : (
                    <button type="button" className="text-xs font-semibold text-emerald-300 underline" onClick={() => call(mail.id, `/api/contractor/company/email/${mail.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "confirmed" }) }, "Marked as updated with that department.")}>
                      Mark as updated with this department
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {message && (
        <p role={message.error ? "alert" : "status"} className={"text-sm " + (message.error ? "text-rose-300" : "text-emerald-300")}>
          {message.text}
        </p>
      )}
    </div>
  );
}
