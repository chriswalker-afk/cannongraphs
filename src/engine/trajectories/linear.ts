import type {Bounds,Point} from '../coordinates';
import {evaluateLinear,type LinearEquation} from '../equations/linear';
export interface LinearFlight {
 readonly source:Point;readonly start:Point;readonly end:Point;readonly startError:number;
 readonly passesLaunchPoint:boolean;pointAt(progress:number):Point;
}
// World units, not pixels. No destination or obstacle judgment until PR5.
export const SOURCE_EPSILON=1e-9;
export function buildLinearFlight(e:LinearEquation,source:Point,direction:1|-1,bounds:Bounds):LinearFlight{
 if(![source.x,source.y,bounds.minX,bounds.maxX,bounds.minY,bounds.maxY].every(Number.isFinite)||bounds.minX>=bounds.maxX||bounds.minY>=bounds.maxY||source.x<bounds.minX||source.x>bounds.maxX||source.y<bounds.minY||source.y>bounds.maxY||![1,-1].includes(direction))throw new RangeError('Invalid flight source or direction');
 const at=(x:number):Point=>({x,y:evaluateLinear(e,x)});
 const start=at(source.x),end=at(direction===1?bounds.maxX:bounds.minX);
 const startError=start.y-source.y;
 return {source:{...source},start,end,startError,passesLaunchPoint:Math.abs(startError)<=SOURCE_EPSILON,pointAt(progress:number){
  if(!Number.isFinite(progress)||progress<0||progress>1)throw new RangeError('Flight progress must be between 0 and 1.');
  return at(start.x+(end.x-start.x)*progress);
 }};
}
