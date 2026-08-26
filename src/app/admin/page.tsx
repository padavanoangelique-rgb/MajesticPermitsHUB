import { createServiceClient } from "@/lib/supabase/service";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const supabase = createServiceClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, property_address, client_type, brand, stage, sub_status, permit_number, permit_eta, homeowner_name, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo subtitle="Admin" />

          <nav className="flex items-center gap-3">
            <Link
              href="/admin/inspections"
              className="text-sm font-medium text-slate-600 hover:text-[#0B1F3F] dark:text-slate-300"
            >
              Inspections
            </Link>
            <a
              href="/api/admin/report"
              className="text-sm font-medium text-slate-600 hover:text-[#0B1F3F] dark:text-slate-300"
            >
              Download report
            </a>
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

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-[#0B1F3F] dark:text-white">All Jobs</h1>
        <p className="mt-1 text-slate-500">{jobs?.length || 0} total</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#111827]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/50">
              <tr>
                <th className="px-5 py-3">Address</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3">Permit #</th>
                <th className="px-5 py-3">ETA</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(jobs || []).map((job: any) => (
                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-4">
                    <p className="font-medium text-[#0B1F3F] dark:text-white">
                      {job.property_address}
                    </p>
                    <p className="text-xs text-slate-500">{job.homeowner_name}</p>
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-600 dark:text-slate-300">
                    {job.client_type}
                    <span className="mt-0.5 block text-xs text-slate-400">{job.brand}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {job.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {job.permit_number || "—"}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {job.permit_eta
                      ? format(new Date(job.permit_eta), "MMM d, yyyy")
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="text-sm font-medium text-[#0B1F3F] hover:underline dark:text-[#C9A24B]"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {(!jobs || jobs.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No jobs yet. Create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
