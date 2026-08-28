-- ============================================================
-- Roofing document workflow + RAS 127 uplift calculations
-- Additive, idempotent migration for MajesticPermitsHUB
-- Safe to run repeatedly on the existing production database.
--
-- Adds:
--   1. Extra job_documents categories (roofing forms, NOA, calcs, cost estimate)
--   2. permit_form_templates  - catalog of jurisdiction forms
--   3. job_roofing_systems    - the roof system being permitted
--   4. job_form_checklist     - required-form checklist per job
--   5. job_roof_calculations  - RAS 127 / RAS 128 worksheets
--   6. Package readiness view (Cost Estimate gate)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Extend job_documents categories
--    The original CHECK constraint is replaced with a superset,
--    so every existing row stays valid.
-- ------------------------------------------------------------
do $$
declare
  con_name text;
begin
  select conname into con_name
  from pg_constraint
  where conrelid = 'job_documents'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%category%';

  if con_name is not null then
    execute format('alter table job_documents drop constraint %I', con_name);
  end if;

  alter table job_documents
    add constraint job_documents_category_check
    check (category in (
      'intake',
      'submitted_package',
      'corrections',
      'approved_permit',
      'inspections',
      'closeout',
      -- added 2026-08-27 for the roofing workflow
      'roofing_form',
      'product_approval',   -- NOA / Florida Product Approval
      'design_calculations',-- Chapter 16 / RAS 127 / RAS 128 output
      'cost_estimate',
      'other'));
end $$;

-- ------------------------------------------------------------
-- 2. Form template catalog
--    One row per blank jurisdiction form we can hand a contractor.
--    `applies_to` is a jsonb rule object evaluated in app code:
--      { "roof_systems": [...], "work_types": [...], "jurisdictions": [...] }
-- ------------------------------------------------------------
create table if not exists permit_form_templates (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,     -- stable machine key, e.g. 'hvhz_uniform_permit_app'
  title          text not null,
  authority      text,                     -- e.g. 'FBC 8th Edition (2023) Section 1525'
  jurisdiction   text,                     -- null = applies statewide / all HVHZ
  trade_type     text not null default 'roofing',
  storage_path   text,                      -- path in the 'form-templates' bucket
  public_path    text,                      -- served from /public, e.g. '/forms/roofing/...pdf'
  applies_to     jsonb not null default '{}'::jsonb,
  requires_notary   boolean not null default false,
  requires_owner_signature boolean not null default false,
  requires_contractor_signature boolean not null default false,
  attachment_group text,                    -- HVHZ attachment number (1-7) where relevant
  sort_order     integer not null default 100,
  active         boolean not null default true,
  notes          text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_permit_form_templates_lookup
  on permit_form_templates (trade_type, jurisdiction, active, sort_order);

-- ------------------------------------------------------------
-- 3. The roof system being permitted (one per job)
--    Feeds both the checklist rules and the RAS 127 calculator.
-- ------------------------------------------------------------
create table if not exists job_roofing_systems (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null unique references jobs(id) on delete cascade,

  -- What is being installed
  roof_system       text check (roof_system in (
                      'low_slope',
                      'prescriptive_bur_ras150',
                      'asphalt_shingles',
                      'mechanically_fastened_tile',
                      'mortar_adhesive_set_tile',
                      'metal_panel_shingles',
                      'wood_shingles_shakes',
                      'other')),
  work_type         text check (work_type in ('new_roof', 'reroof', 'repair')),
  roof_area_sf      numeric(10,2),

  -- Product approval
  product_approval_type text check (product_approval_type in ('noa', 'florida_product_approval', 'other')),
  noa_number        text,
  noa_holder        text,
  noa_expires_on    date,
  manufacturer      text,
  product_name      text,

  -- Geometry / structure (RAS 127 inputs)
  deck_type         text,
  mean_roof_height_ft numeric(6,2),
  roof_slope_rise   numeric(5,2),           -- rise in a rise:12 slope
  roof_pitch_deg    numeric(5,2),
  exposure_category text check (exposure_category in ('B','C','D')),
  design_wind_speed_mph integer,
  risk_category     text check (risk_category in ('I','II','III','IV')),
  tile_profile      text check (tile_profile in ('high','low','flat')),
  attachment_method text,                   -- 'mortar_set','adhesive_set','mechanically_fastened','battens'

  -- Compliance flags
  asbestos_survey_status text not null default 'unconfirmed'
                      check (asbestos_survey_status in ('unconfirmed','not_applicable','on_file','pending')),
  asbestos_note     text,
  roof_to_wall_required boolean,            -- FS 553.844 / FEBC 706.8 trigger
  insured_value_usd numeric(12,2),
  year_permitted    integer,

  notes             text,
  updated_at        timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists idx_job_roofing_systems_job on job_roofing_systems (job_id);

-- ------------------------------------------------------------
-- 4. Per-job required-form checklist
-- ------------------------------------------------------------
create table if not exists job_form_checklist (
  id             uuid primary key default gen_random_uuid(),
  job_id         uuid not null references jobs(id) on delete cascade,
  template_code  text not null,             -- references permit_form_templates.code (soft ref)
  title          text not null,             -- denormalised so history survives catalog edits
  required       boolean not null default true,
  status         text not null default 'not_started' check (status in (
                   'not_started',
                   'sent_to_contractor',
                   'uploaded',
                   'signed',
                   'notarized',
                   'accepted',
                   'waived')),
  document_id    uuid references job_documents(id) on delete set null,
  waived_reason  text,
  notes          text,
  sort_order     integer not null default 100,
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (job_id, template_code)
);

create index if not exists idx_job_form_checklist_job on job_form_checklist (job_id, sort_order);

-- ------------------------------------------------------------
-- 5. RAS 127 / RAS 128 calculation worksheets
--    Inputs and results are stored as jsonb so the worksheet can
--    evolve without a migration, but the headline numbers are
--    also columns so they are queryable and printable.
-- ------------------------------------------------------------
create table if not exists job_roof_calculations (
  id             uuid primary key default gen_random_uuid(),
  job_id         uuid not null references jobs(id) on delete cascade,
  method         text not null default 'ras127_m1' check (method in (
                   'ras127_m1',   -- RAS 127 Method 1 - tile uplift moment
                   'ras128',      -- RAS 128 - mortar/adhesive set (separate standard)
                   'chapter16',   -- ASCE 7 component & cladding
                   'engineered')),-- signed & sealed site-specific analysis

  label          text,
  inputs         jsonb not null default '{}'::jsonb,
  results        jsonb not null default '{}'::jsonb,

  -- Headline outputs (RAS 127 M1)
  qh_psf             numeric(10,4),   -- velocity pressure at mean roof height
  mf_ft_lbf          numeric(10,4),   -- aerodynamic uplift moment
  mg_ft_lbf          numeric(10,4),   -- resisting moment from tile self weight
  mr_required_ft_lbf numeric(10,4),   -- required resistance (Mf - Mg)
  mr_noa_ft_lbf      numeric(10,4),   -- tested resistance from the NOA
  passes             boolean,
  requires_engineering boolean not null default false,
  engineering_reason text,

  -- Provenance - this is a code-compliance number, so record who ran it
  calculated_by  uuid,
  standard_ref   text,                -- e.g. 'RAS 127 (2023), FBC 8th Ed.'
  reviewed_by_pe text,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists idx_job_roof_calculations_job
  on job_roof_calculations (job_id, created_at desc);

-- ------------------------------------------------------------
-- 6. Package readiness
--    A Cost Estimate document is required before a package can be
--    marked internally complete. Exposed as a view so both the
--    admin UI and the API read one definition.
-- ------------------------------------------------------------
create or replace view job_package_readiness as
select
  j.id as job_id,
  exists (
    select 1 from job_documents d
    where d.job_id = j.id and d.category = 'cost_estimate'
  ) as has_cost_estimate,
  exists (
    select 1 from job_documents d
    where d.job_id = j.id and d.category = 'product_approval'
  ) as has_product_approval,
  exists (
    select 1 from job_roof_calculations c
    where c.job_id = j.id
  ) as has_calculations,
  coalesce((
    select count(*) from job_form_checklist f
    where f.job_id = j.id and f.required
      and f.status not in ('accepted', 'waived')
  ), 0) as outstanding_forms,
  coalesce((
    select rs.asbestos_survey_status from job_roofing_systems rs
    where rs.job_id = j.id
  ), 'unconfirmed') as asbestos_survey_status
from jobs j;

-- ------------------------------------------------------------
-- 7. Storage bucket for blank form templates
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('form-templates', 'form-templates', false)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 8. Row Level Security
-- ------------------------------------------------------------
alter table permit_form_templates   enable row level security;
alter table job_roofing_systems     enable row level security;
alter table job_form_checklist      enable row level security;
alter table job_roof_calculations   enable row level security;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    execute 'drop policy if exists "Admin manages permit_form_templates" on permit_form_templates';
    execute 'create policy "Admin manages permit_form_templates" on permit_form_templates for all to authenticated using (is_admin()) with check (is_admin())';

    execute 'drop policy if exists "Admin manages job_roofing_systems" on job_roofing_systems';
    execute 'create policy "Admin manages job_roofing_systems" on job_roofing_systems for all to authenticated using (is_admin()) with check (is_admin())';

    execute 'drop policy if exists "Admin manages job_form_checklist" on job_form_checklist';
    execute 'create policy "Admin manages job_form_checklist" on job_form_checklist for all to authenticated using (is_admin()) with check (is_admin())';

    execute 'drop policy if exists "Admin manages job_roof_calculations" on job_roof_calculations';
    execute 'create policy "Admin manages job_roof_calculations" on job_roof_calculations for all to authenticated using (is_admin()) with check (is_admin())';
  end if;
end $$;

-- Every signed-in user may read the blank form catalog
drop policy if exists "Authenticated reads active form templates" on permit_form_templates;
create policy "Authenticated reads active form templates"
on permit_form_templates for select to authenticated
using (active = true);

-- Contractors may read their own job's roofing system, checklist and calcs
drop policy if exists "Contractor reads own job_roofing_systems" on job_roofing_systems;
create policy "Contractor reads own job_roofing_systems"
on job_roofing_systems for select to authenticated
using (
  exists (
    select 1 from jobs j
    join contractors c on c.id = j.contractor_id
    where j.id = job_roofing_systems.job_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists "Contractor reads own job_form_checklist" on job_form_checklist;
create policy "Contractor reads own job_form_checklist"
on job_form_checklist for select to authenticated
using (
  exists (
    select 1 from jobs j
    join contractors c on c.id = j.contractor_id
    where j.id = job_form_checklist.job_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists "Contractor reads own job_roof_calculations" on job_roof_calculations;
create policy "Contractor reads own job_roof_calculations"
on job_roof_calculations for select to authenticated
using (
  exists (
    select 1 from jobs j
    join contractors c on c.id = j.contractor_id
    where j.id = job_roof_calculations.job_id and c.auth_user_id = auth.uid()
  )
);

comment on table permit_form_templates is 'Catalog of blank jurisdiction permit forms (roofing first).';
comment on table job_roofing_systems   is 'The roof system being permitted; drives checklist rules and RAS 127 inputs.';
comment on table job_form_checklist    is 'Required-form checklist per job, one row per required form.';
comment on table job_roof_calculations is 'RAS 127 / RAS 128 / Chapter 16 uplift worksheets with provenance.';
comment on view  job_package_readiness is 'Gate for marking a permit package internally complete (Cost Estimate required).';
