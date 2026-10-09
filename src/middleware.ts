import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isAdminEmail } from "@/lib/admin";
import { adminDestination } from "@/lib/admin-navigation";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (host === "thepermitcloser.com" || host === "www.thepermitcloser.com") {
    return NextResponse.redirect("https://www.majesticpermits.com/permit-closer", 308);
  }

  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const isAdminArea = path === "/admin" || path.startsWith("/admin/");
  const isAdminApi = path.startsWith("/api/admin");
  const isContractorArea = path === "/dashboard" || path.startsWith("/dashboard/");

  if (isAdminApi) {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && request.headers.get("origin") !== request.nextUrl.origin) {
      return NextResponse.json({error: "Invalid origin"}, {status: 403});
    }

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    return response;
  }

  if (!user && (isAdminArea || isContractorArea)) {

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (user && isAdminArea && !isAdminEmail(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin-access";
    url.search = "";
    url.searchParams.set("next", adminDestination(path + request.nextUrl.search));
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    const destination = isAdminEmail(user.email)
      ? adminDestination(request.nextUrl.searchParams.get("next"))
      : "/dashboard";
    const target = new URL(destination, request.nextUrl.origin);
    url.pathname = target.pathname;
    url.search = target.search;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|track|quote|api/cron|api/stripe|api/quote|api/ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
