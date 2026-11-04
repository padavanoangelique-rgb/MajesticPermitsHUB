import { NextResponse } from "next/server";
import { requireCompany, COMPANY_DOCS_BUCKET } from "@/lib/company-auth";
import { defaultEmailBody, defaultEmailSubject, docTypeLabel, makeRefCode, refFromText } from "@/lib/company-docs";
import { getResend } from "@/lib/email";
import { FROM_REQUESTS, MAILBOX } from "@/lib/mailboxes";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Email the chosen company documents to a building department. The subject carries a reference code; the department's
 * reply is matched to it (see /api/ingest/doc-reply) and marks the contractor as updated with that department.
 */
export async function POST(req: Request) {
  const gate = await requireCompany();
  if (!gate.ok) return gate.response;
  const { contractor, db, userId } = gate;

  const body = await req.json().catch(() => ({}));
  const to = typeof body.to_email === "string" ? body.to_email.trim() : "";
  if (!EMAIL.test(to)) return NextResponse.json({ error: "Enter the building department's email address." }, { status: 400 });
  const ids: string[] = Array.isArray(body.document_ids) ? body.document_ids.filter((x: unknown) => typeof x === "string").slice(0, 10) : [];
  if (!ids.length) return NextResponse.json({ error: "Choose at least one document to send." }, { status: 400 });

  const { data: docs } = await db
    .from("contractor_documents")
    .select("id, doc_type, label, file_name, storage_path")
    .eq("company_id", contractor.company_id)
    .in("id", ids);
  if (!docs?.length || docs.length !== ids.length) return NextResponse.json({ error: "One of those documents was not found." }, { status: 404 });

  const company = contractor.company_name || contractor.name || "Contractor";
  const department = typeof body.department === "string" ? body.department.trim().slice(0, 120) : "";
  const toName = typeof body.to_name === "string" ? body.to_name.trim().slice(0, 120) : "";

  const attachments: Array<{ filename: string; content: Buffer }> = [];
  let total = 0;
  for (const doc of docs) {
    const file = await db.storage.from(COMPANY_DOCS_BUCKET).download(doc.storage_path);
    if (file.error || !file.data) return NextResponse.json({ error: `Could not read ${doc.file_name}.` }, { status: 500 });
    const buffer = Buffer.from(await file.data.arrayBuffer());
    total += buffer.length;
    attachments.push({ filename: doc.file_name, content: buffer });
  }
  if (total > 30 * 1024 * 1024) return NextResponse.json({ error: "Those files add up to more than 30 MB. Send fewer at once." }, { status: 400 });

  // A code that is not taken yet.
  let ref = "";
  for (let i = 0; i < 5 && !ref; i++) {
    const candidate = makeRefCode();
    const { data: taken } = await db.from("contractor_doc_emails").select("id").eq("ref_code", candidate).maybeSingle();
    if (!taken) ref = candidate;
  }
  if (!ref) return NextResponse.json({ error: "Could not create a reference code. Try again." }, { status: 500 });

  let subject = typeof body.subject === "string" && body.subject.trim() ? body.subject.trim().slice(0, 200) : defaultEmailSubject(company, ref, department);
  if (refFromText(subject) !== ref) subject = `${subject} [${ref}]`;
  const text =
    typeof body.body === "string" && body.body.trim()
      ? body.body.trim().slice(0, 5000)
      : defaultEmailBody(company, docs.map((d) => d.label || docTypeLabel(d.doc_type)), department);

  let resendId: string | null = null;
  try {
    const sent = await getResend().emails.send({
      from: FROM_REQUESTS,
      to: toName ? [`${toName.replace(/[<>",]/g, "")} <${to}>`] : [to],
      replyTo: MAILBOX.requests,
      subject,
      text,
      html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`,
      attachments,
    });
    if (sent.error) throw new Error(sent.error.message);
    resendId = sent.data?.id ?? null;
  } catch (err: any) {
    return NextResponse.json({ error: `The email did not send: ${err?.message || "unknown error"}` }, { status: 502 });
  }

  const { error } = await db.from("contractor_doc_emails").insert({
    company_id: contractor.company_id,
    sent_by: userId,
    to_email: to,
    to_name: toName || null,
    department: department || null,
    subject,
    body: text,
    document_ids: docs.map((d) => d.id),
    ref_code: ref,
    resend_id: resendId,
  });
  if (error) return NextResponse.json({ ok: true, ref, warning: `Sent, but the log entry failed: ${error.message}` });
  return NextResponse.json({ ok: true, ref });
}
