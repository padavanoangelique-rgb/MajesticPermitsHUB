import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const validUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(value);

const respond = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

const safeText = (value: unknown, max = 250) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function bearerAllowed(header: string | null, secret: string): boolean {
  const hash = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(hash(header || ""), hash("Bearer " + secret));
}

/**
 * New versioned lead generator handoff. This does not change the contractor
 * dashboard or the existing /api/ingest/permit-closer endpoint.
 * source_sale_id is unique in jobs, including during concurrent retries.
 */
export async function POST(req: Request) {
  const secret = process.env.LEAD_INGEST_SECRET;
  if (!secret) return respond({ error: "Majestic lead intake is not configured." }, 503);
  if (!bearerAllowed(req.headers.get("authorization"), secret)) {
    return respond({ error: "Unauthorized." }, 401);
  }

  const body = await req.json().catch(() => null);
  if (!validUuid(body?.source_sale_id)) {
    return respond({ error: "A valid source sale ID is required." }, 400);
  }
  if (body?.source_lead_id != null && !validUuid(body.source_lead_id)) {
    return respond({ error: "Invalid source lead ID." }, 400);
  }
  const address = safeText(body?.address, 400);
  if (address.length < 5) return respond({ error: "Verified project address required." }, 400);
  const brand = body?.brand === "Majestic Permits" ? "Majestic Permits" : "The Permit Closer";
  const value = Number(body?.job_value || 0);
  if (!Number.isFinite(value) || value < 0 || value > 99999999) {
    return respond({ error: "Invalid job value." }, 400);
  }

  const db = createServiceClient();
  const existingJob = async () => {
    const { data, error } = await db.from("jobs")
      .select("id").eq("lead_generator_sale_id", body.source_sale_id).maybeSingle();
    if (error) throw new Error("Existing job lookup failed");
    return data;
  };

  try {
    const existing = await existingJob();
    if (existing) return respond({
      id: existing.id,
      url: "https://hub.majesticpermits.com/admin/jobs/" + existing.id,
      reused: true
    });

    const noteParts = [
      "Source: Lead Generator verified sale",
      "Original sale: " + body.source_sale_id,
      body.source_lead_id ? "Original lead: " + body.source_lead_id : "",
      value ? "Quoted job value: $" + value.toFixed(2) : "",
      safeText(body.notes, 1200),
    ].filter(Boolean);

    const { data: job, error: insertError } = await db.from("jobs").insert({
      lead_generator_sale_id: body.source_sale_id,
      lead_generator_lead_id: body.source_lead_id || null,
      brand,
      property_address: address,
      homeowner_name: safeText(body.name, 250) || null,
      homeowner_email: safeText(body.email, 250) || null,
      homeowner_phone: safeText(body.phone, 80) || null,
      client_type: "homeowner",
      stage: "Getting your project ready",
      sub_status: "Need to Submit",
      permit_number: safeText(body.permit_number, 150) || null,
      trade_type: safeText(body.permit_type, 200) || "Expired permit close-out",
      jurisdiction: safeText(body.county, 200) || null,
      next_step: "Review converted lead and prepare permit service intake",
      notes: noteParts.join("\n"),
    }).select("id").single();

    if (insertError || !job) {
      if (insertError?.code === "23505") {
        const prior = await existingJob();
        if (prior) return respond({
          id: prior.id,
          url: "https://hub.majesticpermits.com/admin/jobs/" + prior.id,
          reused: true
        });
      }
      return respond({ error: "Majestic job could not be created." }, 503);
    }

    const { error: linkError } = await db.from("homeowner_links").insert({ job_id: job.id });
    return respond({
      id: job.id,
      url: "https://hub.majesticpermits.com/admin/jobs/" + job.id,
      reused: false,
      warning: linkError ? "Job created; homeowner tracking link needs review." : undefined,
    });
  } catch {
    return respond({ error: "Majestic intake temporarily unavailable." }, 503);
  }
}
