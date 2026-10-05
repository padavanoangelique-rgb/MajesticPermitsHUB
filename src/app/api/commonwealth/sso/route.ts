import {NextResponse} from "next/server";
import {commonwealthOtp} from "@/lib/commonwealth-sso";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export async function GET(req:Request){try{const otp=await commonwealthOtp(new URL(req.url).searchParams.get("code")||"");const auth=await createClient();const {data,error}=await auth.auth.verifyOtp({token_hash:otp.token_hash,type:"magiclink"});if(error||data.user?.id!==otp.userId)throw new Error("Owner sign-in failed.");const response=NextResponse.redirect(new URL("/admin",req.url));response.headers.set("Cache-Control","no-store");response.headers.set("Referrer-Policy","no-referrer");return response;}catch(e){return new Response(e instanceof Error?e.message:"Dashboard sign-in failed.",{status:401,headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});}}
