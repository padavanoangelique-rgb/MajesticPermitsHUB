// Twilio SMS. Fails silently so a missing text never blocks a save.
// Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, ADMIN_SMS_NUMBER

export function toE164(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

export async function sendSms(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const dest = toE164(to) || to;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("sendSms: skipped, Twilio env vars not fully configured");
    return { ok: false, error: "Twilio not configured" };
  }
  if (!dest) {
    console.warn("sendSms: skipped, no destination number on file");
    return { ok: false, error: "No number" };
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: dest, From: fromNumber, Body: body.slice(0, 320) }),
      }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("sendSms: Twilio error", res.status, detail);
      return { ok: false, error: detail || String(res.status) };
    }
    return { ok: true };
  } catch (err: any) {
    console.error("sendSms: request failed", err);
    return { ok: false, error: err?.message || "send failed" };
  }
}

export async function sendAdminSms(body: string) {
  const toNumber = process.env.ADMIN_SMS_NUMBER;
  if (!toNumber) {
    console.warn("sendAdminSms: skipped, ADMIN_SMS_NUMBER not set");
    return { ok: false, error: "ADMIN_SMS_NUMBER not set" };
  }
  return sendSms(toNumber, body);
}
