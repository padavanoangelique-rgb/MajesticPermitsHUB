-- Adds source identifiers only; no contractor-facing table columns are read by the UI.
-- Existing jobs, permits and homeowner links remain unchanged.
alter table public.jobs
  add column if not exists lead_generator_sale_id uuid;
alter table public.jobs
  add column if not exists lead_generator_lead_id uuid;

create unique index if not exists idx_jobs_lead_generator_sale_once
  on public.jobs (lead_generator_sale_id)
  where lead_generator_sale_id is not null;
