/**
 * The contractor's company documents (license, insurance, ...): each has its own expiration date. Plain functions only:
 * the expiration flag, the email-out reference code, and reading the building department's reply.
 */

export const DOC_TYPES = [
  { value: "license", label: "Contractor license" },
  { value: "insurance", label: "Certificate of insurance" },
  { value: "workers_comp", label: "Workers' comp (policy or exemption)" },
  { value: "business_tax_receipt", label: "Business tax receipt" },
  { value: "w9", label: "W-9" },
  { value: "other", label: "Other" },
] as const;

export type DocType = (typeof DOC_TYPES)[number]["value"];

export function docTypeLabel(value: string | null | undefined): string {
  return DOC_TYPES.find((t) => t.value === value)?.label ?? "Other";
}

export function normalizeDocType(value: unknown): DocType {
  return DOC_TYPES.some((t) => t.value === value) ? (value as DocType) : "other";
}

export type ExpiryState = "none" | "expired" | "soon" | "ok";

/** Expired, or inside 30 days, is flagged. `today` is a YYYY-MM-DD day. */
export function expiryStatus(expiresOn: string | null | undefined, today: string): { state: ExpiryState; days: number | null } {
  const day = (expiresOn || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { state: "none", days: null };
  const days = Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);
  if (days < 0) return { state: "expired", days };
  if (days <= 30) return { state: "soon", days };
  return { state: "ok", days };
}

export function expiryText(state: ExpiryState, days: number | null): string {
  if (state === "expired") return days === -1 ? "Expired yesterday" : `Expired ${Math.abs(days ?? 0)} days ago`;
  if (state === "soon") return days === 0 ? "Expires today" : days === 1 ? "Expires tomorrow" : `Expires in ${days} days`;
  if (state === "ok") return "Current";
  return "No expiration date";
}

export const MAX_DOC_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOC_MIME = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic"];

export function safeFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^\.+/, "");
  return (cleaned || "document").slice(-120);
}

/** A short code in the subject line of an email-out, so the reply can be matched to it. */
export function makeRefCode(random: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(random() * alphabet.length)];
  return `DOC-${code}`;
}

export function refFromText(text: string | null | undefined): string | null {
  const match = /\bDOC-[A-HJKMNP-Z2-9]{6}\b/i.exec(text || "");
  return match ? match[0].toUpperCase() : null;
}

const POSITIVE = /\b(received|got (them|it)|on file|has been updated|have been updated|updated (the )?(file|record|system)|added to|approved|accepted|thank you|thanks|all set|complete|confirmed|in our system|are current|is current)\b/i;
const NEGATIVE = /\b(missing|expired|not (received|valid|accepted|complete)|need(s)?\b|please (send|provide|resubmit|submit)|incorrect|illegible|unable|cannot|can't|rejected|denied|deficien|still require|additional)\b/i;

/**
 * Reads a reply from the building department. Only a clear "received / updated / on file" with nothing asking for more
 * counts as confirmed; anything else is just a reply, for a person to read.
 */
export function classifyReply(text: string | null | undefined): "confirmed" | "replied" {
  const body = (text || "").replace(/^>.*$/gm, "").slice(0, 4000);
  return POSITIVE.test(body) && !NEGATIVE.test(body) ? "confirmed" : "replied";
}

export function defaultEmailSubject(company: string, ref: string, department: string): string {
  return `${company}: contractor documents${department ? ` for ${department}` : ""} [${ref}]`;
}

export function defaultEmailBody(company: string, docLabels: string[], department: string): string {
  return [
    department ? `To the ${department},` : "Hello,",
    "",
    `Attached are the current contractor documents for ${company}:`,
    ...docLabels.map((l) => `  - ${l}`),
    "",
    "Please update the contractor's file and reply to confirm it has been updated.",
    "",
    "Thank you,",
    "Majestic Permits",
  ].join("\n");
}
