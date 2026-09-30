-- Public website leads. A lead is not a job.
-- Jobs are created only when the email or phone already matches a customer.
-- Idempotent. Safe to run in the Supabase SQL editor.

create table if not exists public_leads (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  phone             text not null,
  email             text not null,
  property_address  text not null,
  project_type      text not null,
  brand             text not null,
  notes             text,
  source            text not null default 'majesticpermits.com landing',
  status            text not null default 'New',
  created_at        timestamptz not null default now()
);

create index if not exists idx_public_leads_email
  on public_leads (lower(email));

create index if not exists idx_public_leads_created
  on public_leads (created_at desc);

alter table public_leads enable row level security;

comment on table public_leads is
  'Inquiries from majesticpermits.com. Not a job. Service role writes; no public read policy.';
