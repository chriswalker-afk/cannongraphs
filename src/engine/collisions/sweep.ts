import type {Bounds,Point} from '../coordinates';
export const GEOMETRY_EPS=1e-9;
const dot=(a:Point,b:Point)=>a.x*b.x+a.y*b.y;
const sub=(a:Point,b:Point):Point=>({x:a.x-b.x,y:a.y-b.y});
export function along(p:Point,v:Point,d:number):Point{return {x:p.x+v.x*d,y:p.y+v.y*d};}
function rectangleEntry(p:Point,v:Point,b:Bounds,limit:number):number|null{
 let lo=0,hi=limit;
 for(const [s,d,min,max] of [[p.x,v.x,b.minX,b.maxX],[p.y,v.y,b.minY,b.maxY]]){
  if(d===0){if(s<min||s>max)return null;continue;}
  const a=(min-s)/d,z=(max-s)/d;lo=Math.max(lo,Math.min(a,z));hi=Math.min(hi,Math.max(a,z));
  if(lo>hi)return null;
 }
 return lo;
}
function circleEntry(p:Point,v:Point,c:Point,r:number,limit:number):number|null{
 const w=sub(c,p);
 if(Math.hypot(w.x,w.y)<=r)return 0;
 const projection=dot(w,v),perp=w.x*v.y-w.y*v.x,discriminant=r*r-perp*perp;
 if(discriminant< -1e-12)return null;
 const d=projection-Math.sqrt(Math.max(0,discriminant));
 return d>=0&&d<=limit?d:null;
}
export interface SweepHit {distance:number;center:Point;normal:Point}
// Exact swept disk versus an axis-aligned rectangle: two strips + four rounded corners.
// v is a unit vector and distance is in world units, not frame time.
export function sweepDiskRectangle(p:Point,v:Point,r:number,b:Bounds,limit:number):SweepHit|null{
 const candidates:(number|null)[]=[
  rectangleEntry(p,v,{minX:b.minX-r,maxX:b.maxX+r,minY:b.minY,maxY:b.maxY},limit),
  rectangleEntry(p,v,{minX:b.minX,maxX:b.maxX,minY:b.minY-r,maxY:b.maxY+r},limit)
 ];
 for(const x of [b.minX,b.maxX])for(const y of [b.minY,b.maxY])candidates.push(circleEntry(p,v,{x,y},r,limit));
 const hits=candidates.filter((d):d is number=>d!==null);
 if(!hits.length)return null;
 const distance=Math.min(...hits),center=along(p,v,distance);
 const closest={x:Math.max(b.minX,Math.min(b.maxX,center.x)),y:Math.max(b.minY,Math.min(b.maxY,center.y))};
 const delta=sub(center,closest),len=Math.hypot(delta.x,delta.y);
 const normal=len>GEOMETRY_EPS?{x:delta.x/len,y:delta.y/len}:{x:-v.x,y:-v.y};
 return {distance,center,normal};
}
