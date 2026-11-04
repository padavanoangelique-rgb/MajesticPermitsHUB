import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { pushJobToPermitAIO } from "@/lib/permitaio-sync";

export const dynamic = "force-dynamic";

/** One-time: push existing hub jobs for A Plus (or a named contractor) into PermitAIO. */
export async function POST(req: Request) {
  const secret = process.env.PERMITAIO_HUB_SECRET;
  if (!secret || req.headers.get("x-hub-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const match = String(body.company || "A Plus").trim();
  const supabase = createServiceClient();

  const { data: contractors, error: cErr } = await supabase
    .from("contractors")
    .select("id, name, company_name")
    .or(`company_name.ilike.%${match}%,name.ilike.%${match}%`);

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });
  if (!contractors?.length) {
    return NextResponse.json({ error: `No contractor matching ${match}` }, { status: 404 });
  }

  const results: { id: string; address: string; ok: boolean; error?: string }[] = [];
  for (const contractor of contractors) {
    const company = contractor.company_name || contractor.name || match;
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, property_address, trade_type, jurisdiction, homeowner_name, homeowner_phone, homeowner_email, notes, stage, sub_status")
      .eq("contractor_id", contractor.id);

    for (const job of jobs || []) {
      if (!job.property_address) continue;
      const sync = await pushJobToPermitAIO({
        hub_job_id: job.id,
        company_name: company,
        property_address: job.property_address,
        trade_type: job.trade_type,
        jurisdiction: job.jurisdiction,
        homeowner_name: job.homeowner_name,
        homeowner_phone: job.homeowner_phone,
        homeowner_email: job.homeowner_email,
        notes: [job.notes, job.stage ? `Hub stage: ${job.stage}` : null, job.sub_status ? `Hub status: ${job.sub_status}` : null]
          .filter(Boolean)
          .join("\n"),
      });
      results.push({
        id: job.id,
        address: job.property_address,
        ok: Boolean((sync as any).ok),
        error: (sync as any).error,
      });
    }
  }

  return NextResponse.json({
    contractors: contractors.map((c) => c.company_name || c.name),
    pushed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
