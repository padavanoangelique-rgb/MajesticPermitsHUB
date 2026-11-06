import { createServiceClient } from "@/lib/supabase/service";
import { buildAdminListPdf, JobRow } from "@/lib/pdf";
import { PERMIT_STAGES, stageKeyFromTitle } from "@/lib/stages";
import { effectiveWorkStatus, getWorkStatus, permitApproved } from "@/lib/work-status";

/** Which jobs a report lists. */
export const REPORT_VIEWS = [
  { key: "all", label: "All open jobs", title: "Open jobs" },
  { key: "need_submit", label: "Need to submit", title: "Jobs to submit" },
  { key: "in_review", label: "In review", title: "Jobs in review" },
  { key: "approved", label: "Approved, install", title: "Approved jobs: install" },
  { key: "inspections", label: "Inspections", title: "Jobs in inspections" },
  { key: "noc", label: "NOCs to record", title: "NOCs to record" },
] as const;

export type ReportView = (typeof REPORT_VIEWS)[number]["key"];

export function isReportView(value: unknown): value is ReportView {
  return REPORT_VIEWS.some((view) => view.key === value);
}

const STAGE_SHORT = Object.fromEntries(PERMIT_STAGES.map((stage) => [stage.key, stage.short])) as Record<string, string>;

/**
 * The job's status as one line: where the permit is until it is approved, then where the work is. A permit that is
 * pending or submitted for its NOC says so. This is a column in the list, never a heading.
 */
export function jobStatusText(job: { stage?: string | null; work_status?: string | null; noc_status?: string | null }): string {
  const stageKey = stageKeyFromTitle(job.stage);
  const work = getWorkStatus(effectiveWorkStatus(stageKey, job.work_status));
  const base = permitApproved(stageKey) ? work?.label || "Approved" : STAGE_SHORT[stageKey] || job.stage || "-";
  const noc = job.noc_status === "Pending" || job.noc_status === "Submitted" ? ` - NOC ${job.noc_status.toLowerCase()}` : "";
  return base + noc;
}

/** Which report view a job belongs to. */
export function jobViewOf(job: { stage?: string | null; work_status?: string | null }): Exclude<ReportView, "all" | "noc"> {
  const stageKey = stageKeyFromTitle(job.stage);
  if (!permitApproved(stageKey)) return stageKey === "getting_ready" || !stageKey ? "need_submit" : "in_review";
  const work = effectiveWorkStatus(stageKey, job.work_status);
  return work === "install_ready" || work === "install_started" ? "approved" : "inspections";
}

/** In jurisdiction order, so one building department can be worked through at a time. No jurisdiction goes last. */
export function sortByJurisdiction<T extends { jurisdiction?: string | null; property_address?: string | null }>(rows: T[]): T[] {
  const key = (row: T) => (row.jurisdiction || "").trim().toLowerCase();
  return [...rows].sort((a, b) => {
    const ja = key(a);
    const jb = key(b);
    if (ja !== jb) return !ja ? 1 : !jb ? -1 : ja.localeCompare(jb);
    return (a.property_address || "").localeCompare(b.property_address || "", undefined, { numeric: true });
  });
}

export async function buildAdminReport(view: ReportView = "all"): Promise<{
  pdf: Uint8Array;
  totalOpen: number;
  nocsToRecord: JobRow[];
}> {
  const supabase = createServiceClient();

  const { data: jobsRaw, error } = await supabase
    .from("jobs")
    .select(
      "id, property_address, homeowner_name, stage, work_status, sub_status, next_step, permit_number, permit_eta, jurisdiction, building_dept_url, noc_status, contractor_id, updated_at"
    );

  if (error) throw new Error(error.message);

  const contractorIds = Array.from(new Set((jobsRaw || []).map((j: any) => j.contractor_id).filter((v: any) => v)));

  const contractorMap = new Map<string, string>();
  if (contractorIds.length > 0) {
    const { data: contractors } = await supabase.from("contractors").select("id, name, company_name").in("id", contractorIds);
    for (const c of contractors || []) {
      contractorMap.set(c.id, c.company_name || c.name || "(unnamed contractor)");
    }
  }

  // Open jobs only: a closed job is not on the list.
  const openJobs = (jobsRaw || []).filter((j: any) => stageKeyFromTitle(j.stage) !== "closed") as any[];

  const enriched = openJobs.map((j) => ({
    view: jobViewOf(j),
    row: {
      property_address: j.property_address,
      homeowner_name: j.homeowner_name,
      stage: j.stage,
      sub_status: j.sub_status,
      status_text: jobStatusText(j),
      next_step: j.next_step,
      permit_number: j.permit_number,
      permit_eta: j.permit_eta,
      jurisdiction: j.jurisdiction,
      building_dept_url: j.building_dept_url,
      noc_status: j.noc_status,
      contractor_company: j.contractor_id ? contractorMap.get(j.contractor_id) || "-" : "Homeowner-only",
    } as JobRow,
  }));

  const nocsToRecord = enriched.map((e) => e.row).filter((r) => r.noc_status === "Pending" || r.noc_status === "Submitted");

  const listed =
    view === "all"
      ? enriched.map((e) => e.row)
      : view === "noc"
        ? nocsToRecord
        : enriched.filter((e) => e.view === view).map((e) => e.row);

  const title = REPORT_VIEWS.find((v) => v.key === view)?.title || "Open jobs";
  const rows = sortByJurisdiction(listed);
  const pdf = await buildAdminListPdf({ title, rows, nocCount: view === "noc" ? 0 : nocsToRecord.length });

  return { pdf, totalOpen: enriched.length, nocsToRecord };
}
