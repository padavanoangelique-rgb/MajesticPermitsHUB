import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

/**
 * Server-side guard for admin pages. Middleware already blocks non-admins,
 * this is defence-in-depth so a routing change can never silently expose
 * the admin console (which reads with the service-role key).
 */
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  return user;
}

/** Server-side guard for contractor pages. Returns the signed-in user. */
export async function requireUser(nextPath = "/dashboard") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}
