import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { randomUUID } from 'node:crypto';
import * as files from '../../src/lib/job-document-files.ts';

function route(path, options = {}) {
  const user = options.signedOut ? null : { id: 'user', email: options.admin ? 'owner@test' : 'cody@test' };
  const state = { uploads: [], rows: [], removed: [], signed: [], notifications: 0 };
  const storage = {
    upload: async (path, bytes) => { state.uploads.push({ path, bytes }); return { error: options.storageError ? { message: 'storage failed' } : null }; },
    remove: async paths => { state.removed.push(...paths); return { error: null }; },
    createSignedUrl: async (path, seconds, opts) => { state.signed.push({ path, opts }); return { data: { signedUrl: 'https://storage.test/document' }, error: null }; },
  };
  const db = { storage: { from: () => storage }, from(table) {
    let inserted;
    return {
      select() { return this; }, eq() { return this; },
      insert(row) { inserted = row; state.rows.push(row); return this; },
      then(resolve) { return Promise.resolve({ error: options.metadataError ? { message: 'metadata failed' } : null }).then(resolve); },
      single: async () => ({ data: { id: 'document' }, error: options.metadataError ? { message: 'metadata failed' } : null }),
      maybeSingle: async () => ({ data: table === 'jobs' ? options.missingJob ? null : { id: 'job', contractor_id: options.otherCompany ? 'other' : 'contractor', property_address: 'Test job' } : table === 'contractors' ? { id: 'contractor' } : { id: 'document', job_id: 'job', storage_path: 'job/majestic/file.pdf', file_name: 'file.pdf', visible_to_contractor: !options.hidden }, error: null }),
    };
  } };
  const stubs = {
    'node:crypto': { randomUUID },
    'next/server': { NextResponse: { json: (value, init) => new Response(JSON.stringify(value), init) } },
    '@/lib/supabase/server': { createClient: () => ({ auth: { getUser: async () => ({ data: { user } }) } }) },
    '@/lib/supabase/service': { createServiceClient: () => db },
    '@/lib/admin': { isAdminEmail: email => email === 'owner@test' },
    '@/lib/contractor': { getContractorForUser: async () => ({ id: 'contractor', company_name: 'A Plus' }) },
    '@/lib/job-document-files': files,
    '@/lib/admin-notify': { notifyAdmin: async () => { state.notifications++; if (options.notificationError) throw new Error('notification unavailable'); } },
    '@/lib/admin-email': { sendAdminRequestEmail: async () => {} },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, require: name => stubs[name], File, Buffer, URL, console });
  return { state, exports };
}
const adminPath = 'src/app/api/admin/documents/route.ts';
const contractorPath = 'src/app/api/contractor/jobs/[id]/documents/route.ts';
const downloadPath = 'src/app/api/documents/[id]/signed-url/route.ts';
function upload(api, admin, fileList = [new File(['permit'], 'permit.pdf')], category = 'intake') {
  const form = new FormData();
  form.set('job_id', 'job'); form.set('category', category);
  for (const file of fileList) form.append(admin ? 'file' : 'files', file);
  return api.exports.POST({ formData: async () => form }, { params: { id: 'job' } });
}
for (const admin of [false, true]) {
  const path = admin ? adminPath : contractorPath;
  const name = admin ? 'owner' : 'contractor';
  test(`${name} upload saves the job, uploader, and private sharing settings`, async () => {
    const api = route(path, { admin });
    assert.equal((await upload(api, admin)).status, 200);
    assert.equal(api.state.rows[0].job_id, 'job');
    assert.equal(api.state.rows[0].uploaded_by, 'user');
    assert.equal(api.state.rows[0].visible_to_contractor, true);
    assert.equal(api.state.rows[0].visible_to_homeowner, false);
    assert.match(api.state.uploads[0].path, admin ? /^job\/majestic\// : /^job\/contractor\//);
  });
  test(`${name} upload rejects signed-out users before storage`, async () => {
    const api = route(path, { admin, signedOut: true });
    assert.equal((await upload(api, admin)).status, 401);
    assert.equal(api.state.uploads.length, 0);
  });
  test(`${name} metadata failure removes the unregistered storage object`, async () => {
    const api = route(path, { admin, metadataError: true });
    assert.equal((await upload(api, admin)).status, 400);
    assert.equal(api.state.removed[0], api.state.uploads[0].path);
  });
  test(`${name} storage failure does not create a document record`, async () => {
    const api = route(path, { admin, storageError: true });
    assert.equal((await upload(api, admin)).status, 400);
    assert.equal(api.state.rows.length, 0);
  });
}
test('contractor cannot upload into another company job or through the admin route', async () => {
  for (const [path, options, admin] of [[contractorPath, { otherCompany: true }, false], [adminPath, {}, true]]) {
    const api = route(path, options);
    assert.equal((await upload(api, admin)).status, 403);
    assert.equal(api.state.uploads.length, 0);
  }
});
test('invalid category and oversized files fail before storage', async () => {
  for (const admin of [false, true]) {
    const api = route(admin ? adminPath : contractorPath, { admin });
    assert.equal((await upload(api, admin, undefined, 'invented')).status, 400);
    assert.equal((await upload(api, admin, [new File([new Uint8Array(files.MAX_DOCUMENT_BYTES + 1)], 'large.pdf')])).status, 400);
    assert.equal(api.state.uploads.length, 0);
  }
});
test('notification failure cannot turn a saved contractor document into a failed upload', async () => {
  const api = route(contractorPath, { notificationError: true });
  const response = await upload(api, false);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).files, 1);
});
test('contractor download rejects signed-out, hidden, and other company documents', async () => {
  for (const [options, status] of [[{ signedOut: true }, 401], [{ hidden: true }, 404], [{ otherCompany: true }, 403]]) {
    const api = route(downloadPath, options);
    const result = await api.exports.GET({ url: 'https://hub.test/api/documents/document/signed-url' }, { params: { id: 'document' } });
    assert.equal(result.status, status);
    assert.equal(api.state.signed.length, 0);
  }
});
test('visible own-job documents support both preview and named download', async () => {
  const api = route(downloadPath);
  for (const suffix of ['', '?view=1']) {
    const result = await api.exports.GET({ url: `https://hub.test/api/documents/document/signed-url${suffix}` }, { params: { id: 'document' } });
    assert.equal(result.status, 200);
  }
  assert.equal(api.state.signed[0].opts.download, 'file.pdf');
  assert.equal(api.state.signed[1].opts.download, false);
});
