export type JurisdictionContact = {
  name: string;
  email: string;
  portal?: string;
  nocByEmail?: boolean;
};

/** Cities and counties copied from PermitAIO's jurisdiction list, so the property lookup can name the department.
 * Only the names are known here. Add an email or portal on the admin jurisdictions page. */
const MORE_DEPARTMENTS: string[] = [
  // Martin County
  "Martin County", "Jensen Beach", "Palm City", "Stuart",
  // Palm Beach County
  "Atlantis", "Belle Glade", "Briny Breezes", "Cloud Lake", "Glen Ridge", "Golf", "Gulf Stream", "Haverhill", "Highland Beach", "Hypoluxo", "Juno Beach", "Jupiter Inlet Colony", "Lake Clarke Shores", "Lake Park", "Lantana", "Loxahatchee Groves", "Manalapan", "Mangonia Park", "North Palm Beach", "Ocean Ridge", "Pahokee", "Palm Beach", "Palm Beach Shores", "Palm Springs", "South Bay", "South Palm Beach", "Tequesta", "Westlake",
  // Broward County
  "Coconut Creek", "Cooper City", "Coral Springs", "Davie", "Deerfield Beach", "Miramar", "Pembroke Pines", "Plantation", "Pompano Beach", "Sunrise", "Tamarac", "Weston", "Dania Beach", "Hallandale Beach", "Hillsboro Beach", "Lauderdale Lakes", "Lauderdale-By-The-Sea", "Lauderhill", "Lazy Lake", "Lighthouse Point", "Margate", "North Lauderdale", "Oakland Park", "Parkland", "Pembroke Park", "Sea Ranch Lakes", "Southwest Ranches", "West Park", "Wilton Manors",
  // Miami-Dade County
  "Aventura", "Bal Harbour", "Bay Harbor Islands", "Biscayne Park", "Coral Gables", "Cutler Bay", "Doral", "El Portal", "Florida City", "Golden Beach", "Hialeah Gardens", "Homestead", "Indian Creek", "Kendall", "Key Biscayne", "Medley", "Miami Beach", "Miami Gardens", "Miami Lakes", "Miami Shores", "Miami Springs", "North Bay Village", "North Miami", "North Miami Beach", "Opa-locka", "Palmetto Bay", "Pinecrest", "South Miami", "Sunny Isles Beach", "Surfside", "Sweetwater", "Virginia Gardens", "West Miami",
  // St. Lucie County
  "St. Lucie County", "Fort Pierce", "Port St. Lucie",
];
/** Saved building-department contacts. Edit emails here or from the job form. */
const SAVED_DEPARTMENTS: JurisdictionContact[] = [
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

export const JURISDICTIONS: JurisdictionContact[] = [
  ...SAVED_DEPARTMENTS,
  ...MORE_DEPARTMENTS.map((name) => ({ name, email: "", nocByEmail: true })),
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
