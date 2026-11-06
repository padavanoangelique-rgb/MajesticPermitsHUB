import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { PDFDocument } from 'pdf-lib';
import * as stages from '../../src/lib/stages.ts';
import * as workStatus from '../../src/lib/work-status.ts';
import * as pdfLib from '../../src/lib/pdf.ts';

function load(jobs) {
  const supabase = {
    from(table) {
      const q = {
        select() { return this; },
        in() { return this; },
        then(resolve) { return Promise.resolve(table === 'jobs' ? { data: jobs, error: null } : { data: [{ id: 'c1', company_name: 'A Plus' }], error: null }).then(resolve); },
      };
      return q;
    },
  };
  const stubs = { '@/lib/supabase/service': { createServiceClient: () => supabase }, '@/lib/pdf': pdfLib, '@/lib/stages': stages, '@/lib/work-status': workStatus };
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/lib/reports.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: (n) => stubs[n], console, Error, Map, Set, Object, Array, String },
  );
  return exports;
}

const T = (key) => stages.stageTitle(key);
const job = (i, over = {}) => ({ id: 'j' + i, property_address: `${100 + i} Main St`, stage: T('under_review'), work_status: null, sub_status: 'In Review', next_step: 'Waiting on the city', permit_number: 'P-' + i, permit_eta: '2026-12-01', jurisdiction: 'Boca Raton', noc_status: null, contractor_id: 'c1', ...over });
const pages = async (pdf) => (await PDFDocument.load(pdf)).getPageCount();

test('the job status is one line of text: the permit until it is approved, then where the work is', () => {
  const r = load([]);
  assert.equal(r.jobStatusText({ stage: T('under_review') }), 'Under review');
  assert.equal(r.jobStatusText({ stage: T('corrections') }), 'Corrections');
  assert.equal(r.jobStatusText({ stage: T('approved'), work_status: null }), 'Install ready to start');
  assert.equal(r.jobStatusText({ stage: T('inspections'), work_status: 'needs_reinspection' }), 'Needs re-inspection');
  assert.equal(r.jobStatusText({ stage: T('submitted'), noc_status: 'Pending' }), 'Submitted - NOC pending');
});

test('each job belongs to one view', () => {
  const r = load([]);
  assert.equal(r.jobViewOf({ stage: T('getting_ready') }), 'need_submit');
  assert.equal(r.jobViewOf({ stage: T('submitted') }), 'in_review');
  assert.equal(r.jobViewOf({ stage: T('corrections') }), 'in_review');
  assert.equal(r.jobViewOf({ stage: T('approved') }), 'approved');
  assert.equal(r.jobViewOf({ stage: T('installing'), work_status: 'install_started' }), 'approved');
  assert.equal(r.jobViewOf({ stage: T('inspections'), work_status: 'needs_inspection_progress' }), 'inspections');
});

test('jobs print in jurisdiction order, each jurisdiction together, jobs with none last', () => {
  const r = load([]);
  const rows = [
    { jurisdiction: 'Delray Beach', property_address: '9 A St' },
    { jurisdiction: 'Boca Raton', property_address: '20 B St' },
    { jurisdiction: null, property_address: '1 Z St' },
    { jurisdiction: 'boca raton', property_address: '3 B St' },
    { jurisdiction: 'Delray Beach', property_address: '10 A St' },
    { jurisdiction: 'Boca Raton', property_address: '100 B St' },
  ];
  const sorted = r.sortByJurisdiction(rows);
  assert.deepEqual(JSON.parse(JSON.stringify(sorted.map((x) => x.property_address))), ['3 B St', '20 B St', '100 B St', '9 A St', '10 A St', '1 Z St']);
});

test('a list fits on one sheet when it can: about 30 jobs, even with a next step on each', async () => {
  const few = await load(Array.from({ length: 6 }, (_, i) => job(i))).buildAdminReport('all');
  assert.equal(await pages(few.pdf), 1);
  const thirty = await load(Array.from({ length: 30 }, (_, i) => job(i, { next_step: 'Waiting on the city' }))).buildAdminReport('all');
  assert.equal(await pages(thirty.pdf), 1, 'thirty jobs should be one sheet');
});

test('a list longer than a sheet runs on to more pages, in as few as it can', async () => {
  const seventy = await load(Array.from({ length: 70 }, (_, i) => job(i, { next_step: 'Waiting on the city' }))).buildAdminReport('all');
  const count = await pages(seventy.pdf);
  assert.ok(count >= 2 && count <= 3, `pages: ${count}`);
  const many = await load(Array.from({ length: 160 }, (_, i) => job(i, { next_step: 'Waiting on the city' }))).buildAdminReport('all');
  const total = await pages(many.pdf);
  assert.ok(total >= 5 && total <= 7, `pages: ${total}`);
});

test('the view picks the jobs, and closed jobs are never listed', async () => {
  const jobs = [
    job(1, { stage: T('under_review') }),
    job(2, { stage: T('getting_ready'), sub_status: 'Need to Submit' }),
    job(3, { stage: T('closed'), work_status: 'permit_closed' }),
    job(4, { stage: T('approved') }),
    job(5, { stage: T('submitted'), noc_status: 'Pending' }),
  ];
  const all = await load(jobs).buildAdminReport('all');
  assert.equal(all.totalOpen, 4);
  const noc = await load(jobs).buildAdminReport('noc');
  assert.equal(noc.nocsToRecord.length, 1);
  assert.ok(noc.pdf.length > 500);
});

test('the contractor weekly list is the same flat list: one sheet, status as a column', async () => {
  const jobs = Array.from({ length: 8 }, (_, i) => ({ property_address: `${i + 1} Main St`, stage: T('under_review'), status_text: 'Under review', next_step: 'Waiting on the city', permit_number: 'P-' + i, permit_eta: '2026-12-01' }));
  const pdf = await pdfLib.buildContractorWeeklyPdf({ contractorName: 'A Plus', jobs });
  const doc = await PDFDocument.load(pdf);
  assert.equal(doc.getPageCount(), 1);
  assert.equal(doc.getPage(0).getWidth(), 612);
  const empty = await PDFDocument.load(await pdfLib.buildContractorWeeklyPdf({ contractorName: 'A Plus', jobs: [] }));
  assert.equal(empty.getPageCount(), 1);
});

test('the admin list is landscape', async () => {
  const doc = await PDFDocument.load((await load([job(1)]).buildAdminReport('all')).pdf);
  assert.equal(doc.getPage(0).getWidth(), 792);
});
