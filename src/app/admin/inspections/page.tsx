import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth-guard";
import { MarkHandledButton } from "@/components/admin/mark-handled-button";
import {
  InspectionsCalendar,
  type InspectionRequestRow,
} from "@/components/admin/inspections-calendar";

export const dynamic = "force-dynamic";

export default async function InspectionsPage({
  searchParams,
}: {
  searchParams: { embed?: string };
}) {
  await requireAdmin();
  const embed = searchParams?.embed === "1";
  const supabase = createServiceClient();

  const { data: requests } = await supabase
    .from("inspection_requests")
    .select(
      "id, job_id, inspection_type, notes, status, requested_by, requested_by_contractor_id, preferred_date, created_at"
    )
    .order("created_at", { ascending: false });

  const { data: slots } = await supabase
    .from("job_inspections")
    .select("id, job_id, inspection_type, status, requested_date, scheduled_date")
    .in("status", [
      "requested",
      "reinspection_requested",
      "scheduled",
      "reinspection_scheduled",
    ]);

  const { data: notices } = await supabase
    .from("admin_notifications")
    .select("id, job_id, type, message, created_at")
    .eq("type", "inspection_needed")
    .order("created_at", { ascending: false })
    .limit(50);

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

  const jobIds = new Set<string>();
  for (const r of requests || []) if (r.job_id) jobIds.add(r.job_id);
  for (const s of slots || []) if ((s as any).job_id) jobIds.add((s as any).job_id);
  for (const n of notices || []) if (n.job_id) jobIds.add(n.job_id);

  const { data: jobs } = jobIds.size
    ? await supabase
        .from("jobs")
        .select("id, property_address, homeowner_name, contractor_id")
        .in("id", Array.from(jobIds))
    : { data: [] as any[] };

  const jobMap = new Map((jobs || []).map((j: any) => [j.id, j]));

  const rows: InspectionRequestRow[] = [];
  const seen = new Set<string>();

  for (const r of requests || []) {
    const job = r.job_id ? jobMap.get(r.job_id) : null;
    const contractorId = r.requested_by_contractor_id || job?.contractor_id;
    const contractor = contractorId ? contractorMap.get(contractorId) : null;
    seen.add(`${r.job_id || ""}|${String(r.inspection_type || "").toLowerCase()}`);
    rows.push({
      id: r.id,
      inspection_type: r.inspection_type,
      notes: r.notes,
      status: r.status,
      requested_by: r.requested_by,
      preferred_date: r.preferred_date,
      created_at: r.created_at,
      contractor_email: contractor?.email || null,
      contractor_name: contractor?.name || null,
      property_address: job?.property_address || null,
      homeowner_name: job?.homeowner_name || null,
      job_id: r.job_id || job?.id || null,
    });
  }

  for (const slot of slots || []) {
    const s = slot as any;
    const key = `${s.job_id || ""}|${String(s.inspection_type || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const job = s.job_id ? jobMap.get(s.job_id) : null;
    const contractor = job?.contractor_id ? contractorMap.get(job.contractor_id) : null;
    const status = String(s.status || "");
    rows.push({
      id: `slot-${s.id}`,
      inspection_type: s.inspection_type,
      notes: null,
      status: status.includes("scheduled") ? "Scheduled" : "Pending",
      requested_by: "contractor",
      preferred_date: s.scheduled_date || s.requested_date || null,
      created_at: new Date().toISOString(),
      contractor_email: contractor?.email || null,
      contractor_name: contractor?.name || null,
      property_address: job?.property_address || null,
      homeowner_name: job?.homeowner_name || null,
      job_id: s.job_id || null,
    });
  }

  for (const n of notices || []) {
    if (!n.job_id) continue;
    const already = rows.some((r) => r.job_id === n.job_id);
    if (already) continue;
    const job = jobMap.get(n.job_id);
    const contractor = job?.contractor_id ? contractorMap.get(job.contractor_id) : null;
    rows.push({
      id: `notice-${n.id}`,
      inspection_type: "Inspection request",
      notes: n.message,
      status: "Pending",
      requested_by: "contractor",
      preferred_date: String(n.created_at || "").slice(0, 10),
      created_at: n.created_at,
      contractor_email: contractor?.email || null,
      contractor_name: contractor?.name || null,
      property_address: job?.property_address || n.message,
      homeowner_name: job?.homeowner_name || null,
      job_id: n.job_id,
    });
  }

  const pending = rows.filter((r) => {
    const s = String(r.status || "").toLowerCase();
    return ["pending", "requested", "reinspection_requested"].includes(s);
  });
  const scheduled = rows.filter((r) => {
    const s = String(r.status || "").toLowerCase();
    return ["scheduled", "reinspection_scheduled"].includes(s);
  });
  const done = rows.filter((r) => !pending.includes(r) && !scheduled.includes(r));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020202]">
      <main className={embed ? "px-4 py-6 sm:px-6" : "mx-auto max-w-6xl px-4 py-10 sm:px-6"}>
        <h1 className="text-2xl font-bold text-[#156cdd] dark:text-[#b6ff2a]">
          Inspection calendar
        </h1>
        <p className="mt-1 text-slate-500">
          {pending.length} pending · {scheduled.length} scheduled · record pass/fail to close
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
            <div key={req.id} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#090909]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-[#156cdd] dark:text-[#b6ff2a]">
                    {req.property_address || "Unknown address"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {req.homeowner_name} · {req.contractor_name || req.requested_by}
                    {req.preferred_date ? ` · ${String(req.preferred_date).slice(0, 10)}` : ""}
                  </p>
                  <p className="mt-3">
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                      {req.inspection_type}
                    </span>
                  </p>
                  {req.notes && <p className="mt-3 text-sm text-slate-600">{req.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <MarkHandledButton
                    id={req.id}
                    status="Scheduled"
                    label="Schedule + notify"
                    preferredDate={req.preferred_date}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-lg font-semibold text-[#156cdd] dark:text-[#b6ff2a]">
          Scheduled — waiting on result
        </h2>
        <div className="mt-4 space-y-4">
          {scheduled.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-[#090909]">
              <p className="text-slate-500">Nothing on the calendar waiting for a result</p>
            </div>
          )}
          {scheduled.map((req) => (
            <div key={req.id} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#090909]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-[#156cdd] dark:text-[#b6ff2a]">
                    {req.property_address || "Unknown address"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {req.inspection_type}
                    {req.preferred_date ? ` · ${req.preferred_date}` : ""}
                    {" · "}{req.contractor_name || req.requested_by}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MarkHandledButton id={req.id} status="Passed" label="Passed" preferredDate={req.preferred_date} />
                  <MarkHandledButton id={req.id} status="Partial" label="Partial" preferredDate={req.preferred_date} />
                  <MarkHandledButton id={req.id} status="Failed" label="Failed" preferredDate={req.preferred_date} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {done.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-slate-500">Results</h2>
            <div className="mt-4 space-y-3">
              {done.map((req) => (
                <div key={req.id} className="rounded-xl border border-slate-100 bg-white/60 px-5 py-4 text-sm dark:border-slate-800 dark:bg-[#090909]/60">
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
