import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface ContractorRecord {
  /** The company's main record. Jobs created through the portal are assigned to it. */
  id: string;
  /** The signed-in person's own record (their login). */
  own_id: string;
  name: string | null;
  company_name: string | null;
  email: string | null;
  company_id: string | null;
  /**
   * Every record that belongs to the company. A job assigned to any of them is the company's job, so every login of
   * the company sees the same jobs.
   */
  company_contractor_ids: string[];
}

type ContractorRow = {
  id: string;
  name: string | null;
  company_name: string | null;
  email: string | null;
  company_id?: string | null;
  created_at?: string | null;
};

const COLUMNS = "id, name, company_name, email, company_id, created_at";

/** True when a job assigned to `jobContractorId` belongs to this contractor's company. */
export function ownsJob(contractor: Pick<ContractorRecord, "company_contractor_ids">, jobContractorId: string | null | undefined) {
  return Boolean(jobContractorId) && contractor.company_contractor_ids.includes(jobContractorId as string);
}

function companyKey(row: ContractorRow) {
  return (row.company_name || row.name || row.email || "").trim();
}

/** The company row for a login, created and linked the first time it is needed. */
async function companyFor(row: ContractorRow): Promise<string | null> {
  if (row.company_id) return row.company_id;
  const key = companyKey(row);
  if (!key) return null;
  const service = createServiceClient();
  const found = await service.from("contractor_companies").select("id").ilike("name", escapeLike(key)).limit(1).maybeSingle();
  if (found.error) return null; // companies are not set up on this database yet: fall back to the company name
  let id = found.data?.id as string | undefined;
  if (!id) {
    const created = await service.from("contractor_companies").insert({ name: key }).select("id").maybeSingle();
    id = created.data?.id;
    if (!id) {
      // Another login created it at the same moment.
      const again = await service.from("contractor_companies").select("id").ilike("name", escapeLike(key)).limit(1).maybeSingle();
      id = again.data?.id;
    }
  }
  if (!id) return null;
  await service.from("contractors").update({ company_id: id }).eq("id", row.id).is("company_id", null);
  return id;
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

async function membersOfCompany(companyId: string | null, fallbackName: string | null, own: ContractorRow): Promise<ContractorRow[]> {
  const service = createServiceClient();
  if (companyId) {
    const { data } = await service.from("contractors").select(COLUMNS).eq("company_id", companyId).order("created_at", { ascending: true });
    if (data?.length) return data as ContractorRow[];
  } else if (fallbackName) {
    const { data } = await service.from("contractors").select(COLUMNS).ilike("company_name", escapeLike(fallbackName)).order("created_at", { ascending: true });
    if (data?.length) return data as ContractorRow[];
  }
  return [own];
}

async function resolve(own: ContractorRow): Promise<ContractorRecord> {
  const companyId = await companyFor(own);
  const members = await membersOfCompany(companyId, own.company_name, own);
  const ids = Array.from(new Set([own.id, ...members.map((m) => m.id)]));
  const main = members[0] || own;
  let companyName = own.company_name;
  if (companyId) {
    const { data } = await createServiceClient().from("contractor_companies").select("name").eq("id", companyId).maybeSingle();
    if (data?.name) companyName = data.name;
  }
  return {
    id: main.id,
    own_id: own.id,
    name: own.name,
    company_name: companyName || main.company_name,
    email: own.email,
    company_id: companyId,
    company_contractor_ids: ids,
  };
}

/**
 * Resolves the contractor profile for a signed-in user.
 * Every login of a company sees the company's jobs: the record carries the ids of all the company's records.
 */
export async function getContractorForUser(user: User): Promise<ContractorRecord | null> {
  const supabase = createClient();

  const { data: linked } = await supabase.from("contractors").select(COLUMNS).eq("auth_user_id", user.id).maybeSingle();
  if (linked) return resolve(linked as ContractorRow);

  if (!user.email) return null;

  const service = createServiceClient();
  const { data: byEmail } = await service
    .from("contractors")
    .select(`${COLUMNS}, auth_user_id`)
    .ilike("email", escapeLike(user.email))
    .maybeSingle();

  if (!byEmail) return null;

  if (!byEmail.auth_user_id) {
    await service.from("contractors").update({ auth_user_id: user.id }).eq("id", byEmail.id);
  } else if (byEmail.auth_user_id !== user.id) {
    return null;
  }

  return resolve(byEmail as ContractorRow);
}
