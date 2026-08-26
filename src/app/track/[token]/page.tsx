import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { PERMIT_STAGES, getStageByKey, getStageIndex } from "@/lib/stages";
import { StageStepper } from "@/components/homeowner/stage-stepper";
import { CurrentStageCard } from "@/components/homeowner/current-stage-card";
import { ActivityTimeline } from "@/components/homeowner/activity-timeline";
import { ContactCard } from "@/components/homeowner/contact-card";
import { BrandHeader } from "@/components/homeowner/brand-header";
import { format } from "date-fns";

interface PageProps {
  params: { token: string };
}

export default async function TrackPage({ params }: PageProps) {
  const { token } = params;

  if (!token || token.length < 16) {
    notFound();
  }

  const supabase = createServiceClient();

  // Use the secure function we created earlier, or fall back to direct query
  const { data: link } = await supabase
    .from("homeowner_links")
    .select("job_id, token, last_viewed_at")
    .eq("token", token)
    .maybeSingle();

  if (!link) {
    notFound();
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", link.job_id)
    .single();

  if (!job) {
    notFound();
  }

  // Update last viewed
  await supabase
    .from("homeowner_links")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("token", token);

  // Fetch documents that are customer-visible
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("job_id", job.id)
    .eq("is_customer_visible", true)
    .order("created_at", { ascending: false });

  // Map current stage (fallback to first stage if key doesn't match)
  const stageKey =
    job.stage?.toLowerCase().replace(/\s+/g, "_") || "getting_ready";
  const currentStage = getStageByKey(stageKey);
  const currentIndex = getStageIndex(currentStage.key);

  const brandName =
    job.brand === "The Permit Closer" ? "The Permit Closer" : "Majestic Permits";

  return (
    <div className="min-h-screen bg-surface-light dark:bg-background-dark">
      <BrandHeader brand={brandName} />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
        {/* Address + meta */}
        <div className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Project status
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy dark:text-white sm:text-4xl">
            {job.property_address}
          </h1>
          {job.permit_number && (
            <p className="mt-2 text-base text-muted-foreground">
              Permit #{job.permit_number}
            </p>
          )}
          {job.permit_eta && (
            <p className="mt-1 text-base font-medium text-gold">
              Estimated ready:{" "}
              {format(new Date(job.permit_eta), "MMMM d, yyyy")}
            </p>
          )}
        </div>

        {/* Visual stepper */}
        <div className="mb-12">
          <StageStepper
            stages={PERMIT_STAGES}
            currentIndex={currentIndex}
          />
        </div>

        {/* Big "You are here" card */}
        <CurrentStageCard
          stage={currentStage}
          stageNumber={currentIndex + 1}
          totalStages={PERMIT_STAGES.length}
          customNote={job.notes}
          nextStep={job.next_step}
          permitEta={job.permit_eta}
        />

        {/* Documents */}
        {documents && documents.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-semibold text-navy dark:text-white">
              Documents
            </h2>
            <ul className="space-y-2">
              {documents.map((doc: any) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-surface-dark"
                >
                  <span className="font-medium">{doc.file_name}</span>
                  <a
                    href={`/api/documents/${doc.id}`}
                    className="text-sm font-medium text-navy underline-offset-4 hover:underline dark:text-gold"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Activity / past updates */}
        <ActivityTimeline jobId={job.id} />

        {/* Contact */}
        <div className="mt-16">
          <ContactCard brand={brandName} />
        </div>
      </main>
    </div>
  );
}
