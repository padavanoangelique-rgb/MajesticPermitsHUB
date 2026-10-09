import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminDestination } from "@/lib/admin-navigation";

export const dynamic = "force-dynamic";

async function signOutAndRedirect(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();

  /*
   * 303 See Other — not the default 307. A 307 preserves the POST method,
   * so the browser would re-POST to /login and get a 405 error page.
   * 303 forces the follow-up request to be a GET.
   */
  const login = new URL("/login", request.url);
  const requestedNext = new URL(request.url).searchParams.get("next");
  if (requestedNext) login.searchParams.set("next", adminDestination(requestedNext));
  return NextResponse.redirect(login, { status: 303 });
}

export async function POST(request: Request) {
  return signOutAndRedirect(request);
}

export async function GET(request: Request) {
  return signOutAndRedirect(request);
}
