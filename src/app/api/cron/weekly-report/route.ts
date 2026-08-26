import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { getResend, FROM_EMAIL, weeklyReportEmail } from "@/lib/email";
import { buildContractorWeeklyPdf, JobRow } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CLOSED_STAGES = ["closed", "Permit closed — all done"];

/** Weekly Monday digest for each contractor, with a PDF attached. */
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
  let sent = 0;
  const problems: string[] = [];

  for (const contractor of contractors || []) {
    if (!contractor.email) continue;

    const { data: jobs } = await supabase
      .from("jobs")
      .select(
        "property_address, homeowner_name, stage, sub_status, next_step, permit_number, permit_eta, jurisdiction, building_dept_url"
      )
      .eq("contractor_id", contractor.id)
      .order("updated_at", { ascending: false });

    const openJobs = (jobs || []).filter(
      (j) => !CLOSED_STAGES.includes(j.stage || "")
    ) as JobRow[];

    if (openJobs.length === 0) continue;

    const contractorName =
      contractor.company_name || contractor.name || "there";

    const { subject, html } = weeklyReportEmail({
      contractorName,
      jobs: openJobs.map((j) => ({
        property_address: j.property_address,
        stage: j.stage || "Getting your project ready",
        sub_status: j.sub_status,
        permit_eta: j.permit_eta,
      })),
    });

    let pdfBase64: string;
    try {
      const pdf = await buildContractorWeeklyPdf({
        contractorName,
        jobs: openJobs,
      });
      pdfBase64 = Buffer.from(pdf).toString("base64");
    } catch (err: any) {
      problems.push(`${contractor.email}: pdf build failed — ${err.message}`);
      continue;
    }

    const filename = `majestic-permits-weekly-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

    const { error: sendError } = await resend.emails.send({
      from: `Majestic Permits <${FROM_EMAIL}>`,
      to: contractor.email,
      subject,
      html,
      attachments: [{ filename, content: pdfBase64 }],
    });

    if (sendError) {
      problems.push(`${contractor.email}: ${sendError.message}`);
    } else {
      sent++;
    }
  }

  return NextResponse.json({ sent, problems });
}

export async function POST(req: Request) {
  return GET(req);
}
