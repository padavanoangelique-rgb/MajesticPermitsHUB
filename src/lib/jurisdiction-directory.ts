export type JurisdictionContact = {
  name: string;
  email: string;
  portal?: string;
  nocByEmail?: boolean;
};

/** Saved building-department contacts. Edit emails here or from the job form. */
export const JURISDICTIONS: JurisdictionContact[] = [
  { name: "Village of Wellington", email: "", portal: "https://www.wellingtonfl.gov", nocByEmail: true },
  { name: "Palm Beach County", email: "", nocByEmail: true },
  { name: "West Palm Beach", email: "", nocByEmail: true },
  { name: "Boca Raton", email: "", nocByEmail: true },
  { name: "Delray Beach", email: "", nocByEmail: true },
  { name: "Boynton Beach", email: "", nocByEmail: true },
  { name: "Lake Worth Beach", email: "", nocByEmail: true },
  { name: "Greenacres", email: "", nocByEmail: true },
  { name: "Royal Palm Beach", email: "", nocByEmail: true },
  { name: "Palm Beach Gardens", email: "", nocByEmail: true },
  { name: "Jupiter", email: "", nocByEmail: true },
  { name: "Riviera Beach", email: "", nocByEmail: true },
  { name: "Miami-Dade County", email: "", nocByEmail: true },
  { name: "City of Miami", email: "", nocByEmail: true },
  { name: "Hialeah", email: "", nocByEmail: true },
  { name: "Broward County", email: "", nocByEmail: true },
  { name: "Fort Lauderdale", email: "", nocByEmail: true },
  { name: "Hollywood", email: "", nocByEmail: true },
];

export function findJurisdiction(name?: string | null) {
  if (!name) return null;
  const needle = name.toLowerCase().trim();
  return (
    JURISDICTIONS.find((j) => j.name.toLowerCase() === needle) ||
    JURISDICTIONS.find((j) => needle.includes(j.name.toLowerCase()) || j.name.toLowerCase().includes(needle)) ||
    null
  );
}
