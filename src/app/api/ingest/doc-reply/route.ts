import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { classifyReply, refFromText } from "@/lib/company-docs";
import { notifyAdmin } from "@/lib/admin-notify";

export const dynamic = "force-dynamic";

/**
 * Where a building department's reply to a document email lands. The inbound-mail hook (a Zoho forward rule, Resend
 * inbound, or the bot) POSTs { subject, text, from, to? } with INBOUND_MAIL_SECRET. The reference code in the subject
 * (or in the plus-address) ties the reply to the email-out. A clear "received / updated / on file" marks the
 * contractor confirmed with that department; anything else is saved as a reply for a person to read.
 */
export async function POST(req: Request) {
  const secret = process.env.INBOUND_MAIL_SECRET || process.env.INSPECTION_BOT_SECRET;
  if (!secret) return NextResponse.json({ error: "INBOUND_MAIL_SECRET is not set on the Hub" }, { status: 503 });
  const auth = req.headers.get("authorization") || "";
  if ((auth.startsWith("Bearer ") ? auth.slice(7) : "") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const subject = typeof body.subject === "string" ? body.subject : "";
  const text = typeof body.text === "string" ? body.text : typeof body.body === "string" ? body.body : "";
  const ref = refFromText(subject) || refFromText(typeof body.to === "string" ? body.to : "") || refFromText(text);
  if (!ref) return NextResponse.json({ ok: true, matched: false });

  const db = createServiceClient();
  const { data: sent } = await db.from("contractor_doc_emails").select("id, company_id, department, to_email, status").eq("ref_code", ref).maybeSingle();
  if (!sent) return NextResponse.json({ ok: true, matched: false });

  const verdict = classifyReply(text);
  // A reply never takes back a confirmation a person already made.
  const status = sent.status === "confirmed" ? "confirmed" : verdict;
  const now = new Date().toISOString();
  const { error } = await db
    .from("contractor_doc_emails")
    .update({ status, replied_at: now, confirmed_at: status === "confirmed" ? now : null, last_reply: text.slice(0, 4000) })
    .eq("id", sent.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: company } = await db.from("contractor_companies").select("name").eq("id", sent.company_id).maybeSingle();
  await notifyAdmin(
    "document_reply",
    `${company?.name || "A contractor"}: ${sent.department || sent.to_email} replied about the contractor documents (${ref}) — ${status === "confirmed" ? "file updated" : "needs a look"}.`,
    null
  );
  return NextResponse.json({ ok: true, matched: true, status });
}
