import type {LinearEquation} from '../engine/equations/linear';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
import {routeLegs} from '../engine/simulation/linearRoute';
export interface PlanDraft {readonly text:string;readonly equation:LinearEquation|null}
export type LegEvidence='tested'|'revise';
export type PlanStatus='empty'|'invalid'|'ready'|LegEvidence;
export interface PlanEntry extends PlanDraft {readonly id:string;readonly evidence:LegEvidence|null}
export type FlightPlan=readonly PlanEntry[];
export function createFlightPlan(ids:readonly string[]):FlightPlan{
 if(!ids.length||new Set(ids).size!==ids.length)throw new Error('Invalid cannon IDs');
 return ids.map(id=>({id,text:'',equation:null,evidence:null}));
}
export function getPlanEntry(plan:FlightPlan,id:string):PlanEntry|undefined{return plan.find(e=>e.id===id);}
const equationKey=(e:LinearEquation|null)=>e?[
 e.exactGradient.numerator,e.exactGradient.denominator,e.exactIntercept.numerator,e.exactIntercept.denominator
].join('/'):'';
function sameDraft(a:PlanDraft,b:PlanDraft):boolean{return a.text===b.text&&equationKey(a.equation)===equationKey(b.equation);}
export function editPlan(plan:FlightPlan,id:string,draft:PlanDraft):FlightPlan{
 const previous=getPlanEntry(plan,id);
 if(!previous||sameDraft(previous,draft))return plan;
 return plan.map(entry=>entry.id===id?{id,text:draft.text,equation:draft.equation,evidence:null}:entry);
}
export function planStatus(entry:PlanEntry):PlanStatus{
 if(!entry.equation)return !entry.text.trim()||/^y\s*=\s*$/i.test(entry.text.trim())?'empty':'invalid';
 return entry.evidence??'ready';
}
export function countReady(plan:FlightPlan):number{return plan.filter(e=>e.equation!==null).length;}
export function snapshotPlan(plan:FlightPlan):ReadonlyMap<string,LinearEquation>|null{
 const result=new Map<string,LinearEquation>();
 for(const entry of plan){if(!entry.equation)return null;result.set(entry.id,entry.equation);}
 return result;
}
// Only call when an actual attempt has finished, never from editor validation.
// Evidence is local to the tested leg and its unchanged input; it is not a
// prediction that the entire route is correct or that this cannon will be reached.
export function recordFlightEvidence(plan:FlightPlan,launched:FlightPlan,result:AttemptResult):FlightPlan{
 const legs=routeLegs(result),evidence=new Map<string,LegEvidence>();
 for(const [index,leg] of legs.entries()){
  const loopEnd=result.event.kind==='loop'&&index===legs.length-1;
  evidence.set(leg.cannonId,!loopEnd&&(leg.event.kind==='cannon'||leg.event.kind==='exit')?'tested':'revise');
 }
 return plan.map(entry=>{
  const tested=evidence.get(entry.id),original=getPlanEntry(launched,entry.id);
  return tested&&entry.equation&&original&&sameDraft(entry,original)?{...entry,evidence:tested}:entry;
 });
}
export function clearEvidence(plan:FlightPlan):FlightPlan{return plan.map(e=>e.evidence?{...e,evidence:null}:e);}
