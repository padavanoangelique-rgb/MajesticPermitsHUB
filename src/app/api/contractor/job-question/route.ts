import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { notifyAdmin } from "@/lib/admin-notify";
import { sendAdminSms } from "@/lib/sms";
import { sendAdminRequestEmail } from "@/lib/admin-email";

export const dynamic = "force-dynamic";

function row(label: string, value: string) {
  if (!value) return "";
  return `<tr><td style="padding:6px 10px 6px 0;color:#64748b;font-size:13px;vertical-align:top;">${label}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">${value}</td></tr>`;
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const contractor = await getContractorForUser(user);
    if (!contractor) {
      return NextResponse.json({ error: "No contractor profile" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const jobId = String(body.job_id || "").trim();
    const question = String(body.question || "").trim();
    if (!jobId || !question) {
      return NextResponse.json({ error: "Job and question are required" }, { status: 400 });
    }
    if (question.length > 500) {
      return NextResponse.json({ error: "Question is too long" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: job } = await service
      .from("jobs")
      .select("id, property_address, stage, sub_status, permit_number, trade_type, jurisdiction, homeowner_name, homeowner_phone, homeowner_email, notes, next_step, contractor_id")
      .eq("id", jobId)
      .in("contractor_id", contractor.company_contractor_ids)
      .maybeSingle();

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const company = contractor.company_name || contractor.name || "Contractor";
    const address = job.property_address || "Unknown address";
    const sms = `Job question — ${company}\n${address}\nStage: ${job.stage || "—"}${job.permit_number ? `\nPermit: ${job.permit_number}` : ""}\nQ: ${question.slice(0, 160)}\nReply to this text.`;

    await notifyAdmin("job_question", `${company} asked about ${address}: ${question}`, job.id);
    await sendAdminSms(sms);

    const detailTable = `<table style="width:100%;border-collapse:collapse;margin-top:8px;">
      ${row("Contractor", company)}
      ${row("Address", address)}
      ${row("Stage", job.stage || "")}
      ${row("Sub status", job.sub_status || "")}
      ${row("Permit #", job.permit_number || "Pending")}
      ${row("Trade", job.trade_type || "")}
      ${row("Jurisdiction", job.jurisdiction || "")}
      ${row("Homeowner", job.homeowner_name || "")}
      ${row("Phone", job.homeowner_phone || "")}
      ${row("Email", job.homeowner_email || "")}
      ${row("Next step", job.next_step || "")}
      ${row("Question", question)}
    </table>
    <p style="margin:14px 0 0;font-size:13px;color:#64748b;">Reply to this email or text Angelique — the reply goes back to the contractor.</p>`;

    await sendAdminRequestEmail({
      kind: "request",
      subject: `Job question — ${company} — ${address}`,
      heading: "Contractor asked about a job",
      bodyHtml: detailTable,
      actionUrl: `https://hub.majesticpermits.com/admin/jobs/${job.id}`,
      actionLabel: "Open job on Majestic dashboard",
    }).catch(() => null);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
