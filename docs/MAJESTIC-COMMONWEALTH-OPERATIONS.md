# Majestic → Commonwealth: operations and contractor onboarding

This read-only addition does not replace the original Majestic contractor portal, owner admin, existing Commonwealth SSO or `/api/commonwealth/summary`.

## Endpoint

- `GET https://hub.majesticpermits.com/api/commonwealth/operations`
- **Server-to-server only.** Header: `Authorization: Bearer <COMMONWEALTH_SSO_SECRET>`.
- Keep the shared secret and Supabase service-role credential in server environment variables. Never place them in browser code, URLs or logs.
- The endpoint verifies the shared secret, the configured owner account and Majestic admin authorization before querying.
- It returns `Cache-Control: private, no-store`. Failed authentication returns 401/403 and unconfigured/data errors return 503, never fabricated zero counts.
- There are no writes or database migrations.

## What's included

- Existing contractor directory and **profile-readiness** assessment, derived from linked portal login, license number/expiration and insurance policy/expiration.
- Pending contractor requests derived from `jobs.sub_status = "Pending request"` (the currently used workflow), **not** the legacy `job_requests` table.
- Majestic-only active jobs, submitted, under review, corrections, approved-ready-to-build, recent submissions and 7+-day activity gaps.
- New Majestic leads from `public_leads`, excluding PermitCloser leads.
- A limited attention queue for requests, corrections and records without a recent update.
- Original Majestic admin deep links. Use the existing verified SSO flow to open restricted dashboards.
- An `asOf` timestamp, source identification, and explicit limitations.

## Important interpretation

- A complete portal/profile record does **not** prove the contractor has completed signed agreements, payments or all onboarding steps.
- A job with no recorded update in seven days warrants review, but is **not** proof of a building-department delay.
- The feed does **not** include financial data, paid fees, Stripe transactions or homeowner email addresses.
- Legacy unbranded jobs are included; records explicitly branded The Permit Closer are excluded.
- If the connection fails, display a connection warning and last successful synchronization time; never show failure as zero jobs.

## Commonwealth user interface mapping

Use this source to populate Majestic's workspace in the already approved cinematic Commonwealth dashboard:

1. KPI tiles: active jobs, in review, corrections, submitted this week, pending requests.
2. Onboarding section: portal account linked, license/COI status, contractor contact and profile attention list.
3. Project attention queue: corrections, new requests, and no-update jobs.
4. Existing portal navigation: `/admin`, `/admin/contractors`, `/admin/job-requests`, original download report.
5. Drill down through authenticated Majestic pages. Keep the original data in the contractor portal; do not copy it into another job database.

## Testing and review before any deployment

- Run on Node 22+: `node --experimental-strip-types --test scripts/tests/majestic-commonwealth-operations.test.mjs`.
- Validate unauthorized, missing secret, unverified owner, and missing database-table behavior.
- Reconcile totals with Majestic `/admin` and `/admin/job-requests` against the same real records.
- Verify original SSO, direct sign-in, contractor access isolation and `/api/commonwealth/summary` remain unchanged.
- Have the owner approve the pull request before merging/deploying. This branch contains no production changes.