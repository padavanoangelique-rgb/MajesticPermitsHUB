import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as stages from '../../src/lib/stages.ts';
function route(admin,{user={id:'u',email:'owner@test'},owned=true,missing=false,writeError=false}={}) {
 const state={patch:null};
 const db={from(){const q={select(){return this;},eq(){return this;},update(p){state.patch=p;return this;},maybeSingle:async()=>({data:missing?null:{id:'j',contractor_id:owned?'c':'other',stage:stages.PERMIT_STAGES[4].title,sub_status:'Approved'},error:null}),single:async()=>({data:writeError?null:{id:'j'},error:writeError?{message:'write rejected'}:null})};return q;}};
 const stubs={'next/server':{NextResponse:{json:(b,o)=>new Response(JSON.stringify(b),{status:o?.status||200})}},'@/lib/stages':stages,'@/lib/supabase/server':{createClient:()=>({auth:{getUser:async()=>({data:{user}})}})},'@/lib/supabase/service':{createServiceClient:()=>db},'@/lib/admin':{isAdminEmail:e=>e==='owner@test'},'@/lib/contractor':{getContractorForUser:async()=>({id:'c'})},'@/lib/job-status-sms':{textClientStatusChange:async()=>{}}};
 const path=admin?'src/app/api/admin/jobs/[id]/route.ts':'src/app/api/contractor/jobs/[id]/stage/route.ts';
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:n=>stubs[n],Response,console});
 return {state,save:b=>exports.PATCH({json:async()=>b},{params:{id:'j'}})};
}
for (const admin of [true,false]) {
 const name=admin?'admin':'contractor';
 test(`${name} persists corrected stage and corresponding status`,async()=>{const api=route(admin);assert.equal((await api.save({stage:stages.PERMIT_STAGES[0].title})).status,200);assert.equal(api.state.patch.sub_status,'Need to Submit');});
 test(`${name} reports rejected database write`,async()=>{const api=route(admin,{writeError:true});const res=await api.save({stage:stages.PERMIT_STAGES[0].title});assert.equal(res.status,400);assert.match((await res.json()).error,/write rejected/);});
 test(`${name} rejects invalid stage and missing jobs`,async()=>{assert.equal((await route(admin).save({stage:'wrong'})).status,400);assert.equal((await route(admin,{missing:true}).save({stage:stages.PERMIT_STAGES[0].title})).status,404);});
}
test('contractor cannot change another company’s job',async()=>{const api=route(false,{owned:false});assert.equal((await api.save({stage:stages.PERMIT_STAGES[0].title})).status,404);assert.equal(api.state.patch,null);});
