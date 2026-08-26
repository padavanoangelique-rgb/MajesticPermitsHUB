import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { getResend, FROM_EMAIL } from "@/lib/email";
import { ADMIN_EMAILS } from "@/lib/admin";
import { buildAdminReport } from "@/lib/reports";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Weekly admin operations digest.
 * Emails the PDF to every address in ADMIN_EMAILS.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ADMIN_EMAILS.length === 0) {
    return NextResponse.json(
      { error: "No admin emails configured" },
      { status: 500 }
    );
  }

  let result;
  try {
    result = await buildAdminReport();
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to build report" },
      { status: 500 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const filename = `majestic-admin-report-${today}.pdf`;
  const pdfBase64 = Buffer.from(result.pdf).toString("base64");

  const subject = `Admin operations report — ${result.totalOpen} open permits${
    result.nocsToRecord.length ? `, ${result.nocsToRecord.length} NOC${result.nocsToRecord.length === 1 ? "" : "s"} pending` : ""
  }`;

  const summaryRows = result.nocsToRecord
    .slice(0, 6)
    .map(
      (n) =>
        `<li style="margin:4px 0">${n.property_address} — <strong>${n.noc_status}</strong>${
          n.jurisdiction ? ` · ${n.jurisdiction}` : ""
        }</li>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F5F7FB;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#0B1F3F">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FB;padding:32px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden">
        <tr>
          <td style="background:#0B1F3F;padding:24px 32px">
            <div style="font-size:20px;font-weight:700;color:#FFFFFF">Majestic Permits</div>
            <div style="font-size:13px;color:#C9A24B;margin-top:4px">Admin operations report</div>
          </td>
        </tr>
        <tr><td style="height:4px;background:#C9A24B;line-height:4px;font-size:0">&nbsp;</td></tr>
        <tr>
          <td style="padding:28px 32px">
            <p style="margin:0 0 12px 0;font-size:15px">Here is this week's operations snapshot.</p>
            <p style="margin:0 0 16px 0;font-size:14px;color:#4B5568">
              <strong style="color:#0B1F3F">${result.totalOpen}</strong> open permits ·
              <strong style="color:#0B1F3F">${result.nocsToRecord.length}</strong> NOC${result.nocsToRecord.length === 1 ? "" : "s"} needing attention
            </p>
            ${
              result.nocsToRecord.length
                ? `<div style="background:#FFF7E6;border-left:4px solid #C9A24B;padding:12px 16px;border-radius:8px;margin-top:8px">
                    <div style="font-size:13px;font-weight:600;margin-bottom:6px">NOCs to record this week</div>
                    <ul style="margin:0;padding-left:18px;font-size:13px;color:#3B4560">${summaryRows}${
                    result.nocsToRecord.length > 6
                      ? `<li>…and ${result.nocsToRecord.length - 6} more (see attachment)</li>`
                      : ""
                  }</ul>
                  </div>`
                : `<div style="background:#EAF7EF;border-left:4px solid #2E7D57;padding:12px 16px;border-radius:8px;margin-top:8px;font-size:13px">NOCs are current. Nothing outstanding.</div>`
            }
            <p style="margin:24px 0 0 0;font-size:13px;color:#4B5568">
              A full PDF broken down by stage — with each permit's next step, contractor, jurisdiction, and building-department portal link — is attached.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px 32px;font-size:12px;color:#8A93A6">
            You are receiving this because your email is on the Majestic Permits admin allowlist.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const resend = getResend();

  const { error: sendError } = await resend.emails.send({
    from: `Majestic Permits <${FROM_EMAIL}>`,
    to: ADMIN_EMAILS,
    subject,
    html,
    attachments: [{ filename, content: pdfBase64 }],
  });

  if (sendError) {
    return NextResponse.json(
      { error: sendError.message, delivered: false },
      { status: 500 }
    );
  }

  return NextResponse.json({
    delivered: true,
    recipients: ADMIN_EMAILS,
    totalOpen: result.totalOpen,
    nocsPending: result.nocsToRecord.length,
  });
}

export async function POST(req: Request) {
  return GET(req);
}
