-- Hub contractor fixes: one company per contractor, company documents with expiration dates,
-- email-out tracking, inspection confirmation / day-of details / re-inspection fee, and the contractor
-- tool tables that never reached the production database (forms sends, measurements).
-- Additive. Safe to run more than once. Nothing here removes or rewrites an existing row except the
-- company_id backfill on contractors.

-- ---------------------------------------------------------------------------------------------------
-- 1. Companies: one row per company, users (contractors rows) link to it
-- ---------------------------------------------------------------------------------------------------
create table if not exists contractor_companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists contractor_companies_name_key
  on contractor_companies (lower(btrim(name)));

alter table contractors add column if not exists company_id uuid references contractor_companies(id) on delete set null;
create index if not exists idx_contractors_company on contractors (company_id);

-- One company per distinct company name (case and spacing ignored).
insert into contractor_companies (name)
select distinct on (lower(btrim(company_name))) btrim(company_name)
from contractors
where nullif(btrim(company_name), '') is not null
order by lower(btrim(company_name)), created_at
on conflict do nothing;

-- A contractor with no company name gets a company of their own, named after them.
insert into contractor_companies (name)
select distinct on (lower(btrim(coalesce(nullif(btrim(name), ''), email)))) btrim(coalesce(nullif(btrim(name), ''), email))
from contractors
where nullif(btrim(company_name), '') is null and coalesce(nullif(btrim(name), ''), email) is not null
order by lower(btrim(coalesce(nullif(btrim(name), ''), email))), created_at
on conflict do nothing;

update contractors c
set company_id = cc.id
from contractor_companies cc
where c.company_id is null
  and lower(btrim(coalesce(nullif(btrim(c.company_name), ''), nullif(btrim(c.name), ''), c.email))) = lower(btrim(cc.name));

-- Only the server (service role) reads and writes companies.
alter table contractor_companies enable row level security;

-- ---------------------------------------------------------------------------------------------------
-- 2. Company documents (license, insurance, ...) each with its own expiration date
-- ---------------------------------------------------------------------------------------------------
create table if not exists contractor_documents (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references contractor_companies(id) on delete cascade,
  doc_type      text not null default 'other',
  label         text,
  doc_number    text,
  expires_on    date,
  storage_path  text not null,
  file_name     text not null,
  mime_type     text,
  size_bytes    bigint,
  uploaded_by   uuid,
  created_at    timestamptz not null default now()
);
create index if not exists idx_contractor_documents_company on contractor_documents (company_id, doc_type);
alter table contractor_documents enable row level security;

-- Emails sent from the license page, and whether the building department answered.
create table if not exists contractor_doc_emails (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references contractor_companies(id) on delete cascade,
  sent_by       uuid,
  to_email      text not null,
  to_name       text,
  department    text,
  subject       text not null,
  body          text,
  document_ids  uuid[] not null default '{}',
  ref_code      text not null unique,
  status        text not null default 'sent' check (status in ('sent', 'replied', 'confirmed')),
  resend_id     text,
  sent_at       timestamptz not null default now(),
  replied_at    timestamptz,
  confirmed_at  timestamptz,
  last_reply    text
);
create index if not exists idx_contractor_doc_emails_company on contractor_doc_emails (company_id, sent_at desc);
alter table contractor_doc_emails enable row level security;

insert into storage.buckets (id, name, public)
values ('contractor-docs', 'contractor-docs', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------------------------------
-- 3. Inspections: confirmation, the day-of details, and the re-inspection fee
-- ---------------------------------------------------------------------------------------------------
alter table job_inspections add column if not exists confirmed_at timestamptz;
alter table job_inspections add column if not exists inspection_time text;
alter table job_inspections add column if not exists day_notes text;
alter table job_inspections add column if not exists reinspection_fee numeric(10, 2);
alter table job_inspections add column if not exists reinspection_fee_status text
  check (reinspection_fee_status is null or reinspection_fee_status in ('due', 'paid', 'waived'));

-- Everything already scheduled or finished before this change counts as confirmed.
update job_inspections
set confirmed_at = coalesce(updated_at, created_at, now())
where confirmed_at is null
  and status in ('scheduled', 'reinspection_scheduled', 'passed', 'partial_pass', 'failed', 'closed');

-- Every step of an inspection, so a failed visit and its re-inspection both stay on record.
create table if not exists job_inspection_events (
  id             uuid primary key default gen_random_uuid(),
  inspection_id  uuid references job_inspections(id) on delete cascade,
  job_id         uuid not null references jobs(id) on delete cascade,
  kind           text not null,
  status         text,
  event_date     date,
  inspection_time text,
  inspector_name text,
  notes          text,
  fee            numeric(10, 2),
  created_by     text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_job_inspection_events_job on job_inspection_events (job_id, created_at desc);
alter table job_inspection_events enable row level security;

-- ---------------------------------------------------------------------------------------------------
-- 4. Contractor tools whose tables were missing in production (from 20260930_contractor_tools.sql)
-- ---------------------------------------------------------------------------------------------------
create table if not exists contractor_form_sends (
  id             uuid primary key default gen_random_uuid(),
  contractor_id  uuid not null,
  job_id         uuid,
  form_key       text not null,
  fields         jsonb not null default '{}',
  signer_email   text,
  status         text not null default 'sent',
  token          text not null unique,
  signature      text,
  signed_name    text,
  signed_at      timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_contractor_form_sends_contractor
  on contractor_form_sends (contractor_id, created_at desc);

create table if not exists job_measures (
  job_id         uuid primary key,
  contractor_id  uuid not null,
  openings       jsonb not null default '[]',
  updated_at     timestamptz not null default now()
);

alter table contractor_form_sends enable row level security;
alter table job_measures enable row level security;
