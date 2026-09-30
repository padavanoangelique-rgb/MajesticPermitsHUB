export type FormField = {
  key: string;
  label: string;
  kind?: "text" | "date" | "textarea";
};

export type PermitForm = {
  key: string;
  name: string;
  blurb: string;
  fields: FormField[];
};

export const PERMIT_FORMS: PermitForm[] = [
  {
    key: "noc",
    name: "Notice of Commencement",
    blurb: "The notice recorded before work starts. Filled with the company and the property.",
    fields: [
      { key: "owner_name", label: "Owner name" },
      { key: "property_address", label: "Property address" },
      { key: "legal_description", label: "Legal description", kind: "textarea" },
      { key: "company_name", label: "Contractor" },
      { key: "license_number", label: "License number" },
      { key: "description", label: "Description of the work", kind: "textarea" },
    ],
  },
  {
    key: "application",
    name: "Building permit application",
    blurb: "The usual application fields. The city still gets its own copy.",
    fields: [
      { key: "property_address", label: "Job address" },
      { key: "owner_name", label: "Owner" },
      { key: "owner_phone", label: "Owner phone" },
      { key: "company_name", label: "Contractor" },
      { key: "license_number", label: "License number" },
      { key: "work_type", label: "Type of work" },
      { key: "description", label: "Scope", kind: "textarea" },
    ],
  },
  {
    key: "schedule",
    name: "Window and door schedule",
    blurb: "Each opening, the size, and the product. Ready to attach to the package.",
    fields: [
      { key: "property_address", label: "Job address" },
      { key: "company_name", label: "Contractor" },
      { key: "openings", label: "Openings (label, width, height, product)", kind: "textarea" },
    ],
  },
  {
    key: "owner-auth",
    name: "Owner authorization",
    blurb: "Lets the contractor pull the permit for the owner. They sign it from their phone.",
    fields: [
      { key: "owner_name", label: "Owner name" },
      { key: "property_address", label: "Property address" },
      { key: "company_name", label: "Contractor" },
      { key: "license_number", label: "License number" },
      { key: "work_type", label: "Work authorized" },
    ],
  },
];

export function getPermitForm(key: string) {
  return PERMIT_FORMS.find((form) => form.key === key) || null;
}
