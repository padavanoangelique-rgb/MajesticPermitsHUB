import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  summarizeMajesticOperations,
  type ContractorRow,
  type ContractorRecordRow,
  type JobRow,
  type PublicLeadRow,
} from "@/lib/majestic-commonwealth-operations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const respond = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", Vary: "Authorization" } });

function equalSecrets(value: string, expected: string): boolean {
  const hash = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(hash(value), hash(expected));
}

export async function GET(req: Request) {
  const secret = process.env.COMMONWEALTH_SSO_SECRET;
  const ownerId = process.env.COMMONWEALTH_OWNER_USER_ID;
  if (!secret || !ownerId || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return respond({ error: "Connection not configured." }, 503);
  }
  if (!equalSecrets(req.headers.get("authorization") || "", "Bearer " + secret)) {
    return respond({ error: "Unauthorized." }, 401);
  }

  try {
    const db = createServiceClient();
    const { data: verified, error: verifyError } = await db.auth.admin.getUserById(ownerId);
    const user = verified.user;
    if (verifyError || !user || !user.email || !user.email_confirmed_at) {
      return respond({ error: "Owner authorization unavailable." }, 403);
    }
    const ownerEmails = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "angelique@majesticpermits.com")
      .split(",").map((email) => email.trim().toLowerCase());
    if (!ownerEmails.includes(user.email.toLowerCase())) {
      return respond({ error: "Owner authorization unavailable." }, 403);
    }

    // Use explicit table selections to retain Next/Supabase static query typing.
    // Paginate to avoid losing rows at the PostgREST response limit.
    const contractors: ContractorRow[] = [];
    const records: ContractorRecordRow[] = [];
    const jobs: JobRow[] = [];
    const leads: PublicLeadRow[] = [];
    const pageSize = 500;

    for (let start = 0; ; start += pageSize) {
      const { data, error } = await db.from("contractors")
        .select("id,name,company_name,email,auth_user_id")
        .order("id").range(start, start + pageSize - 1);
      if (error || !data) throw new Error("Contractors query failed");
      contractors.push(...(data as ContractorRow[]));
      if (data.length < pageSize) break;
    }
    for (let start = 0; ; start += pageSize) {
      const { data, error } = await db.from("contractor_records")
        .select("contractor_id,license_number,license_expires,coi_carrier,coi_policy,coi_expires")
        .order("contractor_id").range(start, start + pageSize - 1);
      if (error || !data) throw new Error("Contractor records query failed");
      records.push(...(data as ContractorRecordRow[]));
      if (data.length < pageSize) break;
    }
    for (let start = 0; ; start += pageSize) {
      const { data, error } = await db.from("jobs")
        .select("id,contractor_id,brand,property_address,permit_number,stage,sub_status,submitted_date,updated_at")
        .order("id").range(start, start + pageSize - 1);
      if (error || !data) throw new Error("Jobs query failed");
      jobs.push(...(data as JobRow[]));
      if (data.length < pageSize) break;
    }
    for (let start = 0; ; start += pageSize) {
      const { data, error } = await db.from("public_leads")
        .select("id,brand,status")
        .order("id").range(start, start + pageSize - 1);
      if (error || !data) throw new Error("Leads query failed");
      leads.push(...(data as PublicLeadRow[]));
      if (data.length < pageSize) break;
    }

    return respond(summarizeMajesticOperations({ contractors, records, jobs, leads }));
  } catch (error) {
    console.error("Majestic Commonwealth operations error", error instanceof Error ? error.message : "Unknown");
    return respond({ error: "Majestic operations temporarily unavailable." }, 503);
  }
}
