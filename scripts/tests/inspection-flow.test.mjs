import test from 'node:test';
import assert from 'node:assert/strict';
import { phaseOf, currentVisit, slotsToActivate, jobsNeedingInspection, reinspectionFee, scheduledStatusFor, isFinalVisit, visitName } from '../../src/lib/inspection-flow.ts';
import { stageAfterInspectionConfirmed, stageAfterInspectionResult, inspectionsAllowed, stageTitle, PERMIT_STAGES, canonicalStageTitle, defaultSubStatus } from '../../src/lib/stages.ts';

const row = (slot, status, extra = {}) => ({ id: `r${slot}`, job_id: 'j', slot, inspection_type: null, status, ...extra });

test('phase: what each status means for the calendar', () => {
  assert.equal(phaseOf({ status: 'not_required' }), 'unavailable');
  assert.equal(phaseOf({ status: 'not_requested' }), 'ready');
  assert.equal(phaseOf({ status: 'requested' }), 'requested');
  assert.equal(phaseOf({ status: 'reinspection_requested' }), 'requested');
  assert.equal(phaseOf({ status: 'scheduled', confirmed_at: null }), 'tentative');
  assert.equal(phaseOf({ status: 'scheduled', confirmed_at: '2026-11-04T10:00:00Z' }), 'scheduled');
  assert.equal(phaseOf({ status: 'reinspection_scheduled', confirmed_at: null }), 'tentative');
  assert.equal(phaseOf({ status: 'passed' }), 'passed');
  assert.equal(phaseOf({ status: 'failed' }), 'needs_reinspection');
  assert.equal(phaseOf({ status: 'partial_pass' }), 'needs_reinspection');
});

test('the current visit is the first one that is on and not passed', () => {
  assert.equal(currentVisit([row(1, 'not_required'), row(2, 'not_required'), row(3, 'not_required')]), null);
  assert.equal(currentVisit([row(1, 'not_requested'), row(2, 'not_required'), row(3, 'not_requested')]).slot, 1);
  assert.equal(currentVisit([row(3, 'not_requested'), row(1, 'passed'), row(2, 'not_required')]).slot, 3, 'rows are read in slot order; a passed visit is history');
  assert.equal(currentVisit([row(1, 'failed'), row(3, 'not_requested')]).slot, 1, 'a failed visit stays current until it is scheduled again and passes');
  assert.equal(currentVisit([row(1, 'passed'), row(3, 'passed')]), null);
});

test('an approved job whose visits were never touched gets the standard visits; a job Majestic already set up does not', () => {
  const untouched = [row(1, 'not_required'), row(2, 'not_required'), row(3, 'not_required')];
  assert.deepEqual(slotsToActivate(untouched), [
    { id: 'r1', patch: { status: 'not_requested', inspection_type: 'In progress' } },
    { id: 'r3', patch: { status: 'not_requested', inspection_type: 'Final' } },
  ]);
  assert.deepEqual(slotsToActivate([row(1, 'not_required'), row(2, 'not_required'), row(3, 'requested')]), []);
  assert.deepEqual(slotsToActivate([row(1, 'not_required', { result_date: '2026-10-01' }), row(2, 'not_required'), row(3, 'not_required')]), []);
  assert.deepEqual(slotsToActivate([]), []);
});

test('jobs needing an inspection: ready, asked for, or failed; not scheduled, not passed, not ineligible', () => {
  const jobs = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id }));
  const by = new Map([
    ['a', [row(1, 'not_requested')]],
    ['b', [row(1, 'requested')]],
    ['c', [row(1, 'failed')]],
    ['d', [row(1, 'scheduled', { confirmed_at: 'x' })]],
    ['e', [row(1, 'passed'), row(3, 'not_requested')]],
    ['f', [row(1, 'not_requested')]],
  ].map(([id, rows]) => [id, rows.map((r) => ({ ...r, job_id: id }))]));
  const out = jobsNeedingInspection(jobs, by, (job) => job.id !== 'f');
  assert.deepEqual(out.map((e) => [e.job.id, e.phase, e.visit.slot]), [['a', 'ready', 1], ['b', 'requested', 1], ['c', 'needs_reinspection', 1], ['e', 'ready', 3]]);
});

test('a failed or partial visit is scheduled again as a re-inspection', () => {
  assert.equal(scheduledStatusFor('not_requested'), 'scheduled');
  assert.equal(scheduledStatusFor('requested'), 'scheduled');
  assert.equal(scheduledStatusFor('failed'), 'reinspection_scheduled');
  assert.equal(scheduledStatusFor('partial_pass'), 'reinspection_scheduled');
  assert.equal(scheduledStatusFor('reinspection_requested'), 'reinspection_scheduled');
});

test('visit names and the final visit', () => {
  assert.equal(visitName({ slot: 1, inspection_type: null }), 'In progress');
  assert.equal(visitName({ slot: 3, inspection_type: '' }), 'Final');
  assert.equal(visitName({ slot: 2, inspection_type: 'Dry-in' }), 'Dry-in');
  assert.equal(isFinalVisit({ slot: 3, inspection_type: null }), true);
  assert.equal(isFinalVisit({ slot: 1, inspection_type: 'Roof Final' }), true);
  assert.equal(isFinalVisit({ slot: 1, inspection_type: 'In progress' }), false);
});

test('the re-inspection fee comes from a setting and is null until set', () => {
  assert.equal(reinspectionFee(undefined), null);
  assert.equal(reinspectionFee(''), null);
  assert.equal(reinspectionFee('0'), null);
  assert.equal(reinspectionFee('abc'), null);
  assert.equal(reinspectionFee('$75'), 75);
  assert.equal(reinspectionFee('1,250.5'), 1250.5);
});

test('stages: confirming moves an approved job to Inspection scheduled; results move it on', () => {
  assert.equal(stageAfterInspectionConfirmed(stageTitle('approved')), 'Inspection scheduled');
  assert.equal(stageAfterInspectionConfirmed('Being installed'), 'Inspection scheduled');
  assert.equal(stageAfterInspectionConfirmed('Inspections in progress'), 'Inspection scheduled');
  assert.equal(stageAfterInspectionConfirmed('Ready for final'), 'Inspection scheduled');
  assert.equal(stageAfterInspectionConfirmed('Inspection scheduled'), null);
  assert.equal(stageAfterInspectionConfirmed('Under review'), null, 'a job that is not approved never jumps ahead');
  assert.equal(stageAfterInspectionConfirmed('Permit closed — all done'), null);
  assert.equal(stageAfterInspectionResult('Inspection scheduled', 'passed', false), 'Ready for final');
  assert.equal(stageAfterInspectionResult('Inspection scheduled', 'passed', true), null, 'a passed final is closed by the closing step');
  assert.equal(stageAfterInspectionResult('Inspection scheduled', 'failed', false), 'Inspections in progress');
  assert.equal(stageAfterInspectionResult('Inspection scheduled', 'partial_pass', true), 'Inspections in progress');
  assert.equal(stageAfterInspectionResult('Permit closed — all done', 'failed', false), null);
  assert.equal(stageAfterInspectionResult('Under review', 'passed', false), null);
});

test('stage list: every stage has a unique key and title, in the order Majestic works them', () => {
  assert.deepEqual(PERMIT_STAGES.map((s) => s.key), ['getting_ready', 'submitted', 'under_review', 'corrections', 'approved', 'install_scheduled', 'installing', 'inspection_scheduled', 'inspections', 'ready_for_final', 'final_passed', 'closed']);
  assert.equal(new Set(PERMIT_STAGES.map((s) => s.title)).size, PERMIT_STAGES.length);
  assert.equal(canonicalStageTitle('inspection scheduled'), 'Inspection scheduled');
  assert.equal(canonicalStageTitle('closed'), 'Permit closed — all done');
  assert.equal(defaultSubStatus('Ready for final'), 'Approved');
  assert.equal(defaultSubStatus('Final inspection passed'), 'Complete');
  assert.equal(inspectionsAllowed('Final inspection passed'), false);
});
