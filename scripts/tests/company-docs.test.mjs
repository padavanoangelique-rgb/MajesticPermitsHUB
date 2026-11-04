import test from 'node:test';
import assert from 'node:assert/strict';
import { expiryStatus, expiryText, normalizeDocType, docTypeLabel, safeFileName, makeRefCode, refFromText, classifyReply, defaultEmailSubject, defaultEmailBody } from '../../src/lib/company-docs.ts';

test('expiration flag: expired, inside 30 days, current, none', () => {
  const today = '2026-11-04';
  assert.deepEqual(expiryStatus('2026-11-03', today), { state: 'expired', days: -1 });
  assert.deepEqual(expiryStatus('2026-10-01', today), { state: 'expired', days: -34 });
  assert.deepEqual(expiryStatus('2026-11-04', today), { state: 'soon', days: 0 });
  assert.deepEqual(expiryStatus('2026-12-04', today), { state: 'soon', days: 30 });
  assert.deepEqual(expiryStatus('2026-12-05', today), { state: 'ok', days: 31 });
  assert.deepEqual(expiryStatus('2027-03-01T00:00:00Z', today).state, 'ok');
  assert.deepEqual(expiryStatus('', today), { state: 'none', days: null });
  assert.deepEqual(expiryStatus(null, today), { state: 'none', days: null });
  assert.deepEqual(expiryStatus('not a date', today), { state: 'none', days: null });
  assert.equal(expiryText('expired', -1), 'Expired yesterday');
  assert.equal(expiryText('expired', -34), 'Expired 34 days ago');
  assert.equal(expiryText('soon', 0), 'Expires today');
  assert.equal(expiryText('soon', 1), 'Expires tomorrow');
  assert.equal(expiryText('soon', 12), 'Expires in 12 days');
  assert.equal(expiryText('ok', 90), 'Current');
  assert.equal(expiryText('none', null), 'No expiration date');
});

test('document types', () => {
  assert.equal(normalizeDocType('license'), 'license');
  assert.equal(normalizeDocType('nonsense'), 'other');
  assert.equal(normalizeDocType(undefined), 'other');
  assert.equal(docTypeLabel('insurance'), 'Certificate of insurance');
  assert.equal(docTypeLabel('zzz'), 'Other');
});

test('file names are made safe', () => {
  assert.equal(safeFileName('My License (2026).pdf'), 'My_License_2026_.pdf');
  assert.equal(safeFileName('../../etc/passwd'), '_.._etc_passwd');
  assert.equal(safeFileName('   '), '_');
  assert.equal(safeFileName(''), 'document');
  assert.equal(safeFileName('.hidden'), 'hidden');
});

test('reference codes are found in a reply, with quoting and case ignored', () => {
  const code = makeRefCode(() => 0.5);
  assert.match(code, /^DOC-[A-HJKMNP-Z2-9]{6}$/);
  assert.equal(makeRefCode(() => 0), 'DOC-AAAAAA');
  assert.equal(refFromText('Re: Acme: contractor documents [DOC-K7M2QX]'), 'DOC-K7M2QX');
  assert.equal(refFromText('re: [doc-k7m2qx] thanks'), 'DOC-K7M2QX');
  assert.equal(refFromText('no code here'), null);
  assert.equal(refFromText('DOC-K7M2Q'), null);
  assert.equal(refFromText(null), null);
});

test('a reply confirms only when it clearly says updated and asks for nothing more', () => {
  assert.equal(classifyReply('Thank you, we received the documents and have updated the contractor file.'), 'confirmed');
  assert.equal(classifyReply('Documents are on file. All set.'), 'confirmed');
  assert.equal(classifyReply('We received your documents but the insurance certificate is expired. Please send a new one.'), 'replied');
  assert.equal(classifyReply('Received. Additional information is needed.'), 'replied');
  assert.equal(classifyReply('Please call the office.'), 'replied');
  assert.equal(classifyReply(''), 'replied');
  assert.equal(classifyReply('> please update the file\nReceived and updated, thanks'), 'confirmed', 'quoted lines are ignored');
});

test('email text', () => {
  assert.equal(defaultEmailSubject('A Plus', 'DOC-AAAAAA', 'City of Miramar'), 'A Plus: contractor documents for City of Miramar [DOC-AAAAAA]');
  assert.equal(defaultEmailSubject('A Plus', 'DOC-AAAAAA', ''), 'A Plus: contractor documents [DOC-AAAAAA]');
  const body = defaultEmailBody('A Plus', ['Contractor license', 'Certificate of insurance'], 'City of Miramar');
  assert.match(body, /To the City of Miramar,/);
  assert.match(body, /  - Certificate of insurance/);
  assert.match(body, /reply to confirm/);
});
