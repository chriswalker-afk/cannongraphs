import type {Bounds,Point} from '../coordinates';
import {sweepDiskRectangle} from './sweep';
// Nominal Pip body hitbox. Decorative limbs and squash/stretch do not alter it.
export const PIP_RADIUS=.20;
export function pointRectangleDistance(p:Point,b:Bounds):number{
 return Math.hypot(Math.max(b.minX-p.x,0,p.x-b.maxX),Math.max(b.minY-p.y,0,p.y-b.maxY));
}
function pointSegmentDistance(p:Point,a:Point,z:Point):number{
 const dx=z.x-a.x,dy=z.y-a.y,len2=dx*dx+dy*dy;
 const t=len2===0?0:Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len2));
 return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
// Exact minimum centreline distance for a straight segment and a solid rectangle.
// If disjoint, a minimum is attained by an endpoint or a rectangle corner.
export function segmentRectangleDistance(a:Point,z:Point,b:Bounds):number{
 const dx=z.x-a.x,dy=z.y-a.y,length=Math.hypot(dx,dy);
 if(length===0)return pointRectangleDistance(a,b);
 if(sweepDiskRectangle(a,{x:dx/length,y:dy/length},0,b,length))return 0;
 return Math.min(pointRectangleDistance(a,b),pointRectangleDistance(z,b),
  ...[b.minX,b.maxX].flatMap(x=>[b.minY,b.maxY].map(y=>pointSegmentDistance({x,y},a,z))));
}
