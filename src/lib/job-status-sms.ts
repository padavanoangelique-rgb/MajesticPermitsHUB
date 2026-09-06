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

  const phones: string[] = [];
  const primary = await getJobContactPhone(job);
  if (primary) phones.push(primary);
  if (job.homeowner_phone && job.homeowner_phone !== primary) {
    phones.push(job.homeowner_phone);
  }

  for (let i = 0; i < phones.length; i += 1) {
    await sendSms(phones[i], body);
  }
}
