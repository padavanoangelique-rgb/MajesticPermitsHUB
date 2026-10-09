import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function route({ user = { id: 'u1' }, contractor = { id: 'c1', company_name: 'Test contractor' }, uploadError = false, documentError = false } = {}) {
  const state = { jobs: [], documents: [] };
  const db = {
    from(table) {
      let record;
      const result = () => table === 'job_documents' && documentError
        ? { error: { message: 'document rejected' } }
        : { data: { id: 'j1' }, error: null };
      const builder = {
        insert(value) { record = value; if (table === 'jobs') state.jobs.push(value); if (table === 'job_documents' && !documentError) state.documents.push(value); return this; },
        select() { return this; }, single() { return Promise.resolve(result()); },
        then(resolve) { return Promise.resolve(result()).then(resolve); },
      };
      return builder;
    },
    storage: { from() { return {
      upload: async () => ({ error: uploadError ? { message: 'upload rejected' } : null }),
      remove: async () => ({ error: null }),
    }; } },
  };
  const stubs = {
    'next/server': { NextResponse: { json: (body, options) => new Response(JSON.stringify(body), { status: options?.status || 200 }) } },
    '@/lib/supabase/server': { createClient: () => ({ auth: { getUser: async () => ({ data: { user } }) } }) },
    '@/lib/supabase/service': { createServiceClient: () => db },
    '@/lib/contractor': { getContractorForUser: async () => contractor },
    '@/lib/admin-notify': { notifyAdmin: async () => {} },
    '@/lib/sms': { sendAdminSms: async () => {} },
    '@/lib/admin-email': { sendAdminRequestEmail: async () => ({ ok: true }) },
    '@/lib/job-request': { PENDING_REQUEST_SUB: 'Pending approval' },
  };
  const compiled = ts.transpileModule(fs.readFileSync('src/app/api/contractor/job-requests/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: (name) => { if (!(name in stubs)) throw new Error(name); return stubs[name]; }, Response, File, Buffer, console });
  return { post: exports.POST, state };
}
function request({ address = 'Test request', attachment = true } = {}) {
  const form = new FormData(); form.set('property_address', address); form.set('trade_type', 'Windows');
  if (attachment) form.append('files', new File(['test document'], 'test.pdf', { type: 'application/pdf' }));
  return { formData: async () => form };
}

test('job request saves for authenticated contractor with attachment metadata', async () => {
  const api = route(); const response = await api.post(request()); const body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.id, 'j1'); assert.equal(body.files, 1);
  assert.equal(api.state.jobs[0].contractor_id, 'c1'); assert.equal(api.state.jobs[0].sub_status, 'Pending approval');
  assert.equal(api.state.documents[0].job_id, 'j1'); assert.deepEqual(body.warnings, []);
});
test('rejects signed-out request without creating a job', async () => {
  const api = route({ user: null }); assert.equal((await api.post(request())).status, 401); assert.equal(api.state.jobs.length, 0);
});
test('rejects empty address without creating a job', async () => {
  const api = route(); assert.equal((await api.post(request({ address: '' }))).status, 400); assert.equal(api.state.jobs.length, 0);
});
test('saved request survives upload or metadata failures and explicitly reports missing documents', async () => {
  for (const failure of [{ uploadError: true }, { documentError: true }]) {
    const api = route(failure); const response = await api.post(request()); const body = await response.json();
    assert.equal(response.status, 200); assert.equal(body.id, 'j1'); assert.equal(body.files, 0); assert.equal(body.warnings.length, 1);
    assert.equal(api.state.jobs.length, 1); assert.equal(api.state.documents.length, 0);
  }
});
