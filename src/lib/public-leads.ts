import { createServiceClient } from "@/lib/supabase/service";
import { getResend } from "@/lib/email";
import { FROM_REQUESTS, MAILBOX, PUBLIC_HELLO } from "@/lib/mailboxes";
import {
  PUBLIC_LEAD_SOURCE,
  type PublicFormBrand,
  type PublicProjectType,
} from "@/lib/brands";
import { upsertNotionLead } from "@/lib/notion-leads";

export type PublicInquiry = {
  intent: "more-info" | "permit-report" | "contact";
  fullName: string;
  email: string;
  company: string;
  propertyAddress: string;
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

const INTENT_LABEL = {
  "more-info": "Contractor registration",
  "permit-report": "Free permit report",
  contact: "Contact me",
} as const;

function inquiryBrand(intent: PublicInquiry["intent"]): PublicFormBrand {
  return intent === "permit-report" ? "The Permit Closer" : "Majestic Permits";
}

function inquiryProject(intent: PublicInquiry["intent"]): PublicProjectType {
  return intent === "permit-report" ? "Expired permit close-out" : "Other";
}

function inquiryNotes(input: PublicInquiry) {
  return [
    INTENT_LABEL[input.intent],
    input.company ? `Company: ${input.company}` : "",
    input.message ? input.message : "",
    "Website inquiry only. A new permit is requested inside the hub after onboarding, not from this form.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function notifyHello(input: PublicInquiry, hubId: string) {
  const label = INTENT_LABEL[input.intent];
  const rows = [
    ["Ask", label],
    ["Name", input.fullName],
    ["Email", input.email],
    ["Company", input.company || "—"],
    ["Property address", input.propertyAddress || "—"],
    ["Message", input.message || "—"],
    ["Brand", inquiryBrand(input.intent)],
    ["Source", PUBLIC_LEAD_SOURCE],
    ["Hub record id", hubId],
  ];

  const body = rows
    .map(
      ([labelName, value]) =>
        `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;">${labelName}</td><td style="padding:6px 0 6px 16px;color:#0f172a;font-size:14px;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const { error } = await getResend().emails.send({
    from: FROM_REQUESTS,
    to: [PUBLIC_HELLO, MAILBOX.owner],
    replyTo: input.email,
    subject: `${label} — ${input.fullName}`,
    html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f7fb;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
        <p style="margin:0 0 8px;color:#5c4dff;font-weight:700;">Majestic Permits</p>
        <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">${escapeHtml(label)}</h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table>
      </div>
    </body></html>`,
  });

  if (error) {
    console.error("public lead email failed", error);
    return false;
  }
  return true;
}

export async function capturePublicLead(input: PublicInquiry) {
  const supabase = createServiceClient();
  const email = input.email.trim().toLowerCase();
  const notes = inquiryNotes(input);
  const brand = inquiryBrand(input.intent);
  const projectType = inquiryProject(input.intent);
  const address = input.propertyAddress.trim() || "Not given";

  const { data: lead, error } = await supabase
    .from("public_leads")
    .insert({
      full_name: input.fullName.trim(),
      phone: "Not given",
      email,
      property_address: address,
      project_type: projectType,
      brand,
      notes,
      source: PUBLIC_LEAD_SOURCE,
      status: "New",
    })
    .select("id")
    .single();

  if (error || !lead) {
    throw new Error(error?.message || "Could not save the lead");
  }

  const emailed = await notifyHello(input, lead.id).catch((err) => {
    console.error("public lead email failed", err);
    return false;
  });

  await upsertNotionLead({
    hubId: lead.id,
    name: input.fullName.trim(),
    phone: "",
    email,
    propertyAddress: address,
    projectType,
    brand,
    source: PUBLIC_LEAD_SOURCE,
    status: "New",
    createdAt: new Date().toISOString(),
  });

  return { id: lead.id, kind: "new lead" as const, emailed };
}
