import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { getPermitForm } from "@/lib/permit-forms";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const contractor = await getContractorForUser(user);
  if (!contractor) return NextResponse.json({ error: "No contractor profile" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const form = getPermitForm(typeof body.form_key === "string" ? body.form_key : "");
  if (!form) return NextResponse.json({ error: "Unknown form" }, { status: 400 });

  const fields: Record<string, string> = {};
  const raw = body.fields && typeof body.fields === "object" ? body.fields : {};
  for (const field of form.fields) {
    const value = raw[field.key];
    fields[field.key] = typeof value === "string" ? value.slice(0, 2000) : "";
  }

  const signerEmail = typeof body.signer_email === "string" ? body.signer_email.trim() : "";
  const token = randomUUID().replace(/-/g, "");
  const service = createServiceClient();
  const { error } = await service.from("contractor_form_sends").insert({
    contractor_id: contractor.id,
    job_id: typeof body.job_id === "string" && body.job_id ? body.job_id : null,
    form_key: form.key,
    fields,
    signer_email: signerEmail || null,
    status: "sent",
    token,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ token, path: `/sign/${token}` });
}
