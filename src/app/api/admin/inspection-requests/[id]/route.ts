import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { SITE_URL, getResend } from "@/lib/email";
import { FROM_INSPECTIONS, MAILBOX } from "@/lib/mailboxes";
import { sendSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

const RESULT_STATUSES = new Set(["Passed", "Failed", "Partial"]);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const status = typeof body.status === "string" ? body.status : undefined;
    const handledAt =
      typeof body.handled_at === "string" ? body.handled_at : new Date().toISOString();
    const preferredDate =
      typeof body.preferred_date === "string" && body.preferred_date
        ? body.preferred_date
        : undefined;
    const contractorNote =
      typeof body.contractor_note === "string" ? body.contractor_note.trim() : "";
    const notifyContractor =
      Boolean(body.notify_contractor) || Boolean(status && RESULT_STATUSES.has(status));

    const supabase = createServiceClient();

    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (status) update.handled_at = handledAt;
    if (preferredDate) update.preferred_date = preferredDate;
    if (contractorNote) update.notes = contractorNote;

    const { error } = await supabase
      .from("inspection_requests")
      .update(update)
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let emailed = false;
    let texted = false;
    let emailError = "";

    if (notifyContractor && status) {
      const { data: request } = await supabase
        .from("inspection_requests")
        .select(
          `
          id,
          inspection_type,
          preferred_date,
          requested_by_contractor_id,
          jobs (
            id,
            property_address,
            contractor_id
          )
        `
        )
        .eq("id", params.id)
        .maybeSingle();

      const job: any = request?.jobs;
      const contractorId =
        request?.requested_by_contractor_id || job?.contractor_id || null;

      if (contractorId) {
        const { data: contractor } = await supabase
          .from("contractors")
          .select("email, name, company_name, phone")
          .eq("id", contractorId)
          .maybeSingle();

        const address = job?.property_address || "Inspection";
        const kind = request?.inspection_type || "Inspection";
        const dateLabel = (preferredDate || request?.preferred_date || "")
          .toString()
          .slice(0, 10);
        const resultLine = RESULT_STATUSES.has(status)
          ? `${kind} result: ${status}`
          : status === "Scheduled"
            ? `${kind}${dateLabel ? ` is set for ${dateLabel}` : " has been scheduled"}`
            : `${kind} is now ${status}`;
        const smsBody = `Majestic Permits — ${address}: ${resultLine}.`;

        if (contractor?.phone) {
          await sendSms(contractor.phone, smsBody);
          texted = true;
        }

        if (contractor?.email) {
          try {
            const heading = RESULT_STATUSES.has(status)
              ? `Inspection ${status.toLowerCase()}`
              : "Inspection scheduled";
            const noteHtml = contractorNote
              ? `<p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#334155;">${contractorNote}</p>`
              : "";
            await getResend().emails.send({
              from: FROM_INSPECTIONS,
              to: contractor.email,
              replyTo: MAILBOX.inspections,
              subject: `${address} — ${heading}`,
              html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:24px;">
                <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dedede;border-radius:16px;padding:28px;">
                  <p style="margin:0 0 6px;color:#156cdd;font-weight:700;">Majestic Permits</p>
                  <h1 style="margin:0 0 12px;color:#156cdd;font-size:22px;">${heading}</h1>
                  <p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">${address}: ${resultLine}.</p>
                  ${noteHtml}
                  <p style="margin:24px 0 0;">
                    <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#156cdd;color:#fff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;">Open your portal</a>
                  </p>
                </div>
              </body></html>`,
            });
            emailed = true;
          } catch (err: any) {
            emailError = err?.message || "email failed";
          }
        } else {
          emailError = "no contractor email";
        }
      } else {
        emailError = "no contractor on this request";
      }
    }

    return NextResponse.json({ ok: true, emailed, texted, email_error: emailError });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
