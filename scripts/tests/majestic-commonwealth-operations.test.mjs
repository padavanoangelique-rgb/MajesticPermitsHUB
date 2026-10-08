import test from "node:test";
import assert from "node:assert/strict";
import { summarizeMajesticOperations } from "../../src/lib/majestic-commonwealth-operations.ts";

const clock = new Date("2026-10-08T12:00:00Z");
const c = (override = {}) => ({
  id: "c1", name: "Jane", company_name: "Coastal Windows", email: "contact@example.test",
  auth_user_id: "u1", ...override,
});
const rec = (override = {}) => ({
  contractor_id: "c1", license_number: "LIC1", license_expires: "2027-01-01",
  coi_carrier: "Insurer", coi_policy: "P1", coi_expires: "2027-01-01", ...override,
});
const j = (override = {}) => ({
  id: "j1", contractor_id: "c1", brand: "Majestic Permits", property_address: "123 Test St",
  permit_number: "P123", stage: "Under review", sub_status: "In Review",
  submitted_date: "2026-10-05", updated_at: "2026-10-07T15:00:00Z", ...override,
});
const report = (partial) =>
  summarizeMajesticOperations({ contractors: [], records: [], jobs: [], leads: [], ...partial }, clock);

test("shows actual Majestic counts but never invents fees or revenue", () => {
  const result = report({
    contractors: [c()], records: [rec()], jobs: [j()],
    leads: [{ id: "l1", brand: "Majestic Permits", status: "New" }],
  });
  assert.equal(result.metrics.contractorProfilesReady, 1);
  assert.equal(result.metrics.activeJobs, 1);
  assert.equal(result.metrics.underReview, 1);
  assert.equal(result.metrics.submissionsLast7Days, 1);
  assert.equal(result.metrics.newMajesticLeads, 1);
  assert.equal("revenue" in result.metrics, false);
  assert.equal("fees" in result.metrics, false);
});

test("keeps PermitCloser separate and preserves unbranded legacy jobs", () => {
  const result = report({
    jobs: [j({ id: "closer", brand: "The Permit Closer" }), j({ id: "legacy", brand: null, stage: "Corrections requested" })],
    leads: [{ id: "l2", brand: "The Permit Closer", status: "New" }],
  });
  assert.equal(result.metrics.activeJobs, 1);
  assert.equal(result.metrics.corrections, 1);
  assert.equal(result.metrics.newMajesticLeads, 0);
});

test("flags incomplete portal and document records, and upcoming expirations", () => {
  const result = report({
    contractors: [c({ id: "c1", auth_user_id: null }), c({ id: "c2", company_name: "Second", auth_user_id: "u2" })],
    records: [rec({ contractor_id: "c2", license_expires: "2026-10-08" })],
  });
  assert.equal(result.metrics.contractorPortalsLinked, 1);
  assert.equal(result.metrics.contractorProfilesNeedingAttention, 2);
  assert.equal(result.contractors.find((x) => x.id === "c2").license, "expiring");
  assert.equal(result.contractors.find((x) => x.id === "c2").profileReady, true);
  assert.ok(result.contractors.find((x) => x.id === "c1").missingItems.includes("Portal login not linked"));
});

test("uses the actual contractor job-request status and orders attention items", () => {
  const result = report({
    jobs: [
      j({ id: "request", sub_status: "Pending request", updated_at: "2026-10-08" }),
      j({ id: "correction", stage: "Corrections requested", updated_at: "2026-09-28" }),
      j({ id: "closed", stage: "Permit closed — all done", updated_at: "2025-01-01" }),
    ],
  });
  assert.equal(result.metrics.pendingContractorRequests, 1);
  assert.equal(result.metrics.activeJobs, 2);
  assert.equal(result.metrics.jobsWithoutUpdate7Days, 1);
  assert.equal(result.attentionJobs[0].id, "request");
  assert.ok(result.attentionJobs[1].reasons.includes("No recorded update in 7+ days"));
  assert.equal(result.attentionJobs.some((x) => x.id === "closed"), false);
});

test("does not invent activity ages for missing dates", () => {
  const result = report({
    contractors: [c()], records: [rec({ coi_expires: null })],
    jobs: [j({ submitted_date: null, updated_at: null })],
  });
  assert.equal(result.contractors[0].insurance, "missing");
  assert.equal(result.metrics.jobsWithoutUpdate7Days, 0);
  assert.equal(result.metrics.submissionsLast7Days, 0);
});
