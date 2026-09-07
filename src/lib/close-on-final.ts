import { createServiceClient } from "@/lib/supabase/service";
import { notifyAdmin } from "@/lib/admin-notify";
import { isFinalInspection } from "@/lib/inspection-final";

export { isFinalInspection };

export async function closeJobIfFinalPassed(opts: {
  jobId: string;
  inspection: { slot?: number | null; inspection_type?: string | null; status: string };
  treatAsFinal?: boolean;
}) {
  const passed = opts.inspection.status === "passed";
  const final = opts.treatAsFinal ?? isFinalInspection(opts.inspection);
  if (!passed || !final) return { closed: false };

  const supabase = createServiceClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, property_address, stage")
    .eq("id", opts.jobId)
    .maybeSingle();

  if (!job || job.stage === "Permit closed — all done") {
    return { closed: Boolean(job) };
  }

  await supabase
    .from("jobs")
    .update({
      stage: "Permit closed — all done",
      sub_status: "Closed",
      next_step: "Permit closed after final inspection passed",
    })
    .eq("id", job.id);

  await notifyAdmin(
    "job_closed",
    `${job.property_address}: final inspection passed — job closed.`,
    job.id
  );

  return { closed: true };
}
