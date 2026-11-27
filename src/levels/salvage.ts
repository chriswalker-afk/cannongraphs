import type {Level} from './schema';
import {salvageLinear,initialSalvageLinearPlan} from './salvageLinear';
import {salvageQuadratic} from './salvageQuadratic';
import {initialAnchorDemoPlan} from './anchorDemos';
import {createLevelFlightPlan} from '../game/flightPlan';

export const salvageLevels:readonly Level[]=[...salvageLinear,...salvageQuadratic];
export function initialSalvagePlan(level:Level){
 if(salvageLinear.some(l=>l.id===level.id))return initialSalvageLinearPlan(level);
 if(salvageQuadratic.some(l=>l.id===level.id))return createLevelFlightPlan(level);
 return initialAnchorDemoPlan(level);
}
export function nextSalvageLevel(id:string):Level|undefined{
 const i=salvageLevels.findIndex(l=>l.id===id);return i<0?undefined:salvageLevels[i+1];
}
export function salvageSceneryVariant(id:string):number{
 const index=salvageLevels.findIndex(l=>l.id===id);return index<0?0:Math.floor(index/3);
}
