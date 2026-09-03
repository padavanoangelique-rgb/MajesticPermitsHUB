import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isAdminEmail } from "@/lib/admin";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isAdminArea = path === "/admin" || path.startsWith("/admin/");
  const isAdminApi = path.startsWith("/api/admin");
  const isContractorArea = path === "/dashboard" || path.startsWith("/dashboard/");

  if (isAdminApi) {
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
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && isAdminArea && !isAdminEmail(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = isAdminEmail(user.email) ? "/admin" : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|track|quote|api/cron|api/stripe|api/quote|api/ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
