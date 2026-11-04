import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface ContractorRecord {
  id: string;
  name: string | null;
  company_name: string | null;
  email: string | null;
}

async function primaryForCompany(company: string | null) {
  if (!company) return null;
  const service = createServiceClient();
  const { data } = await service
    .from("contractors")
    .select("id, name, company_name, email")
    .ilike("company_name", company)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data as ContractorRecord | null;
}

/**
 * Resolves the contractor profile for a signed-in user.
 * Extra logins for the same company see the original company's jobs.
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

  if (linked) {
    const primary = await primaryForCompany(linked.company_name);
    return primary || (linked as ContractorRecord);
  }

  if (!user.email) return null;

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
    return null;
  }

  const primary = await primaryForCompany(byEmail.company_name);
  return primary || {
    id: byEmail.id,
    name: byEmail.name,
    company_name: byEmail.company_name,
    email: byEmail.email,
  };
}
