import { createServiceClient } from "@/lib/supabase/service";
import { getResend } from "@/lib/email";
import { sendAdminSms } from "@/lib/sms";
import { FROM_INSPECTIONS, MAILBOX } from "@/lib/mailboxes";

/** Where Majestic hears about things. The email address is the inbox the bot reads, so everything lands there. */
export const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || MAILBOX.owner;

/** Only these kinds of notice are texted: an inspection has to be requested or scheduled. Everything else is an email. */
const TEXT_TYPES = new Set(["inspection_needed"]);

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

  if (TEXT_TYPES.has(type)) {
    const sent = await sendAdminSms(message).catch((err) => {
      console.error("notifyAdmin: sms failed", err);
      return { ok: false as const };
    });
    // A text that cannot go out (Twilio not set up, or it failed) is never the only copy: it is emailed too.
    if (sent.ok) return;
  }

  try {
    await getResend().emails.send({
      from: FROM_INSPECTIONS,
      to: ADMIN_ALERT_EMAIL,
      subject: `[Majestic Hub] ${type.replace(/_/g, " ")}${TEXT_TYPES.has(type) ? " (text not sent)" : ""}`,
      text: message,
    });
  } catch (err) {
    console.error("notifyAdmin: email failed", err);
  }
}
