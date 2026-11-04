import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { contactsForJob, InspectionError, recordVisitResult, updateDayOf, validDay, type JobForInspection } from "@/lib/inspection-actions";

export const dynamic = "force-dynamic";

/**
 * The inspection bot's door. Every morning the bot GETs today's confirmed inspections, then POSTs what it learned for
 * each one (time, inspector, notes), and later the result. Authorized with INSPECTION_BOT_SECRET, like the other
 * /api/ingest routes (the session layer skips this path).
 *
 *   GET  ?date=YYYY-MM-DD   (default: today in Florida)  -> { date, inspections: [...] }
 *   POST { inspection_id, action: "day_of", time, inspector_name, inspector_number, notes }
 *   POST { inspection_id, action: "result", result: "passed" | "failed" | "partial_pass", date?, notes?, fee? }
 */
function authorized(req: Request) {
  const secret = process.env.INSPECTION_BOT_SECRET;
  if (!secret) return { ok: false as const, response: NextResponse.json({ error: "INSPECTION_BOT_SECRET is not set on the Hub" }, { status: 503 }) };
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== secret) return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { ok: true as const };
}

function floridaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export async function GET(req: Request) {
  const gate = authorized(req);
  if (!gate.ok) return gate.response;
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") ? validDay(url.searchParams.get("date")) : floridaToday();
    const db = createServiceClient();
    const { data: rows, error } = await db
      .from("job_inspections")
      .select("id, job_id, slot, inspection_type, status, scheduled_date, inspection_time, inspector_name, inspector_number, day_notes, confirmed_at")
      .eq("scheduled_date", date)
      .in("status", ["scheduled", "reinspection_scheduled"])
      .not("confirmed_at", "is", null);
    if (error) throw new Error(error.message);
    const jobIds = Array.from(new Set((rows || []).map((r) => r.job_id)));
    const { data: jobs } = jobIds.length
      ? await db.from("jobs").select("id, property_address, jurisdiction, permit_number, trade_type, stage, contractor_id, client_type, homeowner_phone").in("id", jobIds)
      : { data: [] as any[] };
    const jobMap = new Map((jobs || []).map((j: any) => [j.id, j]));
    const inspections = [];
    for (const row of rows || []) {
      const job = jobMap.get(row.job_id) as (JobForInspection & { jurisdiction?: string | null; permit_number?: string | null }) | undefined;
      const contacts = job ? await contactsForJob(db, job) : { emails: [], phones: [] };
      inspections.push({
        inspection_id: row.id,
        job_id: row.job_id,
        address: job?.property_address || null,
        jurisdiction: job?.jurisdiction || null,
        permit_number: job?.permit_number || null,
        trade: job?.trade_type || null,
        type: row.inspection_type || `Inspection ${row.slot}`,
        is_reinspection: row.status === "reinspection_scheduled",
        date: row.scheduled_date,
        time: row.inspection_time,
        inspector_name: row.inspector_name,
        inspector_number: row.inspector_number,
        notes: row.day_notes,
        contractor_phones: contacts.phones,
      });
    }
    return NextResponse.json({ date, inspections });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Could not load inspections" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const gate = authorized(req);
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json().catch(() => ({}));
    const id = typeof body.inspection_id === "string" ? body.inspection_id : "";
    if (!id) return NextResponse.json({ error: "inspection_id is required" }, { status: 400 });
    const db = createServiceClient();
    if (body.action === "day_of") {
      const out = await updateDayOf(db, {
        inspectionId: id,
        time: body.time,
        inspector_name: body.inspector_name,
        inspector_number: body.inspector_number,
        notes: body.notes,
        notify: body.notify !== false,
        by: "bot",
      });
      return NextResponse.json({ ok: true, notified: out.notice });
    }
    if (body.action === "result") {
      const out = await recordVisitResult(db, {
        inspectionId: id,
        result: body.result,
        date: body.date,
        notes: body.notes,
        fee: body.fee,
        inspector_name: body.inspector_name,
        notify: body.notify !== false,
        by: "bot",
      });
      return NextResponse.json({ ok: true, status: out.status, closed: out.closed, fee: out.fee, notified: out.notice });
    }
    return NextResponse.json({ error: 'action must be "day_of" or "result"' }, { status: 400 });
  } catch (err: any) {
    if (err instanceof InspectionError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 500 });
  }
}
