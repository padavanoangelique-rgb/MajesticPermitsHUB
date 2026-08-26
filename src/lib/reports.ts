import { createServiceClient } from "@/lib/supabase/service";
import { buildAdminWeeklyPdf, JobRow } from "@/lib/pdf";
import { PERMIT_STAGES } from "@/lib/stages";

const CLOSED_STAGE_TITLES = new Set(["Permit closed — all done"]);

/** Stage-title order pulled straight from the app's stage definitions. */
const STAGE_ORDER: string[] = PERMIT_STAGES.map((s) => s.title);

export async function buildAdminReport(): Promise<{
  pdf: Uint8Array;
  totalOpen: number;
  nocsToRecord: JobRow[];
}> {
  const supabase = createServiceClient();

  const { data: jobsRaw, error } = await supabase
    .from("jobs")
    .select(
      "id, property_address, homeowner_name, stage, sub_status, next_step, permit_number, permit_eta, jurisdiction, building_dept_url, noc_status, contractor_id, updated_at"
    )
    .order("permit_eta", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);

  const contractorIds = Array.from(
    new Set(
      (jobsRaw || [])
        .map((j: any) => j.contractor_id)
        .filter((v: any) => v)
    )
  );

  const contractorMap = new Map<string, string>();
  if (contractorIds.length > 0) {
    const { data: contractors } = await supabase
      .from("contractors")
      .select("id, name, company_name")
      .in("id", contractorIds);
    for (const c of contractors || []) {
      contractorMap.set(
        c.id,
        c.company_name || c.name || "(unnamed contractor)"
      );
    }
  }

  // Open (non-closed) jobs only
  const openJobs = (jobsRaw || []).filter(
    (j: any) => !CLOSED_STAGE_TITLES.has(j.stage || "")
  ) as any[];

  const enriched: JobRow[] = openJobs.map((j) => ({
    property_address: j.property_address,
    homeowner_name: j.homeowner_name,
    stage: j.stage,
    sub_status: j.sub_status,
    next_step: j.next_step,
    permit_number: j.permit_number,
    permit_eta: j.permit_eta,
    jurisdiction: j.jurisdiction,
    building_dept_url: j.building_dept_url,
    noc_status: j.noc_status,
    contractor_company: j.contractor_id
      ? contractorMap.get(j.contractor_id) || "—"
      : "Homeowner-only",
  }));

  const jobsByStage: Record<string, JobRow[]> = {};
  for (const j of enriched) {
    const stage = j.stage || "Uncategorized";
    (jobsByStage[stage] ||= []).push(j);
  }

  // Any stage not in the canonical order (typo / legacy) still gets a section
  const stageOrder: string[] = [
    ...STAGE_ORDER.filter((s) => jobsByStage[s]?.length),
    ...Object.keys(jobsByStage).filter((s) => !STAGE_ORDER.includes(s as any)),
  ];

  const nocsToRecord = enriched.filter(
    (j) => j.noc_status === "Pending" || j.noc_status === "Submitted"
  );

  const pdf = await buildAdminWeeklyPdf({
    jobsByStage,
    stageOrder,
    totalOpen: enriched.length,
    nocsToRecord,
  });

  return { pdf, totalOpen: enriched.length, nocsToRecord };
}
