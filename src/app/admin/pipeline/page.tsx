import { createServiceClient } from "@/lib/supabase/service";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { List } from "lucide-react";
import { PipelineBoard, type PipelineJob } from "@/components/shared/pipeline-board";
import { ThemeToggle } from "@/components/layout/theme-toggle";

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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card dark:border-border dark:bg-card">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-semibold text-primary dark:text-white">
              Majestic Permits Admin
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:border-border dark:border-border dark:bg-card dark:text-foreground"
            >
              <List className="h-4 w-4" />
              Table view
            </Link>
            <Link
              href="/admin/new"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
            >
              + New Job
            </Link>
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-muted-foreground hover:text-primary dark:text-muted-foreground"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary dark:text-white">
            Pipeline
          </h1>
          <p className="mt-1 text-muted-foreground">
            Drag a job card between stages to bump it. Click a card to open the
            job.
          </p>
        </div>

        <PipelineBoard
          jobs={pipelineJobs}
          jobHrefPrefix="/admin/jobs"
          updateHrefTemplate="/api/admin/jobs/{id}"
          canDrag={true}
        />
      </main>
    </div>
  );
}
