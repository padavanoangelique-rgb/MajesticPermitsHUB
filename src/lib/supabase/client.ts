import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import {embedCookieOptions} from "./embed-cookies";
// @supabase/ssr 0.5's cookie serializer omits Partitioned. Write it explicitly.
function setCookie(name:string,value:string,options:CookieOptions={}) {
  const secure=window.location.protocol==="https:";
  document.cookie=encodeURIComponent(name)+"="+encodeURIComponent(value)+"; Path=/; SameSite="+(secure?"None; Secure; Partitioned":"Lax")+(options.maxAge!==undefined?"; Max-Age="+options.maxAge:"")+(options.expires?"; Expires="+options.expires.toUTCString():"");
}
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
    cookieOptions: embedCookieOptions,
    cookies: {
      get(name:string){const prefix=encodeURIComponent(name)+"=";const row=document.cookie.split("; ").find(v=>v.startsWith(prefix));return row?decodeURIComponent(row.slice(prefix.length)):undefined;},
      set:setCookie,
      remove(name:string,options:CookieOptions){setCookie(name,"",{...options,maxAge:0});}
    }
  });
}
