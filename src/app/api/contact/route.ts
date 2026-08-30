import { NextResponse } from "next/server";
import { z } from "zod";
import { getResend, FROM_EMAIL } from "@/lib/email";

export const runtime = "nodejs";

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(120),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  role: z.enum(["contractor", "homeowner", "other"]).optional(),
  project_type: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Please add a short message").max(4000),
  intent: z.enum(["quote", "access", "general"]).default("general"),
  // Honeypot: real users won't fill this hidden field. Bots will.
  website: z.string().max(0).optional().or(z.literal("")),
});

const ADMIN_EMAIL = "angelique@majesticpermits.com";

function escape(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function row(label: string, value?: string | null) {
  if (!value) return "";
  return `<tr>
    <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;width:140px;vertical-align:top;">${escape(label)}</td>
    <td style="padding:8px 12px;background:#ffffff;border:1px solid #e2e8f0;font-size:14px;color:#0B1F3F;">${escape(value).replace(/\n/g, "<br />")}</td>
  </tr>`;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const parsed = ContactSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message || "Please check the form and try again" },
      { status: 400 }
    );
  }

  // Silently drop honeypot hits — bots think it worked.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const {
    name,
    email,
    phone,
    company,
    role,
    project_type,
    address,
    message,
    intent,
  } = parsed.data;

  const subjectPrefix =
    intent === "access"
      ? "New access request"
      : intent === "quote"
      ? "New quote request"
      : "New contact form message";

  const subject = `${subjectPrefix} — ${name}${company ? ` (${company})` : ""}`;

  const bodyHtml = `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:#0B1F3F;padding:22px 28px;">
            <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.2px;">Majestic Permits — ${escape(subjectPrefix)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 18px;color:#475569;font-size:14px;line-height:1.55;">A new submission just came in from <strong style="color:#0B1F3F;">hub.majesticpermits.com</strong>.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${row("Intent", intent)}
              ${row("Name", name)}
              ${row("Email", email)}
              ${row("Phone", phone)}
              ${row("Company", company)}
              ${row("Role", role)}
              ${row("Project type", project_type)}
              ${row("Property address", address)}
              ${row("Message", message)}
            </table>
            <p style="margin:22px 0 0;color:#64748b;font-size:12px;line-height:1.55;">Reply directly to this email to respond to ${escape(name)}.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject,
      html: bodyHtml,
    });
  } catch (err: any) {
    console.error("[contact] send failed:", err?.message || err);
    return NextResponse.json(
      { error: "We couldn't send your message right now. Please email hello@majesticpermits.com." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
