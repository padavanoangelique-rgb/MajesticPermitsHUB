import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";

export const dynamic = "force-dynamic";

function cleanDate(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const contractor = await getContractorForUser(user);
  if (!contractor) return NextResponse.json({ error: "No contractor profile" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const service = createServiceClient();
  const { error } = await service.from("contractor_records").upsert({
    contractor_id: contractor.id,
    license_number: typeof body.license_number === "string" ? body.license_number.trim() : "",
    license_expires: cleanDate(body.license_expires),
    coi_carrier: typeof body.coi_carrier === "string" ? body.coi_carrier.trim() : "",
    coi_policy: typeof body.coi_policy === "string" ? body.coi_policy.trim() : "",
    coi_expires: cleanDate(body.coi_expires),
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
