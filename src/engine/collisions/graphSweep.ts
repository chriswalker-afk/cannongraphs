import type {Bounds,Point} from '../coordinates';
import type {GraphSegment} from '../trajectories/graph';
import {pointRectangleDistance} from './clearance';
export const GRAPH_TOLERANCE=1e-6;
export interface GraphContact {parameter:number;center:Point;normal:Point;uncertain:boolean}
const MAX_NODES=50000;
function rectangleDistance(a:Point,z:Point,b:Bounds):number{
 return Math.hypot(Math.max(b.minX-Math.max(a.x,z.x),0,Math.min(a.x,z.x)-b.maxX),Math.max(b.minY-Math.max(a.y,z.y),0,Math.min(a.y,z.y)-b.maxY));
}
// Each knot interval is monotone in both x and y. Its endpoint box therefore
// encloses the *whole* graph. Disjoint boxes prove no collision. Search in
// flight order and subdivide only ambiguous intervals, including tangencies.
// At a sub-microunit box, conservatively resolve contact within tolerance;
// an exhausted computation is explicitly uncertain, never a successful skip.
export function sweepGraphDisk(s:GraphSegment,radius:number,b:Bounds):GraphContact|null{
 let budget=MAX_NODES;
 const make=(t:number,p:Point,uncertain:boolean):GraphContact=>{
  const dx=p.x-Math.max(b.minX,Math.min(b.maxX,p.x)),dy=p.y-Math.max(b.minY,Math.min(b.maxY,p.y)),d=Math.hypot(dx,dy);
  return {parameter:t,center:p,normal:d?{x:dx/d,y:dy/d}:{x:0,y:1},uncertain};
 };
 function visit(lo:number,hi:number,a:Point,z:Point):GraphContact|null{
  if(--budget<0||![a.x,a.y,z.x,z.y].every(Number.isFinite))return make(lo,a,true);
  if(rectangleDistance(a,z,b)>radius+1e-9)return null;
  if(pointRectangleDistance(a,b)<=radius+1e-9)return make(lo,a,false);
  const mid=lo+(hi-lo)/2;
  if(Math.hypot(z.x-a.x,z.y-a.y)<=GRAPH_TOLERANCE||mid===lo||mid===hi){
   return pointRectangleDistance(z,b)<=radius+GRAPH_TOLERANCE+1e-9?make(hi,z,false):make(lo,a,true);
  }
  const p=s.pointAt(mid);
  return visit(lo,mid,a,p)??visit(mid,hi,p,z);
 }
 for(let i=1;i<s.knots.length;i++){
  const lo=s.knots[i-1],hi=s.knots[i],hit=visit(lo,hi,s.pointAt(lo),s.pointAt(hi));if(hit)return hit;
 }
 return null;
}
// A lower bound on clearance, suitable for authored route regression audits.
export function graphRectangleClearance(s:GraphSegment,radius:number,b:Bounds):number{
 if(sweepGraphDisk(s,radius,b))return 0;
 let lo=0,hi=pointRectangleDistance(s.pointAt(0),b)-radius;
 for(let i=0;i<24&&hi-lo>GRAPH_TOLERANCE;i++){
  const mid=(lo+hi)/2;if(sweepGraphDisk(s,radius+mid,b))hi=mid;else lo=mid;
 }
 return lo;
}
