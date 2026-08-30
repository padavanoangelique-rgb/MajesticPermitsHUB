import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { format } from "date-fns";
import { MarkHandledButton } from "@/components/admin/mark-handled-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const dynamic = "force-dynamic";

export default async function InspectionsPage() {
  await requireAdmin();

  const supabase = createServiceClient();

  const { data: requests } = await supabase
    .from("inspection_requests")
    .select(`
      id,
      inspection_type,
      notes,
      status,
      requested_by,
      created_at,
      jobs (
        id,
        property_address,
        homeowner_name
      )
    `)
    .order("created_at", { ascending: false });

  const pending = (requests || []).filter((r: any) => r.status === "Pending");
  const others = (requests || []).filter((r: any) => r.status !== "Pending");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-slate-500 hover:text-[#0B1F3F]">
              ← Jobs
            </Link>
            <p className="text-sm font-semibold text-[#0B1F3F] dark:text-white">
              Inspection Requests
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-[#0B1F3F] dark:text-white">
          Inspection Requests
        </h1>
        <p className="mt-1 text-slate-500">
          {pending.length} pending
        </p>

        {/* Pending */}
        <div className="mt-8 space-y-4">
          {pending.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#111827]">
              <p className="text-slate-500">No pending requests</p>
            </div>
          )}

          {pending.map((req: any) => (
            <div
              key={req.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#111827]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-[#0B1F3F] dark:text-white">
                    {req.jobs?.property_address || "Unknown address"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {req.jobs?.homeowner_name} · {req.requested_by} ·{" "}
                    {format(new Date(req.created_at), "MMM d, yyyy h:mm a")}
                  </p>
                  <p className="mt-3">
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      {req.inspection_type}
                    </span>
                  </p>
                  {req.notes && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      {req.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <MarkHandledButton id={req.id} status="Scheduled" label="Mark Scheduled" />
                  <MarkHandledButton id={req.id} status="Dismissed" label="Dismiss" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Previous */}
        {others.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-slate-500">Previous</h2>
            <div className="mt-4 space-y-3">
              {others.map((req: any) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-100 bg-white/60 px-5 py-4 text-sm dark:border-slate-800 dark:bg-[#111827]/60"
                >
                  <span className="font-medium">{req.jobs?.property_address}</span>
                  <span className="mx-2 text-slate-400">·</span>
                  <span>{req.inspection_type}</span>
                  <span className="mx-2 text-slate-400">·</span>
                  <span className="capitalize text-slate-500">{req.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
