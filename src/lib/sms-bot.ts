import { notifyAdmin } from "@/lib/admin-notify";
import { sendAdminSms, sendSms } from "@/lib/sms";

const MENU = `Majestic Permits
Text:
1 status — how to check a job
2 request — new job
3 inspection — schedule one
4 docs — what to send
5 human — reach Angelique

Or just type your question.`;

function normalize(body: string) {
  return body.trim().toLowerCase().replace(/[^a-z0-9+\s]/g, " ").replace(/\s+/g, " ");
}

export async function handleInboundSms(from: string, rawBody: string) {
  const text = (rawBody || "").trim();
  const key = normalize(text);

  if (!text || /^(hi|hello|hey|start|menu|help|info)$/.test(key)) {
    return MENU;
  }

  if (/^(1|status|track|where is my permit|permit status)$/.test(key) || key.includes("status")) {
    return `To check a job, open your Hub link or email request@majesticpermits.com with the property address.
If you want Angelique to look it up, text HUMAN and the address.`;
  }

  if (/^(2|request|new job|new permit)$/.test(key) || key.includes("new job") || key.startsWith("request ")) {
    await escalate(from, text, "sms_job_request");
    return `Got it. Angelique will text you back about a new job request.
Include the property address and trade if you have them.`;
  }

  if (/^(3|inspection|inspect)$/.test(key) || key.includes("inspection")) {
    await escalate(from, text, "sms_inspection");
    return `Inspection request received. Text the property address and the date you want (weekday).
Angelique will confirm.`;
  }

  if (/^(4|docs|documents|paperwork)$/.test(key) || key.includes("document")) {
    return `Typical intake: contract or scope, survey or plans if you have them, owner name/phone/email, property address, and trade.
Upload in the Hub or email request@majesticpermits.com.`;
  }

  if (/^(5|human|angelique|call me|office)$/.test(key) || key.includes("human")) {
    await escalate(from, text, "sms_human");
    return `Angelique has your message and will text or call you back.`;
  }

  await escalate(from, text, "sms_question");
  return `Thanks — I sent that to Angelique. She will follow up.
Text MENU anytime.`;
}

async function escalate(from: string, text: string, type: string) {
  const notice = `SMS from ${from}: ${text}`;
  await notifyAdmin(type, notice, null);
  await sendAdminSms(notice);
}

export async function replyToSender(to: string, body: string) {
  await sendSms(to, body);
}
