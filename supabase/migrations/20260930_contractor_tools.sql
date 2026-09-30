-- Contractor tools: license and insurance, filled forms, field measurements.
-- Additive. Safe to run more than once.

create table if not exists contractor_records (
  contractor_id   uuid primary key,
  license_number  text,
  license_expires date,
  coi_carrier     text,
  coi_policy      text,
  coi_expires     date,
  updated_at      timestamptz not null default now()
);

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

alter table contractor_records enable row level security;
alter table contractor_form_sends enable row level security;
alter table job_measures enable row level security;
