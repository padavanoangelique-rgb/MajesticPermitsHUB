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

const response = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Authorization" },
  });
const digest = (value: string) => createHash("sha256").update(value).digest();

/** Owner-only, read-only endpoint. The shared secret must never be sent to browsers. */
export async function GET(request: Request) {
  const secret = process.env.COMMONWEALTH_SSO_SECRET;
  const ownerId = process.env.COMMONWEALTH_OWNER_USER_ID;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !ownerId || !serviceKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return response({ error: "Majestic connection is not configured." }, 503);
  }
  const provided = request.headers.get("authorization") || "";
  if (!timingSafeEqual(digest(provided), digest("Bearer " + secret))) {
    return response({ error: "Unauthorized." }, 401);
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.admin.getUserById(ownerId);
    const owner = data?.user;
    const ownerEmail = owner?.email?.toLowerCase();
    const approvedEmails = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (error || !owner || !ownerEmail || !owner.email_confirmed_at || !approvedEmails.includes(ownerEmail)) {
      return response({ error: "Owner access unavailable." }, 403);
    }

    // Explicitly paginate to avoid truncating data at Supabase's configured row cap.
    async function readAll<T>(table: string, columns: string, sortColumn = "id"): Promise<T[]> {
      const pageSize = 500;
      const rows: T[] = [];
      for (let offset = 0; ; offset += pageSize) {
        const { data: page, error: pageError } = await supabase
          .from(table)
          .select(columns)
          .order(sortColumn, { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (pageError || !page) throw new Error("Cannot read " + table + " records");
        rows.push(...(page as unknown as T[]));
        if (page.length < pageSize) break;
      }
      return rows;
    }

    const [contractors, records, jobs, leads] = await Promise.all([
      readAll<ContractorRow>("contractors", "id,name,company_name,email,auth_user_id"),
      readAll<ContractorRecordRow>(
        "contractor_records",
        "contractor_id,license_number,license_expires,coi_carrier,coi_policy,coi_expires",
        "contractor_id"
      ),
      readAll<JobRow>(
        "jobs",
        "id,contractor_id,brand,property_address,permit_number,stage,sub_status,submitted_date,updated_at"
      ),
      readAll<PublicLeadRow>("public_leads", "id,brand,status"),
    ]);

    return response(summarizeMajesticOperations({ contractors, records, jobs, leads }));
  } catch (error) {
    console.error("Majestic operations read failed", error instanceof Error ? error.message : "Unknown error");
    return response({ error: "Majestic operations temporarily unavailable." }, 503);
  }
}
