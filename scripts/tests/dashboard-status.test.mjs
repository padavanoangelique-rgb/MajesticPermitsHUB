import test from 'node:test';
import assert from 'node:assert/strict';
import { PERMIT_STAGES, stageIndexFromTitle, inspectionsAllowed, defaultSubStatus } from '../../src/lib/stages.ts';
import { visibleInspections } from '../../src/lib/inspection-sequence.ts';
test('canonical and legacy stages never confuse preparation, approval or final',()=>{
 PERMIT_STAGES.forEach((s,i)=>assert.equal(stageIndexFromTitle(s.title),i));
 assert.equal(stageIndexFromTitle('Need Permit Submittal'),0);
 assert.equal(stageIndexFromTitle('not submitted'),0);
 assert.equal(stageIndexFromTitle('unrecognized'),-1);
 assert.equal(defaultSubStatus(PERMIT_STAGES[0].title),'Need to Submit');
});
test('inspections open only after approval until final completion',()=>{
 PERMIT_STAGES.forEach((s,i)=>assert.equal(inspectionsAllowed(s.title),i===4||i===5));
});
test('next required visit appears alone, results become history and corrections keep current visit',()=>{
 const rows=[{slot:3,status:'not_requested'},{slot:1,status:'not_required'},{slot:2,status:'scheduled'}];
 assert.deepEqual(visibleInspections(rows,false),[]);
 assert.deepEqual(visibleInspections(rows,true).map(i=>i.slot),[2]);
 rows[2].status='partial_pass'; assert.deepEqual(visibleInspections(rows,true).map(i=>i.slot),[2]);
 rows[2].status='passed'; assert.deepEqual(visibleInspections(rows,true).map(i=>i.slot),[2,3]);
 assert.deepEqual(visibleInspections(rows,true,true).map(i=>i.slot),[2]);
});
