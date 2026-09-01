import { createServiceClient } from "@/lib/supabase/service";

export async function notifyAdmin(
  type: string,
  message: string,
  jobId?: string | null
) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("admin_notifications").insert({
      type,
      message,
      job_id: jobId ?? null,
    });
    if (error) {
      console.error("notifyAdmin: insert failed", error.message);
    }
  } catch (err) {
    console.error("notifyAdmin: insert failed", err);
  }
}
