-- ============================================================
-- MajesticPermitsHUB schema (idempotent, additive-only)
-- Safe to run on an existing Supabase project.
-- This script does NOT drop or alter any table it did not create.
-- ============================================================

-- Email queue (used by the stage-change trigger already installed)
create table if not exists mph_email_queue (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null,
  event_type    text not null,
  payload       jsonb not null default '{}',
  status        text not null default 'pending'
                  check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts      int  not null default 0,
  last_error    text,
  created_at    timestamptz not null default now(),
  processed_at  timestamptz
);

create index if not exists idx_mph_email_queue_status
  on mph_email_queue (status, created_at);

-- Stage history for the homeowner timeline
create table if not exists mph_stage_history (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null,
  stage       text not null,
  sub_status  text,
  note        text,
  changed_by  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_mph_stage_history_job
  on mph_stage_history (job_id, created_at desc);

-- Ensure permit_eta exists on jobs (safe if already added)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'jobs' and column_name = 'permit_eta'
  ) then
    alter table jobs add column permit_eta date;
  end if;
end $$;

-- Ensure internal_notes exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'jobs' and column_name = 'internal_notes'
  ) then
    alter table jobs add column internal_notes text;
  end if;
end $$;

-- RLS for new tables
alter table mph_email_queue enable row level security;
alter table mph_stage_history enable row level security;

-- Admin-only policies (using the existing is_admin() function if present)
do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    execute 'drop policy if exists "Admin full access to mph_email_queue" on mph_email_queue';
    execute 'create policy "Admin full access to mph_email_queue" on mph_email_queue for all to authenticated using (is_admin()) with check (is_admin())';

    execute 'drop policy if exists "Admin full access to mph_stage_history" on mph_stage_history';
    execute 'create policy "Admin full access to mph_stage_history" on mph_stage_history for all to authenticated using (is_admin()) with check (is_admin())';
  end if;
end $$;

-- Comment
comment on table mph_email_queue is 'Queue of outbound emails triggered by stage changes';
comment on table mph_stage_history is 'Chronological log of stage changes for homeowner timeline';
