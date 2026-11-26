import type {Cannon,Level} from '../../levels/schema';
import type {AdvancedEquation} from '../equations/advanced';
import {graphSegment,graphLength} from '../trajectories/graph';
import {sweepGraphDisk,GRAPH_TOLERANCE} from '../collisions/graphSweep';
import {PIP_RADIUS} from '../collisions/clearance';
import {GEOMETRY_EPS} from '../collisions/sweep';
import {SOURCE_EPSILON} from '../trajectories/linear';
import {CAPTURE_EPSILON,type AttemptResult,type FlightEvent} from './linearAttempt';
export function simulateAdvancedAttempt(e:AdvancedEquation,cannon:Cannon,level:Level):AttemptResult{
 const source={...cannon.position},direction=cannon.direction,b=level.bounds;
 const y=e.valueAt(source.x),valid=e.definedAt(source.x)&&Number.isFinite(y),startError=valid?y-source.y:0;
 const angleAtX=(x:number)=>Math.atan(e.slopeAt(x)*direction)*180/Math.PI;
 const angle=valid?angleAtX(source.x):0;
 if(!valid||Math.abs(startError)>SOURCE_EPSILON)return {
  cannonId:cannon.id,event:{kind:'misfire',startError,undefinedAtSource:!valid},source,start:source,end:source,direction,angle,length:0,
  pointAt(t){if(!Number.isFinite(t)||t<0||t>1)throw new RangeError('Invalid attempt progress');return {...source};}
 };
 const x0=source.x,start={x:x0,y};
 const edge=e.domainEdge(x0,direction);
 let stopX=direction===1?b.maxX:b.minX,event:FlightEvent=direction===1?{kind:'boundary',edge:'right',normal:{x:-1,y:0}}:{kind:'boundary',edge:'left',normal:{x:1,y:0}};
 let domainEnd=!!edge&&(edge.x-stopX)*direction<=0;
 if(domainEnd){stopX=edge!.x;event={kind:'domain',reason:'asymptote'};}
 // Find the nearest forward capture on this branch first. It is provisional
 // until we have checked the intervening boundary intersections and solids.
 const targets=[{position:level.exit,event:{kind:'exit'} as FlightEvent},...level.cannons.filter(c=>c.id!==cannon.id).sort((a,b)=>a.id.localeCompare(b.id)).map(c=>({position:c.position,event:{kind:'cannon',cannonId:c.id} as FlightEvent}))];
 let captured=false;
 for(const target of targets){
  const x=target.position.x;
  if((x-x0)*direction<=GEOMETRY_EPS||(x-stopX)*direction>0||domainEnd&&(x-stopX)*direction>=0||captured&&x===stopX)continue;
  if(e.definedAt(x)&&Math.abs(e.valueAt(x)-target.position.y)<=CAPTURE_EPSILON){stopX=x;event=target.event;domainEnd=false;captured=true;}
 }
 const knots=[x0,...[...e.criticalXs(x0,stopX)].sort((a,b)=>(a-b)*direction),stopX];
 let previous=start;
 for(let i=1;i<knots.length;i++){
  const x=knots[i],endValue=domainEnd&&i===knots.length-1?edge!.limit:e.valueAt(x);
  if(!Number.isFinite(previous.y)){event={kind:'domain',reason:'numeric-limit'};stopX=previous.x;break;}
  const upper=endValue>=b.maxY,lower=endValue<=b.minY;
  if(!upper&&!lower&&Number.isFinite(endValue)){previous={x,y:endValue};continue;}
  if(Number.isNaN(endValue)){stopX=previous.x;event={kind:'domain',reason:'numeric-limit'};break;}
  const height=upper?b.maxY:b.minY,sign=upper?1:-1;
  // At a marked boundary capture, the capture wins if this is the first
  // contact. At other endpoints even tangency ends the flight.
  if(endValue===height&&i===knots.length-1&&captured&&(previous.y-height)*sign<0)break;
  if((previous.y-height)*sign>=0){stopX=previous.x;event={kind:'boundary',edge:upper?'top':'bottom',normal:{x:0,y:-sign}};break;}
  // Monotone y on this entire knot interval. Bisection never evaluates the
  // singular endpoint, and returns the last finite point inside the world.
  let lo=previous.x,hi=x;
  for(let j=0;j<128;j++){
   const mid=lo+(hi-lo)/2;if(mid===lo||mid===hi)break;
   const v=e.valueAt(mid);
   if(Number.isFinite(v)&&(v-height)*sign<0)lo=mid;
   else if(v===height){lo=mid;hi=mid;break;}
   else hi=mid;
  }
  stopX=lo;
  const v=e.valueAt(lo);
  event=Math.abs(v-height)<=GRAPH_TOLERANCE?{kind:'boundary',edge:upper?'top':'bottom',normal:{x:0,y:-sign}}:{kind:'domain',reason:'numeric-limit'};
  domainEnd=false;break;
 }
 // An unresolved domain edge must never be evaluated or crossed.
 if(!e.definedAt(stopX)||!Number.isFinite(e.valueAt(stopX))){
  stopX=previous.x;event={kind:'domain',reason:'numeric-limit'};
 }
 const segment=graphSegment(e,x0,stopX);
 let stop=1;
 for(const obstacle of level.obstacles){
  const hit=sweepGraphDisk(segment,PIP_RADIUS,obstacle.bounds);
  if(hit&&(hit.parameter<stop||hit.parameter===stop&&event.kind!=='obstacle')){
   stop=hit.parameter;event=hit.uncertain?{kind:'domain',reason:'numeric-limit'}:{kind:'obstacle',obstacleId:obstacle.id,obstacleKind:obstacle.kind,normal:hit.normal};
  }
 }
 const final=graphSegment(e,x0,segment.pointAt(stop).x),end=final.pointAt(1);
 return {cannonId:cannon.id,event,source,start,end,direction,angle,length:graphLength(final),graphSegment:final,
  pointAt(t){if(!Number.isFinite(t)||t<0||t>1)throw new RangeError('Invalid attempt progress');return final.pointAt(t);},
  angleAt(t){return angleAtX(final.pointAt(t).x);}
 };
}
