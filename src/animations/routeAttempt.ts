import {attemptDuration,sampleAttempt,type AttemptFrame} from './attempt';
import {stageMisfire} from './misfire';
import {LOAD_MS,BARREL_ANGLE,sampleLaunchCue} from './launch';
import {boardingPoint,canBoardFrom} from './waitingCrew';
import type {Point} from '../engine/coordinates';
import {routeLegs} from '../engine/simulation/linearRoute';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
import type {Level} from '../levels/schema';
export interface RouteCue {leg:AttemptResult;frame:AttemptFrame;index:number;completed:readonly AttemptResult[]}
export function routeDuration(result:AttemptResult,reduced=false):number{
 return routeLegs(result).reduce((n,leg)=>n+attemptDuration(leg,reduced),0);
}
export function sampleRouteAttempt(ms:number,result:AttemptResult,level:Level,reduced=false,boardingFrom?:Point):RouteCue{
 const legs=routeLegs(result);let t=Math.max(0,ms),index=0;
 while(index<legs.length-1&&t>=attemptDuration(legs[index],reduced)){t-=attemptDuration(legs[index],reduced);index++;}
 const leg=legs[index];
 const staging=leg.event.kind==='misfire'?stageMisfire(leg.source,leg.direction,level.bounds,level.obstacles):undefined;
 let frame=sampleAttempt(t,leg,reduced,staging);
 if(index===0&&!reduced&&boardingFrom&&t<LOAD_MS){
  const to=sampleLaunchCue(LOAD_MS-1,leg.source,leg.direction,false,leg.event.kind==='misfire'?BARREL_ANGLE:leg.angle).loadingPoint!;
  if(canBoardFrom(level,boardingFrom,to))frame={...frame,pip:boardingPoint(boardingFrom,to,t/LOAD_MS)};
 }
 return {leg,index,completed:legs.slice(0,index),frame};
}
