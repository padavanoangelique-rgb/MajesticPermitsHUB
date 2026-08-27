import { createServiceClient } from "@/lib/supabase/service";
import { PERMIT_STAGES } from "@/lib/stages";
import { StageStepper } from "@/components/homeowner/stage-stepper";
import { CurrentStageCard } from "@/components/homeowner/current-stage-card";
import { ContactCard } from "@/components/homeowner/contact-card";
import { BrandHeader } from "@/components/homeowner/brand-header";
import { RequestInspection } from "@/components/homeowner/request-inspection";
import { PermitHeader } from "@/components/shared/permit-header";
import { format } from "date-fns";

interface PageProps {
  params: { token: string };
}

export const dynamic = "force-dynamic";

const INSPECTION_STATUS_LABEL: Record<string, string> = {
  not_required: "Not required",
  not_requested: "Not requested",
  requested: "Requested",
  scheduled: "Scheduled",
  passed: "Passed",
  partial_pass: "Partial pass",
  failed: "Follow-up needed",
  reinspection_requested: "Follow-up requested",
  reinspection_scheduled: "Follow-up scheduled",
  cancelled: "Cancelled",
  closed: "Closed",
};

export default async function TrackPage({ params }: PageProps) {
  const token = params.token;

  if (!token || token.length < 20) {
    return <InvalidLink />;
  }

  try {
    const supabase = createServiceClient();

    const { data: link, error: linkError } = await supabase
      .from("homeowner_links")
      .select("job_id, token, enabled, expires_at, view_count")
      .eq("token", token)
      .maybeSingle();

    if (linkError || !link) return <InvalidLink />;
    if (link.enabled === false) return <DisabledLink />;
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return <DisabledLink />;
    }

    // Homeowner-safe column list only.
    // Do NOT select notes, internal_notes, or contract_value — those can
    // contain fees, contractor billing detail, or internal wording.
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(
        "id, brand, property_address, homeowner_name, trade_type, permit_number, jurisdiction, stage, sub_status, next_step, homeowner_note, submitted_date, approved_date, permit_eta, building_dept_url"
      )
      .eq("id", link.job_id)
      .single();

    if (jobError || !job) return <InvalidLink />;

    // Update view metadata (fire and forget)
    supabase
      .from("homeowner_links")
      .update({
        last_viewed_at: new Date().toISOString(),
        view_count: (link.view_count ?? 0) + 1,
      })
      .eq("token", token)
      .then(() => {});

    // Homeowner-visible inspections and documents
    const { data: inspections } = await supabase
      .from("job_inspections")
      .select("slot, inspection_type, status, scheduled_date, result_date")
      .eq("job_id", job.id)
      .eq("visible_to_homeowner", true)
      .order("slot", { ascending: true });

    const { data: sharedDocs } = await supabase
      .from("job_documents")
      .select("id, category, label, file_name")
      .eq("job_id", job.id)
      .eq("visible_to_homeowner", true)
      .order("created_at", { ascending: false });

    const stageText = (job.stage || "").toLowerCase();
    let currentIndex = 2;
    if (stageText.includes("ready") || stageText.includes("getting")) currentIndex = 0;
    else if (stageText.includes("submit")) currentIndex = 1;
    else if (stageText.includes("review")) currentIndex = 2;
    else if (stageText.includes("correct")) currentIndex = 3;
    else if (stageText.includes("approv")) currentIndex = 4;
    else if (stageText.includes("inspect")) currentIndex = 5;
    else if (stageText.includes("final")) currentIndex = 6;
    else if (stageText.includes("close") || stageText.includes("complete") || stageText.includes("done"))
      currentIndex = 7;

    const currentStage = PERMIT_STAGES[currentIndex];
    const brandName =
      job.brand === "The Permit Closer" ? "The Permit Closer" : "Majestic Permits";

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
        <BrandHeader brand={brandName} />

        <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
          <div className="mb-8 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
              Project status
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0B1F3F] dark:text-white sm:text-4xl">
              {job.property_address || "Your Project"}
            </h1>
          </div>

          <PermitHeader
            permitNumber={job.permit_number}
            submittedDate={job.submitted_date}
            permitEta={job.permit_eta}
          />

          <div className="mt-10 mb-12">
            <StageStepper stages={PERMIT_STAGES} currentIndex={currentIndex} />
          </div>

          <CurrentStageCard
            stage={currentStage}
            stageNumber={currentIndex + 1}
            totalStages={PERMIT_STAGES.length}
            customNote={job.homeowner_note}
            nextStep={job.next_step}
            permitEta={job.permit_eta}
          />

          {inspections && inspections.length > 0 && (
            <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#111827]">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Inspections
              </h2>
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
                {inspections.map((i: any) => (
                  <li
                    key={i.slot}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0B1F3F] dark:text-white">
                        {i.inspection_type || `Inspection ${i.slot}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {i.scheduled_date
                          ? `Scheduled ${format(new Date(i.scheduled_date), "MMM d, yyyy")}`
                          : i.result_date
                            ? format(new Date(i.result_date), "MMM d, yyyy")
                            : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {INSPECTION_STATUS_LABEL[i.status] ?? i.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sharedDocs && sharedDocs.length > 0 && (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#111827]">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Documents
              </h2>
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
                {sharedDocs.map((d: any) => (
                  <li key={d.id} className="py-3">
                    <a
                      href={`/api/track/${token}/documents/${d.id}`}
                      className="text-sm font-medium text-[#0B1F3F] hover:underline dark:text-white"
                    >
                      {d.label || d.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <RequestInspection jobId={job.id} token={token} />

          <div className="mt-16">
            <ContactCard brand={brandName} />
          </div>
        </main>
      </div>
    );
  } catch (err) {
    console.error("Track page error:", err);
    return <InvalidLink />;
  }
}

function InvalidLink() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-[#0A0F1C]">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-[#0B1F3F] dark:text-white">
          This link isn&apos;t valid
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          The tracking link you used may have expired or been typed incorrectly.
          Please contact Majestic Permits for a new link.
        </p>
        <a
          href="mailto:hello@majesticpermits.com"
          className="mt-8 inline-flex rounded-2xl bg-[#0B1F3F] px-6 py-3 text-sm font-semibold text-white"
        >
          Email us
        </a>
      </div>
    </div>
  );
}

function DisabledLink() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-[#0A0F1C]">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-[#0B1F3F] dark:text-white">
          Sharing has been paused
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          The person who shared this link has turned off homeowner access for
          the moment. Please reach out to your contractor or Majestic Permits
          for the latest status.
        </p>
      </div>
    </div>
  );
}
