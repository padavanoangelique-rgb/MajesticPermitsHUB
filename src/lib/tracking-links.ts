import type { TrackingLinkStatus } from "@/components/contractor/tracking-link-share";

export const PORTAL_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://majesticpermits.com"
).replace(/\/$/, "");

export interface HomeownerLinkRow {
  job_id: string;
  token: string | null;
  enabled: boolean | null;
  expires_at: string | null;
}

export interface TrackingLinkInfo {
  url: string | null;
  status: TrackingLinkStatus;
}

/** Resolve the share URL + status a contractor should see for one job. */
export function resolveTrackingLink(
  link: HomeownerLinkRow | undefined | null
): TrackingLinkInfo {
  if (!link || !link.token) return { url: null, status: "none" };
  if (link.enabled === false) return { url: null, status: "disabled" };
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { url: null, status: "expired" };
  }
  return {
    url: `${PORTAL_SITE_URL}/track/${link.token}`,
    status: "active",
  };
}

/**
 * Build a jobId -> link map. When a job somehow has several link rows, an
 * active one always wins so the contractor is never shown a stale status.
 */
export function mapTrackingLinks(
  rows: HomeownerLinkRow[] | null | undefined
): Record<string, TrackingLinkInfo> {
  const out: Record<string, TrackingLinkInfo> = {};
  for (const row of rows || []) {
    const info = resolveTrackingLink(row);
    const current = out[row.job_id];
    if (!current || (current.status !== "active" && info.status === "active")) {
      out[row.job_id] = info;
    }
  }
  return out;
}
