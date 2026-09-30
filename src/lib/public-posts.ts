export type PostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export type PublicPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  citySlug: string;
  blocks: PostBlock[];
};

export const PUBLIC_POSTS: PublicPost[] = [
  {
    slug: "window-permit-weston",
    title: "How to get a window permit in Weston",
    description:
      "What the City of Weston actually asks for on a window and door replacement, and where quick permits stall.",
    date: "2026-09-30",
    citySlug: "weston",
    blocks: [
      {
        type: "p",
        text: "Weston will let a window and door replacement travel as a quick permit. The city lists it next to garage doors and shutters, and they publish a 3–5 business day review for a complete submittal. Complete is the word that matters. A missing schedule or a product approval that does not match the order is not a quick permit. It is a hold.",
      },
      {
        type: "h2",
        text: "What goes in the package",
      },
      {
        type: "p",
        text: "Weston enforces the Florida Building Code and Broward County. For retrofit windows they point at the Broward County Uniform Retrofit Window and Door Schedule, Policy 20-01, and their own affidavit and notice to contractors on retrofit windows. There is also a Broward fenestration wind-load chart. Those sheets have to describe the same openings, with the same sizes, as the product sitting on the order.",
      },
      {
        type: "p",
        text: "The file names matter. Weston publishes a naming convention and reviewers use it. Uploading one giant scan called “windows final final” is how a complete package becomes an incomplete one.",
      },
      {
        type: "h2",
        text: "The city is not the association",
      },
      {
        type: "p",
        text: "A lot of Weston houses sit in a master community. The city can be ready to issue while the association still wants an architectural application, a paint sample, or a specific frame color. We ask which community the property is in before we tell you the only clock is the building department. Those are two approvals. Getting one does not produce the other.",
      },
      {
        type: "h2",
        text: "What we do before we file",
      },
      {
        type: "ul",
        items: [
          "Match the product approval to the series, glass, and design pressure on each opening.",
          "Build the retrofit schedule so it agrees with the wind-load chart.",
          "Name the files the way the portal expects.",
          "Flag the association if the house is in one, and keep that off the city’s critical path when the city does not ask for it.",
        ],
      },
      {
        type: "p",
        text: "If the opening is changing size, or a new opening is being cut, this is no longer the quick window permit. Say so at the start. Forcing that scope through the retrofit checklist is how the 3–5 day lane disappears.",
      },
    ],
  },
  {
    slug: "broward-reroof",
    title: "What Broward wants for a reroof",
    description:
      "Broward reroof permits are high-velocity work. The cover sheets change by city. Here is what we actually watch.",
    date: "2026-09-30",
    citySlug: "plantation",
    blocks: [
      {
        type: "p",
        text: "Broward County is in the high-velocity hurricane zone. A reroof is not a shingle color and a check. The roof system has to be an approved assembly, the city has to see the mitigation forms, and the first inspection does not happen if the Notice of Commencement is missing on a job that needs one.",
      },
      {
        type: "h2",
        text: "The packet is not the same in every city",
      },
      {
        type: "p",
        text: "Plantation publishes a roofing list we use as a serious example, not as a universal form: the High-Velocity Hurricane Zone uniform permit application (section 1525), a re-roof hurricane mitigation application, a roof-to-wall connection affidavit, a rooftop equipment affidavit when equipment is up there, and the section 1524 owner notification. Weston does not want that stack copied onto their portal. Weston has its own re-roof and gas-vent affidavit. Pembroke Pines will not take the package by email at all. It goes through the Development Hub. Fort Lauderdale wants it in LauderBuild, digital only.",
      },
      {
        type: "p",
        text: "If someone hands us “the Broward roof PDF” we still open the city’s current sheet. Using the wrong cover page is a correction, and corrections are how a reroof misses a dry week.",
      },
      {
        type: "h2",
        text: "Product approval and the Notice of Commencement",
      },
      {
        type: "p",
        text: "Tile, metal, and shingles are different approvals. The approval has to be the system being installed, including the underlayment the notice describes, not a cousin product from the same brand. Tamarac prints a $5,000 Notice of Commencement line on its window page. Roofing jobs clear that number constantly. The recorded notice has to be in the city’s hands before the first inspection. We do not discover that on the morning the inspector is supposed to walk the deck.",
      },
      {
        type: "h2",
        text: "What we tell the contractor up front",
      },
      {
        type: "ul",
        items: [
          "Which city’s packet this address actually uses.",
          "Whether a roof-to-wall affidavit is on that city’s list.",
          "Whether the existing roof deck has to be photographed or described before tear-off.",
          "That an association can still refuse a tile color the city already approved.",
        ],
      },
      {
        type: "p",
        text: "Plantation, for what it’s worth, put in writing that association approval is not required to apply for or receive the building permit, and that a city permit is not association approval. That split is the cleanest way to explain Broward roofs: two yeses, from two different desks.",
      },
    ],
  },
  {
    slug: "impact-doors-miami-dade",
    title: "Impact door permits in Miami-Dade",
    description:
      "Hialeah, Aventura, and the City of Miami do not share one door permit. Here is how the packages actually differ.",
    date: "2026-09-30",
    citySlug: "miami",
    blocks: [
      {
        type: "p",
        text: "Miami-Dade is in the high-velocity hurricane zone. An exterior door is opening protection, not a finish. The reviewer wants to see the product approval for that door, the opening it is going into, and what happens to the opening if the door itself is not impact-rated. There is no single county form that Hialeah, Aventura, and the City of Miami all accept in place of their own process.",
      },
      {
        type: "h2",
        text: "Hialeah writes the drawing down",
      },
      {
        type: "p",
        text: "Hialeah’s window and door sheet asks for a notarized application signed by the owner and the contractor. The drawing is a floor plan with rooms labeled, every opening sized and located, and the product approval number on the windows, doors, fixed glass, and mullions. Wind-load pressures are required on multifamily and commercial. Approvals are Miami-Dade product control, a state approval, or both, and the installation details in that approval have to be marked. If the new door is not impact-rated, they say a shutter permit may be required. Doors are their own improvement type on the form. We do not hide them in a window count.",
      },
      {
        type: "h2",
        text: "Aventura adds the building and the association",
      },
      {
        type: "p",
        text: "Aventura’s window, door, and shutter checklist wants the association, property manager, or condominium authorization letter as part of the city package. It also wants proof of ownership, a notarized application with no white-out, and site-specific calculations sealed by a Florida engineer. Their note on effective area is specific: over 60 feet, use 20 square feet; under 60, use 10. A one-page chart from a different building height does not survive that review. Submittals go through their ePermits process with the folio number in the subject line. A correction is a different subject line than a new permit.",
      },
      {
        type: "h2",
        text: "The City of Miami is two portals",
      },
      {
        type: "p",
        text: "City of Miami applications open in iBuild. The plans go to ProjectDox. Filing one without the other is not a filed permit. Historically designated properties have a separate path, and an open code case should be cleared before the application. A Miami-Dade Notice of Acceptance, or a Florida Product Approval that truly covers HVHZ use, has to match the series and glass on the order. We do not upload a Palm Beach approval and explain it later.",
      },
      {
        type: "p",
        text: "If you are replacing one entry door and leaving the rest of the house alone, say that. The permit should cover the door you are changing. The openings you are not touching stay described as existing, unless the city requires protection for the whole unit. We would rather ask that question before the order is cut than after the comment comes back.",
      },
    ],
  },
];

export function getPost(slug: string) {
  return PUBLIC_POSTS.find((post) => post.slug === slug) || null;
}
