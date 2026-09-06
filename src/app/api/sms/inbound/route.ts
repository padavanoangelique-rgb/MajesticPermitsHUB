import { NextResponse } from "next/server";
import { handleInboundSms } from "@/lib/sms-bot";

export const dynamic = "force-dynamic";

function xmlReply(message: string) {
  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let from = "";
    let body = "";

    if (contentType.includes("application/json")) {
      const json = await req.json().catch(() => ({}));
      from = String(json.From || json.from || "");
      body = String(json.Body || json.body || "");
    } else {
      const form = await req.formData();
      from = String(form.get("From") || "");
      body = String(form.get("Body") || "");
    }

    if (!from) {
      return new NextResponse(xmlReply("Missing sender."), {
        status: 400,
        headers: { "Content-Type": "text/xml" },
      });
    }

    const reply = await handleInboundSms(from, body);
    return new NextResponse(xmlReply(reply), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("inbound sms failed", err);
    return new NextResponse(
      xmlReply("We got your text. Angelique will follow up."),
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}
