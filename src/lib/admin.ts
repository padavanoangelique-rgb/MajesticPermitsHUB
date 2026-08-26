/**
 * Single source of truth for who counts as a Majestic Permits admin.
 * Mirrors the is_admin() function in Postgres.
 *
 * Override with the ADMIN_EMAILS env var (comma separated) if you add staff.
 */
export const ADMIN_EMAILS: string[] = (
  process.env.ADMIN_EMAILS ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  "angelique@majesticpermits.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
