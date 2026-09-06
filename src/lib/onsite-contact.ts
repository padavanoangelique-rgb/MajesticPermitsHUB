/** Format and parse the on-site contact number stored on inspection requests. */

const NOTE_PREFIX = "On-site:";

export function digitsOnly(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "");
}

export function formatPhone(value: string | null | undefined): string {
  const digits = digitsOnly(value);
  if (digits.length === 11 && digits.startsWith("1")) {
    return formatPhone(digits.slice(1));
  }
  if (digits.length !== 10) return (value || "").trim();
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isValidUsPhone(value: string | null | undefined): boolean {
  const digits = digitsOnly(value);
  if (digits.length === 11 && digits.startsWith("1")) return digits.length === 11;
  return digits.length === 10;
}

export function buildRequestNotes(phone: string | null, extra?: string | null): string | null {
  const formatted = phone ? formatPhone(phone) : "";
  const rest = (extra || "").trim();
  if (!formatted && !rest) return null;
  if (!formatted) return rest;
  return rest ? `${NOTE_PREFIX} ${formatted}\n${rest}` : `${NOTE_PREFIX} ${formatted}`;
}

export function parseOnsiteFromNotes(notes: string | null | undefined): {
  phone: string;
  extra: string;
} {
  const raw = notes || "";
  const match = raw.match(/^On-site:\s*(.+)$/m);
  if (!match) return { phone: "", extra: raw.trim() };
  const extra = raw
    .replace(/^On-site:\s*.+$/m, "")
    .replace(/^\n+/, "")
    .trim();
  return { phone: match[1].trim(), extra };
}
