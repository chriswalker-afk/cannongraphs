import type {Point} from '../coordinates';
import type {Cannon,Level,Obstacle} from '../../levels/schema';
import {evaluateLinear,type LinearEquation} from '../equations/linear';
import {buildLinearFlight} from '../trajectories/linear';
import {along,GEOMETRY_EPS,sweepDiskRectangle} from '../collisions/sweep';
export const PIP_RADIUS=.20;
// A destination is a marked mathematical point, not the entire decorative portal.
export const CAPTURE_EPSILON=1e-7;
export type FlightEvent=
 |{kind:'exit'}
 |{kind:'obstacle';obstacleId:string;obstacleKind:Obstacle['kind'];normal:Point}
 |{kind:'boundary';edge:'left'|'right'|'top'|'bottom';normal:Point}
 |{kind:'misfire';startError:number};
export interface AttemptResult {
 readonly event:FlightEvent;readonly source:Point;readonly start:Point;readonly end:Point;
 readonly direction:1|-1;readonly angle:number;readonly length:number;
 pointAt(progress:number):Point;
}
export function simulateLinearAttempt(e:LinearEquation,cannon:Cannon,level:Level):AttemptResult{
 const source={...cannon.position},direction=cannon.direction,flight=buildLinearFlight(e,source,direction,level.bounds);
 const angle=Math.atan(e.gradient*direction)*180/Math.PI;
 const norm=Math.hypot(1,e.gradient),v={x:direction/norm,y:direction*e.gradient/norm};
 const make=(event:FlightEvent,start:Point,length:number,end=along(start,v,length)):AttemptResult=>({
  event,source,start,end,direction,angle,length,pointAt(progress){
   if(!Number.isFinite(progress)||progress<0||progress>1)throw new RangeError('Invalid attempt progress');
   return progress===1?{...end}:along(start,v,length*progress);
  }
 });
 if(!flight.passesLaunchPoint)return make({kind:'misfire',startError:flight.startError},source,0);
 const start=flight.start,b=level.bounds;
 // Bounds limit the centre's travel. Solid obstacle contact includes the Pip's radius.
 const dx=(direction===1?b.maxX-start.x:start.x-b.minX)/Math.abs(v.x);
 let length=Math.max(0,dx);
 let event:FlightEvent=direction===1?{kind:'boundary',edge:'right',normal:{x:-1,y:0}}:{kind:'boundary',edge:'left',normal:{x:1,y:0}};
 if(v.y!==0){
  const dy=(v.y>0?b.maxY-start.y:start.y-b.minY)/Math.abs(v.y);
  if(dy<=length){length=Math.max(0,dy);event=v.y>0?{kind:'boundary',edge:'top',normal:{x:0,y:-1}}:{kind:'boundary',edge:'bottom',normal:{x:0,y:1}};}
 }
 let end=along(start,v,length);
 const target=level.exit,forward=(target.x-start.x)*direction;
 if(forward>GEOMETRY_EPS){
  const targetY=evaluateLinear(e,target.x),dist=forward/Math.abs(v.x);
  if(Math.abs(targetY-target.y)<=CAPTURE_EPSILON&&dist<=length+GEOMETRY_EPS){
   length=dist;end={x:target.x,y:targetY};event={kind:'exit'};
  }
 }
 // The earliest solid contact wins; contact at the capture instant also fails.
 for(const obstacle of level.obstacles){
  const hit=sweepDiskRectangle(start,v,PIP_RADIUS,obstacle.bounds,length);
  if(hit&&(event.kind!=='obstacle'||hit.distance<length-GEOMETRY_EPS)){
   length=hit.distance;end=hit.center;event={kind:'obstacle',obstacleId:obstacle.id,obstacleKind:obstacle.kind,normal:hit.normal};
  }
 }
 return make(event,start,length,end);
}
