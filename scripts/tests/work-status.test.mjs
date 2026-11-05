import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORK_STATUSES, isWorkStatus, getWorkStatus, workStatusIndex, permitApproved, permitBarIndex, workStatusFromStageKey, effectiveWorkStatus, storedWorkStatus, alertChannel, PERMIT_BAR_KEYS,
} from '../../src/lib/work-status.ts';

test('the inspection bar has the statuses in the order Majestic named them', () => {
  assert.deepEqual(WORK_STATUSES.map((s) => s.label), [
    'Install ready to start', 'Install started', 'Needs inspection (in progress)', 'Needs inspection (final)', 'Inspection failed',
    'Needs re-inspection', 'In progress passed', 'Needs final', 'Final scheduled', 'Final passed', 'Permit closed',
  ]);
  assert.equal(new Set(WORK_STATUSES.map((s) => s.key)).size, WORK_STATUSES.length);
  assert.equal(workStatusIndex('final_scheduled'), 8);
  assert.ok(isWorkStatus('install_started') && !isWorkStatus('approved') && !isWorkStatus(null));
  assert.equal(getWorkStatus('nope'), null);
});

test('the inspection bar only runs once the permit is approved', () => {
  for (const key of ['getting_ready', 'submitted', 'under_review', 'corrections']) {
    assert.equal(permitApproved(key), false, key);
    assert.equal(effectiveWorkStatus(key, 'install_started'), null, key);
  }
  for (const key of ['approved', 'installing', 'inspections', 'ready_for_final', 'closed']) assert.equal(permitApproved(key), true, key);
});

test('the permit bar ends at approved, whatever stage the work has reached', () => {
  assert.deepEqual([...PERMIT_BAR_KEYS], ['getting_ready', 'submitted', 'under_review', 'corrections', 'approved']);
  assert.equal(permitBarIndex('under_review'), 2);
  assert.equal(permitBarIndex('approved'), 4);
  assert.equal(permitBarIndex('inspections'), 4);
  assert.equal(permitBarIndex('closed'), 4);
  assert.equal(permitBarIndex(''), 0);
});

test('a job saved before the inspection bar existed gets the status its stage implies', () => {
  assert.equal(workStatusFromStageKey('approved'), 'install_ready');
  assert.equal(workStatusFromStageKey('installing'), 'install_started');
  assert.equal(workStatusFromStageKey('inspections'), 'needs_inspection_progress');
  assert.equal(workStatusFromStageKey('ready_for_final'), 'needs_final');
  assert.equal(workStatusFromStageKey('closed'), 'permit_closed');
  assert.equal(workStatusFromStageKey('under_review'), null);
  assert.equal(effectiveWorkStatus('approved', null), 'install_ready');
  assert.equal(effectiveWorkStatus('inspections', 'needs_reinspection'), 'needs_reinspection');
  assert.equal(effectiveWorkStatus('inspections', 'garbage'), 'needs_inspection_progress');
});

test('every status keeps an older stage in step', () => {
  const stages = ['approved', 'installing', 'inspections', 'ready_for_final', 'inspection_scheduled', 'final_passed', 'closed'];
  for (const status of WORK_STATUSES) assert.ok(stages.includes(status.stageKey), status.key);
  assert.equal(getWorkStatus('permit_closed').stageKey, 'closed');
  assert.equal(getWorkStatus('install_ready').stageKey, 'approved');
});

test('final passed closes the whole job out', () => {
  assert.equal(storedWorkStatus('final_passed'), 'permit_closed');
  assert.equal(storedWorkStatus('needs_final'), 'needs_final');
});

test('a text only when an inspection is needed, an email for everything else', () => {
  for (const key of ['needs_inspection_progress', 'needs_inspection_final', 'needs_reinspection', 'needs_final']) assert.equal(alertChannel(key), 'sms', key);
  for (const key of ['install_ready', 'install_started', 'inspection_failed', 'in_progress_passed', 'final_scheduled', 'final_passed', 'permit_closed']) assert.equal(alertChannel(key), 'email', key);
});
