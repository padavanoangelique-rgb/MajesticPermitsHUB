import { createServiceClient } from "@/lib/supabase/service";
import { notifyAdmin } from "@/lib/admin-notify";
import { isFinalInspection } from "@/lib/inspection-final";

export { isFinalInspection };

export async function closeJobIfFinalPassed(opts: {
  jobId: string;
  inspection: { slot?: number | null; inspection_type?: string | null; status: string; result_date?: string | null };
  treatAsFinal?: boolean;
}) {
  const passed = opts.inspection.status === "passed";
  const final = opts.treatAsFinal ?? isFinalInspection(opts.inspection);
  if (!passed || !final) return { closed: false };

  const supabase = createServiceClient();
  const { data: job, error: readError } = await supabase
    .from("jobs")
    .select("id, property_address, stage")
    .eq("id", opts.jobId)
    .maybeSingle();

  if (readError || !job) throw new Error(readError?.message || "Job not found");
  if (job.stage === "Permit closed — all done") return { closed: true };

  const { data: saved, error: saveError } = await supabase
    .from("jobs")
    .update({
      stage: "Permit closed — all done",
      sub_status: "Closed",
      next_step: "Permit closed after final inspection passed",
      final_inspection_date: opts.inspection.result_date || new Date().toISOString().slice(0, 10),
    })
    .eq("id", job.id)
    .select("id")
    .single();

  if (saveError || !saved) throw new Error(`Final passed, but job closure failed: ${saveError?.message || "job update missing"}`);

  await notifyAdmin(
    "job_closed",
    `${job.property_address}: final inspection passed — job closed.`,
    job.id
  );

  return { closed: true };
}
