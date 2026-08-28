-- Product approval library, company profile, product selection per job, and
-- package export tracking.
--
-- Additive and idempotent: safe to run more than once, and it does not alter or
-- drop anything created by earlier migrations.
--
-- Why this exists: the roofing forms need three kinds of data merged together.
--   1. Boilerplate that never changes per job  -> company_profile
--   2. Product-specific approval values         -> product_approvals + tile_attachment_values
--   3. Job-specific selections and calculations -> job_product_selections
-- The form filler reads all three plus the existing job / job_roofing_systems
-- records. Nothing about a product is ever hardcoded in application code.

-- ---------------------------------------------------------------------------
-- 1. Company profile: the "data that doesn't change"
-- ---------------------------------------------------------------------------
-- Keyed to contractor_id because jobs.contractor_id already exists and the
-- portal is multi-contractor: each company's licence details differ, and the
-- forms must carry the licence of the contractor pulling that permit. A null
-- contractor_id is the house default, used when a job has no contractor set.
create table if not exists public.company_profile (
  id                    uuid primary key default gen_random_uuid(),
  contractor_id         uuid references public.contractors(id) on delete cascade,
  -- Lets us supersede a profile rather than overwrite it when a qualifier or
  -- licence changes, so a form reprinted later still explains what was filed.
  is_active             boolean not null default true,

  company_name          text,
  business_address_1    text,
  business_address_2    text,
  city                  text,
  state                 text default 'FL',
  zip_code              text,
  phone                 text,
  email                 text,

  -- Qualifier / licence holder, as it must appear on the applications.
  qualifier_name        text,
  license_type          text,           -- e.g. 'CCC', 'CGC'
  license_number        text,
  qualifier_phone       text,

  -- Roofing contractor block, when different from the qualifier above.
  roofing_company_name  text,
  roofing_license_type  text,
  roofing_license_number text,

  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- One active profile per contractor, and one active house default.
create unique index if not exists company_profile_active_per_contractor
  on public.company_profile (contractor_id)
  where is_active and contractor_id is not null;

create unique index if not exists company_profile_active_default
  on public.company_profile ((true))
  where is_active and contractor_id is null;

comment on table public.company_profile is
  'Contractor boilerplate merged into every generated permit form. Filled once per contractor.';

-- ---------------------------------------------------------------------------
-- 2. Product approval library (NOA / Florida Product Approval)
-- ---------------------------------------------------------------------------
create table if not exists public.product_approvals (
  id                uuid primary key default gen_random_uuid(),

  product_category  text not null check (product_category in (
                      'tile', 'underlayment', 'adhesive', 'fastener',
                      'shingle', 'metal', 'accessory', 'other')),

  approval_type     text not null default 'noa'
                      check (approval_type in ('noa', 'florida_product_approval', 'other')),
  approval_number   text not null,          -- e.g. '24-1008.09' or 'FL5259.1'
  manufacturer      text,
  product_name      text,
  product_profile   text,                   -- e.g. 'Medium Profile Concrete Tile'

  approval_date     date,
  expiration_date   date,

  -- Physical properties, tile only. Nullable for other categories.
  weight_lbf        numeric(8,3),
  length_ft         numeric(8,4),
  width_ft          numeric(8,4),

  -- Where the document came from and where the stored copy lives.
  source_url        text,
  storage_path      text,                   -- path inside the product-approvals bucket
  page_count        integer,

  -- Anything a human still needs to check, e.g. a table row that did not
  -- transcribe cleanly. Non-empty means the record is not export-ready.
  needs_verification boolean not null default false,
  verification_notes text,

  raw_extract       jsonb,                  -- full extraction payload w/ page evidence
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (approval_type, approval_number, product_name)
);

create index if not exists product_approvals_category_idx
  on public.product_approvals (product_category);
create index if not exists product_approvals_expiration_idx
  on public.product_approvals (expiration_date);

comment on column public.product_approvals.needs_verification is
  'True when any transcribed value was ambiguous. Blocks package export.';

-- ---------------------------------------------------------------------------
-- 3. Tile attachment values, straight out of the NOA tables
-- ---------------------------------------------------------------------------

-- Aerodynamic multiplier lambda (NOA Table 2) and restoring moment Mg
-- (NOA Table 3). Mg varies by slope, lambda does not, so both are stored per
-- (application, slope) row with lambda repeated - it keeps lookups single-row
-- and avoids a join for the common case.
create table if not exists public.tile_attachment_values (
  id                  uuid primary key default gen_random_uuid(),
  product_approval_id uuid not null references public.product_approvals(id) on delete cascade,

  application         text not null check (application in ('direct_deck', 'batten', 'adhesive_set', 'mortar_set')),

  -- Slope band exactly as the NOA prints it, plus a numeric range so we can
  -- match a job's slope without parsing the label.
  slope_label         text,                 -- e.g. '2" & 3":12', '7":12 or greater'
  slope_min_rise      numeric(5,2),
  slope_max_rise      numeric(5,2),         -- null means "or greater"

  lambda_ft3          numeric(8,4),         -- Table 2
  mg_ft_lbf           numeric(8,3),         -- Table 3, null where the NOA prints N/A

  evidence_page       integer,
  needs_verification  boolean not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists tile_attachment_values_product_idx
  on public.tile_attachment_values (product_approval_id, application);

-- Attachment resistance Mf (NOA Tables 4 and 5). One row per
-- fastener/adhesive option per deck condition, because Mf is what the
-- calculator compares against and the installer picks it.
create table if not exists public.tile_attachment_resistance (
  id                  uuid primary key default gen_random_uuid(),
  product_approval_id uuid not null references public.product_approvals(id) on delete cascade,

  system_type         text not null check (system_type in ('nail_on', 'adhesive_set', 'mortar_set', 'clip', 'screw')),

  -- For nail-on: the fastener description as printed. For adhesive: product name.
  attachment_label    text not null,        -- e.g. '2-10d Ring Shank Nails'
  deck_condition      text,                 -- '15_32_plywood' | '19_32_plywood' | 'battens' | null
  paddy_weight        text,                 -- adhesive only, e.g. '8 grams each'
  contact_area        text,                 -- adhesive only

  mf_ft_lbf           numeric(8,3) not null,

  -- Footnote text that changes how the value may be used, e.g. the Eagle
  -- footnote requiring a 4" headlap and fasteners 2.5" from the tile head.
  footnote            text,

  -- An adhesive-set row usually depends on a separate component approval.
  component_approval_id uuid references public.product_approvals(id) on delete set null,

  evidence_page       integer,
  needs_verification  boolean not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists tile_attachment_resistance_product_idx
  on public.tile_attachment_resistance (product_approval_id, system_type);

-- ---------------------------------------------------------------------------
-- 4. What was selected for a given job
-- ---------------------------------------------------------------------------
create table if not exists public.job_product_selections (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid not null references public.jobs(id) on delete cascade,

  role                text not null check (role in ('tile', 'underlayment', 'adhesive', 'fastener', 'accessory')),
  product_approval_id uuid references public.product_approvals(id) on delete set null,

  -- The specific rows chosen from the NOA, so the calculation and the filled
  -- form both reference an auditable selection rather than a loose number.
  attachment_values_id    uuid references public.tile_attachment_values(id) on delete set null,
  attachment_resistance_id uuid references public.tile_attachment_resistance(id) on delete set null,

  -- Free-text capture for products that are not yet in the library.
  manual_product_name text,
  manual_approval_number text,

  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (job_id, role)
);

create index if not exists job_product_selections_job_idx
  on public.job_product_selections (job_id);

-- ---------------------------------------------------------------------------
-- 5. Generated package exports
-- ---------------------------------------------------------------------------
create table if not exists public.job_package_exports (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references public.jobs(id) on delete cascade,

  storage_path    text not null,            -- zip inside job-documents
  file_name       text,
  byte_size       bigint,

  -- Snapshot of what went in, so a reviewer can tell two exports apart.
  included_forms  jsonb,                    -- [{code, file_name, filled: bool, overlay: bool}]
  included_approvals jsonb,                 -- [{approval_number, product_name, expiration_date}]
  calculation_id  uuid references public.job_roof_calculations(id) on delete set null,

  -- Blocking problems found at export time, e.g. an expired approval.
  warnings        jsonb,

  generated_by    uuid,
  created_at      timestamptz not null default now()
);

create index if not exists job_package_exports_job_idx
  on public.job_package_exports (job_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 6. Storage bucket for approval documents
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-approvals', 'product-approvals', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Convenience view: approval status against today's date
-- ---------------------------------------------------------------------------
create or replace view public.product_approval_status as
select
  pa.id,
  pa.product_category,
  pa.approval_number,
  pa.manufacturer,
  pa.product_name,
  pa.expiration_date,
  (pa.expiration_date - current_date)                as days_until_expiry,
  case
    when pa.expiration_date is null then 'unknown'
    when pa.expiration_date < current_date then 'expired'
    when pa.expiration_date < current_date + 60 then 'expiring_soon'
    else 'current'
  end                                                as expiry_status,
  pa.needs_verification,
  pa.verification_notes
from public.product_approvals pa;

-- ---------------------------------------------------------------------------
-- 8. Row level security
-- ---------------------------------------------------------------------------
alter table public.company_profile             enable row level security;
alter table public.product_approvals           enable row level security;
alter table public.tile_attachment_values      enable row level security;
alter table public.tile_attachment_resistance  enable row level security;
alter table public.job_product_selections      enable row level security;
alter table public.job_package_exports         enable row level security;

-- is_admin() is not created by any migration in this repo - it already exists
-- in the deployed database. Guarding on it keeps a fresh database from failing
-- here, matching how the two earlier migrations handle the same function.
do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    -- Admin full access on all six tables.
    if not exists (select 1 from pg_policies where tablename = 'company_profile' and policyname = 'company_profile_admin_all') then
      create policy company_profile_admin_all on public.company_profile
        for all using (public.is_admin()) with check (public.is_admin());
    end if;

    if not exists (select 1 from pg_policies where tablename = 'product_approvals' and policyname = 'product_approvals_admin_all') then
      create policy product_approvals_admin_all on public.product_approvals
        for all using (public.is_admin()) with check (public.is_admin());
    end if;

    if not exists (select 1 from pg_policies where tablename = 'tile_attachment_values' and policyname = 'tile_values_admin_all') then
      create policy tile_values_admin_all on public.tile_attachment_values
        for all using (public.is_admin()) with check (public.is_admin());
    end if;

    if not exists (select 1 from pg_policies where tablename = 'tile_attachment_resistance' and policyname = 'tile_resistance_admin_all') then
      create policy tile_resistance_admin_all on public.tile_attachment_resistance
        for all using (public.is_admin()) with check (public.is_admin());
    end if;

    if not exists (select 1 from pg_policies where tablename = 'job_product_selections' and policyname = 'job_products_admin_all') then
      create policy job_products_admin_all on public.job_product_selections
        for all using (public.is_admin()) with check (public.is_admin());
    end if;

    if not exists (select 1 from pg_policies where tablename = 'job_package_exports' and policyname = 'job_exports_admin_all') then
      create policy job_exports_admin_all on public.job_package_exports
        for all using (public.is_admin()) with check (public.is_admin());
    end if;
  end if;

  -- The approval library is reference data every authenticated user may read;
  -- it contains no customer information.
  if not exists (select 1 from pg_policies where tablename = 'product_approvals' and policyname = 'product_approvals_read_authenticated') then
    create policy product_approvals_read_authenticated on public.product_approvals
      for select using (auth.uid() is not null);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'tile_attachment_values' and policyname = 'tile_values_read_authenticated') then
    create policy tile_values_read_authenticated on public.tile_attachment_values
      for select using (auth.uid() is not null);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'tile_attachment_resistance' and policyname = 'tile_resistance_read_authenticated') then
    create policy tile_resistance_read_authenticated on public.tile_attachment_resistance
      for select using (auth.uid() is not null);
  end if;
end $$;
