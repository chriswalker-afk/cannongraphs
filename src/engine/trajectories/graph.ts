import type {Point} from '../coordinates';
import type {AdvancedEquation} from '../equations/advanced';
export interface GraphSegment {
 readonly x0:number;readonly x1:number;
 readonly knots:readonly number[];
 pointAt(t:number):Point;
}
export function graphSegment(e:AdvancedEquation,x0:number,x1:number):GraphSegment{
 const dx=x1-x0;
 const knots=dx===0?[0,1]:[0,...e.criticalXs(x0,x1).map(x=>(x-x0)/dx).filter(t=>t>0&&t<1).sort((a,b)=>a-b),1];
 return {x0,x1,knots,pointAt(t){const x=t===0?x0:t===1?x1:x0+dx*t;return {x,y:e.valueAt(x)};}};
}
export function graphLength(s:GraphSegment):number{
 let sum=0,last=s.pointAt(0);
 for(let i=1;i<s.knots.length;i++)for(let j=1;j<=12;j++){
  const p=s.pointAt(s.knots[i-1]+(s.knots[i]-s.knots[i-1])*j/12);sum+=Math.hypot(p.x-last.x,p.y-last.y);last=p;
 }
 return sum;
}
