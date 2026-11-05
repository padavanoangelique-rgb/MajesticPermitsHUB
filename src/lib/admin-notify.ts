import { createServiceClient } from "@/lib/supabase/service";
import { getResend } from "@/lib/email";
import { FROM_INSPECTIONS, MAILBOX } from "@/lib/mailboxes";

/** Where Majestic hears about things. This is the inbox the bot reads, so it sees everything and does the texting. */
export const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || MAILBOX.owner;

/** The notice types that mean an inspection has to be requested or scheduled. The bot texts Majestic for these. */
export const INSPECTION_ALERT_TYPES = new Set(["inspection_needed"]);

const SITE = "https://admin.majesticpermits.com";

/**
 * Tell Majestic something happened. Every notice is saved on the admin notification list and emailed to Majestic's
 * inbox. The Hub sends no texts: an inspection-needed notice has its own fixed subject, "[Majestic Hub] INSPECTION
 * NEEDED", and a "Type:" line, so the bot can pick it out and text Majestic.
 */
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

  const inspection = INSPECTION_ALERT_TYPES.has(type);
  const subject = inspection ? "[Majestic Hub] INSPECTION NEEDED" : `[Majestic Hub] ${type.replace(/_/g, " ")}`;
  const lines = [
    ...(inspection ? ["INSPECTION NEEDED", ""] : []),
    message,
    "",
    `Type: ${type}`,
    ...(jobId ? [`Job: ${SITE}/admin/jobs/${jobId}`] : []),
  ];

  try {
    await getResend().emails.send({
      from: FROM_INSPECTIONS,
      to: ADMIN_ALERT_EMAIL,
      subject,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("notifyAdmin: email failed", err);
  }
}
