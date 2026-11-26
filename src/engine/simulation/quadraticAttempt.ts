import type {Point} from '../coordinates';
import type {Cannon,Level} from '../../levels/schema';
import {type QuadraticEquation} from '../equations/linear';
import {quadraticSegment,restrictSegment,approximateLength} from '../trajectories/quadratic';
import {rootsInUnitInterval} from '../collisions/polynomialRoots';
import {sweepQuadraticDisk} from '../collisions/quadraticSweep';
import {PIP_RADIUS} from '../collisions/clearance';
import {GEOMETRY_EPS} from '../collisions/sweep';
import {SOURCE_EPSILON} from '../trajectories/linear';
import {CAPTURE_EPSILON,type AttemptResult,type FlightEvent} from './linearAttempt';
export function simulateQuadraticAttempt(e:QuadraticEquation,cannon:Cannon,level:Level):AttemptResult{
 const source={...cannon.position},direction=cannon.direction,b=level.bounds;
 const full=quadraticSegment(e,source.x,direction===1?b.maxX:b.minX);
 const start=full.pointAt(0),startError=start.y-source.y;
 const angleAtX=(x:number)=>Math.atan((2*e.quadratic*x+e.linear)*direction)*180/Math.PI;
 const angle=angleAtX(source.x);
 if(Math.abs(startError)>SOURCE_EPSILON)return {cannonId:cannon.id,event:{kind:'misfire',startError},source,start:source,end:source,direction,angle,length:0,
  pointAt(p){if(!Number.isFinite(p)||p<0||p>1)throw new RangeError('Invalid attempt progress');return {...source};}};
 let limit=1,event:FlightEvent=direction===1?{kind:'boundary',edge:'right',normal:{x:-1,y:0}}:{kind:'boundary',edge:'left',normal:{x:1,y:0}};
 for(const [height,edge,sign] of [[b.maxY,'top',1],[b.minY,'bottom',-1]] as const){
  const roots=rootsInUnitInterval([full.y[0]-height,full.y[1],full.y[2]]);
  const delta=full.y[0]-height;
  // Starting on a boundary is permitted only if the curve enters the world.
  const outward=(full.y[1]||full.y[2])*sign>0;
  if(delta*sign>0||(Math.abs(delta)<=SOURCE_EPSILON&&outward))roots.unshift(0);
  const first=roots.find(t=>t>0||delta*sign>0||outward);
  if(first!==undefined&&first<=limit){limit=first;event={kind:'boundary',edge,normal:{x:0,y:-sign}};}
 }
 const targets:{position:Point;event:FlightEvent}[]=[{position:level.exit,event:{kind:'exit'}},...level.cannons.filter(c=>c.id!==cannon.id).sort((a,b)=>a.id.localeCompare(b.id)).map(c=>({position:c.position,event:{kind:'cannon' as const,cannonId:c.id}}))];
 let captured=false;
 for(const target of targets){
  const dx=target.position.x-source.x;
  if(dx*direction<=GEOMETRY_EPS||full.dx===0)continue;
  const t=dx/full.dx;
  if(t>limit+GEOMETRY_EPS/Math.max(1,Math.abs(full.dx))||captured&&t>=limit)continue;
  if(Math.abs(full.pointAt(t).y-target.position.y)<=CAPTURE_EPSILON){limit=t;event=target.event;captured=true;}
 }
 // Restrict before finding collision extrema: only the reachable part of the
 // graph is relevant and its local coefficients are better conditioned.
 const segment=restrictSegment(full,0,limit);let stop=1;
 for(const o of level.obstacles){
  const hit=sweepQuadraticDisk(segment,PIP_RADIUS,o.bounds);
  if(hit&&(hit.parameter<stop||hit.parameter===stop&&event.kind!=='obstacle')){
   stop=hit.parameter;event={kind:'obstacle',obstacleId:o.id,obstacleKind:o.kind,normal:hit.normal};
  }
 }
 const final=restrictSegment(segment,0,stop),end=final.pointAt(1);
 return {cannonId:cannon.id,event,source,start,end,direction,angle,length:approximateLength(final),
  pointAt(progress){if(!Number.isFinite(progress)||progress<0||progress>1)throw new RangeError('Invalid attempt progress');return final.pointAt(progress);},
  angleAt(progress){return angleAtX(final.pointAt(progress).x);},
  curveControl(from:Point,to:Point){const dx=to.x-from.x;return {x:(from.x+to.x)/2,y:(from.y+to.y)/2-e.quadratic*dx*dx/2};},
  quadraticSegment:final
 };
}
