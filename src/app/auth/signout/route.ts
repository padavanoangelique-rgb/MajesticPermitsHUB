import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function signOutAndRedirect(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();

  /*
   * 303 See Other — not the default 307. A 307 preserves the POST method,
   * so the browser would re-POST to /login and get a 405 error page.
   * 303 forces the follow-up request to be a GET.
   */
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}

export async function POST(request: Request) {
  return signOutAndRedirect(request);
}

export async function GET(request: Request) {
  return signOutAndRedirect(request);
}
