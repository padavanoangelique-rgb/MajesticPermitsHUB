/** Fire-and-forget: send a new hub job to PermitAIO so it lands under the contractor on the Majestic desk. */
export async function pushJobToPermitAIO(payload: {
  hub_job_id: string;
  company_name: string;
  property_address: string;
  trade_type?: string | null;
  jurisdiction?: string | null;
  homeowner_name?: string | null;
  homeowner_phone?: string | null;
  homeowner_email?: string | null;
  notes?: string | null;
}) {
  const url = process.env.PERMITAIO_SYNC_URL;
  const secret = process.env.PERMITAIO_HUB_SECRET;
  if (!url || !secret) return { skipped: true as const };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-secret": secret,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false as const, error: text || res.statusText };
    }
    return { ok: true as const };
  } catch (err: any) {
    return { ok: false as const, error: err?.message || "sync failed" };
  }
}
