import type {Level} from './schema';
import {foundryLinear,foundryStartPlan} from './foundryLinear';
import {foundryQuadratic,foundryQuadraticStartPlan} from './foundryQuadratic';
export const foundryLevels:readonly Level[]=[...foundryLinear,...foundryQuadratic];
export function initialFoundryPlan(level:Level){
 return foundryQuadratic.some(l=>l.id===level.id)?foundryQuadraticStartPlan(level):foundryStartPlan(level);
}
export function nextFoundryLevel(id:string):Level|undefined{
 const index=foundryLevels.findIndex(l=>l.id===id);
 return index<0?undefined:foundryLevels[index+1];
}
