import type {Bounds,Point} from '../coordinates';
import {pointRectangleDistance} from './clearance';
import {GEOMETRY_EPS} from './sweep';
import {polynomialDerivative,rootsInUnitInterval,uniqueParameters} from './polynomialRoots';
import {restrictSegment,type QuadraticSegment} from '../trajectories/quadratic';
function square(p:readonly number[]):number[]{
 const result=Array<number>(2*p.length-1).fill(0);
 for(let i=0;i<p.length;i++)for(let j=0;j<p.length;j++)result[i+j]+=p[i]*p[j];
 return result;
}
export interface CurveContact {parameter:number;center:Point;normal:Point}
// Partition by rectangle x/y faces. On each open interval the nearest point
// on the rectangle has a fixed feature, so squared distance is degree <=4.
// Its derivative has degree <=3; evaluate all critical points and isolate
// the first contact on monotone pieces. This includes corner tangencies.
function distanceKnots(s:QuadraticSegment,b:Bounds):number[]{
 const edges=uniqueParameters([0,1,...(s.dx===0?[]:[(b.minX-s.x0)/s.dx,(b.maxX-s.x0)/s.dx]),
  ...rootsInUnitInterval([s.y[0]-b.minY,s.y[1],s.y[2]]),
  ...rootsInUnitInterval([s.y[0]-b.maxY,s.y[1],s.y[2]])]);
 const knots=[...edges];
 for(let i=1;i<edges.length;i++){
  const lo=edges[i-1],hi=edges[i];if(hi<=lo)continue;
  const part=restrictSegment(s,lo,hi),mid=part.pointAt(.5);
  const x=mid.x<b.minX?[part.x0-b.minX,part.dx]:mid.x>b.maxX?[part.x0-b.maxX,part.dx]:[0];
  const y=mid.y<b.minY?[part.y[0]-b.minY,part.y[1],part.y[2]]:mid.y>b.maxY?[part.y[0]-b.maxY,part.y[1],part.y[2]]:[0];
  const a=square(x),z=square(y),p=Array.from({length:Math.max(a.length,z.length)},(_,j)=>(a[j]??0)+(z[j]??0));
  for(const t of rootsInUnitInterval(polynomialDerivative(p)))knots.push(lo+(hi-lo)*t);
 }
 return uniqueParameters(knots);
}
export function quadraticRectangleDistance(s:QuadraticSegment,b:Bounds):number{
 return Math.min(...distanceKnots(s,b).map(t=>pointRectangleDistance(s.pointAt(t),b)));
}
export function sweepQuadraticDisk(s:QuadraticSegment,radius:number,b:Bounds):CurveContact|null{
 const knots=distanceKnots(s,b),distance=(t:number)=>pointRectangleDistance(s.pointAt(t),b);
 let hit:number|null=distance(0)<=radius+GEOMETRY_EPS?0:null;
 for(let i=1;hit===null&&i<knots.length;i++){
  const t=knots[i],d=distance(t);
  if(d>radius+GEOMETRY_EPS)continue;
  // If the minimum is a numerical tangent, report that minimum. Otherwise
  // bisect the monotone interval using the actual geometric distance.
  if(d>=radius){hit=t;break;}
  let lo=knots[i-1],hi=t;
  for(let k=0;k<256;k++){
   const mid=lo+(hi-lo)/2;if(mid===lo||mid===hi)break;
   if(distance(mid)>radius)lo=mid;else hi=mid;
  }
  hit=hi;
 }
 if(hit===null)return null;
 const center=s.pointAt(hit),closest={x:Math.max(b.minX,Math.min(b.maxX,center.x)),y:Math.max(b.minY,Math.min(b.maxY,center.y))};
 const x=center.x-closest.x,y=center.y-closest.y,length=Math.hypot(x,y);
 const dy=s.y[1]+2*s.y[2]*hit,v=Math.hypot(s.dx,dy);
 return {parameter:hit,center,normal:length>GEOMETRY_EPS?{x:x/length,y:y/length}:v?{x:-s.dx/v,y:-dy/v}:{x:0,y:1}};
}
