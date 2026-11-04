// Property appraiser lookup. The searching is done by PermitAIO's parcel endpoint (the county map-data services for
// Palm Beach, Broward and Miami-Dade), the same one the ProperAC app uses, so the logic lives in one place.
// Pure: no @/ imports, so the tests run it directly.

export type ParcelCounty = "palm-beach" | "broward" | "miami-dade";

export const PARCEL_COUNTIES: Array<{ id: ParcelCounty; name: string; label: string }> = [
  { id: "palm-beach", name: "Palm Beach", label: "Palm Beach County" },
  { id: "broward", name: "Broward", label: "Broward County" },
  { id: "miami-dade", name: "Miami-Dade", label: "Miami-Dade County" },
];

export type ParcelHit = {
  folio: string;
  owner: string;
  address: string;
  city: string;
  zip: string;
  millageCode: string | null;
  /** Null when the county does not publish one (Miami-Dade) or has none on file. */
  legalDescription: string | null;
  countyKey: ParcelCounty;
  countyLabel: string;
};

export type ParcelResult = ParcelHit & {
  /** The building department that issues the permit, in the name the Hub uses for it. */
  jurisdiction: string;
  /** False when the department is not in the Hub's directory yet, so its email and portal are not saved. */
  inDirectory: boolean;
};

export function isParcelCounty(value: unknown): value is ParcelCounty {
  return PARCEL_COUNTIES.some((county) => county.id === value);
}

const norm = (value: string) =>
  value
    .toLowerCase()
    .replace(/^(city|town|village) of /, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Appraiser spelling -> the city's current name. */
const ALIASES: Record<string, string> = { "lake worth": "Lake Worth Beach" };

const titleCase = (value: string) => value.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

/**
 * The jurisdiction for a parcel. A parcel in a city is permitted by that city; one outside every city is permitted by
 * its county. The appraiser's city is matched to the Hub's directory of departments.
 */
export function jurisdictionFor(hit: Pick<ParcelHit, "city" | "countyLabel">, directory: string[]): { jurisdiction: string; inDirectory: boolean } {
  const city = (hit.city || "").replace(/\s+/g, " ").trim();
  const countyKnown = directory.some((name) => name.toLowerCase() === hit.countyLabel.toLowerCase());
  if (!city || /unincorporated/i.test(city)) return { jurisdiction: hit.countyLabel, inDirectory: countyKnown };

  const wanted = norm(city);
  const exact = directory.find((name) => norm(name) === wanted);
  if (exact) return { jurisdiction: exact, inDirectory: true };
  // A city the appraiser still spells under its old name. Only listed ones are matched; a guess here would send the
  // permit to the wrong building department (the Town of Palm Beach is not Palm Beach Gardens).
  const renamed = ALIASES[wanted];
  const alias = renamed && directory.find((name) => norm(name) === norm(renamed));
  if (alias) return { jurisdiction: alias, inDirectory: true };
  return { jurisdiction: titleCase(city), inDirectory: false };
}

export function withJurisdiction(hits: ParcelHit[], directory: string[]): ParcelResult[] {
  return hits.map((hit) => ({ ...hit, ...jurisdictionFor(hit, directory) }));
}

/** Asks PermitAIO's parcel endpoint. Throws a plain-language error when it cannot answer. */
export async function searchParcels(
  county: ParcelCounty,
  query: string,
  options: { base?: string; fetchImpl?: typeof fetch } = {},
): Promise<ParcelHit[]> {
  const q = query.trim();
  if (q.length < 4) return [];
  const base = (options.base || "https://permitaio.com").replace(/\/+$/, "");
  const doFetch = options.fetchImpl || fetch;
  let response: Response;
  try {
    response = await doFetch(`${base}/api/parcel-lookup?county=${encodeURIComponent(county)}&q=${encodeURIComponent(q)}`, { cache: "no-store" });
  } catch {
    throw new Error("Could not reach the property appraiser lookup. Try again in a minute.");
  }
  const data = (await response.json().catch(() => ({}))) as { results?: ParcelHit[]; error?: string };
  if (!response.ok) throw new Error(data.error || "The property appraiser lookup did not answer. Try again in a minute.");
  return Array.isArray(data.results) ? data.results : [];
}
