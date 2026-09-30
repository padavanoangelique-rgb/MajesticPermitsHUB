import { createServiceClient } from "@/lib/supabase/service";
import { getResend } from "@/lib/email";
import { FROM_REQUESTS, MAILBOX, PUBLIC_HELLO } from "@/lib/mailboxes";
import {
  PUBLIC_LEAD_SOURCE,
  PUBLIC_REQUEST_STAGE,
  PUBLIC_REQUEST_SUB_STATUS,
  type PublicFormBrand,
  type PublicProjectType,
} from "@/lib/brands";
import { upsertNotionLead } from "@/lib/notion-leads";

export type PublicLeadInput = {
  fullName: string;
  phone: string;
  email: string;
  propertyAddress: string;
  projectType: PublicProjectType;
  brand: PublicFormBrand;
  notes: string;
};

type ExistingMatch = {
  contractorId: string | null;
  clientType: "contractor" | "homeowner";
  via: string;
};

function last10(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits.slice(-10);
}

function sameEmail(stored: string | null | undefined, email: string) {
  return (stored || "").trim().toLowerCase() === email.trim().toLowerCase();
}

function samePhone(stored: string | null | undefined, target: string) {
  if (!stored || target.length !== 10) return false;
  return last10(stored) === target;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

function phonePattern(target: string) {
  return `%${target.slice(0, 3)}%${target.slice(3, 6)}%${target.slice(6)}%`;
}

async function findExistingCustomer(
  supabase: ReturnType<typeof createServiceClient>,
  email: string,
  phone10: string
): Promise<ExistingMatch | null> {
  const pattern = phonePattern(phone10);

  const { data: contractorsByEmail } = await supabase
    .from("contractors")
    .select("id, email, phone")
    .ilike("email", email)
    .limit(10);

  let contractorsByPhone: Array<{ id: string; email: string | null; phone: string | null }> = [];
  const phoneLookup = await supabase
    .from("contractors")
    .select("id, email, phone")
    .ilike("phone", pattern)
    .limit(20);
  if (!phoneLookup.error) {
    contractorsByPhone = phoneLookup.data || [];
  }

  const contractor = [...(contractorsByEmail || []), ...contractorsByPhone].find(
    (row) => sameEmail(row.email, email) || samePhone(row.phone, phone10)
  );

  const { data: jobsByEmail } = await supabase
    .from("jobs")
    .select("id, contractor_id, client_type, homeowner_email, homeowner_phone")
    .ilike("homeowner_email", email)
    .limit(10);

  const { data: jobsByPhone } = await supabase
    .from("jobs")
    .select("id, contractor_id, client_type, homeowner_email, homeowner_phone")
    .ilike("homeowner_phone", pattern)
    .limit(20);

  const job = [...(jobsByEmail || []), ...(jobsByPhone || [])].find(
    (row) =>
      sameEmail(row.homeowner_email, email) || samePhone(row.homeowner_phone, phone10)
  );

  let homeownerHit = false;
  const homeownerLookup = await supabase
    .from("homeowners")
    .select("id, email, phone")
    .ilike("email", email)
    .limit(5);

  if (homeownerLookup.error) {
    const missing = /homeowners|schema cache|does not exist|PGRST/i.test(
      homeownerLookup.error.message || ""
    );
    if (!missing) {
      console.error("homeowner lookup failed", homeownerLookup.error.message);
    }
  } else if ((homeownerLookup.data || []).some((row) => sameEmail(row.email, email))) {
    homeownerHit = true;
  } else {
    const byPhone = await supabase
      .from("homeowners")
      .select("id, email, phone")
      .ilike("phone", pattern)
      .limit(20);
    if (!byPhone.error) {
      homeownerHit = (byPhone.data || []).some((row) => samePhone(row.phone, phone10));
    }
  }

  if (contractor) {
    return {
      contractorId: contractor.id,
      clientType: "contractor",
      via: "contractor",
    };
  }

  if (job) {
    return {
      contractorId: job.contractor_id || null,
      clientType: job.client_type === "contractor" ? "contractor" : "homeowner",
      via: "prior job",
    };
  }

  if (homeownerHit) {
    return { contractorId: null, clientType: "homeowner", via: "homeowner" };
  }

  return null;
}

async function notifyHello(input: PublicLeadInput, kind: "new lead" | "existing-customer job", hubId: string) {
  const subject =
    kind === "new lead"
      ? `New website lead — ${input.fullName}`
      : `Existing customer website job — ${input.fullName}`;

  const rows = [
    ["Result", kind],
    ["Name", input.fullName],
    ["Phone", input.phone],
    ["Email", input.email],
    ["Property address", input.propertyAddress],
    ["Project type", input.projectType],
    ["Brand", input.brand],
    ["Notes", input.notes || "—"],
    ["Source", PUBLIC_LEAD_SOURCE],
    ["Hub record id", hubId],
  ];

  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;">${label}</td><td style="padding:6px 0 6px 16px;color:#0f172a;font-size:14px;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const { error } = await getResend().emails.send({
    from: FROM_REQUESTS,
    to: [PUBLIC_HELLO, MAILBOX.owner],
    replyTo: input.email,
    subject,
    html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f7fb;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
        <p style="margin:0 0 8px;color:#5c4dff;font-weight:700;">Majestic Permits</p>
        <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Website project request</h1>
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

export async function capturePublicLead(input: PublicLeadInput) {
  const supabase = createServiceClient();
  const email = input.email.trim().toLowerCase();
  const phone10 = last10(input.phone);
  const match = await findExistingCustomer(supabase, email, phone10);

  let hubId = "";
  let kind: "new lead" | "existing-customer job" = "new lead";

  if (match) {
    const noteLines = [
      `Source: ${PUBLIC_LEAD_SOURCE}`,
      `Project type: ${input.projectType}`,
      `Brand: ${input.brand}`,
      `Matched existing customer via ${match.via}. Person was not duplicated.`,
      input.notes ? `Website notes:\n${input.notes}` : "",
    ].filter(Boolean);

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        property_address: input.propertyAddress,
        homeowner_name: input.fullName,
        homeowner_email: email,
        homeowner_phone: input.phone.trim(),
        client_type: match.clientType,
        contractor_id: match.contractorId,
        brand: input.brand,
        stage: PUBLIC_REQUEST_STAGE,
        sub_status: PUBLIC_REQUEST_SUB_STATUS,
        trade_type: input.projectType,
        notes: noteLines.join("\n"),
        next_step: "Review the website request and start intake",
      })
      .select("id")
      .single();

    if (error || !job) {
      throw new Error(error?.message || "Could not open the job");
    }

    const { error: linkError } = await supabase
      .from("homeowner_links")
      .insert({ job_id: job.id });
    if (linkError) {
      console.error("public job tracking link failed", linkError.message);
    }

    hubId = job.id;
    kind = "existing-customer job";
  } else {
    const { data: lead, error } = await supabase
      .from("public_leads")
      .insert({
        full_name: input.fullName,
        phone: input.phone.trim(),
        email,
        property_address: input.propertyAddress,
        project_type: input.projectType,
        brand: input.brand,
        notes: input.notes || null,
        source: PUBLIC_LEAD_SOURCE,
        status: "New",
      })
      .select("id")
      .single();

    if (error || !lead) {
      throw new Error(error?.message || "Could not save the lead");
    }
    hubId = lead.id;
  }

  const emailed = await notifyHello(input, kind, hubId).catch((err) => {
    console.error("public lead email failed", err);
    return false;
  });

  await upsertNotionLead({
    hubId,
    name: input.fullName,
    phone: input.phone.trim(),
    email,
    propertyAddress: input.propertyAddress,
    projectType: input.projectType,
    brand: input.brand,
    source: PUBLIC_LEAD_SOURCE,
    status: "New",
    createdAt: new Date().toISOString(),
  });

  return { id: hubId, kind, emailed };
}
