-- County permit forms: what the contractor's company and each job need to carry so the permit application and the
-- Notice of Commencement fill themselves. Additive. Safe to run more than once.

-- The company: where the contractor is, who the qualifier is, the business tax receipt.
alter table contractor_companies add column if not exists phone text;
alter table contractor_companies add column if not exists email text;
alter table contractor_companies add column if not exists address text;
alter table contractor_companies add column if not exists city text;
alter table contractor_companies add column if not exists state text default 'FL';
alter table contractor_companies add column if not exists zip text;
alter table contractor_companies add column if not exists qualifier_name text;
alter table contractor_companies add column if not exists business_tax_receipt_number text;

-- The job: the parcel and what is being built. The folio and the legal description are the two things the property
-- appraiser holds, so the property lookup writes them here when it can; until then the contractor types them once.
alter table jobs add column if not exists folio_number text;
alter table jobs add column if not exists legal_description text;
alter table jobs add column if not exists property_city text;
alter table jobs add column if not exists property_zip text;
alter table jobs add column if not exists property_unit text;
alter table jobs add column if not exists work_description text;
