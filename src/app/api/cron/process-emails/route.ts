import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { getResend, FROM_EMAIL, SITE_URL, stageChangeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 25;
const MAX_ATTEMPTS = 3;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: queued, error: queueError } = await supabase
    .from("mph_email_queue")
    .select("id, job_id, event_type, payload, attempts")
    .eq("status", "pending")
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (queueError) {
    return NextResponse.json({ error: queueError.message }, { status: 500 });
  }

  if (!queued || queued.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, failed: 0 });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of queued) {
    // Claim the row so a second invocation cannot double-send
    await supabase
      .from("mph_email_queue")
      .update({ status: "processing", attempts: (item.attempts ?? 0) + 1 })
      .eq("id", item.id);

    try {
      const { data: job } = await supabase
        .from("jobs")
        .select(
          "id, brand, property_address, homeowner_email, homeowner_name, stage, sub_status, permit_eta, contractor_id"
        )
        .eq("id", item.job_id)
        .maybeSingle();

      if (!job) throw new Error("Job no longer exists");

      const recipients = new Set<string>();
      if (job.homeowner_email) recipients.add(job.homeowner_email);

      if (job.contractor_id) {
        const { data: contractor } = await supabase
          .from("contractors")
          .select("email")
          .eq("id", job.contractor_id)
          .maybeSingle();
        if (contractor?.email) recipients.add(contractor.email);
      }

      if (recipients.size === 0) {
        // Nothing to send to — close it out rather than retrying forever
        await supabase
          .from("mph_email_queue")
          .update({
            status: "sent",
            processed_at: new Date().toISOString(),
            last_error: "No recipient email on job",
          })
          .eq("id", item.id);
        skipped++;
        continue;
      }

      const { data: link } = await supabase
        .from("homeowner_links")
        .select("token")
        .eq("job_id", job.id)
        .maybeSingle();

      const payload = (item.payload || {}) as Record<string, any>;

      const { subject, html } = stageChangeEmail({
        brand: job.brand || "Majestic Permits",
        propertyAddress: job.property_address,
        newStage: payload.new_stage || job.stage,
        newSubStatus: payload.new_sub_status || job.sub_status,
        permitEta: job.permit_eta,
        trackUrl: link?.token ? `${SITE_URL}/track/${link.token}` : null,
      });

      const resend = getResend();
      const { error: sendError } = await resend.emails.send({
        from: `Majestic Permits <${FROM_EMAIL}>`,
        to: Array.from(recipients),
        subject,
        html,
      });

      if (sendError) throw new Error(sendError.message);

      await supabase
        .from("mph_email_queue")
        .update({
          status: "sent",
          processed_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", item.id);
      sent++;
    } catch (err: any) {
      const attempts = (item.attempts ?? 0) + 1;
      await supabase
        .from("mph_email_queue")
        .update({
          status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
          last_error: String(err?.message || err).slice(0, 500),
        })
        .eq("id", item.id);
      failed++;
    }
  }

  return NextResponse.json({
    processed: queued.length,
    sent,
    failed,
    skipped,
  });
}

export async function POST(req: Request) {
  return GET(req);
}
