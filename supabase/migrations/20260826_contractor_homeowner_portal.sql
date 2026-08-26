-- ============================================================
-- Contractor + Homeowner portal upgrade
-- Additive, idempotent migration for MajesticPermitsHUB
-- Safe to run on the existing production database.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Jobs: submitted_date column (permit_number & permit_eta already exist)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'jobs' and column_name = 'submitted_date'
  ) then
    alter table jobs add column submitted_date date;
  end if;
end $$;

-- ------------------------------------------------------------
-- 2. homeowner_links: sharing controls
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns
    where table_name='homeowner_links' and column_name='enabled') then
    alter table homeowner_links add column enabled boolean not null default true;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='homeowner_links' and column_name='expires_at') then
    alter table homeowner_links add column expires_at timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='homeowner_links' and column_name='view_count') then
    alter table homeowner_links add column view_count integer not null default 0;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='homeowner_links' and column_name='regenerated_at') then
    alter table homeowner_links add column regenerated_at timestamptz;
  end if;
end $$;

-- ------------------------------------------------------------
-- 3. Job documents (with Approved Permit category)
-- ------------------------------------------------------------
create table if not exists job_documents (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references jobs(id) on delete cascade,
  category          text not null check (category in (
                      'intake',
                      'submitted_package',
                      'corrections',
                      'approved_permit',
                      'inspections',
                      'closeout',
                      'other')),
  label             text,
  storage_path      text not null,      -- path inside the 'job-documents' bucket
  file_name         text not null,
  mime_type         text,
  size_bytes        bigint,
  visible_to_contractor boolean not null default true,
  visible_to_homeowner  boolean not null default false,
  uploaded_by       uuid,               -- auth user id
  created_at        timestamptz not null default now()
);

create index if not exists idx_job_documents_job on job_documents (job_id, category);

-- ------------------------------------------------------------
-- 4. Fixed 3-slot inspections per job
-- ------------------------------------------------------------
create table if not exists job_inspections (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references jobs(id) on delete cascade,
  slot              smallint not null check (slot in (1,2,3)),
  inspection_type   text,
  status            text not null default 'not_required' check (status in (
                      'not_required','not_requested','requested','scheduled',
                      'passed','partial_pass','failed','reinspection_requested',
                      'reinspection_scheduled','cancelled','closed')),
  requested_date    date,
  scheduled_date    date,
  result_date       date,
  inspector_name    text,
  inspector_number  text,
  correction_notes  text,
  attachment_path   text,
  visible_to_homeowner boolean not null default false,
  updated_at        timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  unique (job_id, slot)
);

create index if not exists idx_job_inspections_job on job_inspections (job_id);

-- Seed three empty slots for every existing job
insert into job_inspections (job_id, slot, status)
select j.id, s.slot, 'not_required'
from jobs j
cross join (values (1),(2),(3)) as s(slot)
on conflict (job_id, slot) do nothing;

-- Trigger: whenever a new job is created, seed its three inspection slots
create or replace function ensure_job_inspection_slots() returns trigger
language plpgsql as $$
begin
  insert into job_inspections (job_id, slot, status)
  values (new.id, 1, 'not_required'),
         (new.id, 2, 'not_required'),
         (new.id, 3, 'not_required')
  on conflict (job_id, slot) do nothing;
  return new;
end$$;

drop trigger if exists trg_ensure_job_inspection_slots on jobs;
create trigger trg_ensure_job_inspection_slots
after insert on jobs
for each row execute function ensure_job_inspection_slots();

-- ------------------------------------------------------------
-- 5. Quotes lifecycle upgrade (contractor vs homeowner bill-to,
--    approval trail, expiry, versioning)
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns
    where table_name='quotes' and column_name='bill_to') then
    alter table quotes add column bill_to text
      check (bill_to in ('contractor','homeowner')) default 'homeowner';
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='quotes' and column_name='approval_token') then
    alter table quotes add column approval_token text unique;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='quotes' and column_name='approved_at') then
    alter table quotes add column approved_at timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='quotes' and column_name='approved_by_name') then
    alter table quotes add column approved_by_name text;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='quotes' and column_name='declined_at') then
    alter table quotes add column declined_at timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='quotes' and column_name='expires_at') then
    alter table quotes add column expires_at timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='quotes' and column_name='version') then
    alter table quotes add column version integer not null default 1;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='quotes' and column_name='replaces_quote_id') then
    alter table quotes add column replaces_quote_id uuid references quotes(id);
  end if;
end $$;

-- ------------------------------------------------------------
-- 6. Storage bucket for job documents (idempotent)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('job-documents', 'job-documents', false)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 7. Row Level Security
-- ------------------------------------------------------------
alter table job_documents   enable row level security;
alter table job_inspections enable row level security;

-- Admin-only management (uses the existing is_admin() function if present)
do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    execute 'drop policy if exists "Admin manages job_documents" on job_documents';
    execute 'create policy "Admin manages job_documents" on job_documents for all to authenticated using (is_admin()) with check (is_admin())';

    execute 'drop policy if exists "Admin manages job_inspections" on job_inspections';
    execute 'create policy "Admin manages job_inspections" on job_inspections for all to authenticated using (is_admin()) with check (is_admin())';
  end if;
end $$;

-- Contractors can read documents/inspections for jobs assigned to them
drop policy if exists "Contractor reads own job_documents" on job_documents;
create policy "Contractor reads own job_documents"
on job_documents for select to authenticated
using (
  visible_to_contractor = true and exists (
    select 1 from jobs j
    join contractors c on c.id = j.contractor_id
    where j.id = job_documents.job_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists "Contractor reads own job_inspections" on job_inspections;
create policy "Contractor reads own job_inspections"
on job_inspections for select to authenticated
using (
  exists (
    select 1 from jobs j
    join contractors c on c.id = j.contractor_id
    where j.id = job_inspections.job_id and c.auth_user_id = auth.uid()
  )
);

-- Note: the public homeowner tracking page uses the service-role key
-- inside a Next.js server component, so no anon RLS policy is needed
-- for job_documents / job_inspections. That page filters explicitly
-- on visible_to_homeowner = true before returning any row.

comment on table job_documents   is 'Files attached to a job (intake, submitted, approved permit, etc.)';
comment on table job_inspections is 'Exactly three inspection slots per job (roofing/windows workflow).';
