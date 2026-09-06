-- Contractor-submitted job requests (approve to create a real jobs row).
create table if not exists job_requests (
  id               uuid primary key default gen_random_uuid(),
  contractor_id    uuid not null references contractors(id) on delete cascade,
  property_address text not null,
  homeowner_name   text,
  homeowner_email  text,
  homeowner_phone  text,
  trade_type       text,
  jurisdiction     text,
  notes            text,
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'declined')),
  decline_reason   text,
  approved_job_id  uuid references jobs(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_job_requests_status
  on job_requests (status, created_at desc);

create index if not exists idx_job_requests_contractor
  on job_requests (contractor_id, created_at desc);

create table if not exists job_request_files (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references job_requests(id) on delete cascade,
  storage_path  text not null,
  file_name     text not null,
  mime_type     text,
  size_bytes    bigint,
  created_at    timestamptz not null default now()
);

create index if not exists idx_job_request_files_request
  on job_request_files (request_id);

alter table job_requests enable row level security;
alter table job_request_files enable row level security;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    execute 'drop policy if exists "Admin manages job_requests" on job_requests';
    execute 'create policy "Admin manages job_requests" on job_requests for all to authenticated using (is_admin()) with check (is_admin())';
    execute 'drop policy if exists "Admin manages job_request_files" on job_request_files';
    execute 'create policy "Admin manages job_request_files" on job_request_files for all to authenticated using (is_admin()) with check (is_admin())';
  end if;
end $$;

drop policy if exists "Contractor reads own job_requests" on job_requests;
create policy "Contractor reads own job_requests"
on job_requests for select to authenticated
using (
  exists (
    select 1 from contractors c
    where c.id = job_requests.contractor_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists "Contractor reads own job_request_files" on job_request_files;
create policy "Contractor reads own job_request_files"
on job_request_files for select to authenticated
using (
  exists (
    select 1 from job_requests r
    join contractors c on c.id = r.contractor_id
    where r.id = job_request_files.request_id and c.auth_user_id = auth.uid()
  )
);
