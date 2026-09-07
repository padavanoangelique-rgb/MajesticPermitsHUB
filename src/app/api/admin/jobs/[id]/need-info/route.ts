import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend } from "@/lib/email";
import { FROM_REQUESTS, MAILBOX } from "@/lib/mailboxes";
import { sendSms } from "@/lib/sms";
import { notifyAdmin } from "@/lib/admin-notify";

export const dynamic = "force-dynamic";

const HUB = "https://hub.majesticpermits.com";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const kind = body.kind === "note" ? "note" : "attachment";
    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json(
        { error: "Add a short note about what you need" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: job } = await supabase
      .from("jobs")
      .select("id, property_address, contractor_id")
      .eq("id", params.id)
      .maybeSingle();

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (!job.contractor_id) {
      return NextResponse.json(
        { error: "Assign a contractor first" },
        { status: 400 }
      );
    }

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, name, company_name, email, phone")
      .eq("id", job.contractor_id)
      .maybeSingle();

    if (!contractor?.email) {
      return NextResponse.json(
        { error: "That contractor has no email on file" },
        { status: 400 }
      );
    }

    const attachUrl = `${HUB}/dashboard/projects/${job.id}#documents`;
    const need =
      kind === "note"
        ? "a note or answer on this job"
        : "an attachment uploaded to this job";
    const buttonLabel = kind === "note" ? "Open job" : "Attach here";

    const { error } = await getResend().emails.send({
      from: FROM_REQUESTS,
      to: [contractor.email],
      cc: [MAILBOX.requests, MAILBOX.owner],
      replyTo: MAILBOX.requests,
      subject: `Need more information — ${job.property_address}`,
      html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dedede;border-radius:16px;padding:28px;">
          <p style="margin:0 0 6px;color:#156cdd;font-weight:700;">Majestic Permits</p>
          <h1 style="margin:0 0 12px;color:#156cdd;font-size:22px;">We need more information</h1>
          <p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">
            Hi ${contractor.company_name || contractor.name || "there"},
            Majestic needs ${need} for <strong>${job.property_address}</strong>.
          </p>
          <p style="margin:16px 0 0;color:#334155;font-size:15px;line-height:1.65;white-space:pre-wrap;">${message}</p>
          <p style="margin:24px 0 0;">
            <a href="${attachUrl}" style="display:inline-block;background:#156cdd;color:#fff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;">${buttonLabel}</a>
          </p>
          <p style="margin:14px 0 0;font-size:12px;color:#64748b;">Sign in to Hub if asked, then upload or reply on the job page.</p>
        </div>
      </body></html>`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (contractor.phone) {
      await sendSms(
        contractor.phone,
        `Majestic Permits needs more info on ${job.property_address}. Open: ${attachUrl}`
      );
    }

    await notifyAdmin(
      "need_info",
      `Asked ${contractor.company_name || contractor.name} for ${kind} on ${job.property_address}.`,
      job.id
    );

    return NextResponse.json({ ok: true, emailed: contractor.email });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Could not send" },
      { status: 500 }
    );
  }
}
