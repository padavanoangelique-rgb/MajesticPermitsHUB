import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { PermitHeader } from "@/components/shared/permit-header";
import { TrackingLinkShare } from "@/components/contractor/tracking-link-share";
import { mapTrackingLinks } from "@/lib/tracking-links";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const supabase = createClient();

  const contractor = await getContractorForUser(user);

  // If no contractor record, show a friendly message
  if (!contractor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-[#0A0F1C]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#0B1F3F] dark:text-white">
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

  // Get this contractor's jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, property_address, stage, sub_status, permit_number, permit_eta, submitted_date, updated_at")
    .eq("contractor_id", contractor.id)
    .order("updated_at", { ascending: false });

  // Homeowner tracking links for those jobs (read-only for contractors).
  const jobIds = (jobs || []).map((j: any) => j.id);
  let trackingLinks: Record<string, { url: string | null; status: any }> = {};

  if (jobIds.length > 0) {
    const service = createServiceClient();
    const { data: links } = await service
      .from("homeowner_links")
      .select("job_id, token, enabled, expires_at")
      .in("job_id", jobIds);
    trackingLinks = mapTrackingLinks(links as any);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
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
              <p className="text-sm font-semibold text-[#0B1F3F] dark:text-white">
                {contractor.company_name || contractor.name}
              </p>
              <p className="text-xs text-slate-500">Contractor Portal</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-slate-500 hover:text-[#0B1F3F]">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-[#0B1F3F] dark:text-white">
          Your Projects
        </h1>
        <p className="mt-1 text-slate-500">
          {jobs?.length || 0} active project{(jobs?.length || 0) !== 1 ? "s" : ""}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {(jobs || []).map((job: any) => {
            const link = trackingLinks[job.id] || { url: null, status: "none" };

            return (
              <div
                key={job.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#0B1F3F]/30 hover:shadow-sm dark:border-slate-700 dark:bg-[#111827]"
              >
                <Link href={`/dashboard/projects/${job.id}`} className="block">
                  <p className="font-semibold text-[#0B1F3F] hover:underline dark:text-white">
                    {job.property_address}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {job.stage}
                    </span>
                    {job.sub_status && (
                      <span className="inline-flex rounded-full bg-[#0B1F3F]/5 px-2.5 py-1 text-xs font-medium text-[#0B1F3F] dark:bg-[#C9A24B]/15 dark:text-[#C9A24B]">
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

                <div className="mt-5 flex flex-1 flex-col justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
                  <TrackingLinkShare
                    url={link.url}
                    status={link.status}
                    compact
                  />
                  <Link
                    href={`/dashboard/projects/${job.id}`}
                    className="text-sm font-semibold text-[#0B1F3F] hover:underline dark:text-[#C9A24B]"
                  >
                    View project →
                  </Link>
                </div>
              </div>
            );
          })}

          {(!jobs || jobs.length === 0) && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#111827]">
              <p className="font-medium text-[#0B1F3F] dark:text-white">
                No projects assigned yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                As soon as Majestic Permits assigns a permit to your company, it
                will appear here with live status and inspection updates.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
