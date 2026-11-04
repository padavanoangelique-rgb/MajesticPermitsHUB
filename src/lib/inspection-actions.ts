import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL, getResend } from "@/lib/email";
import { FROM_INSPECTIONS, MAILBOX } from "@/lib/mailboxes";
import { sendSms } from "@/lib/sms";
import { closeJobIfFinalPassed } from "@/lib/close-on-final";
import { defaultSubStatus, inspectionsAllowed, stageAfterInspectionConfirmed, stageAfterInspectionResult } from "@/lib/stages";
import {
  isFinalVisit,
  reinspectionFee,
  scheduledStatusFor,
  slotsToActivate,
  visitName,
  type InspectionRow,
} from "@/lib/inspection-flow";

/**
 * Everything Majestic does to an inspection, in one place: put it on the calendar, confirm it (which tells the
 * contractor), add the morning-of details, and record the result. The admin screens and the bot both call these.
 * `db` is the service-role client.
 */

type Db = SupabaseClient;

export type JobForInspection = {
  id: string;
  property_address: string | null;
  stage: string | null;
  contractor_id: string | null;
  client_type: string | null;
  homeowner_phone: string | null;
  trade_type?: string | null;
};

export class InspectionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const INSPECTION_COLUMNS =
  "id, job_id, slot, inspection_type, status, requested_date, scheduled_date, result_date, confirmed_at, inspection_time, inspector_name, inspector_number, day_notes, correction_notes, reinspection_fee, reinspection_fee_status";

export function validDay(value: unknown): string {
  const text = typeof value === "string" ? value.trim().slice(0, 10) : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || new Date(`${text}T12:00:00Z`).toISOString().slice(0, 10) !== text) {
    throw new InspectionError("Enter a valid date.");
  }
  return text;
}

function cleanText(value: unknown, max = 500): string | null {
  const text = typeof value === "string" ? value.trim().slice(0, max) : "";
  return text || null;
}

export async function loadInspection(db: Db, id: string): Promise<{ inspection: InspectionRow; job: JobForInspection }> {
  const { data: inspection, error } = await db.from("job_inspections").select(INSPECTION_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new InspectionError(error.message);
  if (!inspection) throw new InspectionError("Inspection not found.", 404);
  const { data: job, error: jobError } = await db
    .from("jobs")
    .select("id, property_address, stage, contractor_id, client_type, homeowner_phone, trade_type")
    .eq("id", inspection.job_id)
    .maybeSingle();
  if (jobError) throw new InspectionError(jobError.message);
  if (!job) throw new InspectionError("Job not found.", 404);
  return { inspection: inspection as InspectionRow, job: job as JobForInspection };
}

export async function recordEvent(
  db: Db,
  event: {
    inspection_id: string;
    job_id: string;
    kind: string;
    status?: string | null;
    event_date?: string | null;
    inspection_time?: string | null;
    inspector_name?: string | null;
    notes?: string | null;
    fee?: number | null;
    created_by?: string | null;
  }
) {
  const { error } = await db.from("job_inspection_events").insert(event);
  if (error) console.error("inspection event not saved:", error.message);
}

/** An approved job whose standard visits were never turned on gets them, so the contractor has something to request. */
export async function ensureStandardVisits(db: Db, jobId: string, stage: string | null | undefined): Promise<InspectionRow[]> {
  const { data } = await db.from("job_inspections").select(INSPECTION_COLUMNS).eq("job_id", jobId).order("slot");
  const rows = (data || []) as InspectionRow[];
  if (!inspectionsAllowed(stage)) return rows;
  const patches = slotsToActivate(rows);
  for (const { id, patch } of patches) {
    await db.from("job_inspections").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  }
  if (!patches.length) return rows;
  const { data: fresh } = await db.from("job_inspections").select(INSPECTION_COLUMNS).eq("job_id", jobId).order("slot");
  return (fresh || []) as InspectionRow[];
}

/** The same for many jobs at once (one read). Returns every job's visits, with the standard visits already turned on. */
export async function ensureVisitsForJobs(db: Db, jobs: Array<{ id: string; stage: string | null }>): Promise<Map<string, InspectionRow[]>> {
  const byJob = new Map<string, InspectionRow[]>();
  if (!jobs.length) return byJob;
  const { data } = await db.from("job_inspections").select(INSPECTION_COLUMNS).in("job_id", jobs.map((j) => j.id)).order("slot");
  for (const row of (data || []) as InspectionRow[]) {
    const list = byJob.get(row.job_id) || [];
    list.push(row);
    byJob.set(row.job_id, list);
  }
  for (const job of jobs) {
    if (!inspectionsAllowed(job.stage)) continue;
    const rows = byJob.get(job.id) || [];
    for (const { id, patch } of slotsToActivate(rows)) {
      await db.from("job_inspections").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      const row = rows.find((r) => r.id === id);
      if (row) Object.assign(row, patch);
    }
  }
  return byJob;
}

/** Put a visit on the calendar. It is tentative until confirmed: the contractor is not told yet. */
export async function scheduleVisit(
  db: Db,
  args: { inspectionId: string; date: unknown; time?: unknown; by?: string }
) {
  const date = validDay(args.date);
  const { inspection, job } = await loadInspection(db, args.inspectionId);
  if (!inspectionsAllowed(job.stage)) throw new InspectionError("Inspections open after the permit is approved.", 409);
  if (["passed", "closed", "not_required"].includes(inspection.status)) throw new InspectionError("This visit is not open for scheduling.", 409);
  const status = scheduledStatusFor(inspection.status);
  const time = cleanText(args.time, 40);
  const { error } = await db
    .from("job_inspections")
    .update({
      status,
      scheduled_date: date,
      inspection_time: time,
      confirmed_at: null,
      inspection_type: visitName(inspection),
      updated_at: new Date().toISOString(),
    })
    .eq("id", inspection.id);
  if (error) throw new InspectionError(error.message);
  // The old request queue holds the contractor's ask for this visit: it is answered now.
  await db
    .from("inspection_requests")
    .update({ status: "Scheduled", scheduled_date: date, handled_at: new Date().toISOString() })
    .eq("job_id", job.id)
    .eq("status", "Pending")
    .ilike("inspection_type", visitName(inspection));
  await recordEvent(db, { inspection_id: inspection.id, job_id: job.id, kind: "scheduled", status, event_date: date, inspection_time: time, created_by: args.by });
  return { status, date };
}

/** Take a tentative visit off the calendar again. A confirmed one is changed with a new date instead. */
export async function unscheduleVisit(db: Db, inspectionId: string, by?: string) {
  const { inspection, job } = await loadInspection(db, inspectionId);
  if (!["scheduled", "reinspection_scheduled"].includes(inspection.status)) throw new InspectionError("This visit is not on the calendar.", 409);
  const status = inspection.status === "reinspection_scheduled" ? "reinspection_requested" : inspection.requested_date ? "requested" : "not_requested";
  const { error } = await db
    .from("job_inspections")
    .update({ status, scheduled_date: null, inspection_time: null, confirmed_at: null, updated_at: new Date().toISOString() })
    .eq("id", inspection.id);
  if (error) throw new InspectionError(error.message);
  await recordEvent(db, { inspection_id: inspection.id, job_id: job.id, kind: "unscheduled", status, created_by: by });
  return { status };
}

/** Confirm a scheduled visit: it shows on the contractor's schedule and the contractor is told. */
export async function confirmVisit(db: Db, inspectionId: string, by?: string) {
  const { inspection, job } = await loadInspection(db, inspectionId);
  if (!["scheduled", "reinspection_scheduled"].includes(inspection.status) || !inspection.scheduled_date) {
    throw new InspectionError("Put the inspection on the calendar first.", 409);
  }
  const now = new Date().toISOString();
  const { error } = await db.from("job_inspections").update({ confirmed_at: now, updated_at: now }).eq("id", inspection.id);
  if (error) throw new InspectionError(error.message);

  const nextStage = stageAfterInspectionConfirmed(job.stage);
  if (nextStage) {
    await db.from("jobs").update({ stage: nextStage, sub_status: defaultSubStatus(nextStage) }).eq("id", job.id);
  }
  await recordEvent(db, { inspection_id: inspection.id, job_id: job.id, kind: "confirmed", status: inspection.status, event_date: inspection.scheduled_date, inspection_time: inspection.inspection_time, created_by: by });

  const when = longDay(inspection.scheduled_date) + (inspection.inspection_time ? ` at ${inspection.inspection_time}` : "");
  const notice = await notifyJobContractor(db, job, {
    heading: "Inspection scheduled",
    subject: `${job.property_address} — inspection scheduled`,
    lines: [`${visitName(inspection)} inspection at ${job.property_address}: ${when}.`, "It is on your schedule."],
    sms: `Majestic Permits — ${job.property_address}: ${visitName(inspection)} inspection scheduled for ${when}.`,
    link: "/dashboard/inspections",
    linkLabel: "Open your schedule",
  });
  return { notice, stage: nextStage };
}

/** The morning-of details: time, inspector, notes. The bot calls this the morning of the inspection. */
export async function updateDayOf(
  db: Db,
  args: { inspectionId: string; time?: unknown; inspector_name?: unknown; inspector_number?: unknown; notes?: unknown; notify?: boolean; by?: string }
) {
  const { inspection, job } = await loadInspection(db, args.inspectionId);
  if (!["scheduled", "reinspection_scheduled"].includes(inspection.status)) throw new InspectionError("This inspection is not scheduled.", 409);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (args.time !== undefined) patch.inspection_time = cleanText(args.time, 40);
  if (args.inspector_name !== undefined) patch.inspector_name = cleanText(args.inspector_name, 120);
  if (args.inspector_number !== undefined) patch.inspector_number = cleanText(args.inspector_number, 40);
  if (args.notes !== undefined) patch.day_notes = cleanText(args.notes, 1000);
  if (Object.keys(patch).length === 1) throw new InspectionError("Nothing to update.");
  const { error } = await db.from("job_inspections").update(patch).eq("id", inspection.id);
  if (error) throw new InspectionError(error.message);
  const merged = { ...inspection, ...patch } as InspectionRow;
  await recordEvent(db, {
    inspection_id: inspection.id,
    job_id: job.id,
    kind: "day_update",
    status: inspection.status,
    event_date: inspection.scheduled_date,
    inspection_time: merged.inspection_time,
    inspector_name: merged.inspector_name,
    notes: merged.day_notes,
    created_by: args.by,
  });
  let notice = null;
  if (args.notify !== false && inspection.confirmed_at) {
    const bits = [
      merged.inspection_time ? `time ${merged.inspection_time}` : "",
      merged.inspector_name ? `inspector ${merged.inspector_name}${merged.inspector_number ? ` (${merged.inspector_number})` : ""}` : "",
    ].filter(Boolean);
    notice = await notifyJobContractor(db, job, {
      heading: "Inspection details",
      subject: `${job.property_address} — inspection details`,
      lines: [`${visitName(inspection)} inspection at ${job.property_address}${bits.length ? `: ${bits.join(", ")}` : ""}.`, ...(merged.day_notes ? [merged.day_notes] : [])],
      sms: `Majestic Permits — ${job.property_address}: ${visitName(inspection)} inspection${bits.length ? ` ${bits.join(", ")}` : ""}.${merged.day_notes ? ` ${merged.day_notes}` : ""}`,
      link: "/dashboard/inspections",
      linkLabel: "Open your schedule",
    });
  }
  return { notice };
}

export type VisitResult = "passed" | "failed" | "partial_pass";

/**
 * Record the result. Passed moves the job on (a passed final closes it). A failure puts the visit back in the pending
 * queue as a re-inspection, with the re-inspection fee.
 */
export async function recordVisitResult(
  db: Db,
  args: { inspectionId: string; result: unknown; date?: unknown; notes?: unknown; fee?: unknown; inspector_name?: unknown; notify?: boolean; by?: string }
) {
  const result = String(args.result || "");
  if (!["passed", "failed", "partial_pass"].includes(result)) throw new InspectionError("Choose passed, failed or partial pass.");
  const kind = result as VisitResult;
  const date = args.date ? validDay(args.date) : new Date().toISOString().slice(0, 10);
  const { inspection, job } = await loadInspection(db, args.inspectionId);
  if (!inspectionsAllowed(job.stage)) throw new InspectionError("This job is not in the inspection stages.", 409);
  if (!["scheduled", "reinspection_scheduled"].includes(inspection.status)) throw new InspectionError("Only a scheduled inspection can have a result.", 409);

  const notes = cleanText(args.notes, 1000);
  const patch: Record<string, unknown> = { status: kind, result_date: date, updated_at: new Date().toISOString() };
  if (notes) patch.correction_notes = notes;
  if (args.inspector_name !== undefined && cleanText(args.inspector_name, 120)) patch.inspector_name = cleanText(args.inspector_name, 120);

  let fee: number | null = null;
  if (kind === "failed") {
    const typed = args.fee === undefined || args.fee === "" || args.fee === null ? null : Number(args.fee);
    if (typed !== null && (!Number.isFinite(typed) || typed < 0)) throw new InspectionError("Enter the re-inspection fee as a dollar amount.");
    fee = typed ?? reinspectionFee(process.env.REINSPECTION_FEE_USD);
    patch.reinspection_fee = fee;
    patch.reinspection_fee_status = "due";
  }
  const { error } = await db.from("job_inspections").update(patch).eq("id", inspection.id);
  if (error) throw new InspectionError(error.message);

  const isFinal = isFinalVisit(inspection);
  const nextStage = stageAfterInspectionResult(job.stage, kind, isFinal);
  if (nextStage) await db.from("jobs").update({ stage: nextStage, sub_status: defaultSubStatus(nextStage) }).eq("id", job.id);
  const closed =
    kind === "passed" && isFinal
      ? await closeJobIfFinalPassed({ jobId: job.id, inspection: { ...inspection, status: "passed", result_date: date }, treatAsFinal: true })
      : { closed: false };
  await recordEvent(db, {
    inspection_id: inspection.id,
    job_id: job.id,
    kind: kind === "passed" ? "passed" : kind === "failed" ? "failed" : "partial_pass",
    status: kind,
    event_date: date,
    inspection_time: inspection.inspection_time,
    inspector_name: (patch.inspector_name as string) || inspection.inspector_name,
    notes,
    fee,
    created_by: args.by,
  });

  let notice = null;
  if (args.notify !== false) {
    const label = visitName(inspection);
    const resultLine =
      kind === "passed"
        ? `${label} inspection PASSED${closed.closed ? ". The permit is closed." : isFinal ? "." : ". The job is ready for its final inspection."}`
        : kind === "failed"
          ? `${label} inspection did not pass. It needs a re-inspection${fee ? ` and a $${fee.toFixed(2)} re-inspection fee is due` : " (a re-inspection fee applies)"}.`
          : `${label} inspection passed in part. It needs a re-inspection.`;
    notice = await notifyJobContractor(db, job, {
      heading: kind === "passed" ? "Inspection passed" : "Inspection needs a re-inspection",
      subject: `${job.property_address} — inspection ${kind === "passed" ? "passed" : "did not pass"}`,
      lines: [`${job.property_address}: ${resultLine}`, ...(notes ? [`Inspector notes: ${notes}`] : [])],
      sms: `Majestic Permits — ${job.property_address}: ${resultLine}`,
      link: "/dashboard",
      linkLabel: "Open your portal",
    });
  }
  return { status: kind, closed: closed.closed, fee, stage: nextStage, notice };
}

// ---------------------------------------------------------------------------------------------------------------------
// Telling the contractor: every login of the company gets the email, every phone on file gets the text.
// ---------------------------------------------------------------------------------------------------------------------

export type NoticeSummary = { emails: number; texts: number; errors: string[] };

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function noticeHtml(args: { heading: string; lines: string[]; link: string; linkLabel: string }) {
  const body = args.lines.map((line) => `<p style="margin:0 0 10px;color:#334155;font-size:15px;line-height:1.65;">${escapeHtml(line)}</p>`).join("");
  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dedede;border-radius:16px;padding:28px;">
      <p style="margin:0 0 6px;color:#5c4dff;font-weight:700;">Majestic Permits</p>
      <h1 style="margin:0 0 14px;color:#5c4dff;font-size:22px;">${escapeHtml(args.heading)}</h1>
      ${body}
      <p style="margin:22px 0 0;"><a href="${SITE_URL}${args.link}" style="display:inline-block;background:#5c4dff;color:#fff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;">${escapeHtml(args.linkLabel)}</a></p>
    </div></body></html>`;
}

/** Who to tell for a job: the company's logins when it belongs to a contractor, else the homeowner's phone. */
export async function contactsForJob(db: Db, job: JobForInspection): Promise<{ emails: string[]; phones: string[] }> {
  if (!job.contractor_id) return { emails: [], phones: job.homeowner_phone ? [job.homeowner_phone] : [] };
  const { data: own } = await db.from("contractors").select("id, company_id").eq("id", job.contractor_id).maybeSingle();
  let members: Array<{ email: string | null; phone: string | null }> = [];
  if (own?.company_id) {
    const { data } = await db.from("contractors").select("email, phone").eq("company_id", own.company_id);
    members = data || [];
  } else {
    const { data } = await db.from("contractors").select("email, phone").eq("id", job.contractor_id);
    members = data || [];
  }
  const emails = Array.from(new Set(members.map((m) => (m.email || "").trim().toLowerCase()).filter(Boolean)));
  const phones = Array.from(new Set(members.map((m) => (m.phone || "").trim()).filter(Boolean)));
  return { emails, phones };
}

export async function notifyJobContractor(
  db: Db,
  job: JobForInspection,
  message: { heading: string; subject: string; lines: string[]; sms: string; link: string; linkLabel: string }
): Promise<NoticeSummary> {
  const summary: NoticeSummary = { emails: 0, texts: 0, errors: [] };
  const { emails, phones } = await contactsForJob(db, job);
  for (const phone of phones) {
    const sent = await sendSms(phone, message.sms);
    if (sent.ok) summary.texts += 1;
    else summary.errors.push(`text: ${sent.error || "failed"}`);
  }
  if (emails.length) {
    try {
      await getResend().emails.send({
        from: FROM_INSPECTIONS,
        to: emails,
        replyTo: MAILBOX.inspections,
        subject: message.subject,
        html: noticeHtml({ heading: message.heading, lines: message.lines, link: message.link, linkLabel: message.linkLabel }),
      });
      summary.emails = emails.length;
    } catch (err: any) {
      summary.errors.push(`email: ${err?.message || "failed"}`);
    }
  }
  if (!emails.length && !phones.length) summary.errors.push("no email or phone on file for this contractor");
  return summary;
}

function longDay(value: string | null | undefined) {
  if (!value) return "";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
