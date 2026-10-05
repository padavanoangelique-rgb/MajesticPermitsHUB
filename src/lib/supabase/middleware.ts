import { embedCookieOptions } from "./embed-cookies";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and keeps the
 * auth cookies in sync between the browser and Server Components.
 *
 * Without this, cookies written by the browser client are never refreshed
 * on the server, so Server Components see "no user" and bounce the visitor
 * straight back to /login — which looks exactly like a login form that
 * "resets itself".
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: embedCookieOptions,
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set(name, value);
          const pendingCookies = response.cookies.getAll();
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          pendingCookies.forEach(cookie => response.cookies.set(cookie));
          response.cookies.set({ name, value, ...options, ...embedCookieOptions });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set(name, "");
          const pendingCookies = response.cookies.getAll();
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          pendingCookies.forEach(cookie => response.cookies.set(cookie));
          response.cookies.set({ name, value: "", ...options, ...embedCookieOptions, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
