import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { format } from "date-fns";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { UpdateStageForm } from "@/components/admin/update-stage-form";
import { SendQuoteForm } from "@/components/admin/send-quote-form";
import { AssignContractorForm } from "@/components/admin/assign-contractor-form";
import { SITE_URL } from "@/lib/email";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: PageProps) {
  await requireAdmin();

  const supabase = createServiceClient();

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

  const trackingUrl = link ? `${SITE_URL}/track/${link.token}` : null;

  const { data: contractors } = await supabase
    .from("contractors")
    .select("id, name, company_name")
    .order("company_name", { ascending: true });

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, amount, description, status, paid_at, created_at")
    .eq("job_id", job.id)
    .order("created_at", { ascending: false });

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


        {/* Assigned contractor */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#111827]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Assigned contractor
          </h2>
          <AssignContractorForm
            jobId={job.id}
            currentContractorId={job.contractor_id ?? null}
            contractors={contractors || []}
          />
        </div>

        {/* Quotes and invoices */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#111827]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Quotes &amp; payments
          </h2>

          {(quotes || []).length > 0 && (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
              {(quotes || []).map((q: any) => (
                <li key={q.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0B1F3F] dark:text-white">
                      ${Number(q.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    {q.description && (
                      <p className="text-xs text-slate-500">{q.description}</p>
                    )}
                  </div>
                  <span
                    className={
                      q.status === "Accepted"
                        ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    }
                  >
                    {q.status === "Accepted" ? "Paid" : q.status}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <SendQuoteForm jobId={job.id} />
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
