import { createClient } from "@supabase/supabase-js";
import { PERMIT_STAGES } from "@/lib/stages";
import { StageStepper } from "@/components/homeowner/stage-stepper";
import { CurrentStageCard } from "@/components/homeowner/current-stage-card";
import { ContactCard } from "@/components/homeowner/contact-card";
import { BrandHeader } from "@/components/homeowner/brand-header";
import { RequestInspection } from "@/components/homeowner/request-inspection";
import { format } from "date-fns";

interface PageProps {
  params: { token: string };
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function TrackPage({ params }: PageProps) {
  const token = params.token;

  if (!token || token.length < 20) {
    return <InvalidLink />;
  }

  try {
    const supabase = getServiceClient();

    const { data: link, error: linkError } = await supabase
      .from("homeowner_links")
      .select("job_id, token")
      .eq("token", token)
      .maybeSingle();

    if (linkError || !link) {
      return <InvalidLink />;
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", link.job_id)
      .single();

    if (jobError || !job) {
      return <InvalidLink />;
    }

    // Update last viewed
    supabase
      .from("homeowner_links")
      .update({ last_viewed_at: new Date().toISOString() })
      .eq("token", token)
      .then(() => {});

    const stageText = (job.stage || "").toLowerCase();
    let currentIndex = 2;

    if (stageText.includes("ready") || stageText.includes("getting")) currentIndex = 0;
    else if (stageText.includes("submit")) currentIndex = 1;
    else if (stageText.includes("review")) currentIndex = 2;
    else if (stageText.includes("correct")) currentIndex = 3;
    else if (stageText.includes("approv")) currentIndex = 4;
    else if (stageText.includes("inspect")) currentIndex = 5;
    else if (stageText.includes("final")) currentIndex = 6;
    else if (stageText.includes("close") || stageText.includes("complete") || stageText.includes("done")) currentIndex = 7;

    const currentStage = PERMIT_STAGES[currentIndex];
    const brandName = job.brand === "The Permit Closer" ? "The Permit Closer" : "Majestic Permits";

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
        <BrandHeader brand={brandName} />

        <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
              Project status
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0B1F3F] dark:text-white sm:text-4xl">
              {job.property_address || "Your Project"}
            </h1>
            {job.permit_number && (
              <p className="mt-2 text-base text-slate-500">
                Permit #{job.permit_number}
              </p>
            )}
            {job.permit_eta && (
              <p className="mt-1 text-base font-medium text-[#C9A24B]">
                Estimated ready: {format(new Date(job.permit_eta), "MMMM d, yyyy")}
              </p>
            )}
          </div>

          <div className="mb-12">
            <StageStepper stages={PERMIT_STAGES} currentIndex={currentIndex} />
          </div>

          <CurrentStageCard
            stage={currentStage}
            stageNumber={currentIndex + 1}
            totalStages={PERMIT_STAGES.length}
            customNote={job.notes}
            nextStep={job.next_step}
            permitEta={job.permit_eta}
          />

          {/* Inspection request button */}
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
