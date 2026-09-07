import { getResend } from "@/lib/email";
import {
  FROM_INSPECTIONS,
  FROM_REQUESTS,
  MAILBOX,
} from "@/lib/mailboxes";

const OWNER_GMAIL = "padavano.angelique@gmail.com";

export async function sendAdminRequestEmail(opts: {
  kind: "request" | "inspection";
  subject: string;
  heading: string;
  bodyHtml: string;
  actionUrl?: string;
  actionLabel?: string;
}) {
  const inbox =
    opts.kind === "inspection" ? MAILBOX.inspections : MAILBOX.requests;
  const from =
    opts.kind === "inspection" ? FROM_INSPECTIONS : FROM_REQUESTS;
  const recipients = Array.from(
    new Set([inbox, MAILBOX.owner, OWNER_GMAIL])
  );

  const action = opts.actionUrl
    ? `<p style="margin:24px 0 0;"><a href="${opts.actionUrl}" style="display:inline-block;background:#156cdd;color:#fff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;">${opts.actionLabel || "Open in Hub"}</a></p>`
    : "";

  const { error } = await getResend().emails.send({
    from,
    to: recipients,
    replyTo: inbox,
    subject: opts.subject,
    html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dedede;border-radius:16px;padding:28px;">
        <p style="margin:0 0 6px;color:#156cdd;font-weight:700;">Majestic Permits</p>
        <h1 style="margin:0 0 12px;color:#156cdd;font-size:22px;">${opts.heading}</h1>
        ${opts.bodyHtml}
        ${action}
        <p style="margin:20px 0 0;font-size:12px;color:#64748b;">Replies go to ${inbox}</p>
      </div>
    </body></html>`,
  });

  if (error) {
    console.error("admin request email failed", error);
    return { ok: false, error: error.message };
  }
  return { ok: true, error: null as string | null };
}
