import {validateLevel,type Level} from '../../levels/schema';
import {isQuadratic} from '../equations/linear';
import {isAdvanced,equationFamily,cannonEquationKey,type CannonEquation} from '../equations/advanced';
import {lockedLiftEquation} from '../../levels/liftSpec';
import {lockedAnchorEquation,unplacedInventory} from '../../levels/anchorSpec';
import {simulateAdvancedAttempt} from './advancedAttempt';
import {simulateQuadraticAttempt} from './quadraticAttempt';
import {collectRouteGems,type GemHit} from './gemContacts';
import {simulateLinearAttempt,type AttemptResult,type FlightEvent} from './linearAttempt';
export interface RouteResult extends AttemptResult {
 readonly legs:readonly AttemptResult[];
 readonly terminalCannonId:string;
 readonly gemHits:readonly GemHit[];
}
export function isRouteResult(r:AttemptResult):r is RouteResult{return 'legs' in r;}
export function routeLegs(r:AttemptResult):readonly AttemptResult[]{return isRouteResult(r)?r.legs:[r];}
export function routeGemHits(r:AttemptResult):readonly GemHit[]{return isRouteResult(r)?r.gemHits:[];}
export function simulateRoute(level:Level,equations:ReadonlyMap<string,CannonEquation>):RouteResult{
 validateLevel(level);
 if(unplacedInventory(level).length)throw Error('Place every inventory cannon before launching.');
 // Validate the whole plan before an attempt is reserved, even for a cannon that is bypassed.
 const resolved=new Map<string,CannonEquation>();
 for(const c of level.cannons){
  const submitted=equations.get(c.id);
  const locked=c.lift?lockedLiftEquation(c):lockedAnchorEquation(level,c);
  if(locked){
   if(submitted&&cannonEquationKey(submitted)!==cannonEquationKey(locked))throw new Error((c.lift?'Locked lift equation':'Locked anchor equation')+' cannot be changed: '+c.id);
   resolved.set(c.id,locked);
  }else{
   if(!submitted||c.type!==equationFamily(submitted))throw new Error('Program every '+c.type+' cannon with its own equation family before launching.');
   resolved.set(c.id,submitted);
  }
 }
 const byId=new Map(level.cannons.map(c=>[c.id,c]));
 let current=byId.get(level.startId);if(!current)throw new Error('Missing start cannon');
 const visited=new Set<string>(),legs:AttemptResult[]=[];
 let event:FlightEvent;
 while(true){
  visited.add(current.id);
  const equation=resolved.get(current.id)!;
  const leg=isAdvanced(equation)?simulateAdvancedAttempt(equation,current,level):isQuadratic(equation)?simulateQuadraticAttempt(equation,current,level):simulateLinearAttempt(equation,current,level);
  event=leg.event;
  // Reaching the exit without the complete supplied relay is a failed
  // attempt in placement puzzles, even if the geometric flight is valid.
  if(event.kind==='exit'&&level.anchorPuzzle&&visited.size!==level.cannons.length){
   event={kind:'incomplete-relay',unusedCannonIds:level.cannons.filter(c=>!visited.has(c.id)).map(c=>c.id)};
   legs.push({...leg,event});break;
  }
  legs.push(leg);
  if(event.kind!=='cannon')break;
  if(visited.has(event.cannonId)){event={kind:'loop',cannonId:event.cannonId};break;}
  const next=byId.get(event.cannonId);if(!next)throw new Error('Missing capture cannon');current=next;
 }
 const first=legs[0],last=legs[legs.length-1],length=legs.reduce((sum,leg)=>sum+leg.length,0);
 // Summary retains the full path, not a straight line between the first and last points.
 return Object.freeze({cannonId:first.cannonId,event,source:first.source,start:first.start,end:last.end,
  direction:first.direction,angle:first.angle,length,legs:Object.freeze(legs),terminalCannonId:last.cannonId,gemHits:collectRouteGems(level.gems??[],legs),
  pointAt(progress:number){
   if(!Number.isFinite(progress)||progress<0||progress>1)throw new RangeError('Invalid route progress');
   if(progress===1)return {...last.end};
   let d=length*progress;
   for(const leg of legs){if(leg.length>0&&d<=leg.length)return leg.pointAt(d/leg.length);d-=leg.length;}
   return {...last.end};
  }});
}

// Backwards-compatible entry point for existing linear fixtures and integrations.
export const simulateLinearRoute=simulateRoute;
