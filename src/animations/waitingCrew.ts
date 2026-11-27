import type {Point} from '../engine/coordinates';
import type {Level} from '../levels/schema';
import {pointRectangleDistance,segmentRectangleDistance} from '../engine/collisions/clearance';
// Decorative boarding positions on existing terrain, not new platforms.
// Keep hats, bodies and a small bounce away from solid terrain and anchors.
const radius=.245,lift=.10,spacing=.57;
export function waitingCrewSlots(level:Level,count:number):readonly Point[]{
 const source=level.cannons.find(c=>c.id===level.startId)!;
 const b=level.bounds,anchors=[...level.cannons.map(c=>c.position),level.exit,...(level.gems??[]).map(g=>g.position)];
 const candidates:{point:Point;cost:number}[]=[];
 for(const o of level.obstacles){
  const r=o.bounds,y=r.maxY+.23;
  if(y-radius<b.minY-1e-9||y+.34+lift>b.maxY)continue;
  const lo=Math.max(b.minX+radius,r.minX+.12),hi=Math.min(b.maxX-radius,r.maxX-.12);
  if(hi<lo)continue;
  // Include the centre of a narrow perch as well as regularly spaced
  // candidates on long surfaces. Sorting favours the start's rear side.
  const xs=new Set([lo,hi,(lo+hi)/2]);
  for(let x=lo;x<hi;x+=.19)xs.add(x);
  for(const x of xs){
   const p={x,y},top={x,y:y+lift};
   if(level.obstacles.some(other=>other!==o&&segmentRectangleDistance(p,top,other.bounds)<radius))continue;
   if(anchors.some(a=>Math.hypot(a.x-x,a.y-y)<.82||Math.hypot(a.x-x,a.y-y-lift)<.82))continue;
   // Also avoid the cannon bodies and labels, not merely their centres.
   if(level.cannons.some(c=>Math.abs(x-(c.position.x-.36*c.direction))<.66&&Math.abs(y-c.position.y)<.72))continue;
   const forward=(x-source.position.x)*source.direction;
   const cost=Math.hypot(x-source.position.x,y-source.position.y)+Math.max(0,forward)*.45;
   candidates.push({point:p,cost});
  }
 }
 candidates.sort((a,b)=>a.cost-b.cost||a.point.x-b.point.x||a.point.y-b.point.y);
 const selected:Point[]=[];
 for(const {point} of candidates){
  if(selected.every(p=>Math.hypot(p.x-point.x,p.y-point.y)>=spacing-1e-9))selected.push(point);
  if(selected.length>=count)break;
 }
 // An unusually crowded future level may have no room for all characters.
 // Never add a false platform or cover an anchor just to fill the queue.
 return selected;
}
export function waitingIndices(total:number,waiting:number,slots:number):readonly number[]{
 const n=Math.max(0,Math.min(total,Math.floor(waiting))),first=total-n;
 return Array.from({length:Math.min(total,slots)},(_,i)=>i).filter(i=>i>=first);
}
export function departingIndex(total:number,waitingAfterDispatch:number):number{
 return Math.max(0,Math.min(total-1,total-waitingAfterDispatch-1));
}
// A pre-fire boarding hop, if the waiting position is close enough to the
// local loading point and the hop corridor is free. It is purely decorative;
// all mathematical motion still starts at the marked muzzle on FIRE_MS.
export function canBoardFrom(level:Level,from:Point,to:Point):boolean{
 if(Math.hypot(to.x-from.x,to.y-from.y)>2.4)return false;
 const b=level.bounds,peak={x:(from.x+to.x)/2,y:Math.max(from.y,to.y)+.20};
 if(peak.y>b.maxY-.20||to.x<b.minX||to.x>b.maxX||to.y<b.minY||to.y>b.maxY)return false;
 return level.obstacles.every(o=>segmentRectangleDistance(from,peak,o.bounds)>=.19&&segmentRectangleDistance(peak,to,o.bounds)>=.19);
}
export function boardingPoint(from:Point,to:Point,progress:number):Point{
 const t=Math.max(0,Math.min(1,progress)),peak={x:(from.x+to.x)/2,y:Math.max(from.y,to.y)+.20};
 const k=t<.5?2*t:2*t-1,a=t<.5?from:peak,b=t<.5?peak:to;
 // Piecewise linear centreline with eased velocity. This matches the
 // clearance-checked corridor exactly (unlike an unchecked Bezier arc).
 const s=k*k*(3-2*k);
 return {x:a.x+(b.x-a.x)*s,y:a.y+(b.y-a.y)*s};
}
