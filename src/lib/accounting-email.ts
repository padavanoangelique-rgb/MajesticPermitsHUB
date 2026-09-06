import { getResend } from "@/lib/email";
import { FROM_ACCOUNTING, MAILBOX } from "@/lib/mailboxes";

export async function sendAccountingEmail(opts: {
  subject: string;
  heading: string;
  bodyHtml: string;
}) {
  try {
    const { error } = await getResend().emails.send({
      from: FROM_ACCOUNTING,
      to: [MAILBOX.accounting, MAILBOX.owner],
      replyTo: MAILBOX.accounting,
      subject: opts.subject,
      html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dedede;border-radius:16px;padding:28px;">
          <p style="margin:0 0 6px;color:#156cdd;font-weight:700;">Majestic Accounting</p>
          <h1 style="margin:0 0 12px;color:#156cdd;font-size:22px;">${opts.heading}</h1>
          ${opts.bodyHtml}
        </div>
      </body></html>`,
    });
    if (error) console.error("accounting email failed", error);
  } catch (err) {
    console.error("accounting email failed", err);
  }
}
