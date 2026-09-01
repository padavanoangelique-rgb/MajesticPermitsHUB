import { createServiceClient } from "@/lib/supabase/service";

/**
 * Resolves who a status-update text should go to for a given job:
 * the contractor's phone on contractor-type jobs, or the homeowner's
 * phone directly on homeowner-type jobs. Returns null if there's no
 * number on file (never throws — a missing phone just means no text).
 */
export async function getJobContactPhone(job: {
  client_type: string;
  contractor_id: string | null;
  homeowner_phone: string | null;
}): Promise<string | null> {
  if (job.client_type === "contractor") {
    if (!job.contractor_id) return null;
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("contractors")
      .select("phone")
      .eq("id", job.contractor_id)
      .maybeSingle();
    return data?.phone || null;
  }
  return job.homeowner_phone || null;
}
