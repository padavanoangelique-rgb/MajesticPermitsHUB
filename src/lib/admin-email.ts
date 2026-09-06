import { ADMIN_EMAILS } from "@/lib/admin";
import { FROM_EMAIL, getResend } from "@/lib/email";

const ALWAYS_TO = "angelique@majesticpermits.com";

export async function sendAdminRequestEmail(opts: {
  subject: string;
  heading: string;
  bodyHtml: string;
  actionUrl?: string;
  actionLabel?: string;
}) {
  const recipients = Array.from(
    new Set([...ADMIN_EMAILS, ALWAYS_TO].map((e) => e.toLowerCase()).filter(Boolean))
  );
  const action = opts.actionUrl
    ? `<p style="margin:24px 0 0;"><a href="${opts.actionUrl}" style="display:inline-block;background:#156cdd;color:#fff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;">${opts.actionLabel || "Open in Hub"}</a></p>`
    : "";

  const { error } = await getResend().emails.send({
    from: `Majestic Permits <${FROM_EMAIL}>`,
    to: recipients,
    subject: opts.subject,
    html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dedede;border-radius:16px;padding:28px;">
        <p style="margin:0 0 6px;color:#156cdd;font-weight:700;">Majestic Permits</p>
        <h1 style="margin:0 0 12px;color:#156cdd;font-size:22px;">${opts.heading}</h1>
        ${opts.bodyHtml}
        ${action}
      </div>
    </body></html>`,
  });

  if (error) {
    console.error("admin request email failed", error);
    return { ok: false, error: error.message };
  }
  return { ok: true, error: null as string | null };
}
