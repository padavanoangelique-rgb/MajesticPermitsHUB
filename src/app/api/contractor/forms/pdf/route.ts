import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser, ownsJob } from "@/lib/contractor";
import { fillCountyForm, getCountyForm, VALUE_FIELDS } from "@/lib/forms/county-forms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const clean = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 2000) : "");

/**
 * Fills one county form (permit application or Notice of Commencement) and sends the PDF back. What was typed for the
 * company and the job is kept, so the next form starts with it.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const contractor = await getContractorForUser(user);
  if (!contractor) return NextResponse.json({ error: "No contractor profile" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const form = getCountyForm(typeof body.slug === "string" ? body.slug : "");
  if (!form) return NextResponse.json({ error: "Unknown form" }, { status: 400 });

  const raw = body.values && typeof body.values === "object" ? (body.values as Record<string, unknown>) : {};
  const values: Record<string, string> = { job_state: "FL" };
  for (const key of Object.keys(VALUE_FIELDS)) values[key] = clean(raw[key]);

  const service = createServiceClient();

  let job: { id: string; property_address: string | null; contractor_id: string | null; homeowner_name: string | null; homeowner_phone: string | null; homeowner_email: string | null } | null = null;
  const jobId = typeof body.job_id === "string" ? body.job_id : "";
  if (jobId) {
    const { data } = await service
      .from("jobs")
      .select("id, property_address, contractor_id, homeowner_name, homeowner_phone, homeowner_email")
      .eq("id", jobId)
      .maybeSingle();
    if (!data || !ownsJob(contractor, data.contractor_id)) return NextResponse.json({ error: "That job is not yours" }, { status: 403 });
    job = data;
  }

  let bytes: Uint8Array;
  let attached: string[] = [];
  try {
    const pdf = await readFile(path.join(process.cwd(), "src", "lib", "forms", "county-pdfs", form.file));
    const result = await fillCountyForm(new Uint8Array(pdf), form.slug, values);
    bytes = result.bytes;
    attached = result.attached;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not fill the form" }, { status: 500 });
  }

  // Keep what was typed. Empty values never overwrite what is already saved.
  if (contractor.company_id) {
    const company: Record<string, string> = {};
    const map: Record<string, string> = {
      contractor_phone: "phone",
      contractor_email: "email",
      contractor_address: "address",
      contractor_city: "city",
      contractor_state: "state",
      contractor_zip: "zip",
      qualifier_name: "qualifier_name",
      business_tax_receipt_number: "business_tax_receipt_number",
    };
    for (const [key, column] of Object.entries(map)) if (values[key]) company[column] = values[key];
    if (Object.keys(company).length) await service.from("contractor_companies").update(company).eq("id", contractor.company_id);
  }
  if (job) {
    const update: Record<string, string> = {};
    const map: Record<string, string> = {
      folio_number: "folio_number",
      legal_description: "legal_description",
      job_city: "property_city",
      job_zip: "property_zip",
      job_unit: "property_unit",
      description_of_work: "work_description",
    };
    for (const [key, column] of Object.entries(map)) if (values[key]) update[column] = values[key];
    if (!job.homeowner_name && values.client_name) update.homeowner_name = values.client_name;
    if (!job.homeowner_phone && values.owner_phone) update.homeowner_phone = values.owner_phone;
    if (!job.homeowner_email && values.owner_email) update.homeowner_email = values.owner_email;
    if (Object.keys(update).length) await service.from("jobs").update(update).eq("id", job.id);
  }

  const place = (values.job_address || "property").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "property";
  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${form.slug}-${place}.pdf"`,
      "X-Attached": encodeURIComponent(attached.join("|")),
      "Cache-Control": "no-store",
    },
  });
}
