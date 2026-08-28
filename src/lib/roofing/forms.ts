/**
 * Roofing permit form catalog + checklist rules.
 *
 * The required-attachment matrix below is transcribed from the instruction
 * page of the Florida Building Code 8th Edition (2023) High-Velocity
 * Hurricane Zone Uniform Permit Application Form (FBC Section 1525).
 *
 * Do not "tidy" these mappings without checking them against the form
 * itself - they are what a plans examiner checks against.
 */

export type RoofSystem =
  | "low_slope"
  | "prescriptive_bur_ras150"
  | "asphalt_shingles"
  | "mechanically_fastened_tile"
  | "mortar_adhesive_set_tile"
  | "metal_panel_shingles"
  | "wood_shingles_shakes"
  | "other";

export type WorkType = "new_roof" | "reroof" | "repair";

export const ROOF_SYSTEMS: Array<{ value: RoofSystem; label: string }> = [
  { value: "low_slope", label: "Low slope application" },
  { value: "prescriptive_bur_ras150", label: "Prescriptive BUR - RAS 150" },
  { value: "asphalt_shingles", label: "Asphalt shingles" },
  { value: "mechanically_fastened_tile", label: "Mechanically fastened tile" },
  { value: "mortar_adhesive_set_tile", label: "Mortar or adhesive set tile" },
  { value: "metal_panel_shingles", label: "Metal panel / shingles" },
  { value: "wood_shingles_shakes", label: "Wood shingles and shakes" },
  { value: "other", label: "Other" },
];

export const WORK_TYPES: Array<{ value: WorkType; label: string }> = [
  { value: "new_roof", label: "New roof" },
  { value: "reroof", label: "Reroof" },
  { value: "repair", label: "Repair" },
];

/**
 * Sections of the HVHZ Uniform Permit Application that must be completed,
 * per roof system. Source: FBC 8th Ed. (2023) Section 1525 instruction page.
 */
export const HVHZ_REQUIRED_SECTIONS: Record<RoofSystem, string[]> = {
  low_slope: ["A", "B", "C"],
  prescriptive_bur_ras150: ["A", "B", "C"],
  asphalt_shingles: ["A", "B", "D"],
  // The form lists a single "Concrete or Clay Tile" row (A,B,D,E). We split
  // tile into mechanically fastened vs mortar/adhesive set because the two
  // use different uplift standards (RAS 127 vs RAS 128), but the required
  // application sections are identical.
  mechanically_fastened_tile: ["A", "B", "D", "E"],
  mortar_adhesive_set_tile: ["A", "B", "D", "E"],
  metal_panel_shingles: ["A", "B", "D"],
  wood_shingles_shakes: ["A", "B", "D"],
  other: ["A", "B"],
};

/**
 * HVHZ attachment numbers required per roof system.
 * Source: FBC 8th Ed. (2023) Section 1525 instruction page.
 */
export const HVHZ_REQUIRED_ATTACHMENTS: Record<RoofSystem, number[]> = {
  low_slope: [1, 2, 3, 4, 5, 6, 7],
  prescriptive_bur_ras150: [4, 5, 6, 7],
  asphalt_shingles: [1, 2, 4, 5, 6, 7],
  mechanically_fastened_tile: [1, 2, 3, 4, 5, 6, 7],
  mortar_adhesive_set_tile: [1, 2, 3, 4, 5, 6, 7],
  metal_panel_shingles: [1, 2, 3, 4, 5, 6, 7],
  wood_shingles_shakes: [1, 2, 4, 5, 6, 7],
  other: [1, 2, 3, 4, 5, 6, 7],
};

export const HVHZ_ATTACHMENTS: Record<
  number,
  { title: string; detail?: string }
> = {
  1: { title: "Fire Directory Listing Page" },
  2: {
    title: "Product Approval pages",
    detail:
      "Front page, specific system description, specific system limitations, general limitations, and applicable detail drawings.",
  },
  3: {
    title: "Design calculations",
    detail:
      "Per FBC Chapter 16, or if applicable RAS 127 or RAS 128.",
  },
  4: { title: "Other component of Product Approval" },
  5: { title: "Municipal permit application" },
  6: {
    title: "Owner's Notification for Roofing Considerations",
    detail: "Reroofing only (FBC Section 1524).",
  },
  7: { title: "Any required roof testing / calculation documentation" },
};

export interface FormTemplate {
  code: string;
  title: string;
  authority?: string;
  /** null / undefined = applies to all jurisdictions we serve */
  jurisdiction?: string;
  publicPath: string;
  attachmentGroup?: number;
  requiresNotary?: boolean;
  requiresOwnerSignature?: boolean;
  requiresContractorSignature?: boolean;
  sortOrder: number;
  notes?: string;
  /** Restrict to these work types. Undefined = all. */
  workTypes?: WorkType[];
  /** Restrict to these roof systems. Undefined = all. */
  roofSystems?: RoofSystem[];
}

/**
 * The blank forms we currently hold. PDFs live in /public/forms/roofing so
 * a contractor can download them without a signed URL round-trip.
 */
export const FORM_TEMPLATES: FormTemplate[] = [
  {
    code: "hvhz_uniform_permit_app",
    title: "HVHZ Uniform Roofing Permit Application",
    authority: "FBC 8th Edition (2023), Section 1525",
    publicPath:
      "/forms/roofing/hvhz-uniform-roofing-permit-application-fbc-2023.pdf",
    attachmentGroup: 5,
    requiresContractorSignature: true,
    sortOrder: 10,
    notes:
      "Complete only the sections required for the selected roof system (see HVHZ_REQUIRED_SECTIONS).",
  },
  {
    code: "section_1524_owners_notification",
    title: "Section 1524 Owner's Notification for Roofing Considerations",
    authority: "FBC Section 1524 (City of Plantation revision 12/31/2023)",
    jurisdiction: "Plantation",
    publicPath: "/forms/roofing/section-1524-owners-notification.pdf",
    attachmentGroup: 6,
    requiresOwnerSignature: true,
    requiresContractorSignature: true,
    sortOrder: 20,
    workTypes: ["reroof"],
    notes:
      "Reroofing only. The owner must initial every item; the contractor explains each one.",
  },
  {
    code: "plantation_hurricane_mitigation",
    title: "Hurricane Mitigation Retrofits Application",
    authority: "Florida Statute 553.844 (City of Plantation, rev. 07/08/2025)",
    jurisdiction: "Plantation",
    publicPath:
      "/forms/roofing/plantation-hurricane-mitigation-retrofit-application.pdf",
    requiresOwnerSignature: true,
    requiresContractorSignature: true,
    sortOrder: 30,
    workTypes: ["reroof"],
    notes:
      "Existing site-built single family only. Section C is required when insured or ad-valorem value is $300,000 or more and the dwelling was permitted before 2002.",
  },
  {
    code: "plantation_roof_to_wall_affidavit",
    title: "Roof to Wall Connection Affidavit",
    authority: "Florida Existing Building Code 706.8 (City of Plantation, rev. 07/08/2025)",
    jurisdiction: "Plantation",
    publicPath:
      "/forms/roofing/plantation-roof-to-wall-connection-affidavit.pdf",
    requiresNotary: true,
    requiresContractorSignature: true,
    sortOrder: 40,
    workTypes: ["reroof"],
    notes:
      "Signed and notarized/sealed at permit submittal. Only required when the FEBC 706.8 value threshold is triggered.",
  },
];

export function getFormTemplate(code: string) {
  return FORM_TEMPLATES.find((t) => t.code === code);
}

export interface ChecklistContext {
  jurisdiction?: string | null;
  roofSystem?: RoofSystem | null;
  workType?: WorkType | null;
  /** FEBC 706.8 / FS 553.844 roof-to-wall trigger, if already determined. */
  roofToWallRequired?: boolean | null;
  insuredValueUsd?: number | null;
  yearPermitted?: number | null;
}

export interface ChecklistItem {
  templateCode: string;
  title: string;
  required: boolean;
  sortOrder: number;
  /** Why this item is on the list - shown in the admin UI. */
  reason?: string;
  /** True when we cannot decide automatically and a human must confirm. */
  needsConfirmation?: boolean;
  waivedReason?: string;
}

/**
 * Jurisdictions that do not require the HVHZ Fire Directory Listing page
 * (attachment 1) on roofing submittals.
 */
const FIRE_DIRECTORY_EXEMPT_JURISDICTIONS = ["plantation"];

export function isFireDirectoryExempt(jurisdiction?: string | null): boolean {
  if (!jurisdiction) return false;
  return FIRE_DIRECTORY_EXEMPT_JURISDICTIONS.includes(
    jurisdiction.trim().toLowerCase()
  );
}

/**
 * Decide whether the roof-to-wall connection requirement is triggered.
 * FEBC 706.8: applies to a roof covering replacement in the wind-borne debris
 * region on a building with insured or just value of $300,000 or more.
 * Dwellings permitted in 2002 or later already comply.
 *
 * Returns `null` when we do not have enough information to decide, in which
 * case the checklist marks the item as "needs confirmation" rather than
 * silently dropping or forcing it.
 */
export function roofToWallTriggered(
  ctx: ChecklistContext
): boolean | null {
  if (typeof ctx.roofToWallRequired === "boolean") return ctx.roofToWallRequired;
  if (ctx.workType && ctx.workType !== "reroof") return false;
  if (ctx.yearPermitted && ctx.yearPermitted >= 2002) return false;
  if (typeof ctx.insuredValueUsd === "number") {
    if (ctx.insuredValueUsd < 300_000) return false;
    if (!ctx.yearPermitted) return null; // value qualifies, age unknown
    return true;
  }
  return null;
}

/**
 * Build the required-form checklist for a job.
 * Pure function - no database access - so it can be unit tested and also
 * previewed in the UI before anything is written.
 */
export function buildChecklist(ctx: ChecklistContext): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const jurisdiction = ctx.jurisdiction?.trim().toLowerCase() || null;

  for (const t of FORM_TEMPLATES) {
    // Jurisdiction gate
    if (
      t.jurisdiction &&
      jurisdiction &&
      t.jurisdiction.toLowerCase() !== jurisdiction
    ) {
      continue;
    }

    // Work-type gate
    if (t.workTypes && ctx.workType && !t.workTypes.includes(ctx.workType)) {
      continue;
    }

    // Roof-system gate
    if (t.roofSystems && ctx.roofSystem && !t.roofSystems.includes(ctx.roofSystem)) {
      continue;
    }

    let required = true;
    let reason: string | undefined = t.notes;
    let needsConfirmation = false;

    if (
      t.code === "plantation_roof_to_wall_affidavit" ||
      t.code === "plantation_hurricane_mitigation"
    ) {
      const trigger = roofToWallTriggered(ctx);
      if (trigger === false) {
        required = false;
        reason =
          "Not triggered - FEBC 706.8 value threshold not met or dwelling permitted 2002 or later.";
      } else if (trigger === null) {
        needsConfirmation = true;
        reason =
          "Confirm insured or ad-valorem value and the year the dwelling was permitted to decide whether FEBC 706.8 applies.";
      }
    }

    items.push({
      templateCode: t.code,
      title: t.title,
      required,
      sortOrder: t.sortOrder,
      reason,
      needsConfirmation,
    });
  }

  // HVHZ attachments become checklist items too, so nothing gets forgotten.
  if (ctx.roofSystem) {
    const attachments = HVHZ_REQUIRED_ATTACHMENTS[ctx.roofSystem] ?? [];
    for (const n of attachments) {
      const meta = HVHZ_ATTACHMENTS[n];
      if (!meta) continue;

      // Attachment 5 is the municipal application, already covered above.
      if (n === 5) continue;
      // Attachment 6 is the 1524 notification, already covered above.
      if (n === 6) continue;

      let required = true;
      let waivedReason: string | undefined;

      if (n === 1 && isFireDirectoryExempt(ctx.jurisdiction)) {
        required = false;
        waivedReason = `${ctx.jurisdiction} does not require the Fire Directory Listing page.`;
      }
      if (n === 6 && ctx.workType && ctx.workType !== "reroof") {
        required = false;
        waivedReason = "Reroofing only.";
      }

      items.push({
        templateCode: `hvhz_attachment_${n}`,
        title: `Attachment ${n}: ${meta.title}`,
        required,
        sortOrder: 100 + n,
        reason: meta.detail,
        waivedReason,
      });
    }
  }

  // Cost Estimate gate - a package is never internally complete without it.
  items.push({
    templateCode: "cost_estimate",
    title: "Cost estimate",
    required: true,
    sortOrder: 200,
    reason:
      "Required before the permit package can be marked internally complete.",
  });

  // Asbestos survey - a reminder, never a hard block.
  items.push({
    templateCode: "asbestos_certificate",
    title: "Asbestos survey / certificate",
    required: false,
    sortOrder: 210,
    reason:
      "Confirm whether an asbestos survey is required for this structure. This is a reminder, not a submittal blocker.",
    needsConfirmation: true,
  });

  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}
