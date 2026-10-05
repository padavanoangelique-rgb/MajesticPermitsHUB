import {createClient} from '@supabase/supabase-js';
import {timingSafeEqual,createHash} from 'node:crypto';
import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const respond=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:Request){
 const secret=process.env.COMMONWEALTH_SSO_SECRET,id=process.env.COMMONWEALTH_OWNER_USER_ID,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret||!id||!key)return respond({error:'Connection is not configured.'},503);
 const hash=(s:string)=>createHash('sha256').update(s).digest();
 if(!timingSafeEqual(hash(req.headers.get('authorization')||''),hash('Bearer '+secret)))return respond({error:'Unauthorized.'},401);
 try{
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await admin.auth.admin.getUserById(id);
 if(error||!data.user?.email_confirmed_at||!data.user.email)return respond({error:'Owner access unavailable.'},403);

 const emails=(process.env.ADMIN_EMAILS||process.env.NEXT_PUBLIC_ADMIN_EMAIL||'angelique@majesticpermits.com').split(',').map(s=>s.trim().toLowerCase());
 if(!emails.includes(data.user.email.toLowerCase()))return respond({error:'Owner access unavailable.'},403);
 const results=await Promise.all([
 admin.from('jobs').select('*',{count:'exact',head:true}).neq('stage','Permit closed — all done'),
 admin.from('jobs').select('*',{count:'exact',head:true}).eq('stage','Under review'),
 admin.from('jobs').select('*',{count:'exact',head:true}).eq('stage','Corrections requested'),
 admin.from('job_inspections').select('*',{count:'exact',head:true}).in('status',['requested','reinspection_requested']),
 admin.from('inspection_requests').select('*',{count:'exact',head:true}).eq('status','Pending')
 ]);
 if(results.some(r=>r.error||r.count===null))throw new Error('Query failed');
 return respond({business:'majestic',asOf:new Date().toISOString(),metrics:[
 {key:'active',label:'Open permit jobs',value:results[0].count},
 {key:'review',label:'Under city review',value:results[1].count},
 {key:'corrections',label:'Corrections requested',value:results[2].count,attention:true},
 {key:'inspections',label:'Inspections requested',value:results[3].count,attention:true},
 {key:'requests',label:'Pending inspection requests',value:results[4].count,attention:true}
 ]});
 }catch{return respond({error:'Summary temporarily unavailable.'},503);}
}
