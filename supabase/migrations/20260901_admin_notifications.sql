-- ============================================================
-- Admin dashboard notification feed
-- Additive, idempotent migration for MajesticPermitsHUB
-- Safe to run on the existing production database.
-- ============================================================

create table if not exists admin_notifications (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references jobs(id) on delete cascade,
  type       text not null,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_notifications_created
  on admin_notifications (created_at desc);

alter table admin_notifications enable row level security;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    execute 'drop policy if exists "Admin full access to admin_notifications" on admin_notifications';
    execute 'create policy "Admin full access to admin_notifications" on admin_notifications for all to authenticated using (is_admin()) with check (is_admin())';
  end if;
end $$;

comment on table admin_notifications is 'In-app notification feed shown on the admin dashboard (e.g. inspection scheduled).';
