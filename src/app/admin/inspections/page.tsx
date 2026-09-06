import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { format } from "date-fns";
import { MarkHandledButton } from "@/components/admin/mark-handled-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  InspectionsCalendar,
  type InspectionRequestRow,
} from "@/components/admin/inspections-calendar";

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
      requested_by_contractor_id,
      preferred_date,
      created_at,
      jobs (
        id,
        property_address,
        homeowner_name,
        contractor_id
      )
    `)
    .order("created_at", { ascending: false });

  const { data: contractors } = await supabase
    .from("contractors")
    .select("id, name, company_name, email");

  const contractorMap = new Map(
    (contractors || []).map((c) => [
      c.id,
      {
        name: c.company_name || c.name || "Contractor",
        email: c.email || null,
      },
    ])
  );

  const rows: InspectionRequestRow[] = (requests || []).map((r: any) => {
    const contractorId = r.requested_by_contractor_id || r.jobs?.contractor_id;
    const contractor = contractorId ? contractorMap.get(contractorId) : null;
    return {
      id: r.id,
      inspection_type: r.inspection_type,
      notes: r.notes,
      status: r.status,
      requested_by: r.requested_by,
      preferred_date: r.preferred_date,
      created_at: r.created_at,
      contractor_email: contractor?.email || null,
      contractor_name: contractor?.name || null,
      property_address: r.jobs?.property_address || null,
      homeowner_name: r.jobs?.homeowner_name || null,
      job_id: r.jobs?.id || null,
    };
  });

  const pending = rows.filter((r) => r.status === "Pending");
  const others = rows.filter((r) => r.status !== "Pending");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020202]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#090909]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-slate-500 hover:text-[#156cdd]">
              ← Jobs
            </Link>
            <p className="text-sm font-semibold text-[#156cdd] dark:text-[#b6ff2a]">
              Inspection Requests
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-[#156cdd] dark:text-[#b6ff2a]">
          Inspection calendar
        </h1>
        <p className="mt-1 text-slate-500">
          {pending.length} pending · click a request to mark scheduled and send a note back
        </p>

        <InspectionsCalendar requests={rows} />

        <h2 className="mt-12 text-lg font-semibold text-[#156cdd] dark:text-[#b6ff2a]">
          Pending queue
        </h2>
        <div className="mt-4 space-y-4">
          {pending.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#090909]">
              <p className="text-slate-500">No pending requests</p>
            </div>
          )}

          {pending.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#090909]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-[#156cdd] dark:text-[#b6ff2a]">
                    {req.property_address || "Unknown address"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {req.homeowner_name} · {req.contractor_name || req.requested_by} ·{" "}
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

        {others.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-slate-500">Previous</h2>
            <div className="mt-4 space-y-3">
              {others.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-100 bg-white/60 px-5 py-4 text-sm dark:border-slate-800 dark:bg-[#090909]/60"
                >
                  <span className="font-medium">{req.property_address}</span>
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
