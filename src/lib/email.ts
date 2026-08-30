import { Resend } from "resend";
import { PERMIT_STAGES } from "@/lib/stages";

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "updates@majesticpermits.com";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://majesticpermits.com"
).replace(/\/$/, "");

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

/** Look up the friendly copy for a stage, matching by key OR by title. */
export function findStage(stage?: string | null) {
  if (!stage) return null;
  const needle = stage.toLowerCase().trim();
  return (
    PERMIT_STAGES.find(
      (s: any) =>
        String(s.key).toLowerCase() === needle ||
        String(s.title).toLowerCase() === needle ||
        String(s.short ?? "").toLowerCase() === needle
    ) || null
  );
}

function shell(brand: string, heading: string, body: string) {
  const accent = brand === "The Permit Closer" ? "#e2ba00" : "#156cdd";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:${accent};padding:22px 28px;">
              <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.2px;">${brand}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              <h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;color:#156cdd;font-weight:700;">${heading}</h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                ${brand} &middot; South Florida permitting<br />
                Questions? Just reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function stageChangeEmail(opts: {
  brand: string;
  propertyAddress: string;
  newStage: string;
  newSubStatus?: string | null;
  permitEta?: string | null;
  trackUrl?: string | null;
}) {
  const stage = findStage(opts.newStage);
  const title = stage?.title || opts.newStage;
  const description = stage?.description || "";
  const next = stage?.next || "";

  const etaRow = opts.permitEta
    ? `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Estimated permit date</td><td style="padding:6px 0;font-size:14px;color:#156cdd;font-weight:600;text-align:right;">${new Date(
        opts.permitEta + "T12:00:00"
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}</td></tr>`
    : "";

  const button = opts.trackUrl
    ? `<p style="margin:26px 0 0;">
         <a href="${opts.trackUrl}" style="display:inline-block;background:#156cdd;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 24px;border-radius:10px;">View your permit status</a>
       </p>
       <p style="margin:14px 0 0;font-size:12px;color:#94a3b8;">No login needed — this private link always shows your latest status.</p>`
    : "";

  const body = `
    <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#334155;">
      Your permit for <strong style="color:#156cdd;">${opts.propertyAddress}</strong> just moved forward.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;background:#f8fafc;">
      <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">New status</td><td style="padding:6px 0;font-size:14px;color:#156cdd;font-weight:600;text-align:right;">${title}</td></tr>
      ${
        opts.newSubStatus
          ? `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Detail</td><td style="padding:6px 0;font-size:14px;color:#156cdd;font-weight:600;text-align:right;">${opts.newSubStatus}</td></tr>`
          : ""
      }
      ${etaRow}
    </table>
    ${
      description
        ? `<p style="margin:20px 0 0;font-size:15px;line-height:1.65;color:#334155;"><strong style="color:#156cdd;">What's happening now:</strong> ${description}</p>`
        : ""
    }
    ${
      next
        ? `<p style="margin:12px 0 0;font-size:15px;line-height:1.65;color:#334155;"><strong style="color:#156cdd;">What happens next:</strong> ${next}</p>`
        : ""
    }
    ${button}
  `;

  return {
    subject: `${opts.propertyAddress} — ${title}`,
    html: shell(opts.brand || "Majestic Permits", "Permit status update", body),
  };
}

export function weeklyReportEmail(opts: {
  contractorName: string;
  jobs: Array<{
    property_address: string;
    stage: string;
    sub_status?: string | null;
    permit_eta?: string | null;
  }>;
}) {
  const rows =
    opts.jobs.length === 0
      ? `<tr><td colspan="2" style="padding:14px 0;font-size:14px;color:#64748b;">No active permits this week.</td></tr>`
      : opts.jobs
          .map(
            (j) => `<tr>
              <td style="padding:12px 0;border-top:1px solid #e2e8f0;font-size:14px;color:#156cdd;font-weight:600;">${j.property_address}</td>
              <td style="padding:12px 0;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;text-align:right;">${
                findStage(j.stage)?.title || j.stage
              }${j.permit_eta ? `<br /><span style="color:#e2ba00;">ETA ${j.permit_eta}</span>` : ""}</td>
            </tr>`
          )
          .join("");

  const body = `
    <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#334155;">
      Hi ${opts.contractorName}, here is where every one of your permits stands this week.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    <p style="margin:26px 0 0;">
      <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#156cdd;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 24px;border-radius:10px;">Open your dashboard</a>
    </p>
  `;

  return {
    subject: `Your weekly permit report — ${opts.jobs.length} active permit${
      opts.jobs.length === 1 ? "" : "s"
    }`,
    html: shell("Majestic Permits", "Weekly permit report", body),
  };
}

export function quoteEmail(opts: {
  brand: string;
  propertyAddress: string;
  amount: number;
  description?: string | null;
  payUrl: string;
}) {
  const amount = opts.amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const body = `
    <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#334155;">
      Here is your quote for <strong style="color:#156cdd;">${opts.propertyAddress}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;padding:18px;background:#f8fafc;">
      <tr><td style="font-size:14px;color:#64748b;">Total due</td><td style="font-size:22px;color:#156cdd;font-weight:700;text-align:right;">${amount}</td></tr>
      ${
        opts.description
          ? `<tr><td colspan="2" style="padding-top:12px;font-size:14px;line-height:1.6;color:#334155;">${opts.description}</td></tr>`
          : ""
      }
    </table>
    <p style="margin:26px 0 0;">
      <a href="${opts.payUrl}" style="display:inline-block;background:#e2ba00;color:#156cdd;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:10px;">Pay securely</a>
    </p>
    <p style="margin:14px 0 0;font-size:12px;color:#94a3b8;">Payments are processed by Stripe. We never see your card details.</p>
  `;

  return {
    subject: `Quote for ${opts.propertyAddress} — ${amount}`,
    html: shell(opts.brand || "Majestic Permits", "Your quote is ready", body),
  };
}
