import type { PDFFont, PDFTextField } from "pdf-lib";

// Fills the county permit applications and Notices of Commencement (the PDFs in ./county-pdfs) from the company and
// the job. Pure: no database, no @/ imports, so the tests run it directly.

// Field maps for the six county PDFs in ./county-pdfs: PDF field name -> the value it receives.
// Taken from the PermitAIO platform form templates. county-forms.ts drops the fields that belong to the notary
// or the signer and replaces the combined name-and-address lines, so read that file for what is actually filled.
export const COUNTY_FIELD_MAPS: Record<string, Record<string, string>> = {
  "broward-application": {
    "10-75": "job_unit",
    "11-76": "job_city",
    "12": "folio_number",
    "13": "flood_zone",
    "14": "bfe",
    "15": "floor_area",
    "16": "job_value",
    "17": "building_use",
    "18": "construction_type",
    "19": "occupancy_group",
    "20": "present_use",
    "21": "proposed_use",
    "22": "description_of_work",
    "31": "legal_description",
    "33": "client_name",
    "34": "owner_phone",
    "35": "owner_email",
    "36": "job_address",
    "37": "job_city",
    "40": "contractor_company",
    "41": "contractor_phone",
    "42": "contractor_email",
    "43": "contractor_address",
    "44": "contractor_city",
    "45": "contractor_state",
    "46": "contractor_zip",
    "47": "qualifier_name",
    "49": "contractor_license",
    "51": "business_tax_receipt_number",
    "52": "architect_name",
    "53": "architect_phone",
    "54": "architect_email",
    "55": "architect_address",
    "56": "architect_city",
    "57": "architect_state",
    "58": "architect_zip",
    "59": "bonding_company",
    "60": "bonding_address",
    "61": "bonding_city",
    "62": "bonding_state",
    "63": "bonding_zip",
    "64": "fee_simple_titleholder_name",
    "65": "fee_simple_titleholder_name",
    "66": "fee_simple_city",
    "67": "fee_simple_state",
    "68": "fee_simple_zip",
    "69": "mortgage_lender_name",
    "70": "mortgage_lender_address",
    "71": "mortgage_city",
    "72": "mortgage_state",
    "73": "mortgage_zip",
    "8_af_date": "today_date",
    "9-74": "job_address",
  },
  "broward-noc": {
    "1 DESCRIPTION OF PROPERTY Legal description  street address if available TAX FOLIO NO": "folio_number",
    "2 GENERAL DESCRIPTION OF IMPROVEMENT": "description_of_work",
    "3 OWNER INFORMATION a Name": "client_name",
    "4 CONTRACTORS NAME ADDRESS AND PHONE NUMBER 1": "contractor_company",
    "4 CONTRACTORS NAME ADDRESS AND PHONE NUMBER 2": "contractor_phone",
    "5 SURETYS NAME ADDRESS AND PHONE NUMBER AND BOND AMOUNT": "bonding_company",
    "6 LENDERS NAME ADDRESS AND PHONE NUMBER": "mortgage_lender_name",
    "Name and address of fee simple titleholder if other than Owner": "fee_simple_titleholder_name",
    "PERMIT NUMBER": "permit_number",
    "Print Name and Provide Signatorys TitleOffice": "client_name",
    "UNIT": "job_unit",
    "b Address": "job_address",
  },
  "miami-dade-application": {
    "Address": "contractor_address",
    "Address: Architect/Engineer": "architect_address",
    "Address: Bonding": "bonding_address",
    "Address: Contractor Information": "contractor_address",
    "Address: Mortgage Lander": "mortgage_lender_address",
    "Address: Property Owner's Information": "job_address",
    "City: Architect/Engineer": "architect_city",
    "City: Bonding": "bonding_city",
    "City: Contractor Information": "contractor_city",
    "City: Mortgage Lander": "mortgage_city",
    "City: Property Owner's Information": "job_city",
    "Contractor Name": "contractor_company",
    "Contractor No": "contractor_license",
    "Current use of property, line 1": "present_use",
    "Description of Work, line 1": "description_of_work",
    "Fee Payer Name": "contractor_company",
    "Folio": "folio_number",
    "Job Address": "job_address",
    "Metes and bounds": "legal_description",
    "Name: Architect/Engineer": "architect_name",
    "Name: Bonding": "bonding_company",
    "Name: Mortgage Lander": "mortgage_lender_name",
    "Owner": "client_name",
    "Phone No": "contractor_phone",
    "Phone: Architect/Engineer 2": "architect_phone",
    "Phone: Property Owner's Information": "owner_phone",
    "Print Name: Signature of Owner or Owner’s Agent": "client_name",
    "Print Name: Signature of Qualifier": "qualifier_name",
    "Print: Signature of Owner or Owner’s Agent": "client_name",
    "Print: Signature of Qualifier": "qualifier_name",
    "Qualifier Name": "qualifier_name",
    "Sq. Ft": "floor_area",
    "Value of Works": "job_value",
    "Zip: Architect/Engineer 2": "architect_zip",
    "Zip: Bonding": "bonding_zip",
    "Zip: Contractor Information": "contractor_zip",
    "Zip: Mortgage Lander": "mortgage_zip",
  },
  "miami-dade-noc": {
    "1. Legal description of property and street/address: first line": "legal_description",
    "1. Print name current owner": "client_name",
    "2. Description of improvement: first line": "description_of_work",
    "3. Name and address of fee simple titleholder": "fee_simple_titleholder_name",
    "3. Owner(s) name and address": "client_name",
    "4. Contractor’s name, address and phone number: first line": "contractor_company",
    "5. Name, address and phone number": "bonding_company",
    "6. Lender's name and address": "mortgage_lender_name",
    "Permit No": "permit_number",
    "Tax Folio No": "folio_number",
  },
  "palm-beach-application": {
    "Contractor-cert-holder": "contractor_company",
    "Legal-description": "legal_description",
    "License-number": "contractor_license",
    "Project-address": "job_address",
    "Property-owner-phone": "owner_phone",
    "Property_Owner": "client_name",
    "Property_owner_address": "job_address",
    "Property_owner_city": "job_city",
    "Property_owner_unit": "job_unit",
    "bonding-company-address-1": "bonding_address",
    "bonding-company-address-2": "bonding_address",
    "bonding-company-city": "bonding_city",
    "bonding-company-name-1": "bonding_company",
    "bonding-company-name-2": "bonding_company",
    "bonding-company-state": "bonding_state",
    "bonding-company-zip": "bonding_zip",
    "company state": "contractor_state",
    "company-city": "contractor_city",
    "company-email": "contractor_email",
    "company-name": "contractor_company",
    "company-phone": "contractor_phone",
    "company-zip": "contractor_zip",
    "contact-person": "qualifier_name",
    "contractor-address": "contractor_address",
    "contractor-printed-name": "qualifier_name",
    "design-professional-address-1": "architect_address",
    "design-professional-address-2": "architect_address",
    "design-professional-city": "architect_city",
    "design-professional-name-1": "architect_name",
    "design-professional-name-2": "architect_name",
    "design-professional-state": "architect_state",
    "design-professional-zip": "architect_zip",
    "fee-simple-titleholder-city": "fee_simple_city",
    "fee-simple-titleholder-name-1": "fee_simple_titleholder_name",
    "fee-simple-titleholder-name-2": "fee_simple_titleholder_name",
    "fee-simple-titleholder-state": "fee_simple_state",
    "fee-simple-titleholder-zip": "fee_simple_zip",
    "further_work_description": "description_of_work",
    "mortgage-lender-address-1": "mortgage_lender_address",
    "mortgage-lender-address-2": "mortgage_lender_address",
    "mortgage-lender-city": "mortgage_city",
    "mortgage-lender-name-1": "mortgage_lender_name",
    "mortgage-lender-name-2": "mortgage_lender_name",
    "mortgage-lender-state": "mortgage_state",
    "mortgage-lender-zip": "mortgage_zip",
    "net-square-feet": "floor_area",
    "owner-printed-name": "client_name",
    "permit-value": "job_value",
    "project-city": "job_city",
    "property-owner-email": "owner_email",
  },
  "palm-beach-noc": {
    "5 SURETY Name and Address": "bonding_company",
    "6 LENDER Name and address": "mortgage_lender_name",
    "Contractor Phone Number": "contractor_phone",
    "Owner Name Address Fee Simple Titleholder": "fee_simple_titleholder_name",
    "Permit Number": "permit_number",
    "Required 1. Description of Property": "legal_description",
    "Required 2. GENERAL DESCRIPTION OF IMPROVEMENT": "description_of_work",
    "Required 4 CONTRACTOR Name  Address": "contractor_company",
    "Required Address": "contractor_address",
    "Required Description of Property": "folio_number",
    "Required Name": "contractor_company",
    "Required Owner Name and address": "client_name",
    "Required Print Name and Provide Signatorys Title Office": "client_name",
  },
};

// ---------------------------------------------------------------------------------------------------
// What is filled, and how
// ---------------------------------------------------------------------------------------------------

export type CountyId = "palm-beach" | "broward" | "miami-dade";

export type CountyFormDef = {
  slug: string;
  county: CountyId;
  countyName: string;
  kind: "application" | "noc";
  name: string;
  blurb: string;
  /** File inside src/lib/forms/county-pdfs. */
  file: string;
};

export const COUNTY_FORMS: CountyFormDef[] = [
  { slug: "palm-beach-application", county: "palm-beach", countyName: "Palm Beach County", kind: "application", name: "Palm Beach County building permit application", blurb: "The county permit application with the property, owner and contractor filled in.", file: "palm-beach-application.pdf" },
  { slug: "palm-beach-noc", county: "palm-beach", countyName: "Palm Beach County", kind: "noc", name: "Palm Beach County Notice of Commencement", blurb: "The recordable notice with the property, owner, contractor and work filled in.", file: "palm-beach-noc.pdf" },
  { slug: "broward-application", county: "broward", countyName: "Broward County", kind: "application", name: "Broward County uniform building permit application", blurb: "The county permit application with the property, owner and contractor filled in.", file: "broward-application.pdf" },
  { slug: "broward-noc", county: "broward", countyName: "Broward County", kind: "noc", name: "Broward County Notice of Commencement", blurb: "The recordable notice with the property, owner, contractor and work filled in.", file: "broward-noc.pdf" },
  { slug: "miami-dade-application", county: "miami-dade", countyName: "Miami-Dade County", kind: "application", name: "Miami-Dade building permit application", blurb: "The county permit application with the property, owner and contractor filled in.", file: "miami-dade-application.pdf" },
  { slug: "miami-dade-noc", county: "miami-dade", countyName: "Miami-Dade County", kind: "noc", name: "Miami-Dade Notice of Commencement", blurb: "The recordable notice with the property, owner, contractor and work filled in.", file: "miami-dade-noc.pdf" },
];

export function getCountyForm(slug: string) {
  return COUNTY_FORMS.find((form) => form.slug === slug) || null;
}

export type ValueGroup = "property" | "owner" | "contractor" | "job" | "more";

export type ValueField = { label: string; group: ValueGroup; textarea?: boolean };

/** Every value a county form can take, with the label the contractor sees. */
export const VALUE_FIELDS: Record<string, ValueField> = {
  job_address: { label: "Property address (street)", group: "property" },
  job_unit: { label: "Unit", group: "property" },
  job_city: { label: "City", group: "property" },
  job_zip: { label: "ZIP", group: "property" },
  folio_number: { label: "Folio / parcel number", group: "property" },
  legal_description: { label: "Legal description", group: "property", textarea: true },
  client_name: { label: "Owner name", group: "owner" },
  owner_phone: { label: "Owner phone", group: "owner" },
  owner_email: { label: "Owner email", group: "owner" },
  contractor_company: { label: "Company name", group: "contractor" },
  contractor_license: { label: "License number", group: "contractor" },
  qualifier_name: { label: "Qualifier / contact person", group: "contractor" },
  contractor_address: { label: "Company address", group: "contractor" },
  contractor_city: { label: "Company city", group: "contractor" },
  contractor_state: { label: "Company state", group: "contractor" },
  contractor_zip: { label: "Company ZIP", group: "contractor" },
  contractor_phone: { label: "Company phone", group: "contractor" },
  contractor_email: { label: "Company email", group: "contractor" },
  business_tax_receipt_number: { label: "Business tax receipt number", group: "contractor" },
  description_of_work: { label: "Description of work", group: "job", textarea: true },
  job_value: { label: "Value of work ($)", group: "job" },
  floor_area: { label: "Square feet", group: "job" },
  permit_number: { label: "Permit number (if you have one)", group: "job" },
  present_use: { label: "Present use of the property", group: "more" },
  proposed_use: { label: "Proposed use", group: "more" },
  building_use: { label: "Building use", group: "more" },
  construction_type: { label: "Construction type", group: "more" },
  occupancy_group: { label: "Occupancy group", group: "more" },
  flood_zone: { label: "Flood zone", group: "more" },
  bfe: { label: "Base flood elevation", group: "more" },
  fee_simple_titleholder_name: { label: "Titleholder, if not the owner", group: "more" },
  fee_simple_city: { label: "Titleholder city", group: "more" },
  fee_simple_state: { label: "Titleholder state", group: "more" },
  fee_simple_zip: { label: "Titleholder ZIP", group: "more" },
  mortgage_lender_name: { label: "Lender name", group: "more" },
  mortgage_lender_address: { label: "Lender address", group: "more" },
  mortgage_city: { label: "Lender city", group: "more" },
  mortgage_state: { label: "Lender state", group: "more" },
  mortgage_zip: { label: "Lender ZIP", group: "more" },
  bonding_company: { label: "Surety / bonding company", group: "more" },
  bonding_address: { label: "Surety address", group: "more" },
  bonding_city: { label: "Surety city", group: "more" },
  bonding_state: { label: "Surety state", group: "more" },
  bonding_zip: { label: "Surety ZIP", group: "more" },
  architect_name: { label: "Architect / engineer", group: "more" },
  architect_address: { label: "Architect / engineer address", group: "more" },
  architect_city: { label: "Architect / engineer city", group: "more" },
  architect_state: { label: "Architect / engineer state", group: "more" },
  architect_zip: { label: "Architect / engineer ZIP", group: "more" },
  architect_phone: { label: "Architect / engineer phone", group: "more" },
  architect_email: { label: "Architect / engineer email", group: "more" },
};

/** What the county wants on a form before it is worth sending. Shown as "still blank" when empty. */
export const REQUIRED_VALUES = ["job_address", "job_city", "folio_number", "legal_description", "client_name", "contractor_company", "contractor_license", "contractor_address", "contractor_phone", "description_of_work"];

type Values = Record<string, string>;

const clean = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");
const join = (parts: unknown[], glue = ", ") => parts.map(clean).filter(Boolean).join(glue);
const cityLine = (city: string, state: string, zip: string) => join([join([city, state], ", "), zip], " ");

/** Lines on the forms that take a name and an address (or a name, address and phone) together. */
const COMPOSITES: Record<string, { from: string[]; make: (v: Values) => string }> = {
  contractor_name_address: {
    from: ["contractor_company", "contractor_address", "contractor_city", "contractor_state", "contractor_zip"],
    make: (v) => join([v.contractor_company, v.contractor_address, cityLine(clean(v.contractor_city), clean(v.contractor_state), clean(v.contractor_zip))]),
  },
  contractor_block: {
    from: ["contractor_company", "contractor_address", "contractor_city", "contractor_state", "contractor_zip", "contractor_phone"],
    make: (v) => join([v.contractor_company, v.contractor_address, cityLine(clean(v.contractor_city), clean(v.contractor_state), clean(v.contractor_zip)), v.contractor_phone]),
  },
  contractor_address_full: {
    from: ["contractor_address", "contractor_city", "contractor_state", "contractor_zip"],
    make: (v) => join([v.contractor_address, cityLine(clean(v.contractor_city), clean(v.contractor_state), clean(v.contractor_zip))]),
  },
  owner_block: {
    from: ["client_name", "job_address", "job_unit", "job_city", "job_zip"],
    make: (v) => join([v.client_name, join([v.job_address, v.job_unit && "Unit " + clean(v.job_unit)], " "), cityLine(clean(v.job_city), clean(v.job_state) || "FL", clean(v.job_zip))]),
  },
  owner_address_line: {
    from: ["job_address", "job_unit", "job_city", "job_zip"],
    make: (v) => join([join([v.job_address, v.job_unit && "Unit " + clean(v.job_unit)], " "), cityLine(clean(v.job_city), clean(v.job_state) || "FL", clean(v.job_zip))]),
  },
  legal_and_address: {
    from: ["legal_description", "job_address", "job_unit", "job_city"],
    make: (v) => join([v.legal_description, join([v.job_address, v.job_unit && "Unit " + clean(v.job_unit)], " "), v.job_city]),
  },
  titleholder_block: {
    from: ["fee_simple_titleholder_name", "fee_simple_city", "fee_simple_state", "fee_simple_zip"],
    make: (v) => (clean(v.fee_simple_titleholder_name) ? join([v.fee_simple_titleholder_name, cityLine(clean(v.fee_simple_city), clean(v.fee_simple_state), clean(v.fee_simple_zip))]) : ""),
  },
  surety_block: {
    from: ["bonding_company", "bonding_address", "bonding_city", "bonding_state", "bonding_zip"],
    make: (v) => (clean(v.bonding_company) ? join([v.bonding_company, v.bonding_address, cityLine(clean(v.bonding_city), clean(v.bonding_state), clean(v.bonding_zip))]) : ""),
  },
  lender_block: {
    from: ["mortgage_lender_name", "mortgage_lender_address", "mortgage_city", "mortgage_state", "mortgage_zip"],
    make: (v) => (clean(v.mortgage_lender_name) ? join([v.mortgage_lender_name, v.mortgage_lender_address, cityLine(clean(v.mortgage_city), clean(v.mortgage_state), clean(v.mortgage_zip))]) : ""),
  },
};

/** What a combined line is called on the attached page when it is too long for its field. */
const COMPOSITE_LABELS: Record<string, string> = {
  legal_and_address: "Legal description and street address",
  contractor_block: "Contractor name, address and phone",
  contractor_name_address: "Contractor name and address",
  owner_block: "Owner name and address",
  surety_block: "Surety",
  lender_block: "Lender",
  titleholder_block: "Fee simple titleholder",
};

type FormRules = {
  /** PDF fields left alone. These belong to the notary, the signer or a section the contractor does not fill. */
  skip: string[];
  /** PDF fields that take something other than the platform map says, or something it leaves out. */
  set: Record<string, string>;
  /** When the text does not fit the first field it carries on into these fields. */
  continues: Record<string, string[]>;
  /** One digit per box, for parcel numbers printed as a row of boxes. Filled only when the number has exactly `count` digits. */
  digits?: { prefix: string; count: number; key: string };
  /** Text drawn on a blank line the PDF has no field for. */
  stamps?: Array<{ page: number; x: number; y: number; width: number; key: string; label: string }>;
};

const NONE: FormRules = { skip: [], set: {}, continues: {} };

const RULES: Record<string, FormRules> = {
  "palm-beach-application": {
    skip: [],
    set: { Property_owner_state: "job_state", Property_owner_zip: "job_zip" },
    continues: {},
    // The county's parcel control number is 17 digits, one to a box.
    digits: { prefix: "PCN-", count: 17, key: "folio_number" },
  },
  "broward-application": {
    // 65 is the titleholder's address line, which the platform map had pointed at the name. 13, 18 and 19 (flood zone,
    // construction type, occupancy group) are pick lists, which are left as printed.
    skip: ["65", "13", "18", "19"],
    set: { "38": "job_state", "39": "job_zip", "64": "fee_simple_titleholder_name" },
    continues: {},
  },
  "miami-dade-application": {
    skip: ["Print Name: Signature of Owner or Owner’s Agent", "Print Name: Signature of Qualifier"],
    set: {
      "Zip: Property Owner's Information": "job_zip",
    },
    continues: { "Description of Work, line 1": ["Description of Work, line 2"] },
  },
  "palm-beach-noc": {
    skip: [],
    set: {
      "Required Name": "contractor_company",
      "Required Address": "contractor_address_full",
      "Required Owner Name and address": "owner_block",
      "Required 4 CONTRACTOR Name  Address": "contractor_name_address",
      "5 SURETY Name and Address": "surety_block",
      "6 LENDER Name and address": "lender_block",
      "Owner Name Address Fee Simple Titleholder": "titleholder_block",
    },
    continues: {},
  },
  "broward-noc": {
    skip: [],
    set: {
      "1 DESCRIPTION OF PROPERTY Legal description  street address if available TAX FOLIO NO": "folio_number",
      "3 OWNER INFORMATION a Name": "client_name",
      "b Address": "owner_address_line",
      "4 CONTRACTORS NAME ADDRESS AND PHONE NUMBER 1": "contractor_name_address",
      "4 CONTRACTORS NAME ADDRESS AND PHONE NUMBER 2": "contractor_phone",
      "5 SURETYS NAME ADDRESS AND PHONE NUMBER AND BOND AMOUNT": "surety_block",
      "6 LENDERS NAME ADDRESS AND PHONE NUMBER": "lender_block",
      "Name and address of fee simple titleholder if other than Owner": "titleholder_block",
    },
    continues: {},
    // The form has a box for the folio but only a blank line for the legal description.
    stamps: [{ page: 0, x: 38, y: 619, width: 524, key: "legal_and_address", label: "Legal description" }],
  },
  "miami-dade-noc": {
    skip: ["1. Print name current owner"],
    set: {
      "1. Legal description of property and street/address: first line": "legal_and_address",
      "3. Owner(s) name and address": "owner_block",
      "4. Contractor’s name, address and phone number: first line": "contractor_block",
      "5. Name, address and phone number": "surety_block",
      "6. Lender's name and address": "lender_block",
      "3. Name and address of fee simple titleholder": "titleholder_block",
    },
    continues: {
      "1. Legal description of property and street/address: first line": ["1. second line"],
      "2. Description of improvement: first line": ["2. second line"],
      "4. Contractor’s name, address and phone number: first line": ["4.  second line"],
    },
  },
};

/** PDF field name -> value key for one form, after the rules are applied. */
export function fieldPlan(slug: string): Record<string, string> {
  const base = COUNTY_FIELD_MAPS[slug] || {};
  const rules = RULES[slug] || NONE;
  const plan: Record<string, string> = {};
  for (const [field, key] of Object.entries(base)) {
    if (key === "today_date") continue; // dates beside a signature are written by the person signing
    if (rules.skip.includes(field)) continue;
    plan[field] = key;
  }
  for (const [field, key] of Object.entries(rules.set)) plan[field] = key;
  return plan;
}

/** The plain values (not the combined lines) a form reads. These are the inputs the contractor sees. */
export function formValueKeys(slug: string): string[] {
  const keys = new Set<string>();
  const rules = RULES[slug] || NONE;
  const used = [...Object.values(fieldPlan(slug)), ...(rules.stamps || []).map((stamp) => stamp.key), ...(rules.digits ? [rules.digits.key] : [])];
  for (const key of used) {
    if (COMPOSITES[key]) COMPOSITES[key].from.forEach((from) => keys.add(from));
    else keys.add(key);
  }
  return Object.keys(VALUE_FIELDS).filter((key) => keys.has(key));
}

/** The values the form still lacks among those the county needs. */
export function stillBlank(slug: string, values: Values): string[] {
  const read = new Set(formValueKeys(slug));
  return REQUIRED_VALUES.filter((key) => read.has(key) && !clean(values[key]));
}

/** The value for one PDF field, combined lines included. */
export function valueFor(key: string, values: Values): string {
  const composite = COMPOSITES[key];
  return composite ? composite.make(values) : clean(values[key]);
}

// ---------------------------------------------------------------------------------------------------
// Starting values from the company and the job
// ---------------------------------------------------------------------------------------------------

/** "123 Main St, Boca Raton, FL 33432" -> street, city, state, zip. Anything it cannot read stays in the street. */
export function splitAddress(raw: string | null | undefined) {
  const text = clean(raw);
  const empty = { street: text, city: "", state: "", zip: "" };
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return empty;
  const last = parts[parts.length - 1];
  let state = "";
  let zip = "";
  let cityIndex = parts.length - 2;
  let match: RegExpMatchArray | null;
  if ((match = last.match(/^([A-Za-z]{2})\s+(\d{5})(?:-\d{4})?$/))) {
    state = match[1];
    zip = match[2];
  } else if ((match = last.match(/^(\d{5})(?:-\d{4})?$/))) {
    zip = match[1];
    if (parts.length >= 3 && /^[A-Za-z]{2}$/.test(parts[parts.length - 2])) {
      state = parts[parts.length - 2];
      cityIndex = parts.length - 3;
    }
  } else if (/^[A-Za-z]{2}$/.test(last)) {
    state = last;
  } else if ((match = last.match(/^(.+?)\s+([A-Za-z]{2})\s+(\d{5})(?:-\d{4})?$/))) {
    // "Boca Raton FL 33432" with no comma before the state
    if (parts.length < 2) return empty;
    return { street: parts.slice(0, -1).join(", "), city: match[1], state: match[2].toUpperCase(), zip: match[3] };
  } else {
    return empty;
  }
  if (cityIndex < 1) return empty;
  return { street: parts.slice(0, cityIndex).join(", "), city: parts[cityIndex], state: state.toUpperCase(), zip };
}

export type CompanyDetails = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  qualifier_name?: string | null;
  business_tax_receipt_number?: string | null;
};

export type JobDetails = {
  property_address?: string | null;
  property_city?: string | null;
  property_zip?: string | null;
  property_unit?: string | null;
  homeowner_name?: string | null;
  homeowner_phone?: string | null;
  homeowner_email?: string | null;
  contract_value?: number | string | null;
  permit_number?: string | null;
  folio_number?: string | null;
  legal_description?: string | null;
  work_description?: string | null;
};

export function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const number = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(number) || number <= 0) return "";
  return number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Everything known about the company and the job, as the values the forms read. Empty when not known. */
export function startingValues(input: { company?: CompanyDetails | null; licenseNumber?: string | null; companyName?: string | null; job?: JobDetails | null }): Values {
  const company = input.company || {};
  const job = input.job || {};
  const street = splitAddress(job.property_address);
  const values: Values = {
    contractor_company: clean(company.name) || clean(input.companyName),
    contractor_license: clean(input.licenseNumber),
    qualifier_name: clean(company.qualifier_name),
    contractor_address: clean(company.address),
    contractor_city: clean(company.city),
    contractor_state: clean(company.state) || "FL",
    contractor_zip: clean(company.zip),
    contractor_phone: clean(company.phone),
    contractor_email: clean(company.email),
    business_tax_receipt_number: clean(company.business_tax_receipt_number),
    job_address: street.street,
    job_unit: clean(job.property_unit),
    job_city: clean(job.property_city) || street.city,
    job_state: "FL",
    job_zip: clean(job.property_zip) || street.zip,
    client_name: clean(job.homeowner_name),
    owner_phone: clean(job.homeowner_phone),
    owner_email: clean(job.homeowner_email),
    folio_number: clean(job.folio_number),
    legal_description: clean(job.legal_description),
    description_of_work: clean(job.work_description),
    job_value: formatMoney(job.contract_value),
    permit_number: clean(job.permit_number),
  };
  return values;
}

// ---------------------------------------------------------------------------------------------------
// Filling the PDF
// ---------------------------------------------------------------------------------------------------

const MAX_SIZE = 10;
const MIN_SIZE = 6.5;
/** Numbers the county reads digit by digit are squeezed before they are ever sent to the attachment page. */
const SMALL_MIN: Record<string, number> = { folio_number: 5, permit_number: 5, contractor_license: 5 };

/** Helvetica can only draw Latin-1. Curly quotes and dashes become plain ones; anything else is dropped. */
export function pdfSafe(text: string) {
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[^\x20-\x7e¡-ÿ]/g, "");
}

type Slot = { width: number; lines: number };

/** Break text into the slots, word by word. Returns the lines per slot, or null when it does not all fit. */
export function wrapIntoSlots(text: string, slots: Slot[], measure: (value: string) => number): string[][] | null {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[][] = slots.map(() => []);
  let slot = 0;
  let used = 0; // lines used in this slot
  let line = "";
  const push = () => {
    out[slot].push(line);
    line = "";
    used += 1;
  };
  for (const word of words) {
    while (true) {
      if (slot >= slots.length) return null;
      const candidate = line ? line + " " + word : word;
      if (measure(candidate) <= slots[slot].width) {
        line = candidate;
        break;
      }
      if (line) {
        push();
      } else if (measure(word) > slots[slot].width) {
        return null; // one word wider than the field
      }
      if (used >= slots[slot].lines) {
        slot += 1;
        used = 0;
      }
    }
  }
  if (line) {
    if (slot >= slots.length) return null;
    push();
  }
  return out;
}

export type FillResult = {
  bytes: Uint8Array;
  /** Value keys that were written into the form. */
  filled: string[];
  /** Text that did not fit its field and went on the attached page instead. */
  attached: string[];
};

/** Sets the size the text is drawn at. A few fields have no default appearance, so they are given one. */
function setSize(field: PDFTextField, size: number) {
  try {
    field.setFontSize(size);
  } catch {
    field.acroField.setDefaultAppearance("/Helv " + size + " Tf 0 g");
  }
}

type FieldBox = { name: string; width: number; height: number; multiline: boolean; maxLength: number | undefined };

/**
 * Fills the county PDF with the values. Signature, checkbox and notary fields are left alone, and the form stays
 * editable. Text that cannot fit its field is never cut: the field says "SEE ATTACHED" and the full text goes on a
 * last page.
 */
export async function fillCountyForm(pdfBytes: Uint8Array, slug: string, values: Values): Promise<FillResult> {
  const def = getCountyForm(slug);
  if (!def) throw new Error("Unknown county form");
  const rules = RULES[slug] || NONE;
  const plan = fieldPlan(slug);
  const continuationFields = new Set(Object.values(rules.continues).flat());

  // Loaded here, not at the top, so the pages that only read the values do not carry the PDF library to the browser.
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();

  const boxOf = (name: string): FieldBox | null => {
    let field;
    try {
      field = form.getTextField(name);
    } catch {
      return null;
    }
    const widget = field.acroField.getWidgets()[0];
    if (!widget) return null;
    const rect = widget.getRectangle();
    let maxLength: number | undefined;
    try {
      maxLength = field.getMaxLength();
    } catch {
      maxLength = undefined;
    }
    return { name, width: rect.width, height: rect.height, multiline: field.isMultiline(), maxLength };
  };

  const filled: string[] = [];
  const attached: { title: string; text: string }[] = [];
  // Only the fields written here are redrawn. The others keep the look the county gave them.
  const touched: Array<{ updateAppearances: (font: PDFFont) => void }> = [];

  for (const [fieldName, key] of Object.entries(plan)) {
    if (continuationFields.has(fieldName)) continue;
    const text = pdfSafe(valueFor(key, values));
    if (!text) continue;
    const label = VALUE_FIELDS[key]?.label || COMPOSITE_LABELS[key] || key.replace(/_/g, " ");

    // Choice lists (the state boxes) are left as the county printed them, already set to FL; only text boxes are written.
    const first = boxOf(fieldName);
    if (!first) continue;
    const chain = [first, ...(rules.continues[fieldName] || []).map(boxOf).filter((box): box is FieldBox => Boolean(box))];

    let placed: { size: number; lines: string[][] } | null = null;
    const smallest = SMALL_MIN[key] || MIN_SIZE;
    for (let size = Math.min(MAX_SIZE, Math.max(smallest, first.height - 2)); size >= smallest - 0.001; size -= 0.5) {
      const slots = chain.map((box) => ({
        width: box.width - 4,
        lines: box.multiline ? Math.max(1, Math.floor((box.height - 2) / (size * 1.15))) : 1,
      }));
      const lines = wrapIntoSlots(text, slots, (value) => font.widthOfTextAtSize(value, size));
      if (!lines) continue;
      // A field with a character limit cannot take more than it allows.
      if (lines.some((slotLines, index) => chain[index].maxLength !== undefined && slotLines.join("\n").length > (chain[index].maxLength as number))) continue;
      placed = { size, lines };
      break;
    }

    if (!placed) {
      attached.push({ title: label, text });
      const note = "SEE ATTACHED";
      const noteSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, first.height - 2));
      if (first.maxLength === undefined || note.length <= first.maxLength) {
        const field = form.getTextField(fieldName);
        setSize(field, noteSize);
        field.setText(note);
        touched.push(field);
      }
      continue;
    }

    chain.forEach((box, index) => {
      const slotLines = placed!.lines[index];
      if (!slotLines.length) return;
      const field = form.getTextField(box.name);
      setSize(field, placed!.size);
      field.setText(slotLines.join("\n"));
      touched.push(field);
    });
    filled.push(key);
  }

  if (rules.digits) {
    const digits = valueFor(rules.digits.key, values).replace(/\D/g, "");
    if (digits.length === rules.digits.count) {
      for (let index = 0; index < rules.digits.count; index += 1) {
        try {
          const field = form.getTextField(rules.digits.prefix + (index + 1));
          setSize(field, 9);
          field.setText(digits[index]);
          touched.push(field);
        } catch {
          // a box that is not there is left alone
        }
      }
      filled.push(rules.digits.key);
    }
  }

  const stampDraws: Array<() => void> = [];
  for (const stamp of rules.stamps || []) {
    const text = pdfSafe(valueFor(stamp.key, values));
    if (!text) continue;
    const page = pdf.getPage(stamp.page);
    let size = 8;
    while (size > MIN_SIZE && font.widthOfTextAtSize(text, size) > stamp.width) size -= 0.5;
    if (font.widthOfTextAtSize(text, size) <= stamp.width) {
      stampDraws.push(() => page.drawText(text, { x: stamp.x, y: stamp.y, size, font }));
      filled.push(stamp.key);
    } else {
      attached.push({ title: stamp.label, text });
      stampDraws.push(() => page.drawText("SEE ATTACHED " + stamp.label.toUpperCase(), { x: stamp.x, y: stamp.y, size: 8, font }));
    }
  }

  touched.forEach((field) => field.updateAppearances(font));
  stampDraws.forEach((draw) => draw());

  if (attached.length) {
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const margin = 54;
    const width = 612 - margin * 2;
    let page = pdf.addPage([612, 792]);
    let y = 792 - margin;
    const heading = (text: string, size: number) => {
      if (y < margin + size) {
        page = pdf.addPage([612, 792]);
        y = 792 - margin;
      }
      page.drawText(text, { x: margin, y: y - size, size, font: bold });
      y -= size + 8;
    };
    heading("Attachment to " + def.name, 13);
    for (const item of attached) {
      heading(item.title, 11);
      const lines = wrapIntoSlots(item.text, [{ width, lines: 10000 }], (value) => font.widthOfTextAtSize(value, 10))?.[0] || [item.text];
      for (const line of lines) {
        if (y < margin + 12) {
          page = pdf.addPage([612, 792]);
          y = 792 - margin;
        }
        page.drawText(line, { x: margin, y: y - 10, size: 10, font });
        y -= 13;
      }
      y -= 12;
    }
  }

  return { bytes: await pdf.save({ updateFieldAppearances: false }), filled: Array.from(new Set(filled)), attached: attached.map((item) => item.title) };
}
