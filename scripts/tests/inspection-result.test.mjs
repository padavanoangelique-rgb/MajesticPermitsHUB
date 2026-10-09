import test from 'node:test';
import assert from 'node:assert/strict';
import { recordAdminInspectionResult } from '../../src/lib/admin-inspection-result.ts';

function database({ failTable, duplicate = false } = {}) {
  const state = {
    job_inspections: [{ id: 'i1', job_id: 'j1', slot: 1, inspection_type: 'In-progress', status: 'scheduled' }],
    inspection_requests: [{ id: 'r1', job_id: 'j1', inspection_type: 'In-progress', status: 'Scheduled' }],
    jobs: [{ id: 'j1', property_address: 'Test job', contractor_id: 'c1' }],
  };
  if (duplicate) state.job_inspections.push({ ...state.job_inspections[0], id: 'i2' });
  return { state, from(table) {
    let filters = [], patch;
    const query = {
      select() { return this; }, eq(key, value) { filters.push([key, value]); return this; },
      update(value) { patch = value; return this; }, single() { return run(true); },
      then(resolve, reject) { return run(false).then(resolve, reject); },
    };
    async function run(single) {
      if (patch && failTable === table) return { error: { message: 'write rejected' }, data: null };
      const rows = state[table].filter(row => filters.every(([key, value]) => row[key] === value));
      if (patch) rows.forEach(row => Object.assign(row, patch));
      return { data: single ? rows[0] : rows, error: null };
    }
    return query;
  }};
}

test('final result synchronizes request, inspection, date and closure input', async () => {
  const db = database(); let closeInput;
  const result = await recordAdminInspectionResult(db, 'r1', { status: 'Passed', final: true, result_date: '2026-10-09', contractor_note: 'Passed by inspector' }, async input => { closeInput = input; return { closed: true }; });
  assert.equal(result.closed, true);
  assert.equal(db.state.job_inspections[0].status, 'passed');
  assert.equal(db.state.inspection_requests[0].result, 'passed');
  assert.equal(db.state.inspection_requests[0].result_date, '2026-10-09');
  assert.equal(closeInput.inspection.result_date, '2026-10-09');
  assert.equal(closeInput.treatAsFinal, true);
});

test('failed and partial results stay open even when identified as final', async () => {
  for (const status of ['Failed', 'Partial']) {
    const db = database();
    const result = await recordAdminInspectionResult(db, 'slot-i1', { status, final: true }, async input => ({ closed: input.inspection.status === 'passed' }));
    assert.equal(result.closed, false);
  }
});

test('does not close when inspection update fails', async () => {
  const db = database({ failTable: 'job_inspections' }); let called = false;
  await assert.rejects(recordAdminInspectionResult(db, 'slot-i1', { status: 'Passed', final: true }, async () => { called = true; return { closed: true }; }), /write rejected/);
  assert.equal(called, false);
});

test('does not select an arbitrary inspection when request is ambiguous', async () => {
  const db = database({ duplicate: true });
  await assert.rejects(recordAdminInspectionResult(db, 'r1', { status: 'Passed' }, async () => ({ closed: true })), /not uniquely linked/);
  assert.ok(db.state.job_inspections.every(row => row.status === 'scheduled'));
});

test('rejects invalid date before writing', async () => {
  const db = database();
  await assert.rejects(recordAdminInspectionResult(db, 'slot-i1', { status: 'Passed', result_date: '2026-02-30' }, async () => ({ closed: true })), /valid result date/);
  assert.equal(db.state.job_inspections[0].status, 'scheduled');
});
