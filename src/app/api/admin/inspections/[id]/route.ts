import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendSms } from "@/lib/sms";
import { getJobContactPhone } from "@/lib/job-contact";
import { notifyAdmin } from "@/lib/admin-notify";

export const dynamic = "force-dynamic";

/** Fixed columns writable through the admin inspection form. */
const ALLOWED = [
  "inspection_type",
  "status",
  "requested_date",
  "scheduled_date",
  "result_date",
  "inspector_name",
  "inspector_number",
  "correction_notes",
  "attachment_path",
  "visible_to_homeowner",
] as const;

const VALID_STATUS = new Set([
  "not_required",
  "not_requested",
  "requested",
  "scheduled",
  "passed",
  "partial_pass",
  "failed",
  "reinspection_requested",
  "reinspection_scheduled",
  "cancelled",
  "closed",
]);

// Statuses that mean "you're on the calendar" — these are what trigger the
// client-facing "inspection scheduled" text, not every status change.
const SCHEDULED_STATUSES = new Set(["scheduled", "reinspection_scheduled"]);

function sanitize(body: Record<string, any>) {
  const patch: Record<string, any> = {};
  for (const key of ALLOWED) {
    if (!(key in body)) continue;
    let value = body[key];
    if (value === "") value = null;
    if (key === "status" && value != null && !VALID_STATUS.has(value)) {
      throw new Error(`Invalid inspection status: ${value}`);
    }
    patch[key] = value;
  }
  patch.updated_at = new Date().toISOString();
  return patch;
}

/** id here is the inspection row id (each job has three). */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patch = sanitize(await req.json());
    if (Object.keys(patch).length <= 1) {
      return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: updated, error } = await supabase
      .from("job_inspections")
      .update(patch)
      .eq("id", params.id)
      .select("job_id, slot, inspection_type, status, scheduled_date")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Text the contractor/homeowner when the inspection just got scheduled.
    if ("status" in patch && updated && SCHEDULED_STATUSES.has(updated.status)) {
      const { data: job } = await supabase
        .from("jobs")
        .select("property_address, client_type, contractor_id, homeowner_phone")
        .eq("id", updated.job_id)
        .maybeSingle();

      if (job) {
        const what = updated.inspection_type || `Inspection ${updated.slot}`;
        const when = updated.scheduled_date
          ? ` for ${updated.scheduled_date}`
          : "";

        await notifyAdmin(
          "inspection_scheduled",
          `${job.property_address}: ${what} scheduled${when}.`,
          updated.job_id
        );

        const phone = await getJobContactPhone(job);
        if (phone) {
          await sendSms(
            phone,
            `Majestic Permits — ${job.property_address}: ${what} is scheduled${when}.`
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Update failed" },
      { status: 500 }
    );
  }
}
