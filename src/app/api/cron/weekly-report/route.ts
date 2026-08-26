import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { getResend, FROM_EMAIL, weeklyReportEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CLOSED_STAGES = ["closed", "Permit closed — all done"];

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: contractors, error } = await supabase
    .from("contractors")
    .select("id, name, email, company_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resend = getResend();
  let sentCount = 0;
  const problems: string[] = [];

  for (const contractor of contractors || []) {
    if (!contractor.email) continue;

    const { data: jobs } = await supabase
      .from("jobs")
      .select("property_address, stage, sub_status, permit_eta")
      .eq("contractor_id", contractor.id)
      .order("updated_at", { ascending: false });

    const activeJobs = (jobs || []).filter(
      (j) => !CLOSED_STAGES.includes(j.stage)
    );

    // Do not email contractors who have nothing going on
    if (activeJobs.length === 0) continue;

    const { subject, html } = weeklyReportEmail({
      contractorName: contractor.company_name || contractor.name || "there",
      jobs: activeJobs,
    });

    const { error: sendError } = await resend.emails.send({
      from: `Majestic Permits <${FROM_EMAIL}>`,
      to: contractor.email,
      subject,
      html,
    });

    if (sendError) {
      problems.push(`${contractor.email}: ${sendError.message}`);
    } else {
      sentCount++;
    }
  }

  return NextResponse.json({ sent: sentCount, problems });
}

export async function POST(req: Request) {
  return GET(req);
}
