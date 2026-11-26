import {validateLevel,type Level} from '../../levels/schema';
import type {LinearEquation} from '../equations/linear';
import {simulateLinearAttempt,type AttemptResult,type FlightEvent} from './linearAttempt';
export interface RouteResult extends AttemptResult {
 readonly legs:readonly AttemptResult[];
 readonly terminalCannonId:string;
}
export function isRouteResult(r:AttemptResult):r is RouteResult{return 'legs' in r;}
export function routeLegs(r:AttemptResult):readonly AttemptResult[]{return isRouteResult(r)?r.legs:[r];}
export function simulateLinearRoute(level:Level,equations:ReadonlyMap<string,LinearEquation>):RouteResult{
 validateLevel(level);
 // Validate the whole plan before an attempt is reserved, even for a cannon that is bypassed.
 for(const c of level.cannons)if(c.type!=='linear'||!equations.has(c.id))throw new Error('Program every linear cannon before launching.');
 const byId=new Map(level.cannons.map(c=>[c.id,c]));
 let current=byId.get(level.startId);if(!current)throw new Error('Missing start cannon');
 const visited=new Set<string>(),legs:AttemptResult[]=[];
 let event:FlightEvent;
 while(true){
  visited.add(current.id);
  const leg=simulateLinearAttempt(equations.get(current.id)!,current,level);
  legs.push(leg);event=leg.event;
  if(event.kind!=='cannon')break;
  if(visited.has(event.cannonId)){event={kind:'loop',cannonId:event.cannonId};break;}
  const next=byId.get(event.cannonId);if(!next)throw new Error('Missing capture cannon');current=next;
 }
 const first=legs[0],last=legs[legs.length-1],length=legs.reduce((sum,leg)=>sum+leg.length,0);
 // Summary retains the full path, not a straight line between the first and last points.
 return Object.freeze({cannonId:first.cannonId,event,source:first.source,start:first.start,end:last.end,
  direction:first.direction,angle:first.angle,length,legs:Object.freeze(legs),terminalCannonId:last.cannonId,
  pointAt(progress:number){
   if(!Number.isFinite(progress)||progress<0||progress>1)throw new RangeError('Invalid route progress');
   if(progress===1)return {...last.end};
   let d=length*progress;
   for(const leg of legs){if(leg.length>0&&d<=leg.length)return leg.pointAt(d/leg.length);d-=leg.length;}
   return {...last.end};
  }});
}
