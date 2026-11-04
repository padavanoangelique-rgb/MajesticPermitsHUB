import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser, ownsJob } from "@/lib/contractor";

export const dynamic = "force-dynamic";

const clean = (value: unknown, max = 2000) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Save what the appraiser says about a parcel onto one of the company's jobs. */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const contractor = await getContractorForUser(user);
  if (!contractor) return NextResponse.json({ error: "No contractor profile" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const jobId = clean(body.job_id, 80);
  const hit = body.hit && typeof body.hit === "object" ? (body.hit as Record<string, unknown>) : {};
  if (!jobId) return NextResponse.json({ error: "Pick a job" }, { status: 400 });

  const service = createServiceClient();
  const { data: job } = await service.from("jobs").select("id, contractor_id, homeowner_name").eq("id", jobId).maybeSingle();
  if (!job || !ownsJob(contractor, job.contractor_id)) return NextResponse.json({ error: "That job is not yours" }, { status: 403 });

  const update: Record<string, string> = {};
  const folio = clean(hit.folio, 60);
  const legal = clean(hit.legalDescription);
  const city = clean(hit.city, 80);
  const zip = clean(hit.zip, 12);
  const jurisdiction = clean(hit.jurisdiction, 120);
  if (folio) update.folio_number = folio;
  if (legal) update.legal_description = legal;
  if (city) update.property_city = city;
  if (zip) update.property_zip = zip;
  if (jurisdiction) update.jurisdiction = jurisdiction;
  // The owner of record only fills a blank. It never replaces a name someone typed.
  if (!job.homeowner_name && clean(hit.owner, 160)) update.homeowner_name = clean(hit.owner, 160);
  if (!Object.keys(update).length) return NextResponse.json({ error: "Nothing to save" }, { status: 400 });

  const { error } = await service.from("jobs").update(update).eq("id", job.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ saved: Object.keys(update) });
}
