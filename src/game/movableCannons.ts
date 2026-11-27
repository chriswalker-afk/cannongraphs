import {validateLevel,type Level} from '../levels/schema';
import {lockedLiftEquation,lockedLiftText} from '../levels/liftSpec';
import {canPlan,type LevelState} from './levelState';
import {type FlightPlan} from './flightPlan';

// Planning edits create new level geometry, leaving the authored level and
// any previously launched snapshot untouched. Invalid destinations are rejected
// (not silently relocated), so PR44 can give accurate drag feedback.
export function repositionLift(level:Level,id:string,requestedY:number):Level{
 const c=level.cannons.find(c=>c.id===id);
 if(!c?.lift)throw new Error('Not a movable cannon: '+id);
 if(!Number.isFinite(requestedY))throw new RangeError('Invalid lift destination');
 const y=Math.max(c.lift.minY,Math.min(c.lift.maxY,Math.round(requestedY)));
 if(y===c.position.y)return level;
 const next:Level={...level,cannons:level.cannons.map(other=>other.id===id?{...other,position:{x:other.position.x,y}}:other)};
 validateLevel(next);
 return next;
}
export interface LiftPlanningUpdate {readonly level:Level;readonly plan:FlightPlan}
export function moveLiftInPlanning(level:Level,plan:FlightPlan,state:LevelState,id:string,requestedY:number):LiftPlanningUpdate{
 if(!canPlan(state))return {level,plan};
 const next=repositionLift(level,id,requestedY);
 if(next===level)return {level,plan};
 const c=next.cannons.find(c=>c.id===id)!;
 if(!plan.some(entry=>entry.id===id&&entry.locked))throw new Error('Use a level-aware flight plan for a lift');
 const equation=lockedLiftEquation(c);
 // Geometry changes can invalidate an incoming or bypassing leg even if its
 // equation did not change. Clear ALL evidence but preserve ordinary drafts.
 return {level:next,plan:plan.map(entry=>entry.id===id?{...entry,equation,text:lockedLiftText(equation),evidence:null}:entry.evidence?{...entry,evidence:null}:entry)};
}
