import type {Bounds,Point} from '../coordinates';
import {isAdvanced,evaluateCannonEquation,type CannonEquation} from '../equations/advanced';
import {isQuadratic} from '../equations/linear';
// A bounded visual graph of the submitted equation, NOT a route simulation
// or collision prediction. Separate strokes never bridge singular branches.
export function graphPreview(e:CannonEquation,b:Bounds):readonly (readonly Point[])[]{
 const lo=b.minX,hi=b.maxX;if(!(hi>lo))return [];
 const value=(x:number)=>{try{return evaluateCannonEquation(e,x);}catch{return NaN;}};
 const edges=[lo,hi];
 if(isAdvanced(e)){
  let cursor=lo;
  for(let i=0;i<4096;i++){
   const edge=e.domainEdge(cursor,1);
   if(!edge||edge.x>=hi||!(edge.x>cursor))break;
   edges.push(edge.x);
   cursor=edge.x+Math.max(1e-11,Math.abs(edge.x)*Number.EPSILON*16);
  }
  edges.push(...e.criticalXs(lo,hi));
 }else if(isQuadratic(e)){
  const x=-e.linear/(2*e.quadratic);if(x>lo&&x<hi)edges.push(x);
 }
 const knots=[...new Set(edges.filter(x=>Number.isFinite(x)&&x>=lo&&x<=hi))].sort((a,z)=>a-z),paths:Point[][]=[];
 const inside=(y:number)=>Number.isFinite(y)&&y>=b.minY&&y<=b.maxY;
 // Monotone intervals are clipped to the world before sampling; this also
 // prevents huge SVG coordinates when an exponential approaches overflow.
 function crossing(a:number,z:number,height:number,ascending:boolean){
  for(let i=0;i<64;i++){
   const m=a+(z-a)/2;if(m===a||m===z)break;
   const v=value(m);if(Number.isNaN(v))break;
   if((v<height)===ascending)a=m;else z=m;
  }
  return [a,z] as const;
 }
 for(let i=1;i<knots.length;i++){
  let a=knots[i-1],z=knots[i];if(!(z>a))continue;
  if(isAdvanced(e)){
   const mid=a+(z-a)/2;if(!e.definedAt(mid))continue;
   const inset=Math.min((z-a)/4,Math.max(1e-12,(z-a)*1e-10,Math.max(Math.abs(a),Math.abs(z))*Number.EPSILON*16));
   if(!e.definedAt(a))a+=inset;if(!e.definedAt(z))z-=inset;
  }
  const y0=value(a),y1=value(z);
  if(Number.isNaN(y0)||Number.isNaN(y1)||y0<b.minY&&y1<b.minY||y0>b.maxY&&y1>b.maxY)continue;
  const ascending=y1>=y0,from=a,to=z;
  if(!inside(y0))a=crossing(from,to,ascending?b.minY:b.maxY,ascending)[1];
  if(!inside(y1))z=crossing(from,to,ascending?b.maxY:b.minY,ascending)[0];
  if(z<a)continue;
  const n=Math.min(128,Math.max(4,Math.ceil(256*(z-a)/(hi-lo)))),path:Point[]=[];
  for(let j=0;j<=n;j++){
   const x=j===n?z:a+(z-a)*j/n,y=value(x);
   if(inside(y))path.push({x,y});
   else if(path.length){if(path.length>1)paths.push(path.splice(0));else path.length=0;}
  }
  if(path.length>1)paths.push(path);
 }
 return paths;
}
