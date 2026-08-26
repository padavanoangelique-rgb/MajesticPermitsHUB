import { writeFileSync } from "fs";
import { buildAdminWeeklyPdf, buildContractorWeeklyPdf } from "../src/lib/pdf.ts";

const jobs = [
  {
    property_address: "1420 W 60th St, Hialeah, FL 33012",
    homeowner_name: "Maria Gonzalez",
    stage: "Under review",
    sub_status: "In Review",
    next_step: "City reviewer assigned; waiting for first comment cycle",
    permit_number: "P-24-01821",
    permit_eta: new Date(Date.now() + 12 * 864e5).toISOString(),
    jurisdiction: "City of Hialeah",
    building_dept_url: "https://hialeahfl.gov/permits",
    noc_status: "Recorded",
    contractor_company: "Miami Windows LLC",
  },
  {
    property_address: "780 NW 42nd Ave, Miami, FL 33126",
    stage: "Corrections requested",
    sub_status: "Need to Submit",
    next_step: "Structural sheet needs updated wind-load table before resubmit",
    permit_eta: null,
    jurisdiction: "Miami-Dade County",
    building_dept_url: "https://www.miamidade.gov/permits",
    noc_status: "Pending",
    contractor_company: "Coral Roofing Co.",
  },
  {
    property_address: "2211 SW 8th St, Miami, FL 33135",
    stage: "Approved — ready to build",
    sub_status: "Approved and Printed",
    next_step: "Contractor to schedule tie-beam inspection",
    permit_number: "P-24-01903",
    permit_eta: new Date(Date.now() + 3 * 864e5).toISOString(),
    jurisdiction: "City of Miami",
    building_dept_url: "https://miamipermits.com",
    noc_status: "Submitted",
    contractor_company: "Padavano Contracting",
  },
];

const contractorPdf = await buildContractorWeeklyPdf({
  contractorName: "Miami Windows LLC",
  jobs,
});
writeFileSync("/tmp/preview-contractor.pdf", Buffer.from(contractorPdf));

const jobsByStage = {};
for (const j of jobs) (jobsByStage[j.stage] ||= []).push(j);
const nocs = jobs.filter((j) => j.noc_status === "Pending" || j.noc_status === "Submitted");
const adminPdf = await buildAdminWeeklyPdf({
  jobsByStage,
  stageOrder: [
    "Getting your project ready",
    "Submitted to the city",
    "Under review",
    "Corrections requested",
    "Approved — ready to build",
    "Inspections in progress",
    "Final inspection passed",
  ],
  totalOpen: jobs.length,
  nocsToRecord: nocs,
});
writeFileSync("/tmp/preview-admin.pdf", Buffer.from(adminPdf));
console.log("wrote /tmp/preview-contractor.pdf and /tmp/preview-admin.pdf");
