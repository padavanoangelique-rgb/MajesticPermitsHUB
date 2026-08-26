import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface ContractorRecord {
  id: string;
  name: string | null;
  company_name: string | null;
  email: string | null;
}

/**
 * Resolves the contractor profile for a signed-in user.
 *
 * If a contractor row exists with a matching email but no auth_user_id yet
 * (which happens when the profile is created before the login is invited),
 * it is linked automatically instead of showing "Account not linked".
 */
export async function getContractorForUser(
  user: User
): Promise<ContractorRecord | null> {
  const supabase = createClient();

  const { data: linked } = await supabase
    .from("contractors")
    .select("id, name, company_name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (linked) return linked as ContractorRecord;

  if (!user.email) return null;

  // Self-heal: match on email (case-insensitive) and attach the auth user
  const service = createServiceClient();

  const { data: byEmail } = await service
    .from("contractors")
    .select("id, name, company_name, email, auth_user_id")
    .ilike("email", user.email)
    .maybeSingle();

  if (!byEmail) return null;

  if (!byEmail.auth_user_id) {
    await service
      .from("contractors")
      .update({ auth_user_id: user.id })
      .eq("id", byEmail.id);
  } else if (byEmail.auth_user_id !== user.id) {
    // Belongs to a different login — do not hijack it
    return null;
  }

  return {
    id: byEmail.id,
    name: byEmail.name,
    company_name: byEmail.company_name,
    email: byEmail.email,
  };
}
