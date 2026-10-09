import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { adminDestination } from '../../src/lib/admin-navigation.ts';

function middleware(user) {
  const exports = {};
  const stubs = {
    'next/server': { NextResponse: { redirect: url => ({ location: String(url) }), json: (body, options) => ({ body, status: options.status }) } },
    '@/lib/supabase/middleware': { updateSession: async () => ({ user, response: { allowed: true } }) },
    '@/lib/admin': { isAdminEmail: email => email === 'owner@test' },
    '@/lib/admin-navigation': { adminDestination },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/middleware.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, require: name => stubs[name], URL });
  return async path => {
    const nextUrl = new URL(path, 'https://hub.majesticpermits.com');
    nextUrl.clone = () => new URL(nextUrl);
    return exports.middleware({ nextUrl, method: 'GET', headers: new Headers() });
  };
}

test('contractor admin tabs retain separate destinations instead of opening the contractor dashboard', async () => {
  const run = middleware({ email: 'cody@test' });
  for (const path of ['/admin/overview?embed=1', '/admin?embed=1']) {
    const url = new URL((await run(path)).location);
    assert.equal(url.pathname, '/admin-access');
    assert.equal(url.searchParams.get('next'), path);
  }
  assert.equal((await run('/api/admin/jobs')).status, 403);
});

test('owner can open both tabs and login returns to the requested embedded tab', async () => {
  const run = middleware({ email: 'owner@test' });
  assert.equal((await run('/admin/overview?embed=1')).allowed, true);
  assert.equal((await run('/admin?embed=1')).allowed, true);
  assert.equal((await run('/login?next=%2Fadmin%2Foverview%3Fembed%3D1')).location, 'https://hub.majesticpermits.com/admin/overview?embed=1');
});

test('signed-out admin navigation keeps the requested tab through login', async () => {
  const url = new URL((await middleware(null)('/admin/overview?embed=1')).location);
  assert.equal(url.pathname, '/login');
  assert.equal(url.searchParams.get('next'), '/admin/overview?embed=1');
});

test('account switching rejects external and non-admin destinations', () => {
  for (const value of ['https://evil.test', '//evil.test/admin', '/\\evil.test/admin', '/dashboard', '/admin/../../dashboard']) {
    assert.equal(adminDestination(value), '/admin/overview');
  }
});
