"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PERMIT_STAGES, canonicalStageTitle, defaultSubStatus, inspectionsAllowed, stageKeyFromTitle, stageTitle, JOB_SUB_STATUSES } from "@/lib/stages";
// The permit's own steps. Where the work is after approval is the inspection status, set from its own control.
const PERMIT_STEP_KEYS = ["getting_ready", "submitted", "under_review", "corrections", "approved"];
const PERMIT_STEPS = PERMIT_STAGES.filter((s) => PERMIT_STEP_KEYS.includes(s.key));
const PERMIT_SUB_STATUSES = JOB_SUB_STATUSES.filter((s) => !["Complete", "Closed"].includes(s));
const asPermitStage = (value: string) => {
  const key = stageKeyFromTitle(value);
  return key && !PERMIT_STEP_KEYS.includes(key) ? stageTitle("approved") : canonicalStageTitle(value);
};

export function UpdateStageForm({jobId,currentStage,currentSubStatus,contractor=false}: {
  jobId: string; currentStage: string; currentSubStatus: string; contractor?: boolean;
}) {
  const router=useRouter();
  const [stage,setStage]=useState(asPermitStage(currentStage));
  const [subStatus,setSubStatus]=useState(currentSubStatus || defaultSubStatus(currentStage));
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [saved,setSaved]=useState(false);
  async function save() {
    setLoading(true); setError(""); setSaved(false);
    try {
      const res=await fetch(contractor ? `/api/contractor/jobs/${jobId}/stage` : `/api/admin/jobs/${jobId}`, {
        method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({stage,sub_status:subStatus})
      });
      const body=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(body.error || `Could not save status (${res.status})`);
      setSaved(true); router.refresh();
    } catch(e) {setError(e instanceof Error ? e.message : "Could not save status");}
    finally {setLoading(false);}
  }
  return <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-medium">Permit status
        <select disabled={loading} value={stage} onChange={e=>{setStage(e.target.value);setSubStatus(defaultSubStatus(e.target.value));setSaved(false);}} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm">
          {!PERMIT_STEPS.some(s=>s.title===stage) && <option value={stage}>{stage || "Choose stage"}</option>}
          {PERMIT_STEPS.map(s=><option key={s.key}>{s.title}</option>)}
        </select>
      </label>
      <label className="text-xs font-medium">Status
        <select disabled={loading} value={subStatus} onChange={e=>{const value=e.target.value;setSubStatus(value);
          if (["Need to Submit","Pending approval","Request declined"].includes(value)) setStage(PERMIT_STAGES[0].title);
          else if (value === "In Review" && !["submitted","under_review","corrections"].includes(stageKeyFromTitle(stage))) setStage(stageTitle("under_review"));
          else if (["Approved","Approved and Printed"].includes(value) && !inspectionsAllowed(stage)) setStage(stageTitle("approved"));
          else if (value === "Complete") setStage(stageTitle("final_passed"));
          else if (value === "Closed") setStage(stageTitle("closed"));
          setSaved(false);}} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm">
          {!PERMIT_SUB_STATUSES.includes(subStatus) && <option>{subStatus}</option>}
          {PERMIT_SUB_STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
      </label>
    </div>
    <button type="button" disabled={loading} onClick={save} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Saving…" : "Save status"}</button>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    {saved && <p role="status" className="text-sm text-emerald-500">Status saved.</p>}
  </div>;
}
