-- ============================================================
-- Contractor portal: inspection requests without preconfigured slots
-- Idempotent + additive only. Safe to re-run.
-- ============================================================

-- 1. Extra fields on inspection_requests
do $$
begin
  if not exists (select 1 from information_schema.columns
    where table_name='inspection_requests' and column_name='request_type') then
    alter table inspection_requests
      add column request_type text not null default 'general';
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='inspection_requests' and column_name='inspection_code') then
    alter table inspection_requests add column inspection_code text;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='inspection_requests' and column_name='preferred_date') then
    alter table inspection_requests add column preferred_date date;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='inspection_requests' and column_name='requested_by_contractor_id') then
    alter table inspection_requests add column requested_by_contractor_id uuid;
  end if;

  -- Admin-entered outcome fields (contractor sees these read-only)
  if not exists (select 1 from information_schema.columns
    where table_name='inspection_requests' and column_name='scheduled_date') then
    alter table inspection_requests add column scheduled_date date;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='inspection_requests' and column_name='result') then
    alter table inspection_requests add column result text;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='inspection_requests' and column_name='result_date') then
    alter table inspection_requests add column result_date date;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='inspection_requests' and column_name='correction_notes') then
    alter table inspection_requests add column correction_notes text;
  end if;

  -- Used by the existing admin "Mark Scheduled / Dismiss" buttons
  if not exists (select 1 from information_schema.columns
    where table_name='inspection_requests' and column_name='handled_at') then
    alter table inspection_requests add column handled_at timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name='inspection_requests' and column_name='updated_at') then
    alter table inspection_requests
      add column updated_at timestamptz not null default now();
  end if;
end $$;

-- 2. Backfill inspection_code for pre-existing rows
update inspection_requests
   set inspection_code = inspection_type
 where inspection_code is null
   and inspection_type is not null;

-- 3. Constrain the new enumerations (added separately so re-runs are safe)
do $$
begin
  if not exists (select 1 from pg_constraint
    where conname = 'inspection_requests_request_type_check') then
    alter table inspection_requests
      add constraint inspection_requests_request_type_check
      check (request_type in ('general', 'final'));
  end if;

  if not exists (select 1 from pg_constraint
    where conname = 'inspection_requests_result_check') then
    alter table inspection_requests
      add constraint inspection_requests_result_check
      check (result is null or result in
        ('Passed', 'Failed', 'Partial Pass', 'Cancelled'));
  end if;
end $$;

-- 4. Helpful indexes
create index if not exists idx_inspection_requests_job
  on inspection_requests (job_id, created_at desc);

create index if not exists idx_inspection_requests_status
  on inspection_requests (status, created_at desc);

-- 5. Keep updated_at fresh
create or replace function mph_touch_inspection_request()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_touch_inspection_request on inspection_requests;
create trigger trg_touch_inspection_request
  before update on inspection_requests
  for each row execute function mph_touch_inspection_request();
