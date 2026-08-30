import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { PermitHeader } from "@/components/shared/permit-header";
import { DashboardViewSwitch } from "@/components/contractor/dashboard-view-switch";
import {
  PipelineBoard,
  type PipelineJob,
} from "@/components/shared/pipeline-board";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const user = await requireUser("/dashboard");
  const supabase = createClient();

  const contractor = await getContractorForUser(user);

  // If no contractor record, show a friendly message
  if (!contractor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-[#0A0F1C]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#156cdd] dark:text-white">
            Account not linked
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Your login works, but it is not yet linked to a contractor profile.
            Please contact Majestic Permits so we can connect your account.
          </p>
          <form action="/auth/signout" method="post" className="mt-8">
            <button className="text-sm text-slate-500 underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const view: "cards" | "pipeline" =
    searchParams.view === "pipeline" ? "pipeline" : "cards";

  // Get this contractor's jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, property_address, stage, sub_status, permit_number, permit_eta, submitted_date, updated_at"
    )
    .eq("contractor_id", contractor.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-512.png"
              alt="Majestic Permits"
              width={36}
              height={36}
              priority
              className="rounded-lg"
            />
            <div>
              <p className="text-sm font-semibold text-[#156cdd] dark:text-white">
                {contractor.company_name || contractor.name}
              </p>
              <p className="text-xs text-slate-500">Contractor Portal</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-slate-500 hover:text-[#156cdd]">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#156cdd] dark:text-white">
              Your Projects
            </h1>
            <p className="mt-1 text-slate-500">
              {jobs?.length || 0} active project{(jobs?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <DashboardViewSwitch view={view} />
        </div>

        {view === "pipeline" ? (
          <div className="mt-8">
            <PipelineBoard
              jobs={(jobs || []).map<PipelineJob>((j: any) => ({
                id: j.id,
                property_address: j.property_address,
                stage: j.stage,
                sub_status: j.sub_status,
                permit_number: j.permit_number,
                permit_eta: j.permit_eta,
                updated_at: j.updated_at,
              }))}
              jobHrefPrefix="/dashboard/projects"
              updateHrefTemplate="/api/contractor/jobs/{id}/stage"
              canDrag={true}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {(jobs || []).map((job: any) => (
              <Link
                key={job.id}
                href={`/dashboard/projects/${job.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#156cdd]/30 hover:shadow-sm dark:border-slate-700 dark:bg-[#111827]"
              >
                <p className="font-semibold text-[#156cdd] dark:text-white">
                  {job.property_address}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {job.stage}
                  </span>
                  {job.sub_status && (
                    <span className="inline-flex rounded-full bg-[#156cdd]/5 px-2.5 py-1 text-xs font-medium text-[#156cdd] dark:bg-[#e2ba00]/15 dark:text-[#e2ba00]">
                      {job.sub_status}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <PermitHeader
                    variant="compact"
                    permitNumber={job.permit_number}
                    submittedDate={job.submitted_date}
                    permitEta={job.permit_eta}
                  />
                </div>
              </Link>
            ))}

            {(!jobs || jobs.length === 0) && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#111827]">
                <p className="font-medium text-[#156cdd] dark:text-white">
                  No projects assigned yet
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  As soon as Majestic Permits assigns a permit to your company,
                  it will appear here with live status and inspection updates.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
