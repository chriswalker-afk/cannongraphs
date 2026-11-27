import {validateLevel,type Level} from '../levels/schema';
import {anchorAssignments,materializeAnchorLayout,inventoryCannon,lockedAnchorEquation,unplacedInventory} from '../levels/anchorSpec';
import {lockedLiftText} from '../levels/liftSpec';
import {canPlan,canLaunch,type LevelState} from './levelState';
import {getPlanEntry,snapshotPlan,type FlightPlan,type PlanEntry} from './flightPlan';

// Placement is a planning edit, not a simulation attempt. The UI may show
// free/occupied/legal mounts but should never test a candidate's trajectory.
export function repositionAnchor(level:Level,id:string,anchorId:string|null):Level{
 if(!inventoryCannon(level,id))throw Error('Not an inventory cannon: '+id);
 const current=new Map(anchorAssignments(level));
 if((current.get(id)??null)===anchorId)return level;
 if(anchorId===null)current.delete(id);else current.set(id,anchorId);
 const next=materializeAnchorLayout(level,current);
 validateLevel(next);return next;
}
export interface AnchorPlanningUpdate {readonly level:Level;readonly plan:FlightPlan}
export function moveAnchorInPlanning(level:Level,plan:FlightPlan,state:LevelState,id:string,anchorId:string|null):AnchorPlanningUpdate{
 if(!canPlan(state))return {level,plan};
 const next=repositionAnchor(level,id,anchorId);
 if(next===level)return {level,plan};
 const item=inventoryCannon(next,id)!;
 if(!getPlanEntry(plan,id))throw Error('Use a level-aware flight plan for inventory cannons');
 const c=next.cannons.find(c=>c.id===id);
 const updated=plan.map((entry):PlanEntry=>{
  if(entry.id!==id)return entry.evidence?{...entry,evidence:null}:entry;
  const {unplaced:wasUnplaced,locked:wasLocked,...draft}=entry;
  if(item.lockedShape!==undefined){
   const equation=c?lockedAnchorEquation(next,c)!:null;
   return {...draft,locked:true,...(!c?{unplaced:true as const}:{}),equation,text:equation?lockedLiftText(equation):'',evidence:null};
  }
  // Keep ordinary drafts even after unmounting. The equation is not silently
  // repaired when a new source is chosen; a wrong source can still misfire.
  return {...draft,...(!c?{unplaced:true as const}:{}),evidence:null};
 });
 return {level:next,plan:updated};
}
// Readiness is structural, not a hidden solution check.
export function canLaunchAnchorPuzzle(level:Level,plan:FlightPlan,state:LevelState):boolean{
 if(!level.anchorPuzzle||!canLaunch(state)||unplacedInventory(level).length)return false;
 const equations=snapshotPlan(plan);
 return !!equations&&equations.size===level.cannons.length&&level.cannons.every(c=>equations.has(c.id));
}
