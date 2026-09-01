// Texts alerts via Twilio — admin alerts when someone requests an inspection,
// and status-update texts to the contractor or homeowner on file. Fails
// silently (logs only) if Twilio isn't configured or the send errors — a
// missing/broken text alert must never block the underlying update from
// going through.
//
// Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
// TWILIO_FROM_NUMBER (the Twilio number), ADMIN_SMS_NUMBER (where admin
// alerts go).
export async function sendSms(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("sendSms: skipped, Twilio env vars not fully configured");
    return;
  }
  if (!to) {
    console.warn("sendSms: skipped, no destination number on file");
    return;
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
        body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
      }
    );
    if (!res.ok) {
      console.error("sendSms: Twilio error", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("sendSms: request failed", err);
  }
}

export async function sendAdminSms(body: string) {
  const toNumber = process.env.ADMIN_SMS_NUMBER;
  if (!toNumber) {
    console.warn("sendAdminSms: skipped, ADMIN_SMS_NUMBER not set");
    return;
  }
  return sendSms(toNumber, body);
}
