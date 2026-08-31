import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { format } from "date-fns";
import { PERMIT_STAGES } from "@/lib/stages";
import { StageStepper } from "@/components/homeowner/stage-stepper";
import { PermitHeader } from "@/components/shared/permit-header";
import { DocDownload } from "@/components/contractor/doc-download";
import { InspectionRow } from "@/components/contractor/inspection-row";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import {
  nextInspectionLabel,
  nextInspectionReason,
} from "@/lib/next-inspection-day";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function ContractorProjectPage({ params }: PageProps) {
  const user = await requireUser(`/dashboard/projects/${params.id}`);
  const supabase = createClient();
  const service = createServiceClient();

  const contractor = await getContractorForUser(user);
  if (!contractor) redirect("/dashboard");

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .eq("contractor_id", contractor.id)
    .single();

  if (!job) notFound();

  const permitClosed = job.stage === "Permit closed — all done";
  const nextDayLabel = nextInspectionLabel();
  const nextDayReason = nextInspectionReason();

  // Contractor-visible inspections, docs, quotes/invoices
  const [{ data: inspections }, { data: docs }, { data: quotes }] =
    await Promise.all([
      service
        .from("job_inspections")
        .select(
          "id, slot, inspection_type, status, requested_date, scheduled_date, result_date, correction_notes"
        )
        .eq("job_id", job.id)
        .order("slot", { ascending: true }),
      service
        .from("job_documents")
        .select("id, category, label, file_name, created_at, visible_to_contractor")
        .eq("job_id", job.id)
        .eq("visible_to_contractor", true)
        .order("created_at", { ascending: false }),
      service
        .from("quotes")
        .select("id, amount, description, status, bill_to, paid_at, approved_at, declined_at, expires_at, approval_token, created_at, version")
        .eq("job_id", job.id)
        .in("bill_to", ["contractor", null as any])
        .order("created_at", { ascending: false }),
    ]);

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-[#156cdd]">
            ← All projects
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-[#156cdd] dark:text-white">
          {job.property_address}
        </h1>

        <div className="mt-4">
          <PermitHeader
            permitNumber={job.permit_number}
            submittedDate={job.submitted_date}
            permitEta={job.permit_eta}
          />
        </div>

        <div className="mt-10">
          <StageStepper stages={PERMIT_STAGES} currentIndex={currentIndex} />
        </div>

        <Section title="Current stage">
          <p className="text-xl font-semibold text-[#156cdd] dark:text-white">
            {job.stage}
          </p>
          {job.next_step && (
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              <span className="font-medium">Next: </span>
              {job.next_step}
            </p>
          )}
          {job.notes && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-sm font-medium text-slate-500">Notes</p>
              <p className="mt-1">{job.notes}</p>
            </div>
          )}
        </Section>

        <Section title="Inspections">
          {(inspections || []).length === 0 ? (
            <p className="text-sm text-slate-500">
              No inspections on file yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {(inspections || []).map((i: any) => (
                <InspectionRow
                  key={i.id}
                  jobId={job.id}
                  inspection={i}
                  nextDayLabel={nextDayLabel}
                  nextDayReason={nextDayReason}
                  permitClosed={permitClosed}
                />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Documents">
          {(docs || []).length === 0 ? (
            <p className="text-sm text-slate-500">No documents available yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {(docs || []).map((d: any) => (
                <li key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#156cdd] dark:text-white">
                      {d.label || d.file_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {categoryLabel(d.category)} ·{" "}
                      {format(new Date(d.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <DocDownload id={d.id} label="Download" />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Invoices & payments">
          {(quotes || []).length === 0 ? (
            <p className="text-sm text-slate-500">No invoices for this job.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {(quotes || []).map((q: any) => (
                <li key={q.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#156cdd] dark:text-white">
                      ${Number(q.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    {q.description && (
                      <p className="text-xs text-slate-500">{q.description}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {format(new Date(q.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={
                        q.paid_at || q.approved_at
                          ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : q.declined_at
                          ? "rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : q.expires_at && new Date(q.expires_at) < new Date()
                          ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      }
                    >
                      {q.paid_at
                        ? "Paid"
                        : q.approved_at
                        ? "Approved"
                        : q.declined_at
                        ? "Declined"
                        : q.expires_at && new Date(q.expires_at) < new Date()
                        ? "Expired"
                        : q.status}
                    </span>
                    {q.approval_token &&
                      !q.paid_at &&
                      !q.approved_at &&
                      !q.declined_at && (
                        <a
                          href={`/quote/${q.approval_token}`}
                          className="text-[11px] font-semibold text-[#156cdd] underline hover:opacity-80 dark:text-white"
                        >
                          Review &amp; approve
                        </a>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#111827]">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    intake: "Intake",
    submitted_package: "Submitted package",
    corrections: "Corrections",
    approved_permit: "Approved permit",
    inspections: "Inspections",
    closeout: "Closeout",
    other: "Other",
  };
  return map[cat] ?? cat;
}

