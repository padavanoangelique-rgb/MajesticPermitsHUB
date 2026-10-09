import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { createServiceClient } from "@/lib/supabase/service";
import { canonicalStageTitle, inspectionsAllowed, PERMIT_STAGES } from "@/lib/stages";
import { PENDING_REQUEST_SUB, DECLINED_REQUEST_SUB } from "@/lib/job-request";

export const dynamic = "force-dynamic";

export default async function AdminOverview({ searchParams }: { searchParams: { embed?: string } }) {
  await requireAdmin();
  const db = createServiceClient();
  const embed = searchParams.embed === "1";
  const jobs: any[] = [];
  const inspections: any[] = [];
  let failed = false;
  for (let start = 0; ; start += 500) {
    const { data, error } = await db.from("jobs")
      .select("id, property_address, stage, sub_status, updated_at, contractor_id")
      .order("id").range(start, start + 499);
    if (error) { failed = true; break; }
    jobs.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  for (let start = 0; !failed; start += 500) {
    const { data, error } = await db.from("job_inspections")
      .select("id, job_id, inspection_type, status, requested_date, scheduled_date")
      .in("status", ["requested", "reinspection_requested", "scheduled", "reinspection_scheduled"])
      .order("id").range(start, start + 499);
    if (error) { failed = true; break; }
    inspections.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  const href = (path: string) => path + (embed ? (path.includes("?") ? "&embed=1" : "?embed=1") : "");
  if (failed) return <main className="p-6"><h1 className="text-2xl font-bold">Operations overview</h1><p role="alert" className="mt-4">The overview could not load. Refresh to try again.</p><Link href={href("/admin")} className="mt-4 inline-block text-primary">Open jobs</Link></main>;
  const accepted = jobs.filter(j => ![PENDING_REQUEST_SUB, DECLINED_REQUEST_SUB].includes(j.sub_status));
  const active = accepted.filter(j => canonicalStageTitle(j.stage) !== PERMIT_STAGES[7].title);
  const jobMap = new Map(jobs.map(j => [j.id, j]));
  const eligible = inspections.filter(i => inspectionsAllowed(jobMap.get(i.job_id)?.stage));
  const pending = jobs.filter(j => j.sub_status === PENDING_REQUEST_SUB);
  const corrections = active.filter(j => canonicalStageTitle(j.stage) === PERMIT_STAGES[3].title);
  const requested = eligible.filter(i => ["requested", "reinspection_requested"].includes(i.status));
  const scheduled = eligible.filter(i => ["scheduled", "reinspection_scheduled"].includes(i.status));
  const recent = [...accepted].sort((a,b) => (b.updated_at || "").localeCompare(a.updated_at || "")).slice(0,8);
  const metrics = [
    { label: "Active permit jobs", value: active.length, path: "/admin" },
    { label: "Job requests to review", value: pending.length, path: "/admin/job-requests" },
    { label: "Under city review", value: active.filter(j => [PERMIT_STAGES[1].title, PERMIT_STAGES[2].title].includes(canonicalStageTitle(j.stage) as any)).length, path: "/admin?stage=Under+review&stage=Submitted+to+the+city" },
    { label: "Corrections requested", value: corrections.length, path: "/admin?stage=Corrections+requested" },
    { label: "Inspections to schedule", value: requested.length, path: "/admin/inspections" },
    { label: "Scheduled inspections", value: scheduled.length, path: "/admin/inspections" },
  ];
  const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value.slice(0,10) + "T12:00:00Z")) : "Date not set";
  return <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Majestic Permits · Owner</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Operations overview</h1><p className="mt-2 text-sm text-muted-foreground">Live permit activity and the next actions for your team.</p></div>
        <Link href={href("/admin/new")} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Add job</Link>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Current activity">
        {metrics.map(m => <Link key={m.label} href={href(m.path)} className="rounded-2xl border border-border bg-card p-5 hover:border-primary"><p className="text-sm text-muted-foreground">{m.label}</p><p className="mt-2 text-3xl font-bold">{m.value}</p></Link>)}
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">Needs attention</h2>
          <div className="mt-4 space-y-3">
            {pending.length > 0 && <Link href={href("/admin/job-requests")} className="block rounded-xl bg-secondary p-3 text-sm">Review {pending.length} new job request{pending.length === 1 ? "" : "s"}</Link>}
            {corrections.slice(0,5).map(j => <Link key={j.id} href={href(`/admin/jobs/${j.id}`)} className="block rounded-xl bg-secondary p-3"><p className="text-sm font-medium">{j.property_address}</p><p className="mt-1 text-xs text-muted-foreground">City corrections requested</p></Link>)}
            {requested.length > 0 && <Link href={href("/admin/inspections")} className="block rounded-xl bg-secondary p-3 text-sm">Confirm dates for {requested.length} inspection request{requested.length === 1 ? "" : "s"}</Link>}
            {!pending.length && !corrections.length && !requested.length && <p className="text-sm text-muted-foreground">No pending requests or city corrections.</p>}
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">Inspection calendar</h2>
          <div className="mt-4 divide-y divide-border">
            {[...scheduled].sort((a,b)=>(a.scheduled_date || "9999").localeCompare(b.scheduled_date || "9999")).slice(0,5).map(i => <Link key={i.id} href={href(`/admin/jobs/${i.job_id}`)} className="block py-3"><p className="text-sm font-medium">{jobMap.get(i.job_id)?.property_address}</p><p className="mt-1 text-xs text-muted-foreground">{i.inspection_type || "Inspection"} · {dateLabel(i.scheduled_date)}</p></Link>)}
            {!scheduled.length && <p className="py-3 text-sm text-muted-foreground">No inspections currently scheduled.</p>}
          </div>
        </section>
      </div>
      <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Permit pipeline</h2><Link href={href("/admin/pipeline")} className="text-sm text-primary">Open pipeline</Link></div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{PERMIT_STAGES.map(s => <Link key={s.key} href={href(`/admin?stage=${encodeURIComponent(s.title)}`)} className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">{s.short}</p><p className="mt-1 text-xl font-semibold">{accepted.filter(j => canonicalStageTitle(j.stage) === s.title).length}</p></Link>)}</div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Recently updated jobs</h2><Link href={href("/admin")} className="text-sm text-primary">All jobs</Link></div>
        <ul className="mt-4 divide-y divide-border">{recent.map(j => <li key={j.id}><Link href={href(`/admin/jobs/${j.id}`)} className="flex flex-wrap justify-between gap-2 py-3"><span className="text-sm font-medium">{j.property_address}</span><span className="text-xs text-muted-foreground">{canonicalStageTitle(j.stage)} · {j.sub_status}</span></Link></li>)}</ul>
        {!recent.length && <p className="mt-4 text-sm text-muted-foreground">No accepted jobs yet.</p>}
      </section>
    </div>
  </main>;
}
