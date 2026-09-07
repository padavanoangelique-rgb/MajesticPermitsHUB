import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth-guard";
import { DECLINED_REQUEST_SUB, PENDING_REQUEST_SUB } from "@/lib/job-request";
import { getResend } from "@/lib/email";
import { FROM_REQUESTS, MAILBOX } from "@/lib/mailboxes";
import { sendSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "decline" ? "decline" : "approve";

    const supabase = createServiceClient();
    const { data: job, error } = await supabase
      .from("jobs")
      .select("id, sub_status, property_address, contractor_id")
      .eq("id", params.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!job) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (job.sub_status !== PENDING_REQUEST_SUB) {
      return NextResponse.json({ error: "Already handled" }, { status: 409 });
    }

    const { data: contractor } = job.contractor_id
      ? await supabase
          .from("contractors")
          .select("email, phone, name, company_name")
          .eq("id", job.contractor_id)
          .maybeSingle()
      : { data: null };

    if (action === "decline") {
      const { error: updErr } = await supabase
        .from("jobs")
        .update({
          sub_status: DECLINED_REQUEST_SUB,
          next_step: "Contractor request declined",
        })
        .eq("id", job.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
      return NextResponse.json({ ok: true, status: "declined" });
    }

    const { error: updErr } = await supabase
      .from("jobs")
      .update({
        sub_status: "Need to Submit",
        stage: "Getting your project ready",
        next_step: "Intake review of contractor documents",
      })
      .eq("id", job.id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    const address = job.property_address || "your project";
    if (contractor?.email && contractor.email.includes("@")) {
      try {
        await getResend().emails.send({
          from: FROM_REQUESTS,
          to: [contractor.email],
          cc: [MAILBOX.owner],
          replyTo: MAILBOX.requests,
          subject: `Job approved — ${address}`,
          html: `<p>Majestic approved your job request for <strong>${address}</strong>.</p>
            <p>It is now on your contractor dashboard. We will start intake from the documents you uploaded.</p>
            <p><a href="https://hub.majesticpermits.com/dashboard">Open Hub</a></p>`,
        });
      } catch (err) {
        console.error("approve job: contractor email failed", err);
      }
    }
    if (contractor?.phone) {
      await sendSms(
        contractor.phone,
        `Majestic approved ${address}. It is now live on your Hub dashboard.`
      );
    }

    return NextResponse.json({ ok: true, status: "approved", job_id: job.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 500 });
  }
}
