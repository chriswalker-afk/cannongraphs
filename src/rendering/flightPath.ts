import type {Point} from '../engine/coordinates';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
// Quadratic Bezier control point exactly represents a quadratic graph under
// the affine camera transform, including reverse-direction partial traces.
export function flightPath(leg:AttemptResult,from:Point,to:Point,project:(p:Point)=>Point):string{
 const a=project(from),b=project(to),start='M'+a.x+' '+a.y;
 if(leg.graphSegment){
  const s=leg.graphSegment,dx=s.x1-s.x0;if(!dx)return start;
  const clamp=(t:number)=>Math.max(0,Math.min(1,t)),lo=clamp((from.x-s.x0)/dx),hi=clamp((to.x-s.x0)/dx);
  const knots=[lo,...s.knots.filter(t=>t>lo&&t<hi),hi];let path=start;
  // Adaptive visual approximation only. The engine never collides with these chords.
  function draw(l:number,h:number,p:Point,q:Point,depth:number){
   const mid=(l+h)/2,m=project(s.pointAt(mid));
   const dev=Math.hypot(m.x-(p.x+q.x)/2,m.y-(p.y+q.y)/2);
   if(depth<10&&(dev>.35||Math.hypot(q.x-p.x,q.y-p.y)>24)){draw(l,mid,p,m,depth+1);draw(mid,h,m,q,depth+1);}
   else path+=' L'+q.x+' '+q.y;
  }
  for(let i=1;i<knots.length;i++)draw(knots[i-1],knots[i],project(s.pointAt(knots[i-1])),project(s.pointAt(knots[i])),0);
  return path;
 }
 if(!leg.curveControl)return start+' L'+b.x+' '+b.y;
 const c=project(leg.curveControl(from,to));return start+' Q'+c.x+' '+c.y+' '+b.x+' '+b.y;
}
