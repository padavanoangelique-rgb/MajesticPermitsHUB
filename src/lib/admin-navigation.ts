/** Only local admin destinations may be carried across an account switch. */
export function adminDestination(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin/overview";
  try {
    const url = new URL(value, "https://hub.majesticpermits.com");
    if (url.origin !== "https://hub.majesticpermits.com" ||
        !(url.pathname === "/admin" || url.pathname.startsWith("/admin/"))) return "/admin/overview";
    return url.pathname + url.search;
  } catch {
    return "/admin/overview";
  }
}
