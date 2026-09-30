# MajesticPermitsHUB

Permit expediting for South Florida contractors and homeowners. Public site: [majesticpermits.com](https://majesticpermits.com).

## Run this in Supabase before the public form can save leads

`supabase/migrations/20260930_public_leads.sql`

That creates `public_leads`. A website submission from someone we do not already know is a **lead**, not a job. If the email or phone matches a contractor, homeowner, or existing job, the form opens a job on that account instead (`stage` = Getting your project ready, `sub_status` = Pending request) and does not create a second person.

## Environment variables

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Already on Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Already on Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` |
| `NEXT_PUBLIC_ADMIN_EMAIL` | `angelique@majesticpermits.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://majesticpermits.com` |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → API keys |
| `RESEND_API_KEY` | Resend → API Keys. Already used. |
| `RESEND_FROM_EMAIL` | Internal sender only, for example `request@majesticpermits.com`. Visitors never see this. |
| `NOTION_TOKEN` | Notion internal integration token. Optional. If missing, the Hub lead and the email still save. |
| `NOTION_LEADS_DATABASE_ID` | One Notion database for every public lead and every job the form opens. Optional, same rule as the token. |
| `LEAD_INGEST_SECRET` | Unchanged. Still guards `/api/ingest/permit-closer` only. |

Public mail on the website is `hello@majesticpermits.com`. `request@majesticpermits.com` stays the FROM address on admin mail.

### Notion database properties

Name (title), Phone, Email, Property address, Project type, Brand (select: Majestic Permits, The Permit Closer, Permit AIO), Source, Status (New), Created, Hub record id.

Permit AIO is reserved on the Brand select so that product can land in the same database later. It is not a choice on the public form, and this repo does not contain Permit AIO.

## Logos

Drop PNGs here when you have them. Until then the site uses a violet “M”.

- `/public/logos/majestic_permits_logo.png`
- `/public/logos/permit_closer_logo.png`

Work photos, when you have real ones (no stock):

- `/public/work/weston-window-permit-approved.jpg`
- `/public/work/broward-reroof-sealed-plans.jpg`
- `/public/work/miami-dade-impact-door-before-after.jpg`
- `/public/work/plantation-opening-protection-schedule.jpg`
- `/public/work/majestic-permits-field-vehicle.jpg`
- `/public/work/majestic-permits-owner.jpg`

Favicon placeholders are in `/public/icons/`.

## Do not deploy until the new env vars are set

`NOTION_TOKEN` and `NOTION_LEADS_DATABASE_ID` can be blank — the form still saves and still emails `hello@`. The SQL migration above has to be applied or a brand-new person will get an error instead of a lead.
