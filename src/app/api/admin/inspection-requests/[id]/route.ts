import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { SITE_URL, getResend } from "@/lib/email";
import { FROM_INSPECTIONS, MAILBOX } from "@/lib/mailboxes";
import { sendSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

const RESULT_STATUSES = new Set(["Passed", "Failed", "Partial"]);

async function sendContractorNotice(args: {
  contractorId: string | null;
  address: string;
  kind: string;
  status: string;
  dateLabel: string;
  contractorNote: string;
}) {
  const supabase = createServiceClient();
  let emailed = false;
  let texted = false;
  let emailError = "";

  if (!args.contractorId) {
    return { emailed, texted, emailError: "no contractor on this request" };
  }

  const { data: contractor } = await supabase
    .from("contractors")
    .select("email, name, company_name, phone")
    .eq("id", args.contractorId)
    .maybeSingle();

  const resultLine = RESULT_STATUSES.has(args.status)
    ? `${args.kind} result: ${args.status}`
    : args.status === "Scheduled"
      ? `${args.kind}${args.dateLabel ? ` is scheduled for ${args.dateLabel}` : " has been scheduled"}`
      : `${args.kind} is now ${args.status}`;
  const smsBody = `Majestic Permits — ${args.address}: ${resultLine}.`;

  if (contractor?.phone) {
    await sendSms(contractor.phone, smsBody);
    texted = true;
  }

  if (contractor?.email) {
    try {
      const heading = RESULT_STATUSES.has(args.status)
        ? `Inspection ${args.status.toLowerCase()}`
        : "Inspection scheduled";
      const noteHtml = args.contractorNote
        ? `<p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#334155;">${args.contractorNote}</p>`
        : "";
      await getResend().emails.send({
        from: FROM_INSPECTIONS,
        to: contractor.email,
        replyTo: MAILBOX.inspections,
        subject: `${args.address} — ${heading}`,
        html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:24px;">
          <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dedede;border-radius:16px;padding:28px;">
            <p style="margin:0 0 6px;color:#156cdd;font-weight:700;">Majestic Permits</p>
            <h1 style="margin:0 0 12px;color:#156cdd;font-size:22px;">${heading}</h1>
            <p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">${args.address}: ${resultLine}.</p>
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

  return { emailed, texted, emailError };
}

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
    const shouldNotify =
      Boolean(body.notify_contractor) || Boolean(status && RESULT_STATUSES.has(status));

    const supabase = createServiceClient();
    const id = params.id;

    let contractorId: string | null = null;
    let address = "Inspection";
    let kind = "Inspection";
    let dateLabel = (preferredDate || "").slice(0, 10);

    if (id.startsWith("slot-")) {
      const slotId = id.slice(5);
      const { data: slot, error: slotErr } = await supabase
        .from("job_inspections")
        .select("id, job_id, inspection_type, requested_date, scheduled_date, status")
        .eq("id", slotId)
        .maybeSingle();
      if (slotErr || !slot) {
        return NextResponse.json({ error: slotErr?.message || "Slot not found" }, { status: 404 });
      }

      const nextStatus =
        status === "Scheduled"
          ? slot.status === "reinspection_requested"
            ? "reinspection_scheduled"
            : "scheduled"
          : status === "Dismissed"
            ? "not_requested"
            : status === "Passed"
              ? "passed"
              : status === "Failed"
                ? "failed"
                : status === "Partial"
                  ? "partial_pass"
                  : slot.status;

      const patch: Record<string, unknown> = {
        status: nextStatus,
        updated_at: handledAt,
      };
      if (status === "Scheduled") {
        patch.scheduled_date = preferredDate || slot.requested_date || slot.scheduled_date;
      }

      const { error } = await supabase.from("job_inspections").update(patch).eq("id", slotId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      const { data: job } = await supabase
        .from("jobs")
        .select("id, property_address, contractor_id")
        .eq("id", slot.job_id)
        .maybeSingle();

      contractorId = job?.contractor_id || null;
      address = job?.property_address || "Inspection";
      kind = slot.inspection_type || "Inspection";
      dateLabel = String(patch.scheduled_date || slot.requested_date || dateLabel).slice(0, 10);
    } else if (id.startsWith("notice-")) {
      const noticeId = id.slice(7);
      const { data: notice } = await supabase
        .from("admin_notifications")
        .select("id, job_id, message")
        .eq("id", noticeId)
        .maybeSingle();
      if (!notice?.job_id) {
        return NextResponse.json({ error: "Notice has no job" }, { status: 404 });
      }
      const { data: job } = await supabase
        .from("jobs")
        .select("id, property_address, contractor_id")
        .eq("id", notice.job_id)
        .maybeSingle();
      const { data: openSlots } = await supabase
        .from("job_inspections")
        .select("id, inspection_type, requested_date")
        .eq("job_id", notice.job_id)
        .in("status", ["requested", "reinspection_requested"]);
      for (const slot of openSlots || []) {
        await supabase
          .from("job_inspections")
          .update({
            status: "scheduled",
            scheduled_date: preferredDate || slot.requested_date,
            updated_at: handledAt,
          })
          .eq("id", slot.id);
      }
      contractorId = job?.contractor_id || null;
      address = job?.property_address || notice.message || "Inspection";
      kind = (openSlots && openSlots[0]?.inspection_type) || "Inspection";
      dateLabel = (preferredDate || openSlots?.[0]?.requested_date || dateLabel || "").toString().slice(0, 10);
    } else {
      const update: Record<string, unknown> = {};
      if (status) update.status = status;
      if (status) update.handled_at = handledAt;
      if (preferredDate) update.preferred_date = preferredDate;
      if (contractorNote) update.notes = contractorNote;

      const { error } = await supabase.from("inspection_requests").update(update).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      const { data: request } = await supabase
        .from("inspection_requests")
        .select("id, job_id, inspection_type, preferred_date, requested_by_contractor_id")
        .eq("id", id)
        .maybeSingle();

      const { data: job } = request?.job_id
        ? await supabase
            .from("jobs")
            .select("id, property_address, contractor_id")
            .eq("id", request.job_id)
            .maybeSingle()
        : { data: null };

      if (status === "Scheduled" && request?.job_id) {
        await supabase
          .from("job_inspections")
          .update({
            status: "scheduled",
            scheduled_date: preferredDate || request.preferred_date,
            updated_at: handledAt,
          })
          .eq("job_id", request.job_id)
          .in("status", ["requested", "reinspection_requested"]);
      }

      contractorId = request?.requested_by_contractor_id || job?.contractor_id || null;
      address = job?.property_address || "Inspection";
      kind = request?.inspection_type || "Inspection";
      dateLabel = (preferredDate || request?.preferred_date || dateLabel || "").toString().slice(0, 10);
    }

    let emailed = false;
    let texted = false;
    let emailError = "";
    if (shouldNotify && status) {
      const note =
        contractorNote ||
        (status === "Scheduled"
          ? `Your ${kind} for ${address} is scheduled${dateLabel ? ` for ${dateLabel}` : ""}.`
          : "");
      const result = await sendContractorNotice({
        contractorId,
        address,
        kind,
        status,
        dateLabel,
        contractorNote: note,
      });
      emailed = result.emailed;
      texted = result.texted;
      emailError = result.emailError;
    }

    return NextResponse.json({ ok: true, emailed, texted, email_error: emailError });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
