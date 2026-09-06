import { NextRequest } from "next/server";

export function isDeskEmbed(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("embed");
  if (q === "1" || q === "true") return true;
  if (request.cookies.get("mp_desk")?.value === "1") return true;
  const dest = request.headers.get("sec-fetch-dest");
  const site = request.headers.get("sec-fetch-site");
  if (dest === "iframe" && site === "cross-site") return true;
  return false;
}
