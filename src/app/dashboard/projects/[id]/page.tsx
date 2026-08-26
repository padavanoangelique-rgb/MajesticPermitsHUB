import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { PERMIT_STAGES } from "@/lib/stages";
import { StageStepper } from "@/components/homeowner/stage-stepper";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function ContractorProjectPage({ params }: PageProps) {
  const user = await requireUser(`/dashboard/projects/${params.id}`);
  const supabase = createClient();

  const contractor = await getContractorForUser(user);

  if (!contractor) redirect("/dashboard");

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .eq("contractor_id", contractor.id)
    .single();

  if (!job) notFound();

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-[#0B1F3F]">
            ← All projects
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-[#0B1F3F] dark:text-white">
          {job.property_address}
        </h1>
        {job.permit_number && (
          <p className="mt-1 text-slate-500">Permit #{job.permit_number}</p>
        )}
        {job.permit_eta && (
          <p className="mt-1 font-medium text-[#C9A24B]">
            ETA: {format(new Date(job.permit_eta), "MMMM d, yyyy")}
          </p>
        )}

        <div className="mt-10">
          <StageStepper stages={PERMIT_STAGES} currentIndex={currentIndex} />
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#111827]">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Current stage
          </p>
          <p className="mt-2 text-xl font-semibold text-[#0B1F3F] dark:text-white">
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
        </div>
      </main>
    </div>
  );
}
