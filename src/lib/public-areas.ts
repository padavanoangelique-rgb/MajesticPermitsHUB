export type PublicArea = {
  slug: string;
  city: string;
  county: "Broward" | "Miami-Dade" | "Palm Beach";
  description: string;
  intro: string;
  watch: string[];
  windows: string;
  doors: string;
  roofing: string;
  renovation: string;
  related: string[];
};

export const PUBLIC_AREAS: PublicArea[] = [
  {
    slug: "weston",
    city: "Weston",
    county: "Broward",
    description:
      "Weston permit expediter for window, door, roofing, and renovation projects. We file complete packages with the City of Weston building department.",
    intro:
      "Weston runs permits through its own ePermit portal, under the Florida Building Code and Broward County. Window and door replacement sits on the city's quick-permit list, next to garage doors and shutters. That list is not a promise. The city says a 3–5 business day review only happens when the submittal is already complete. Most of the delay we see is a missing Broward retrofit schedule or a product approval that does not match the opening on the order.",
    watch: [
      "The Broward County Uniform Retrofit Window and Door Schedule (Policy 20-01) and the city's retrofit-window affidavit have to agree with the sizes on the plans.",
      "Quick-permit status still dies if a file is named wrong or a sheet is unsigned. Weston publishes a document naming convention and we follow it.",
      "Master associations in Weston are a separate approval from the city. We ask which community the house is in before we tell you the city is the only stop.",
      "Re-roofs use Weston's own roof and gas-vent affidavit, not a generic Broward cover sheet.",
    ],
    windows:
      "We line up the product approval, the wind-load chart, and the retrofit schedule before anything is uploaded. A Weston window permit that is kicked back for a mismatched series wastes the quick-review window.",
    doors:
      "Impact doors and garage doors are on the same quick-permit family as windows, but the rough opening and the hardware still have to be the product that was approved. We do not file a door from a window approval.",
    roofing:
      "A Weston reroof is its own packet: the city's re-roof affidavit, product approval for the system going on, and a Notice of Commencement on file before the first inspection when the job is over the city's threshold.",
    renovation:
      "Interior work that moves a wall, a kitchen that changes plumbing, or anything that touches structure leaves the quick-permit lane. We say that up front instead of forcing it through the window checklist.",
    related: ["plantation", "pembroke-pines", "fort-lauderdale"],
  },
  {
    slug: "tamarac",
    city: "Tamarac",
    county: "Broward",
    description:
      "Tamarac permit expediter for windows, doors, and reroofs. We register the contractor, match product approvals, and file through the city ePermits portal.",
    intro:
      "Tamarac publishes a short window-and-door list, and it is more specific than most cities bother to be. They want the building permit application, a Notice of Commencement if the job is over $5,000, a window-door permit package, plans that are not signed and sealed, and the product approvals. A shutter checklist and manufacturer specs come out when the opening needs them. The portal is ePermits. Contractors have to be registered with the city before they can be picked on an application, and that registration has no fee.",
    watch: [
      "Plans on a straight window replacement are accepted unsigned. The moment the opening changes size or a mullion shows up, that assumption is wrong and we stop.",
      "Insurance and license updates for a contractor already on file go to Contractor@Tamarac.gov. Sending the whole registration packet again just sits.",
      "The $5,000 Notice of Commencement line is printed on their window page. We do not wait for an inspector to be the one who mentions it.",
      "Condos along the commercial corridors often have a manager who wants a letter even though the city checklist does not ask for one.",
    ],
    windows:
      "We build the Tamarac window package around their published list: application, product approvals, and the opening sketch. If a shutter is part of the protection, the shutter checklist goes in the same upload.",
    doors:
      "Exterior doors use the same window-door package. We mark the approval number for that door, not the window next to it.",
    roofing:
      "Reroofs are not on the window checklist. We pull the current roof packet from the city instead of reusing the window file names.",
    renovation:
      "A bathroom or kitchen that stays inside the existing footprint is still a building permit if plumbing or electrical moves. We do not describe that as a window job to get it in the door faster.",
    related: ["plantation", "fort-lauderdale", "weston"],
  },
  {
    slug: "aventura",
    city: "Aventura",
    county: "Miami-Dade",
    description:
      "Aventura permit expediter for condo and house opening protection. Window, door, and shutter permits follow the city's own checklist, including association letters.",
    intro:
      "Aventura is a condo city that happens to have houses on the edges. The building division's window, door, and shutter sheet is not a Broward retrofit form with the city name swapped. They want a notarized application signed by the owner and the contractor, proof of ownership, a corporate signer if a company owns the unit, and an authorization letter from the association, property manager, or condominium. They also want site-specific calculations sealed by a Florida engineer, a floor-plan sketch with height and distance from the corners, and a schedule of every opening. Submittals go through ePermits with the folio number in the subject line. White-out on the signed application is rejected.",
    watch: [
      "The association letter is on the city checklist here. In a lot of other cities it is only an HOA problem. In Aventura it is both.",
      "Calculations are sealed, and the city notes the effective area rule: more than 60 feet uses 20 square feet, less than 60 uses 10. We do not hand them a generic one-page chart and hope.",
      "Corrections are a different email subject from a new permit. Mixing those up restarts the intake clock. They say you hear back within two working days if the package was accepted for review.",
      "Their own sheet says a permit is required for windows, doors, kitchen and bath remodels, and general maintenance over $500. We do not tell an owner a flooring or cabinet job is invisible to the city.",
    ],
    windows:
      "High-rise units and two-story houses do not share a calculation. We get the engineer’s sheet for that building height before the schedule is drawn.",
    doors:
      "Sliding doors and entry doors are line items on the same schedule, with their own product approvals. A shutter-only job is a different document set, and the city says so.",
    roofing:
      "Tower reroofs and a single-family tile roof are different reviewers in practice. We do not file a house roof packet against a condominium folio.",
    renovation:
      "A kitchen inside an Aventura condo still needs the association and the city. We sequence those so the manager is not surprised by a permit that was already issued.",
    related: ["miami", "hialeah", "hollywood"],
  },
  {
    slug: "plantation",
    city: "Plantation",
    county: "Broward",
    description:
      "Plantation permit expediter for windows, doors, and reroofs filed with the Department of Building Safety. Association approval is not a city requirement here.",
    intro:
      "Plantation's Department of Building Safety is explicit about something other Broward cities leave muddy. As of May 8, 2023, a COA, HOA, or POA approval is not a condition to apply for or receive a building permit. The city also says, just as clearly, that a city permit is not association approval. We treat those as two different clocks. Their window packet points at an opening-protection mitigation application, the Broward County Uniform Retrofit Window and Door Schedule, and a wind-load chart. Roofing points at the High-Velocity Hurricane Zone uniform application (section 1525), a re-roof hurricane mitigation form, a roof-to-wall connection affidavit, and the section 1524 owner notification.",
    watch: [
      "Do not hold a complete city package because the HOA board meets next month. File the city, and run the association in parallel, and tell the owner both are real.",
      "The building department phone on their permit page is (954) 797-2765. We use the published checklists instead of a generic Broward upload.",
      "Owner-builders are limited to a single-family home they occupy, or a commercial building they are not selling or leasing. We do not put an investor on an owner-builder affidavit.",
      "Drainage districts show up on larger site work (Old Plantation Water Control District and Plantation Acres). A window replacement does not need that. A lot-line addition might.",
    ],
    windows:
      "The retrofit schedule and the wind-load chart have to describe the same openings. Plantation reviewers bounce packages where the chart is county-generic and the schedule is house-specific, or the other way around.",
    doors:
      "Doors ride the window checklist when they are a replacement of an existing opening. A new opening in a wall is structural and we do not sneak it onto the retrofit form.",
    roofing:
      "We start from Plantation's roofing list: HVHZ application, hurricane mitigation, roof-to-wall affidavit, owner notification. Tile and shingle do not share a product approval.",
    renovation:
      "Fences, driveways, and interior alterations each have their own requirement sheets. We pull the sheet for the actual scope instead of stapling it to a window permit.",
    related: ["weston", "tamarac", "fort-lauderdale"],
  },
  {
    slug: "pembroke-pines",
    city: "Pembroke Pines",
    county: "Broward",
    description:
      "Pembroke Pines permit expediter. Applications go through the Development Hub, not email, for windows, doors, roofing, and renovations.",
    intro:
      "Pembroke Pines stopped taking permit applications by email on April 25, 2022. Everything new goes through the Development Hub or across the counter at the building department. Approved files are downloaded from that hub, not from a clerk's outbox. Applications are worked in the order they arrive, and an incomplete one is a hold, not a place in line. The form they want is the current Broward County Uniform Building Permit Application, typed or clearly printed, with no white-out.",
    watch: [
      "Emailing a PDF to a plans examiner does not start a Pines permit. We register the contact in the Development Hub first.",
      "Owner and agent signatures are optional on many of their applications. We still get them when the scope needs an owner authorization, instead of assuming the optional line means nobody signs.",
      "The building department number published for submittal questions is (954) 435-6502.",
      "Western communities here are association-heavy. The city will issue without the board, and the board can still stop the install. We tell the owner which one we are waiting on.",
    ],
    windows:
      "Impact window packages need the uniform application plus product approvals that match the schedule. We do not upload a showroom quote and call it a plan.",
    doors:
      "Entry and sliding doors are called out opening by opening. A door approval from a different series than the one on the order is the correction we see most.",
    roofing:
      "Reroofs use the Broward roof packet for this city, filed in the hub like everything else. There is no side door by email.",
    renovation:
      "Additions and interior alterations wait in the same queue. A clean, complete file is the only way to keep the place in line they already assigned.",
    related: ["hollywood", "weston", "plantation"],
  },
  {
    slug: "hollywood",
    city: "Hollywood",
    county: "Broward",
    description:
      "Hollywood permit expediter for beach and inland properties. We file windows, doors, roofing, and renovations with the city building division and track them in the self-service portal.",
    intro:
      "Hollywood's public building page is built around a permit you already have. The self-service portal shows application status, plan-review comments, inspection results, and fee payment once the status flips to ready for issuance. The building division phone for a legal status check, including a sale, is 954-921-3335. Inspections requested Monday through Thursday after 6 p.m. roll to the next business day. A Saturday or Sunday request rolls to the second business day. Beach houses and inland houses do not get the same flood questions, and we do not pretend they do.",
    watch: [
      "We confirm the current window and door intake packet with the division before filing. Their website is clearer about tracking than about the opening-protection checklist, and we will not invent a form name to fill the gap.",
      "Fee payment is not the same day as approval. They ask for about 24 business hours after the status changes before the digital permit is emailed.",
      "Inspector phone numbers post after 8:30 a.m. on the morning of the inspection. We do not promise a name the night before.",
      "A resale that needs a permit status letter is a phone call to the division, not a screenshot of the portal.",
    ],
    windows:
      "Broward high-velocity rules still apply west of the Intracoastal and on the barrier island. The product approval has to cover the pressure at that specific house, not the pressure from the last Hollywood job.",
    doors:
      "Impact doors on older beach houses often share a wall with windows that are not being changed. We permit what is actually being replaced and note what is existing.",
    roofing:
      "A reroof near the beach can pick up a flood-zone question a house west of I-95 never sees. We check that before we order the product.",
    renovation:
      "Interior renovations in Hollywood's older neighborhoods get looked at for what is already nonconforming. We do not describe a wall removal as a finish upgrade.",
    related: ["fort-lauderdale", "pembroke-pines", "aventura"],
  },
  {
    slug: "fort-lauderdale",
    city: "Fort Lauderdale",
    county: "Broward",
    description:
      "Fort Lauderdale permit expediter. New building permits are digital only through LauderBuild, including windows, doors, roofing, and renovations.",
    intro:
      "Fort Lauderdale's portal is LauderBuild, the city's Accela site. Since January 1, 2024, new permit applications and the plans that go with them are digital. Paper is not an option for a new submittal. Plan review happens in the LauderBuild Plan Room. You can still search a record and pay a fee without an account. Applying, answering a comment, and uploading a correction all require a free registration. Walk-through applications can be started any time, but the city only processes them the next business morning between 8:00 and 9:30.",
    watch: [
      "A comment left in email does not answer a LauderBuild review. The response has to go back through the plan room or the reviewer never sees it.",
      "Downtown, Las Olas, and a single-family house west of 441 are not the same review even when the trade is 'windows.' We do not use one narrative for all three.",
      "Right-of-way and planning permits live in the same portal and are not building permits. We do not open the wrong record type to save a click.",
      "Contractor registration and insurance updates are a LauderBuild task. An expired registration stops the application before a plans examiner opens it.",
    ],
    windows:
      "Window packages are uploaded as individual files in the plan room, named so the reviewer can tell the application from the product approval. A single combined scan is how these get stalled.",
    doors:
      "Storefront doors on a commercial frontage and an impact door on a house are different permit types inside the same portal. We pick the record that matches the occupancy.",
    roofing:
      "Reroofs are digital-only like everything else. Product approval, the Broward roof application, and the owner notice go in as separate files, not a phone photo of a stack.",
    renovation:
      "A renovation that also needs a planning or right-of-way approval is two records. We tell you that before we start, because LauderBuild will not merge them for you.",
    related: ["hollywood", "plantation", "tamarac"],
  },
  {
    slug: "boca-raton",
    city: "Boca Raton",
    county: "Palm Beach",
    description:
      "Boca Raton permit expediter. The city splits the application (Boca Ehub) from the plan upload (Eplans / ProjectDox). We run both.",
    intro:
      "Boca Raton is outside the high-velocity hurricane zone, and the building department uses two systems that do not replace each other. Boca Ehub is where the permit is applied for, paid, inspected, and searched. Boca Eplans, which is ProjectDox, is where the files are uploaded and the review comments live. People lose a week by finishing Ehub and never opening Eplans. Owner-builder permits are narrow: a single-family house, the applicant on title, currently living there, not a rental and not owned by a business. Sections 7 and 8 of the application are notarized by the owner no matter the job value.",
    watch: [
      "Florida Product Approval is the usual path here, matched to the design pressure on that opening. We do not attach a Miami-Dade NOA out of habit and we do not skip the pressure check because the county is outside the HVHZ.",
      "Approved files are downloaded from Eplans after issuance. Ehub status alone is not the stamped set.",
      "Coastal houses and houses west of the Turnpike do not share a design pressure. We calculate for the site.",
      "Association architectural review in Boca is often stricter than the city. The city can issue while the board says no. We track both.",
    ],
    windows:
      "The window schedule, the product approval, and the pressure at each opening are one package across both portals. Uploading the approval in Eplans and forgetting it on the Ehub application is a Boca-specific miss.",
    doors:
      "Impact and non-impact doors both get permitted. The difference is whether the approval covers the pressure, not whether the city is in Miami-Dade.",
    roofing:
      "Reroof applications start in Ehub and the roof system approval is uploaded in Eplans. Tile, metal, and shingle are not interchangeable approvals.",
    renovation:
      "Interior renovations that change structure or the exterior elevation pick up a planning question faster in Boca than a straight replacement does. We flag that before the application is typed.",
    related: ["boynton-beach", "west-palm-beach", "fort-lauderdale"],
  },
  {
    slug: "west-palm-beach",
    city: "West Palm Beach",
    county: "Palm Beach",
    description:
      "West Palm Beach permit expediter. Building permits run through the city's EPL system on Civic Access, from window replacement to reroof and renovation.",
    intro:
      "West Palm Beach calls its portal EPL, Enterprise Permitting and Licensing. Customers use Civic Access to apply, pay, upload corrections, download the permit card, and schedule inspections. The building division counter is on the first floor at 401 Clematis Street. The published line is (561) 805-6700 and the department mailbox is ds@wpb.org. Contractor registration wants the license, insurance, and workers-comp certificate or exemption before the company can be used on an application. Planning has its own historic preservation section. A house in a historic district is not a normal window swap, and we check that before we quote the path.",
    watch: [
      "EPL is 100% digital. A paper set dropped at the counter is not the application.",
      "Historic preservation is a real review path, not a rumor. If the property is in an overlay, the window product the owner likes may not be the product the district will accept. We find out before the order is placed.",
      "Code cases are visible in the same family of tools. An open case can sit under a new permit and we look before we file.",
      "Palm Beach County is outside the HVHZ. Design pressure still governs. A Miami-Dade NOA is not automatically the document they want, and a Florida approval that misses the pressure is not enough.",
    ],
    windows:
      "We match the Florida product approval to the opening schedule and, where the district cares, to the elevation the historic reviewer will see.",
    doors:
      "Entry doors on older Northwood and Flamingo Park houses get the historic question first. A new house in the western neighborhoods usually does not. We do not use one door narrative for both.",
    roofing:
      "Reroofs are applied in Civic Access with the system approval attached. We do not assume a tile roof can be replaced with shingles without saying so on the application.",
    renovation:
      "Additions and interior structural work can pick up zoning as well as building. EPL keeps those as separate applications and so do we.",
    related: ["boynton-beach", "boca-raton", "miami"],
  },
  {
    slug: "boynton-beach",
    city: "Boynton Beach",
    county: "Palm Beach",
    description:
      "Boynton Beach permit expediter. New permits, including reroofs, windows, and doors, are filed in SagesGov as unlocked PDFs.",
    intro:
      "Boynton Beach moved new permit applications to SagesGov on May 22, 2021. The city describes it as the place the whole job lives: submittal, review, issuance, inspections, close-out, and certificates. The process is paperless. Files have to be unprotected PDFs. A change after the permit is issued is a revision, not a quiet swap of the original upload. Licensed roofing contractors have an instant-permit lane for one- and two-family reroofs, alongside a short list that also includes air-conditioning and water-heater change-outs. Everything else waits for review.",
    watch: [
      "An instant reroof is not an instant window permit. We do not force openings through the roof lane.",
      "Locked PDFs fail the intake. We flatten and unlock before upload.",
      "A revision before issuance is the wrong tool. If the city has not issued, the correction goes back on the open review.",
      "Boynton is in Palm Beach County, outside the HVHZ. Coastal lots still have a higher design pressure than lots west of the turnpike, and the product has to cover the one this house actually has.",
    ],
    windows:
      "Window permits are digital applications with a schedule and product approvals, not the instant roof form. We build that package on its own.",
    doors:
      "Doors are scheduled opening by opening with the approval that belongs to that door. A reroof instant permit does not cover them.",
    roofing:
      "When the contractor qualifies and the house is one- or two-family, we use the city's instant reroof path and still attach the system approval. If the job does not qualify, we file the standard application and say why.",
    renovation:
      "Renovations that change the work after issuance become revisions in SagesGov. We do not email a revised plan to a reviewer and assume the record updated.",
    related: ["boca-raton", "west-palm-beach", "hollywood"],
  },
  {
    slug: "miami",
    city: "Miami",
    county: "Miami-Dade",
    description:
      "City of Miami permit expediter for impact windows, doors, roofing, and renovations. Applications run through iBuild and plans through ProjectDox.",
    intro:
      "The City of Miami is not unincorporated Miami-Dade and it is not Hialeah. Building permits are opened in iBuild. Plans and corrections are uploaded in ProjectDox, which the city calls part of ePlan. A permit can be accepted in iBuild and still sit with no review because the files never landed in ProjectDox. Historically designated properties have their own path. The city also tells people to clear code violations before applying. Expediters working in the city are expected to register as expediters. We do that under our own name rather than borrowing a contractor login.",
    watch: [
      "Two portals, one permit. We do not call a job filed until both the iBuild record and the ProjectDox upload exist.",
      "This is the high-velocity hurricane zone. Opening products need a Miami-Dade Notice of Acceptance or a Florida Product Approval that actually covers HVHZ use, matched to the series and the glass on the order.",
      "A house in a historic district does not get a standard impact-window assumption. We check the designation before the product is ordered.",
      "Private provider is an option in iBuild and it is a decision, not a default. We only use it when it shortens the real path.",
    ],
    windows:
      "The window schedule lists each opening, the NOA or approval number, and the pressure. A showroom package with no NOA number does not get uploaded.",
    doors:
      "Impact doors are their own lines on that schedule. If the door is not impact-rated, protection for that opening still has to be answered, usually with a shutter, and that shutter is often its own permit.",
    roofing:
      "Reroofs in the city are HVHZ roof systems with the approval for that assembly. We do not reuse a Palm Beach shingle approval.",
    renovation:
      "Interior renovations that need plans go through ProjectDox with the naming convention the city publishes. A dump of unnamed PDFs is why these reviews stall.",
    related: ["hialeah", "aventura", "west-palm-beach"],
  },
  {
    slug: "hialeah",
    city: "Hialeah",
    county: "Miami-Dade",
    description:
      "Hialeah permit expediter for window and door replacement, roofing, and renovations, filed against the city's published opening checklist.",
    intro:
      "Hialeah's building department publishes a window and door replacement checklist out of 501 Palm Avenue. The phone on that sheet is (305) 883-5825 and the mailbox is buildingdepartment@hialeahfl.gov. They want the application signed and notarized by the owner and the contractor. A homeowner pulling it themselves adds an affidavit and a copy of their license. The drawing is a schematic floor plan with rooms labeled, every opening sized and located, and the product approval number on each component — windows, doors, fixed glass, and mullions. Wind-load pressures are required on multifamily and commercial. Product control approvals are Miami-Dade, state, or both, with the installation details marked. If the new windows or doors are not impact-rated, they say a shutter permit may be required.",
    watch: [
      "The qualifier signs and notarizes when a contractor is on the application. An unsigned qualifier line is not a small miss here.",
      "Wind loads are called out for multifamily and commercial, not waved through because the product has an NOA somewhere in the PDF.",
      "Single-family replacements still need the floor plan and the approval numbers. 'Repair/replace' is a specific improvement type on their form and we pick it on purpose.",
      "We do not publish their fee schedule. The checklist does not list dollar amounts, and we will not invent them.",
    ],
    windows:
      "Each window on the plan gets its approval number and a marked installation detail from that approval. A cover page that says 'NOA on file' is not the drawing they described.",
    doors:
      "Doors are a separate improvement type from windows on the city form. We do not bury a new entry door inside a window count.",
    roofing:
      "Reroofs are not the window checklist. We use the city's current roof requirements and an HVHZ system approval, and we say so if the window sheet is the only thing a contractor sent us.",
    renovation:
      "Interior alterations, additions, and violation legalizations are different improvement types on the same application family. We pick the one that matches the work instead of defaulting to repair/replace.",
    related: ["miami", "aventura", "tamarac"],
  },
];

export function getArea(slug: string) {
  return PUBLIC_AREAS.find((area) => area.slug === slug) || null;
}

export function areasByCounty() {
  const counties: PublicArea["county"][] = ["Miami-Dade", "Broward", "Palm Beach"];
  return counties.map((county) => ({
    county,
    areas: PUBLIC_AREAS.filter((area) => area.county === county),
  }));
}
