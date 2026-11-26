// Authoring/test helper; not imported by the game UI and never used to
// validate the player's proposed route before they launch.
import {PIP_RADIUS,pointRectangleDistance,segmentRectangleDistance} from '../engine/collisions/clearance';
import {GEOMETRY_EPS} from '../engine/collisions/sweep';
import {parseLinearEquation} from '../engine/equations/linear';
import {simulateLinearRoute,type RouteResult} from '../engine/simulation/linearRoute';
import {validateLevel,type Level} from './schema';
export function assertAuthoredTerrain(level:Level):void{
 validateLevel(level);
 for(const anchor of [...level.cannons.map(c=>({id:c.id,point:c.position})),{id:'exit',point:level.exit}]){
  for(const obstacle of level.obstacles){
   if(pointRectangleDistance(anchor.point,obstacle.bounds)<=PIP_RADIUS+GEOMETRY_EPS)throw new Error(level.id+': '+anchor.id+' touches '+obstacle.id);
  }
 }
}
export interface SolutionAudit {result:RouteResult;minimumClearance:number}
export function auditLinearSolution(level:Level,reference:Readonly<Record<string,string>>,expectedRoute?:readonly string[]):SolutionAudit{
 assertAuthoredTerrain(level);
 const equations=new Map(level.cannons.map(c=>{
  if(!Object.hasOwn(reference,c.id))throw new Error(level.id+': missing reference for '+c.id);
  return [c.id,parseLinearEquation(reference[c.id])] as const;
 }));
 const result=simulateLinearRoute(level,equations);
 if(result.event.kind!=='exit')throw new Error(level.id+': reference route failed at '+result.terminalCannonId+' ('+result.event.kind+')');
 if(expectedRoute&&(expectedRoute.length!==result.legs.length||expectedRoute.some((id,i)=>id!==result.legs[i].cannonId)))throw new Error(level.id+': unexpected reference cannon sequence');
 let minimumClearance=Infinity;
 for(const leg of result.legs)for(const o of level.obstacles)minimumClearance=Math.min(minimumClearance,segmentRectangleDistance(leg.start,leg.end,o.bounds)-PIP_RADIUS);
 if(minimumClearance<=GEOMETRY_EPS)throw new Error(level.id+': reference route has insufficient clearance');
 return {result,minimumClearance};
}
