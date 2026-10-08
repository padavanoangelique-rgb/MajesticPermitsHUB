/** Read-only aggregation of Majestic Hub data for the Commonwealth owner workspace. */

export type ContractorRow = {
  id: string;
  name: string | null;
  company_name: string | null;
  email: string | null;
  auth_user_id: string | null;
};
export type ContractorRecordRow = {
  contractor_id: string;
  license_number: string | null;
  license_expires: string | null;
  coi_carrier: string | null;
  coi_policy: string | null;
  coi_expires: string | null;
};
export type JobRow = {
  id: string;
  contractor_id: string | null;
  brand: string | null;
  property_address: string | null;
  permit_number: string | null;
  stage: string | null;
  sub_status: string | null;
  submitted_date: string | null;
  updated_at: string | null;
};
export type PublicLeadRow = { id: string; brand: string | null; status: string | null };
type DocumentStatus = "missing" | "expired" | "expiring" | "current";
const CLOSED_STAGE = "Permit closed — all done";
const PENDING_REQUEST = "Pending request";
const MAJESTIC_BRAND = "Majestic Permits";
const DAY_MS = 86400000;

function dateOnly(value: string | null | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = value.slice(0, 10);
  const millis = Date.parse(date + "T00:00:00.000Z");
  return Number.isFinite(millis) && new Date(millis).toISOString().slice(0, 10) === date ? date : null;
}
function calendarDaysSince(date: string | null | undefined, today: string): number | null {
  const d = dateOnly(date);
  if (!d) return null;
  return Math.floor((Date.parse(today + "T00:00:00Z") - Date.parse(d + "T00:00:00Z")) / DAY_MS);
}
function documentStatus(present: boolean, expires: string | null, today: string): DocumentStatus {
  const remaining = calendarDaysSince(expires, today);
  if (!present || remaining === null) return "missing";
  if (remaining > 0) return "expired";
  if (remaining >= -30) return "expiring";
  return "current";
}
function isMajesticJob(job: JobRow): boolean {
  // Unbranded legacy records are included; explicit PermitCloser records are not.
  return !job.brand || job.brand === MAJESTIC_BRAND;
}

export function summarizeMajesticOperations(
  input: {
    contractors: ContractorRow[];
    records: ContractorRecordRow[];
    jobs: JobRow[];
    leads: PublicLeadRow[];
  },
  asOf: Date = new Date(),
) {
  const today = asOf.toISOString().slice(0, 10);
  const recordById = new Map(input.records.map((r) => [r.contractor_id, r]));
  const jobs = input.jobs.filter(isMajesticJob);
  const jobsByContractor = new Map<string, JobRow[]>();
  for (const job of jobs) {
    if (!job.contractor_id) continue;
    const list = jobsByContractor.get(job.contractor_id) || [];
    list.push(job);
    jobsByContractor.set(job.contractor_id, list);
  }

  const contractors = input.contractors.map((c) => {
    const record = recordById.get(c.id);
    const license = documentStatus(Boolean(record?.license_number?.trim()), record?.license_expires ?? null, today);
    const insurance = documentStatus(
      Boolean(record?.coi_carrier?.trim() && record?.coi_policy?.trim()),
      record?.coi_expires ?? null,
      today
    );
    const portalLinked = Boolean(c.auth_user_id);
    const missingItems: string[] = [];
    if (!portalLinked) missingItems.push("Portal login not linked");
    if (license === "missing") missingItems.push("License information incomplete");
    if (license === "expired") missingItems.push("License expired");
    if (license === "expiring") missingItems.push("License expires within 30 days");
    if (insurance === "missing") missingItems.push("Insurance information incomplete");
    if (insurance === "expired") missingItems.push("Insurance expired");
    if (insurance === "expiring") missingItems.push("Insurance expires within 30 days");
    const theirJobs = jobsByContractor.get(c.id) || [];
    const profileReady = portalLinked &&
      (license === "current" || license === "expiring") &&
      (insurance === "current" || insurance === "expiring");
    return {
      id: c.id,
      name: c.company_name || c.name || "Unnamed contractor",
      email: c.email,
      portalLinked,
      license,
      insurance,
      profileReady,
      missingItems,
      activeJobs: theirJobs.filter((j) => j.stage !== CLOSED_STAGE).length,
      pendingRequests: theirJobs.filter((j) => j.sub_status === PENDING_REQUEST).length,
    };
  });
  contractors.sort((a, b) =>
    Number(Boolean(b.missingItems.length)) - Number(Boolean(a.missingItems.length)) ||
    a.name.localeCompare(b.name)
  );

  const attentionJobs = jobs
    .map((j) => {
      const daysWithoutUpdate = calendarDaysSince(j.updated_at, today);
      const pendingRequest = j.sub_status === PENDING_REQUEST;
      const corrections = j.stage === "Corrections requested";
      const inactive = j.stage !== CLOSED_STAGE && daysWithoutUpdate !== null && daysWithoutUpdate >= 7;
      if (!pendingRequest && !corrections && !inactive) return null;
      return {
        id: j.id,
        propertyAddress: j.property_address,
        permitNumber: j.permit_number,
        contractorId: j.contractor_id,
        stage: j.stage,
        subStatus: j.sub_status,
        daysWithoutUpdate,
        reasons: [
          ...(pendingRequest ? ["New contractor job request"] : []),
          ...(corrections ? ["Correction notice needs attention"] : []),
          ...(inactive ? ["No recorded update in 7+ days"] : []),
        ],
      };
    })
    .filter((j): j is NonNullable<typeof j> => j !== null)
    .sort((a, b) =>
      Number(b.reasons.includes("New contractor job request")) - Number(a.reasons.includes("New contractor job request")) ||
      Number(b.reasons.includes("Correction notice needs attention")) - Number(a.reasons.includes("Correction notice needs attention")) ||
      (b.daysWithoutUpdate ?? 0) - (a.daysWithoutUpdate ?? 0)
    );

  return {
    business: "majestic" as const,
    asOf: asOf.toISOString(),
    source: "MajesticPermitsHUB" as const,
    metrics: {
      contractors: contractors.length,
      contractorPortalsLinked: contractors.filter((c) => c.portalLinked).length,
      contractorProfilesReady: contractors.filter((c) => c.profileReady).length,
      contractorProfilesNeedingAttention: contractors.filter((c) => c.missingItems.length > 0).length,
      pendingContractorRequests: jobs.filter((j) => j.sub_status === PENDING_REQUEST).length,
      newMajesticLeads: input.leads.filter((l) => l.brand === MAJESTIC_BRAND && l.status?.toLowerCase() === "new").length,
      activeJobs: jobs.filter((j) => j.stage !== CLOSED_STAGE).length,
      submitted: jobs.filter((j) => j.stage === "Submitted to the city").length,
      underReview: jobs.filter((j) => j.stage === "Under review").length,
      corrections: jobs.filter((j) => j.stage === "Corrections requested").length,
      approvedReadyToBuild: jobs.filter((j) => j.stage === "Approved — ready to build").length,
      submissionsLast7Days: jobs.filter((j) => {
        const days = calendarDaysSince(j.submitted_date, today);
        return days !== null && days >= 0 && days <= 6;
      }).length,
      jobsWithoutUpdate7Days: jobs.filter((j) => {
        const days = calendarDaysSince(j.updated_at, today);
        return j.stage !== CLOSED_STAGE && days !== null && days >= 7;
      }).length,
    },
    contractors,
    attentionJobs: attentionJobs.slice(0, 50),
    attentionJobsTotal: attentionJobs.length,
    attentionJobsTruncated: attentionJobs.length > 50,
    links: {
      contractorFiles: "/admin/contractors",
      jobRequests: "/admin/job-requests",
      permits: "/admin",
      weeklyReport: "/api/admin/report",
    },
    limitations: [
      "Profile readiness reflects portal linkage, license and insurance only; not signed agreements or payment.",
      "No fee, revenue or payment statuses are reported; those require verified integrations.",
      "Unbranded legacy jobs are included, explicit PermitCloser jobs are excluded.",
    ],
  };
}
