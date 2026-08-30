import { createServiceClient } from "@/lib/supabase/service";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { List } from "lucide-react";
import { PipelineBoard, type PipelineJob } from "@/components/shared/pipeline-board";

export const dynamic = "force-dynamic";

export default async function AdminPipelinePage() {
  await requireAdmin();

  const supabase = createServiceClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, property_address, stage, sub_status, permit_number, permit_eta, homeowner_name, contractor_id, updated_at"
    );

  const { data: contractors } = await supabase
    .from("contractors")
    .select("id, name, company_name");

  const contractorMap = new Map<string, string>(
    (contractors || []).map((c) => [
      c.id,
      c.company_name || c.name || "Contractor",
    ])
  );

  const pipelineJobs: PipelineJob[] = (jobs || []).map((j: any) => ({
    id: j.id,
    property_address: j.property_address,
    stage: j.stage,
    sub_status: j.sub_status,
    homeowner_name: j.homeowner_name,
    permit_number: j.permit_number,
    permit_eta: j.permit_eta,
    contractor_label: j.contractor_id ? contractorMap.get(j.contractor_id) : null,
    updated_at: j.updated_at,
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-semibold text-[#0B1F3F] dark:text-white">
              Majestic Permits Admin
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
            >
              <List className="h-4 w-4" />
              Table view
            </Link>
            <Link
              href="/admin/new"
              className="rounded-xl bg-[#0B1F3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152C56]"
            >
              + New Job
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-slate-500 hover:text-[#0B1F3F] dark:text-slate-400"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0B1F3F] dark:text-white">
            Pipeline
          </h1>
          <p className="mt-1 text-slate-500">
            Drag a job card between stages to bump it. Click a card to open the
            job.
          </p>
        </div>

        <PipelineBoard
          jobs={pipelineJobs}
          jobHref={(job) => `/admin/jobs/${job.id}`}
          updateHref={(id) => `/api/admin/jobs/${id}`}
          canDrag={true}
        />
      </main>
    </div>
  );
}
