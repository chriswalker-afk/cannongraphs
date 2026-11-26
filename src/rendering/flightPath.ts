import type {Point} from '../engine/coordinates';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
// Quadratic Bezier control point exactly represents a quadratic graph under
// the affine camera transform, including reverse-direction partial traces.
export function flightPath(leg:AttemptResult,from:Point,to:Point,project:(p:Point)=>Point):string{
 const a=project(from),b=project(to),start='M'+a.x+' '+a.y;
 if(!leg.curveControl)return start+' L'+b.x+' '+b.y;
 const c=project(leg.curveControl(from,to));return start+' Q'+c.x+' '+c.y+' '+b.x+' '+b.y;
}
