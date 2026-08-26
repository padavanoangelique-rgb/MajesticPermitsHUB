import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Find the contractor record linked to this auth user
  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, name, company_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

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
    .select("id, property_address, stage, sub_status, permit_number, permit_eta, updated_at")
    .eq("contractor_id", contractor.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B1F3F] text-sm font-bold text-white">
              M
            </div>
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
          {(jobs || []).map((job: any) => (
            <Link
              key={job.id}
              href={`/dashboard/projects/${job.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#0B1F3F]/30 hover:shadow-sm dark:border-slate-700 dark:bg-[#111827]"
            >
              <p className="font-semibold text-[#0B1F3F] dark:text-white">
                {job.property_address}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {job.stage}
                </span>
              </div>
              {job.permit_eta && (
                <p className="mt-3 text-sm text-[#C9A24B]">
                  ETA: {format(new Date(job.permit_eta), "MMM d, yyyy")}
                </p>
              )}
              {job.permit_number && (
                <p className="mt-1 text-sm text-slate-500">
                  Permit #{job.permit_number}
                </p>
              )}
            </Link>
          ))}

          {(!jobs || jobs.length === 0) && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#111827]">
              <p className="text-slate-500">
                No projects assigned yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
