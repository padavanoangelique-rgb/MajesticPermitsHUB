import { createServiceClient } from "@/lib/supabase/service";
import { getJobContactPhone } from "@/lib/job-contact";
import { sendSms } from "@/lib/sms";

export async function textClientStatusChange(opts: {
  jobId: string;
  stage?: string | null;
  subStatus?: string | null;
}) {
  const supabase = createServiceClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, property_address, client_type, contractor_id, homeowner_phone, stage, sub_status")
    .eq("id", opts.jobId)
    .maybeSingle();
  if (!job) return;

  const stage = opts.stage || job.stage;
  const sub = opts.subStatus ?? job.sub_status;
  const detail = sub && sub !== stage ? ` (${sub})` : "";
  const body = `Majestic Permits — ${job.property_address} is now: ${stage}${detail}.`;

  const phones = new Set<string>();
  const primary = await getJobContactPhone(job);
  if (primary) phones.add(primary);
  if (job.homeowner_phone) phones.add(job.homeowner_phone);

  for (const phone of phones) {
    await sendSms(phone, body);
  }
}
