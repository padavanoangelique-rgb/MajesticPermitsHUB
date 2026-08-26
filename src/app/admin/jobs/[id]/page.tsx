import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { UpdateStageForm } from "@/components/admin/update-stage-form";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface PageProps {
  params: { id: string };
}

export default async function JobDetailPage({ params }: PageProps) {
  const supabase = getServiceClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Job not found</p>
      </div>
    );
  }

  const { data: link } = await supabase
    .from("homeowner_links")
    .select("token")
    .eq("job_id", job.id)
    .maybeSingle();

  const trackingUrl = link
    ? `https://majestic-permits-hub.vercel.app/track/${link.token}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-[#0B1F3F]">
            ← All jobs
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-[#0B1F3F] dark:text-white">
          {job.property_address}
        </h1>
        <p className="mt-1 text-slate-500">
          {job.homeowner_name} · {job.client_type} · {job.brand}
        </p>

        {/* Tracking link */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#111827]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Homeowner tracking link
          </h2>
          {trackingUrl ? (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                {trackingUrl}
              </code>
              <CopyLinkButton url={trackingUrl} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No tracking link yet.</p>
          )}
        </div>

        {/* Status */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#111827]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Current status
          </h2>
          <p className="mt-2 text-lg font-medium text-[#0B1F3F] dark:text-white">
            {job.stage} · {job.sub_status}
          </p>
          {job.permit_eta && (
            <p className="mt-1 text-sm text-[#C9A24B]">
              ETA: {format(new Date(job.permit_eta), "MMMM d, yyyy")}
            </p>
          )}

          <div className="mt-6">
            <UpdateStageForm jobId={job.id} currentStage={job.stage} currentSubStatus={job.sub_status} />
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#111827]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Details
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Permit #</dt>
              <dd className="font-medium">{job.permit_number || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Next step</dt>
              <dd className="font-medium text-right max-w-xs">{job.next_step || "—"}</dd>
            </div>
            {job.notes && (
              <div>
                <dt className="text-slate-500">Notes (visible to client)</dt>
                <dd className="mt-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">{job.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </main>
    </div>
  );
}
