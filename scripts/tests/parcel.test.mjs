import test from 'node:test';
import assert from 'node:assert/strict';
import { jurisdictionFor, withJurisdiction, searchParcels, isParcelCounty } from '../../src/lib/parcel.ts';

const directory = ['Village of Wellington', 'Palm Beach County', 'West Palm Beach', 'Lake Worth Beach', 'Palm Beach Gardens', 'Boca Raton', 'Miami-Dade County', 'City of Miami', 'Broward County', 'Fort Lauderdale', 'Hollywood'];
const hit = (city, countyLabel = 'Palm Beach County') => ({ folio: '1', owner: '', address: '', city, zip: '', millageCode: null, legalDescription: null, countyKey: 'palm-beach', countyLabel });

test('a parcel in a city is permitted by that city, in the Hub\'s name for it', () => {
  assert.deepEqual(jurisdictionFor(hit('BOCA RATON'), directory), { jurisdiction: 'Boca Raton', inDirectory: true });
  assert.deepEqual(jurisdictionFor(hit('Wellington'), directory), { jurisdiction: 'Village of Wellington', inDirectory: true });
  assert.deepEqual(jurisdictionFor(hit('Miami', 'Miami-Dade County'), directory), { jurisdiction: 'City of Miami', inDirectory: true });
  assert.deepEqual(jurisdictionFor(hit('LAKE WORTH'), directory), { jurisdiction: 'Lake Worth Beach', inDirectory: true });
});

test('outside every city it is the county; a city not in the directory is kept as the appraiser spells it', () => {
  assert.deepEqual(jurisdictionFor(hit(''), directory), { jurisdiction: 'Palm Beach County', inDirectory: true });
  assert.deepEqual(jurisdictionFor(hit('Unincorporated Palm Beach County'), directory), { jurisdiction: 'Palm Beach County', inDirectory: true });
  assert.deepEqual(jurisdictionFor(hit('UNINCORPORATED', 'Martin County'), directory), { jurisdiction: 'Martin County', inDirectory: false });
  assert.deepEqual(jurisdictionFor(hit('ROYAL PALM BEACH'), directory), { jurisdiction: 'Royal Palm Beach', inDirectory: false });
});

test('a city is never guessed from a similar name: the Town of Palm Beach is not Palm Beach Gardens or the county', () => {
  assert.deepEqual(jurisdictionFor(hit('PALM BEACH'), directory), { jurisdiction: 'Palm Beach', inDirectory: false });
  assert.deepEqual(jurisdictionFor(hit('MIAMI BEACH', 'Miami-Dade County'), directory), { jurisdiction: 'Miami Beach', inDirectory: false });
  assert.deepEqual(jurisdictionFor(hit('WEST PALM'), directory), { jurisdiction: 'West Palm', inDirectory: false });
});

test('every hit gets its jurisdiction', () => {
  const out = withJurisdiction([hit('BOCA RATON'), hit('')], directory);
  assert.deepEqual(out.map((r) => r.jurisdiction), ['Boca Raton', 'Palm Beach County']);
});

test('search asks the parcel endpoint and passes the county and the text', async () => {
  let asked = '';
  const fetchImpl = async (url) => { asked = String(url); return { ok: true, json: async () => ({ results: [hit('BOCA RATON')] }) }; };
  const rows = await searchParcels('broward', ' 4410 Haddon ', { base: 'https://example.test/', fetchImpl });
  assert.equal(asked, 'https://example.test/api/parcel-lookup?county=broward&q=4410%20Haddon');
  assert.equal(rows.length, 1);
  // Too short to search: no request at all.
  asked = '';
  assert.deepEqual(await searchParcels('broward', 'ab', { fetchImpl }), []);
  assert.equal(asked, '');
});

test('search says so in plain words when the lookup is down', async () => {
  await assert.rejects(searchParcels('broward', 'haddon pkwy', { fetchImpl: async () => { throw new Error('boom'); } }), /Could not reach the property appraiser/);
  await assert.rejects(searchParcels('broward', 'haddon pkwy', { fetchImpl: async () => ({ ok: false, json: async () => ({ error: 'upstream 503' }) }) }), /upstream 503/);
  assert.equal(isParcelCounty('palm-beach'), true);
  assert.equal(isParcelCounty('martin'), false);
});

import { JURISDICTIONS } from '../../src/lib/jurisdiction-directory.ts';

test('the department directory has every South Florida city once, and the lookup finds each', () => {
  const names = JURISDICTIONS.map((entry) => entry.name);
  const key = (name) => name.toLowerCase().replace(/^(city|town|village) of /, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  assert.equal(new Set(names.map(key)).size, names.length, 'a department is listed twice');
  assert.ok(names.length >= 110);
  for (const city of ['Pembroke Pines', 'Coral Springs', 'Hialeah Gardens', 'Miami Beach', 'Palm Beach', 'Stuart', 'Port St. Lucie']) {
    assert.deepEqual(jurisdictionFor(hit(city.toUpperCase()), names), { jurisdiction: city, inDirectory: true }, city);
  }
  // Names the Hub already used keep their form.
  assert.equal(jurisdictionFor(hit('WELLINGTON'), names).jurisdiction, 'Village of Wellington');
  assert.equal(jurisdictionFor(hit('MIAMI', 'Miami-Dade County'), names).jurisdiction, 'City of Miami');
  assert.equal(jurisdictionFor(hit('LAKE WORTH'), names).jurisdiction, 'Lake Worth Beach');
  // New departments have no email yet, like the ones already there.
  assert.equal(JURISDICTIONS.find((entry) => entry.name === 'Coral Springs').email, '');
});
