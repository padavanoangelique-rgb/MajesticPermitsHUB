/**
 * Brand values stored on leads, jobs, and the Notion leads database.
 * Permit AIO is reserved so Notion can take those leads later.
 * It is not offered on the public Majestic website form.
 */
export const LEAD_BRANDS = [
  "Majestic Permits",
  "The Permit Closer",
  "Permit AIO",
] as const;

export type LeadBrand = (typeof LEAD_BRANDS)[number];

export const PUBLIC_FORM_BRANDS = [
  "Majestic Permits",
  "The Permit Closer",
] as const;

export type PublicFormBrand = (typeof PUBLIC_FORM_BRANDS)[number];

export const PUBLIC_PROJECT_TYPES = [
  "Windows",
  "Doors",
  "Roofing",
  "Renovation",
  "Expired permit close-out",
  "Other",
] as const;

export type PublicProjectType = (typeof PUBLIC_PROJECT_TYPES)[number];

export const PUBLIC_LEAD_SOURCE = "majesticpermits.com landing";

/** Existing-customer jobs opened from the public form. Not the contractor "Pending approval" queue. */
export const PUBLIC_REQUEST_SUB_STATUS = "Pending request";

export const PUBLIC_REQUEST_STAGE = "Getting your project ready";
