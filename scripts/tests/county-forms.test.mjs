import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import {
  COUNTY_FORMS, VALUE_FIELDS, fieldPlan, fillCountyForm, formValueKeys, formatMoney, getCountyForm, pdfSafe, splitAddress, startingValues, stillBlank, valueFor, wrapIntoSlots,
} from '../../src/lib/forms/county-forms.ts';

const DIR = 'src/lib/forms/county-pdfs/';
const load = async (slug) => PDFDocument.load(fs.readFileSync(DIR + getCountyForm(slug).file), { ignoreEncryption: true });
const bytes = (slug) => new Uint8Array(fs.readFileSync(DIR + getCountyForm(slug).file));
const read = async (result, name) => (await PDFDocument.load(result.bytes)).getForm().getTextField(name).getText();

const company = { name: 'A Plus Windows and Doors LLC', phone: '(561) 555-0142', email: 'office@aplus.example', address: '1200 Commerce Way Suite 4', city: 'Riviera Beach', state: 'FL', zip: '33404', qualifier_name: 'Cody Smith', business_tax_receipt_number: 'BTR-44821' };
const job = { property_address: '4410 Haddon Pkwy, Lake Worth, FL 33467', homeowner_name: 'Maria Alvarez', homeowner_phone: '(561) 555-0199', homeowner_email: 'maria@example.com', contract_value: 18450, work_description: 'Replace 11 impact windows and 2 sliding glass doors', folio_number: '00-42-44-25-04-000-0210', legal_description: 'LOT 21 BLK 4 SUNSET GARDENS 5TH ADD PB 31 PG 112' };
const values = () => startingValues({ company, licenseNumber: 'CGC1530001', job });

test('address split: street, city, state, zip', () => {
  assert.deepEqual(splitAddress('4410 Haddon Pkwy, Lake Worth, FL 33467'), { street: '4410 Haddon Pkwy', city: 'Lake Worth', state: 'FL', zip: '33467' });
  assert.deepEqual(splitAddress('4410 Haddon Pkwy, Lake Worth FL 33467'), { street: '4410 Haddon Pkwy', city: 'Lake Worth', state: 'FL', zip: '33467' });
  assert.deepEqual(splitAddress('12 Ocean Dr, Unit 4, Miami Beach, FL 33139-1204'), { street: '12 Ocean Dr, Unit 4', city: 'Miami Beach', state: 'FL', zip: '33139' });
  assert.deepEqual(splitAddress('77 Palm Ave, Boca Raton, 33432'), { street: '77 Palm Ave', city: 'Boca Raton', state: '', zip: '33432' });
  // Not an address it can read: it stays whole in the street.
  assert.deepEqual(splitAddress('Lot 5 behind the gas station'), { street: 'Lot 5 behind the gas station', city: '', state: '', zip: '' });
  assert.deepEqual(splitAddress(''), { street: '', city: '', state: '', zip: '' });
});

test('starting values come from the company and the job, and stay blank when unknown', () => {
  const v = values();
  assert.equal(v.contractor_company, 'A Plus Windows and Doors LLC');
  assert.equal(v.contractor_license, 'CGC1530001');
  assert.equal(v.job_address, '4410 Haddon Pkwy');
  assert.equal(v.job_city, 'Lake Worth');
  assert.equal(v.job_zip, '33467');
  assert.equal(v.client_name, 'Maria Alvarez');
  assert.equal(v.job_value, '18,450.00');
  const bare = startingValues({ company: null, job: null });
  assert.equal(bare.folio_number, '');
  assert.equal(bare.legal_description, '');
  assert.equal(bare.contractor_state, 'FL');
  assert.equal(formatMoney(0), '');
  assert.equal(formatMoney('$1,200'), '1,200.00');
  // A saved city beats the one read from the address.
  assert.equal(startingValues({ job: { property_address: '1 A St, Miami, FL 33101', property_city: 'Coral Gables' } }).job_city, 'Coral Gables');
});

test('every mapped field is a real text box in its PDF, and every value it reads is known', async () => {
  const all = Object.fromEntries(Object.keys(VALUE_FIELDS).map((key) => [key, 'x ' + key]));
  all.job_state = 'FL';
  for (const form of COUNTY_FORMS) {
    const pdf = await load(form.slug);
    const names = new Set(pdf.getForm().getFields().filter((f) => f.constructor.name === 'PDFTextField').map((f) => f.getName()));
    for (const [field, key] of Object.entries(fieldPlan(form.slug))) {
      assert.ok(names.has(field), `${form.slug}: "${field}" is not a text box`);
      assert.ok(valueFor(key, all), `${form.slug}: nothing to put in "${field}" (${key})`);
    }
    assert.ok(formValueKeys(form.slug).every((key) => VALUE_FIELDS[key]), form.slug);
  }
});

test('notary lines and dates beside signatures are never filled', async () => {
  const plan = fieldPlan('miami-dade-application');
  assert.equal(plan['Print Name: Signature of Owner or Owner’s Agent'], undefined);
  assert.equal(plan['Print Name: Signature of Qualifier'], undefined);
  assert.equal(plan['Print: Signature of Owner or Owner’s Agent'], 'client_name');
  assert.equal(fieldPlan('broward-application')['8_af_date'], undefined);
  assert.equal(fieldPlan('broward-application')['65'], undefined); // the titleholder's address line
  assert.equal(fieldPlan('miami-dade-noc')['1. Print name current owner'], undefined);
  for (const form of COUNTY_FORMS) assert.ok(!Object.values(fieldPlan(form.slug)).includes('today_date'));
});

test('the Palm Beach parcel number goes one digit to a box', async () => {
  const result = await fillCountyForm(bytes('palm-beach-application'), 'palm-beach-application', values());
  const digits = '00-42-44-25-04-000-0210'.replace(/\D/g, '');
  for (let i = 0; i < 17; i += 1) assert.equal(await read(result, 'PCN-' + (i + 1)), digits[i]);
  // A number that is not 17 digits is left out, never guessed.
  const short = await fillCountyForm(bytes('palm-beach-application'), 'palm-beach-application', { ...values(), folio_number: '1234' });
  assert.equal(await read(short, 'PCN-1'), undefined);
});

test('filled values land in the right boxes; signature, notary and choice fields stay as the county printed them', async () => {
  const result = await fillCountyForm(bytes('miami-dade-application'), 'miami-dade-application', values());
  assert.equal(await read(result, 'Job Address'), '4410 Haddon Pkwy');
  assert.equal(await read(result, 'Folio'), '00-42-44-25-04-000-0210');
  assert.equal(await read(result, 'Contractor No'), 'CGC1530001');
  assert.equal(await read(result, 'Print: Signature of Owner or Owner’s Agent'), 'Maria Alvarez');
  assert.equal(await read(result, 'Print Name: Signature of Owner or Owner’s Agent'), undefined);
  assert.equal(await read(result, 'By: Signature of Owner or Owner’s Agent'), undefined);
  // Description of Work line 1 is 124 pt wide, so the rest carries on to line 2.
  const line1 = await read(result, 'Description of Work, line 1');
  const line2 = await read(result, 'Description of Work, line 2');
  assert.ok(line1 && line2 && `${line1} ${line2}`.replace(/\s+/g, ' ') === job.work_description, `${line1} | ${line2}`);
  assert.deepEqual(result.attached, []);
});

test('a name and address line holds the whole line, then carries on to the next', async () => {
  const result = await fillCountyForm(bytes('miami-dade-noc'), 'miami-dade-noc', values());
  const first = await read(result, '4. Contractor’s name, address and phone number: first line');
  const second = await read(result, '4.  second line');
  assert.equal(`${first} ${second || ''}`.trim(), 'A Plus Windows and Doors LLC, 1200 Commerce Way Suite 4, Riviera Beach, FL 33404, (561) 555-0142');
  assert.equal(await read(result, '3. Owner(s) name and address'), 'Maria Alvarez, 4410 Haddon Pkwy, Lake Worth, FL 33467');
  // No titleholder, surety or lender given: those lines stay empty.
  assert.equal(await read(result, '3. Name and address of fee simple titleholder'), undefined);
  assert.equal(await read(result, '5. Name, address and phone number'), undefined);
});

test('Broward notice: folio in its box, legal description stamped on its line', async () => {
  const result = await fillCountyForm(bytes('broward-noc'), 'broward-noc', values());
  assert.equal(await read(result, '1 DESCRIPTION OF PROPERTY Legal description  street address if available TAX FOLIO NO'), '00-42-44-25-04-000-0210');
  assert.equal(await read(result, 'b Address'), '4410 Haddon Pkwy, Lake Worth, FL 33467');
  const pdf = await PDFDocument.load(result.bytes);
  assert.equal(pdf.getPageCount(), 1);
  assert.ok(result.filled.includes('legal_and_address'));
});

test('text that cannot fit is never cut: the box says SEE ATTACHED and the full text is on a last page', async () => {
  const long = 'LOT 21, BLOCK 4, SUNSET GARDENS FIFTH ADDITION, ACCORDING TO THE PLAT THEREOF, AS RECORDED IN PLAT BOOK 31, PAGE 112, OF THE PUBLIC RECORDS OF PALM BEACH COUNTY, FLORIDA, TOGETHER WITH AN UNDIVIDED ONE-HALF INTEREST IN THE EASEMENT FOR INGRESS AND EGRESS SHOWN ON SAID PLAT';
  const before = (await load('palm-beach-application')).getPageCount();
  const result = await fillCountyForm(bytes('palm-beach-application'), 'palm-beach-application', { ...values(), legal_description: long });
  assert.deepEqual(result.attached, ['Legal description']);
  assert.equal(await read(result, 'Legal-description'), 'SEE ATTACHED');
  const pdf = await PDFDocument.load(result.bytes);
  assert.equal(pdf.getPageCount(), before + 1);
  assert.ok(!result.filled.includes('legal_description'));
});

test('curly quotes and symbols the PDF font cannot draw do not break the fill', async () => {
  assert.equal(pdfSafe('Smith’s “Roof” – 5½ ☺'), 'Smith\'s "Roof" - 5½ ');
  const result = await fillCountyForm(bytes('broward-application'), 'broward-application', { ...values(), client_name: 'María Núñez ☺' });
  assert.equal(await read(result, '33'), 'María Núñez');
});

test('what is still blank is what the county needs and the form reads', () => {
  const bare = startingValues({ company, licenseNumber: 'CGC1530001', job: { property_address: '4410 Haddon Pkwy, Lake Worth, FL 33467', homeowner_name: 'Maria Alvarez' } });
  const blank = stillBlank('palm-beach-noc', bare);
  assert.ok(blank.includes('folio_number') && blank.includes('legal_description') && blank.includes('description_of_work'));
  assert.ok(!blank.includes('client_name') && !blank.includes('contractor_license'));
  assert.deepEqual(stillBlank('palm-beach-noc', values()), []);
});

test('word wrap fills the slots in order and gives up honestly', () => {
  const measure = (text) => text.length;
  assert.deepEqual(wrapIntoSlots('aaa bbb ccc ddd', [{ width: 7, lines: 1 }, { width: 7, lines: 1 }], measure), [['aaa bbb'], ['ccc ddd']]);
  assert.deepEqual(wrapIntoSlots('aaa bbb ccc ddd eee', [{ width: 7, lines: 1 }, { width: 7, lines: 1 }], measure), null);
  assert.deepEqual(wrapIntoSlots('aaaaaaaaaaaa', [{ width: 7, lines: 3 }], measure), null);
  assert.deepEqual(wrapIntoSlots('aa bb cc dd', [{ width: 5, lines: 3 }], measure), [['aa bb', 'cc dd']]);
});
