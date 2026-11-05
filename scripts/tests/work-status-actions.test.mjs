import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as stages from '../../src/lib/stages.ts';
import * as workStatus from '../../src/lib/work-status.ts';

function load(job) {
  const state = { patch: null, notices: [] };
  const db = {
    from() {
      const q = {
        select() { return this; },
        eq() { return this; },
        update(p) { state.patch = p; return { eq: async () => ({ error: null }) }; },
        maybeSingle: async () => ({ data: job, error: null }),
      };
      return q;
    },
  };
  const stubs = {
    '@/lib/admin-notify': { notifyAdmin: async (type, message, jobId) => { state.notices.push({ type, message, jobId }); } },
    '@/lib/stages': stages,
    '@/lib/work-status': workStatus,
  };
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/lib/work-status-actions.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: (n) => stubs[n], console, Error },
  );
  return { state, db, ...exports };
}

const approved = { id: 'j', property_address: '4410 Haddon Pkwy', stage: stages.stageTitle('installing'), work_status: 'install_started' };

test('a contractor can set any status on the inspection bar once the permit is approved', async () => {
  for (const status of workStatus.WORK_STATUSES.map((s) => s.key)) {
    const api = load(approved);
    const result = await api.setWorkStatus(api.db, { jobId: 'j', status, by: 'contractor' });
    assert.equal(result.work_status, workStatus.storedWorkStatus(status));
  }
});

test('the inspection bar is closed until the permit is approved, for both of them', async () => {
  for (const by of ['contractor', 'admin']) {
    const api = load({ ...approved, stage: stages.stageTitle('under_review'), work_status: null });
    await assert.rejects(api.setWorkStatus(api.db, { jobId: 'j', status: 'install_started', by }), /once the permit is approved/);
    assert.equal(api.state.patch, null);
  }
});

test('an invalid status is refused and nothing is written', async () => {
  const api = load(approved);
  await assert.rejects(api.setWorkStatus(api.db, { jobId: 'j', status: 'approved', by: 'admin' }), /Choose a status/);
  assert.equal(api.state.patch, null);
});

test('the status keeps the older stage in step, and never touches the permit before approval', async () => {
  const api = load(approved);
  const result = await api.setWorkStatus(api.db, { jobId: 'j', status: 'needs_inspection_progress', by: 'admin' });
  assert.equal(result.stage, stages.stageTitle('inspections'));
  assert.equal(api.state.patch.work_status, 'needs_inspection_progress');
  assert.equal(api.state.patch.stage, stages.stageTitle('inspections'));
});

test('final passed closes the whole job out', async () => {
  const api = load({ ...approved, stage: stages.stageTitle('ready_for_final'), work_status: 'final_scheduled' });
  const result = await api.setWorkStatus(api.db, { jobId: 'j', status: 'final_passed', by: 'contractor' });
  assert.equal(result.closed, true);
  assert.equal(api.state.patch.work_status, 'permit_closed');
  assert.equal(api.state.patch.stage, stages.stageTitle('closed'));
  assert.equal(api.state.notices[0].type, 'job_closed');
});

test('a contractor cannot reopen a closed job, Majestic can', async () => {
  const closed = { ...approved, stage: stages.stageTitle('closed'), work_status: 'permit_closed' };
  const a = load(closed);
  await assert.rejects(a.setWorkStatus(a.db, { jobId: 'j', status: 'needs_final', by: 'contractor' }), /closed/);
  const b = load(closed);
  assert.equal((await b.setWorkStatus(b.db, { jobId: 'j', status: 'needs_final', by: 'admin' })).work_status, 'needs_final');
});

test('Majestic is told when a contractor changes it: a text for an inspection, an email for anything else', async () => {
  const text = load(approved);
  await text.setWorkStatus(text.db, { jobId: 'j', status: 'needs_inspection_final', by: 'contractor', actor: 'A Plus' });
  assert.equal(text.state.notices.length, 1);
  assert.equal(text.state.notices[0].type, 'inspection_needed');
  assert.match(text.state.notices[0].message, /4410 Haddon Pkwy.*Needs inspection \(final\).*A Plus/);

  const email = load({ ...approved, work_status: 'install_ready', stage: stages.stageTitle('approved') });
  await email.setWorkStatus(email.db, { jobId: 'j', status: 'install_started', by: 'contractor' });
  assert.equal(email.state.notices[0].type, 'job_status');
});

test('Majestic changing it tells nobody, and setting the same status again is quiet', async () => {
  const admin = load(approved);
  await admin.setWorkStatus(admin.db, { jobId: 'j', status: 'needs_inspection_progress', by: 'admin' });
  assert.equal(admin.state.notices.length, 0);
  const same = load(approved);
  await same.setWorkStatus(same.db, { jobId: 'j', status: 'install_started', by: 'contractor' });
  assert.equal(same.state.notices.length, 0);
});
