import type {Gem} from '../../levels/schema';
import {GEM_RADIUS} from '../../levels/schema';
import {PIP_RADIUS} from '../collisions/clearance';
import {sweepQuadraticDisk} from '../collisions/quadraticSweep';
import type {QuadraticSegment} from '../trajectories/quadratic';
import type {AttemptResult} from './linearAttempt';
export interface GemHit {readonly gemId:string;readonly legIndex:number;readonly progress:number}
// Reuse the continuous distance solver with a point-sized rectangle. Inflating
// that point by the two disk radii gives exact circle/circle contact for the
// actual line or parabola, including tangencies. No frame sampling.
function legSegment(leg:AttemptResult):QuadraticSegment{
 if(leg.quadraticSegment)return leg.quadraticSegment;
 return {x0:leg.start.x,dx:leg.end.x-leg.start.x,y:[leg.start.y,leg.end.y-leg.start.y,0],pointAt:t=>leg.pointAt(t)};
}
export function collectRouteGems(gems:readonly Gem[],legs:readonly AttemptResult[]):readonly GemHit[]{
 if(!gems.length)return [];
 const seen=new Set<string>(),hits:GemHit[]=[];
 for(const [legIndex,leg] of legs.entries()){
  if(leg.event.kind==='misfire'||leg.length<=0)continue;
  const segment=legSegment(leg),local:GemHit[]=[];
  for(const gem of gems){
   if(seen.has(gem.id))continue;
   const {x,y}=gem.position;
   const hit=sweepQuadraticDisk(segment,PIP_RADIUS+GEM_RADIUS,{minX:x,maxX:x,minY:y,maxY:y});
   if(!hit)continue;
   // Solid contact or boundary failure wins a simultaneous terminal contact.
   if((leg.event.kind==='obstacle'||leg.event.kind==='boundary'||leg.event.kind==='loop')&&hit.parameter>=1-1e-10)continue;
   local.push({gemId:gem.id,legIndex,progress:hit.parameter});
  }
  local.sort((a,b)=>a.progress-b.progress||a.gemId.localeCompare(b.gemId));
  for(const hit of local){seen.add(hit.gemId);hits.push(Object.freeze(hit));}
 }
 return Object.freeze(hits);
}
