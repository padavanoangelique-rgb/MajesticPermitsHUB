/**
 * RAS 127-20 Method 1 — moment-based tile uplift check.
 *
 *   Mr_zone = (|Pasd_zone| x lambda) - Mg      [ft-lbf]
 *   PASS    <=>  Mf >= Mr_zone  for every roof pressure zone
 *
 * Source: RAS 127-20 sections 2.1-2.6, published by the Florida Building
 * Commission:
 *   http://www.floridabuilding.org/fbc/thecode/2020_Code_Development/February2020Workshop/Attachments/Structural/Attachment%20comment-1-c-RAS%20127.pdf
 * Mirrored in Section E of the Miami-Dade HVHZ Uniform Roofing Application
 * Form, FBC 8th Edition (2023):
 *   https://www.miamidade.gov/permits/library/roofing-permit.pdf
 *
 * ---------------------------------------------------------------------------
 * READ BEFORE CHANGING ANYTHING IN THIS FILE
 * ---------------------------------------------------------------------------
 * 1. In RAS 127, `Mr` is the DEMAND and `Mf` is the CAPACITY. That is the
 *    reverse of the usual engineering convention. Do not swap them.
 *
 * 2. Method 1 has NO velocity pressure (qh), NO lift coefficient (CL) and NO
 *    moment arm (La). Those belong to the separate FBC 1609.6.3 / FRSA-TRI
 *    route used outside the HVHZ. lambda already contains the tile geometry
 *    and the moment coefficient, so multiplying by CL*b*L*La would
 *    double-count geometry by about an order of magnitude.
 *
 * 3. There is no code table of lambda by tile profile and slope. lambda, Mg
 *    and Mf are PRODUCT-SPECIFIC and must be read off the tile's NOA /
 *    Florida Product Approval. We never invent them.
 *
 * 4. The Pasd tables below were transcribed from the Florida Building
 *    Commission RAS 127-20 document, which is a code-development redline.
 *    They should be re-verified against the published FLTP2023 text. See
 *    TABLE_PROVENANCE below, which is surfaced in the UI and on the printout.
 */

export type RoofForm = "gable" | "hip";
export type ExposureCategory = "B" | "C" | "D";
export type SlopeBand = "2_to_4" | "4_to_6" | "6_to_12";

export const STANDARD_REF =
  "RAS 127-20 Method 1, FBC 8th Edition (2023) Test Protocols for HVHZ";

export const TABLE_PROVENANCE =
  "Pasd values transcribed from the Florida Building Commission RAS 127-20 document (a code-development redline). Verify against the published FLTP2023 text before relying on a printout for submittal.";

/**
 * Footnote 2 of the RAS 127-20 tables reads: "For Hip Roofs with slope
 * [operator] 5.5:12, Pasd(3) shall be treated as Pasd(2)". The comparison
 * operator is an unreadable glyph in the source PDF, so we deliberately do
 * NOT apply this footnote automatically - doing so would materially change
 * corner-zone pressures on hip roofs. We surface it as a warning instead.
 */
export const HIP_FOOTNOTE_WARNING =
  "RAS 127-20 table footnote 2 may allow Pasd(3) to be treated as Pasd(2) for hip roofs near a 5.5:12 slope. The comparison operator is illegible in the source document, so it is not applied here. Check the printed code if this job is a hip roof near 5.5:12.";

export const SLOPE_BANDS: Array<{ value: SlopeBand; label: string }> = [
  { value: "2_to_4", label: "2:12 to 4:12" },
  { value: "4_to_6", label: "Over 4:12 to 6:12" },
  { value: "6_to_12", label: "Over 6:12 to 12:12" },
];

/** Upper bound (ft, inclusive) of each mean-roof-height band, in table order. */
const HEIGHT_BANDS = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60] as const;

export const HEIGHT_BAND_LABELS = [
  "15 ft or less",
  "Over 15 to 20 ft",
  "Over 20 to 25 ft",
  "Over 25 to 30 ft",
  "Over 30 to 35 ft",
  "Over 35 to 40 ft",
  "Over 40 to 45 ft",
  "Over 45 to 50 ft",
  "Over 50 to 55 ft",
  "Over 55 to 60 ft",
] as const;

/**
 * A table is a list of columns; each column covers one or more pressure
 * zones and holds one value per height band (10 values, in HEIGHT_BANDS
 * order). Values are stored as published: negative = uplift.
 */
interface PasdTable {
  /** RAS 127-20 table number, for the printout. */
  tableNumber: number;
  columns: Array<{ zones: string[]; values: number[] }>;
}

const TABLES: Record<string, PasdTable> = {
  // ---------------- Gable, Exposure C ----------------
  "gable|C|2_to_4": {
    tableNumber: 1,
    columns: [
      { zones: ["1", "2e"], values: [-74, -78, -82, -85, -88, -91, -93, -95, -97, -98] },
      { zones: ["2n", "2r", "3e"], values: [-108, -114, -120, -125, -129, -132, -136, -139, -142, -144] },
      { zones: ["3r"], values: [-128, -136, -142, -148, -153, -157, -162, -165, -169, -171] },
    ],
  },
  "gable|C|4_to_6": {
    tableNumber: 2,
    columns: [
      { zones: ["1", "2e"], values: [-57, -60, -63, -66, -68, -70, -72, -73, -75, -76] },
      { zones: ["2n", "2r", "3e"], values: [-91, -96, -101, -105, -109, -111, -115, -117, -120, -121] },
      { zones: ["3r"], values: [-128, -136, -142, -148, -153, -157, -162, -165, -169, -171] },
    ],
  },
  "gable|C|6_to_12": {
    tableNumber: 3,
    columns: [
      { zones: ["1", "2e", "2r"], values: [-67, -71, -74, -78, -80, -82, -85, -86, -88, -89] },
      { zones: ["2n", "3r"], values: [-74, -78, -82, -85, -88, -91, -93, -95, -97, -98] },
      { zones: ["3e"], values: [-115, -122, -127, -132, -137, -141, -146, -147, -151, -153] },
    ],
  },

  // ---------------- Gable, Exposure D ----------------
  "gable|D|2_to_4": {
    tableNumber: 4,
    columns: [
      { zones: ["1", "2e"], values: [-90, -94, -98, -101, -104, -106, -109, -111, -113, -114] },
      { zones: ["2n", "2r", "3e"], values: [-131, -137, -142, -148, -152, -155, -157, -161, -164, -167] },
      { zones: ["3r"], values: [-156, -163, -169, -175, -180, -184, -189, -192, -195, -198] },
    ],
  },
  "gable|D|4_to_6": {
    tableNumber: 5,
    columns: [
      { zones: ["1", "2e"], values: [-69, -73, -75, -78, -80, -82, -84, -85, -87, -88] },
      { zones: ["2n", "2r", "3e"], values: [-110, -116, -120, -124, -128, -131, -134, -136, -138, -140] },
      { zones: ["3r"], values: [-156, -163, -169, -175, -180, -184, -189, -192, -195, -198] },
    ],
  },
  "gable|D|6_to_12": {
    tableNumber: 6,
    columns: [
      // NOTE: the >20 to <=25 ft value reads -87 in the source, which breaks
      // the otherwise monotonic -86 -> -87 -> -92 sequence. Transcribed as
      // published; flagged as a suspected typo in the standard.
      { zones: ["1", "2e", "2r"], values: [-82, -86, -87, -92, -94, -97, -99, -101, -102, -104] },
      { zones: ["2n", "3r"], values: [-90, -94, -98, -101, -103, -106, -109, -111, -112, -114] },
      { zones: ["3e"], values: [-140, -146, -151, -157, -161, -165, -168, -172, -174, -177] },
    ],
  },

  // ---------------- Hip, Exposure C ----------------
  "hip|C|2_to_4": {
    tableNumber: 7,
    columns: [
      { zones: ["1"], values: [-67, -71, -75, -78, -80, -82, -85, -86, -88, -89] },
      { zones: ["2r"], values: [-88, -93, -97, -101, -105, -107, -110, -112, -115, -117] },
      { zones: ["2e", "3"], values: [-94, -100, -104, -109, -113, -115, -119, -121, -124, -125] },
    ],
  },
  "hip|C|4_to_6": {
    tableNumber: 8,
    columns: [
      { zones: ["1"], values: [-71, -75, -79, -82, -84, -87, -89, -91, -93, -94] },
      { zones: ["2r", "2e"], values: [-91, -97, -101, -105, -109, -112, -114, -117, -120, -122] },
      { zones: ["3"], values: [-111, -118, -124, -129, -133, -137, -140, -143, -146, -149] },
    ],
  },
  "hip|C|6_to_12": {
    tableNumber: 9,
    columns: [
      { zones: ["1"], values: [-57, -60, -63, -66, -67, -70, -71, -73, -75, -76] },
      { zones: ["2r"], values: [-98, -104, -109, -113, -117, -120, -123, -126, -129, -131] },
      { zones: ["2e"], values: [-101, -108, -113, -117, -121, -124, -128, -130, -133, -135] },
      { zones: ["3"], values: [-128, -136, -143, -149, -153, -158, -162, -165, -169, -172] },
    ],
  },

  // ---------------- Hip, Exposure D ----------------
  "hip|D|2_to_4": {
    tableNumber: 10,
    columns: [
      { zones: ["1"], values: [-82, -86, -89, -91, -94, -97, -99, -101, -102, -104] },
      { zones: ["2r"], values: [-106, -111, -116, -120, -123, -126, -128, -131, -133, -135] },
      { zones: ["2e", "3"], values: [-114, -120, -124, -129, -132, -136, -138, -141, -143, -146] },
    ],
  },
  "hip|D|4_to_6": {
    tableNumber: 11,
    columns: [
      { zones: ["1"], values: [-65, -68, -71, -73, -75, -77, -79, -80, -82, -83] },
      { zones: ["2e", "2r", "3"], values: [-90, -94, -98, -101, -104, -106, -109, -111, -112, -114] },
    ],
  },
  "hip|D|6_to_12": {
    tableNumber: 12,
    columns: [
      { zones: ["1"], values: [-69, -73, -75, -78, -80, -82, -84, -85, -87, -88] },
      { zones: ["2e"], values: [-119, -124, -129, -134, -137, -141, -143, -146, -149, -151] },
      { zones: ["2r"], values: [-123, -129, -133, -138, -142, -145, -148, -151, -154, -156] },
      { zones: ["3"], values: [-156, -163, -169, -175, -180, -184, -188, -192, -195, -198] },
    ],
  },
};

export interface ZonePressure {
  zones: string[];
  /** Positive magnitude, psf. */
  pasd: number;
}

export interface ScopeCheck {
  withinTableScope: boolean;
  /** Reasons the RAS 127 tables may not be used without a PE seal. */
  reasons: string[];
  warnings: string[];
}

export interface Ras127Inputs {
  roofForm?: RoofForm | null;
  exposureCategory?: ExposureCategory | null;
  slopeBand?: SlopeBand | null;
  /** Rise in a rise:12 slope. Used to derive slopeBand when not given. */
  slopeRise?: number | null;
  meanRoofHeightFt?: number | null;
  riskCategory?: string | null;
  hasOverhang?: boolean | null;
  designWindSpeedMph?: number | null;

  /** From the NOA. All three are required for a result. */
  lambda?: number | null; // ft^3
  mg?: number | null; // ft-lbf
  mf?: number | null; // ft-lbf

  /**
   * PE/RA-sealed pressures, overriding the tables. Supply when the job falls
   * outside the table envelope or a sealed ASCE 7 analysis was performed.
   */
  sealedPressures?: ZonePressure[] | null;
  sealedBy?: string | null;
}

export interface ZoneResult {
  zones: string[];
  label: string;
  pasd: number;
  /** |Pasd| * lambda */
  pasdLambda: number;
  mr: number;
  passes: boolean;
  /** Mf - Mr; negative means the attachment is short. */
  margin: number;
}

export interface Ras127Result {
  ok: boolean;
  /** True only when every zone passes and we had all NOA values. */
  passes: boolean | null;
  zones: ZoneResult[];
  scope: ScopeCheck;
  requiresEngineering: boolean;
  engineeringReason: string | null;
  tableNumber: number | null;
  heightBandLabel: string | null;
  usedSealedPressures: boolean;
  missing: string[];
  standardRef: string;
  provenance: string;
}

/** Map a rise:12 slope to a RAS 127 slope band. */
export function slopeBandFromRise(rise: number): SlopeBand | null {
  if (!Number.isFinite(rise)) return null;
  if (rise < 2) return null; // below table scope
  if (rise <= 4) return "2_to_4";
  if (rise <= 6) return "4_to_6";
  if (rise <= 12) return "6_to_12";
  return null; // above table scope
}

function heightBandIndex(h: number): number | null {
  if (!Number.isFinite(h) || h <= 0) return null;
  for (let i = 0; i < HEIGHT_BANDS.length; i++) {
    if (h <= HEIGHT_BANDS[i]) return i;
  }
  return null; // above 60 ft
}

export function zoneLabel(zones: string[]): string {
  if (zones.length === 1) return `Zone ${zones[0]}`;
  return `Zones ${zones.slice(0, -1).join(", ")} and ${zones[zones.length - 1]}`;
}

/**
 * Check whether the RAS 127-20 tables may be used without a signed and
 * sealed engineering analysis (RAS 127-20 section 1 Scope).
 */
export function checkScope(input: Ras127Inputs): ScopeCheck {
  const reasons: string[] = [];
  const warnings: string[] = [];

  const slopeBand =
    input.slopeBand ??
    (typeof input.slopeRise === "number"
      ? slopeBandFromRise(input.slopeRise)
      : null);

  if (!input.roofForm) reasons.push("Roof form (gable or hip) is not set.");
  if (!input.exposureCategory) {
    reasons.push("Exposure category is not set.");
  } else if (input.exposureCategory === "B") {
    reasons.push(
      "RAS 127-20 publishes tables for Exposure C and D only. Exposure B requires a sealed ASCE 7 analysis."
    );
  }

  if (!slopeBand) {
    if (typeof input.slopeRise === "number") {
      reasons.push(
        `Roof slope ${input.slopeRise}:12 is outside the tabulated range of 2:12 to 12:12.`
      );
    } else {
      reasons.push("Roof slope is not set.");
    }
  }

  const hb =
    typeof input.meanRoofHeightFt === "number"
      ? heightBandIndex(input.meanRoofHeightFt)
      : null;
  if (typeof input.meanRoofHeightFt !== "number") {
    reasons.push("Mean roof height is not set.");
  } else if (hb === null) {
    reasons.push(
      `Mean roof height ${input.meanRoofHeightFt} ft exceeds the 60 ft table limit.`
    );
  }

  if (input.riskCategory && input.riskCategory !== "II") {
    reasons.push(
      `The tables are Risk Category II only; this job is Risk Category ${input.riskCategory}.`
    );
  } else if (!input.riskCategory) {
    warnings.push(
      "Risk category is not set. The RAS 127-20 tables apply to Risk Category II only."
    );
  }

  if (input.hasOverhang === false) {
    reasons.push(
      "The RAS 127-20 tables are published for roofs with overhangs."
    );
  } else if (input.hasOverhang == null) {
    warnings.push(
      "Overhang not confirmed. The RAS 127-20 tables are published for roofs with overhangs."
    );
  }

  if (
    typeof input.designWindSpeedMph === "number" &&
    input.designWindSpeedMph > 175
  ) {
    reasons.push(
      `The tables are built for 175 mph; this job specifies ${input.designWindSpeedMph} mph.`
    );
  }

  if (input.roofForm === "hip" && slopeBand) {
    warnings.push(HIP_FOOTNOTE_WARNING);
  }

  return { withinTableScope: reasons.length === 0, reasons, warnings };
}

/** Look up the tabulated pressures for a job. */
export function lookupPressures(input: Ras127Inputs): {
  pressures: ZonePressure[];
  tableNumber: number | null;
  heightBandLabel: string | null;
} {
  const slopeBand =
    input.slopeBand ??
    (typeof input.slopeRise === "number"
      ? slopeBandFromRise(input.slopeRise)
      : null);
  const hb =
    typeof input.meanRoofHeightFt === "number"
      ? heightBandIndex(input.meanRoofHeightFt)
      : null;

  if (
    !input.roofForm ||
    !input.exposureCategory ||
    input.exposureCategory === "B" ||
    !slopeBand ||
    hb === null
  ) {
    return { pressures: [], tableNumber: null, heightBandLabel: null };
  }

  const table = TABLES[`${input.roofForm}|${input.exposureCategory}|${slopeBand}`];
  if (!table) return { pressures: [], tableNumber: null, heightBandLabel: null };

  return {
    pressures: table.columns.map((c) => ({
      zones: c.zones,
      pasd: Math.abs(c.values[hb]),
    })),
    tableNumber: table.tableNumber,
    heightBandLabel: HEIGHT_BAND_LABELS[hb],
  };
}

/**
 * Run the RAS 127-20 Method 1 check.
 *
 * Never extrapolates and never invents an NOA value: if the job is outside
 * the table envelope and no sealed pressures were supplied, or if lambda /
 * Mg / Mf are missing, the result reports what is missing instead of
 * producing a number.
 */
export function calculateRas127Method1(input: Ras127Inputs): Ras127Result {
  const scope = checkScope(input);
  const sealed = input.sealedPressures?.filter((p) => Number.isFinite(p.pasd)) ?? [];
  const usedSealedPressures = sealed.length > 0;

  const lookup = usedSealedPressures
    ? { pressures: sealed, tableNumber: null, heightBandLabel: null }
    : lookupPressures(input);

  const missing: string[] = [];
  if (typeof input.lambda !== "number" || !(input.lambda > 0)) {
    missing.push("Aerodynamic multiplier (lambda) from the NOA");
  }
  if (typeof input.mg !== "number") {
    missing.push("Restoring moment due to gravity (Mg) from the NOA");
  }
  if (typeof input.mf !== "number") {
    missing.push("Attachment resistance (Mf) from the NOA");
  }

  let requiresEngineering = false;
  let engineeringReason: string | null = null;

  if (!usedSealedPressures && !scope.withinTableScope) {
    requiresEngineering = true;
    engineeringReason =
      "Outside the RAS 127-20 table scope. A design wind pressure analysis prepared, signed and sealed by a Florida professional engineer or registered architect, based on ASCE 7, is required. " +
      scope.reasons.join(" ");
  }

  if (lookup.pressures.length === 0) {
    return {
      ok: false,
      passes: null,
      zones: [],
      scope,
      requiresEngineering,
      engineeringReason,
      tableNumber: null,
      heightBandLabel: null,
      usedSealedPressures,
      missing: [
        ...missing,
        usedSealedPressures
          ? "Sealed zone pressures"
          : "Tabulated design pressures (see scope reasons)",
      ],
      standardRef: STANDARD_REF,
      provenance: TABLE_PROVENANCE,
    };
  }

  if (missing.length > 0) {
    return {
      ok: false,
      passes: null,
      zones: [],
      scope,
      requiresEngineering,
      engineeringReason,
      tableNumber: lookup.tableNumber,
      heightBandLabel: lookup.heightBandLabel,
      usedSealedPressures,
      missing,
      standardRef: STANDARD_REF,
      provenance: TABLE_PROVENANCE,
    };
  }

  const lambda = input.lambda as number;
  const mg = input.mg as number;
  const mf = input.mf as number;

  const zones: ZoneResult[] = lookup.pressures.map((p) => {
    const pasdLambda = Math.abs(p.pasd) * lambda;
    const mr = pasdLambda - mg;
    return {
      zones: p.zones,
      label: zoneLabel(p.zones),
      pasd: Math.abs(p.pasd),
      pasdLambda: round(pasdLambda, 4),
      mr: round(mr, 4),
      passes: mf >= mr,
      margin: round(mf - mr, 4),
    };
  });

  return {
    ok: true,
    passes: zones.every((z) => z.passes),
    zones,
    scope,
    requiresEngineering,
    engineeringReason,
    tableNumber: lookup.tableNumber,
    heightBandLabel: lookup.heightBandLabel,
    usedSealedPressures,
    missing: [],
    standardRef: STANDARD_REF,
    provenance: TABLE_PROVENANCE,
  };
}

/**
 * FBC-B 1518.8.5 closed form for lambda, for use ONLY when the NOA does not
 * publish one. NOA values are TAS 108 test results and always win: this
 * formula can differ from the tested value by 15% or more, and even
 * disagrees with the NOA on whether batten or direct-deck is larger.
 *
 * b = exposed (cover) width of the tile, ft
 * l = overall tile length, ft
 */
export function estimateLambda(
  exposedWidthFt: number,
  tileLengthFt: number,
  application: "direct_deck" | "batten"
): number | null {
  if (!(exposedWidthFt > 0) || !(tileLengthFt > 0)) return null;
  const c = application === "batten" ? 0.144 : 0.156;
  return round(c * exposedWidthFt * tileLengthFt * tileLengthFt, 4);
}

export const ESTIMATE_LAMBDA_CAVEAT =
  "Estimated with the FBC-B 1518.8.5 formula. This is a fallback only. If the NOA publishes an aerodynamic multiplier, use the NOA value instead - it is a TAS 108 test result and supersedes this formula.";

function round(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
