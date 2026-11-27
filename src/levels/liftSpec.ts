import type {Bounds} from '../engine/coordinates';
import {anchorFlightEquation,equationCoefficients,parseFlightEquation,type FlightEquation} from '../engine/equations/linear';
import type {Cannon} from './schema';

// The position on Cannon is the current mathematical muzzle anchor. Only its
// y coordinate can change; the rail, family, x and direction stay fixed.
// The expression contains the nonconstant global-x terms only.
export interface LiftSpec {
 readonly minY:number;
 readonly maxY:number;
 readonly lockedShape:string;
}
function liftShape(c:Cannon):FlightEquation{
 if(!c.lift||c.type!=='linear'&&c.type!=='quadratic')throw new Error('Lift requires a linear or quadratic cannon: '+c.id);
 const shape=parseFlightEquation(c.lift.lockedShape,c.type);
 const coefficients=equationCoefficients(shape);
 if(coefficients[coefficients.length-1].numerator!=='0')throw new Error('Locked lift shape must have zero constant: '+c.id);
 return shape;
}
export function validateLiftSpec(c:Cannon,bounds:Bounds):void{
 const spec=c.lift;
 if(!spec||typeof spec.lockedShape!=='string'||
  ![spec.minY,spec.maxY,c.position.y].every(Number.isSafeInteger)||
  spec.minY>=spec.maxY||spec.minY<bounds.minY||spec.maxY>bounds.maxY||
  c.position.y<spec.minY||c.position.y>spec.maxY)throw new Error('Invalid lift range: '+c.id);
 const shape=liftShape(c);
 // Reject unsupported precision before the level can be played, at either end.
 anchorFlightEquation(shape,c.position.x,spec.minY);
 anchorFlightEquation(shape,c.position.x,spec.maxY);
 anchorFlightEquation(shape,c.position.x,c.position.y);
}
export function lockedLiftEquation(c:Cannon):FlightEquation{
 return anchorFlightEquation(liftShape(c),c.position.x,c.position.y);
}
export function lockedLiftText(e:FlightEquation):string{
 const terms=equationCoefficients(e);
 const parts:string[]=[];
 for(const [i,r] of terms.entries()){
  const n=BigInt(r.numerator),power=terms.length-1-i;
  if(n===0n)continue;
  const magnitude=n<0n?-n:n,unit=magnitude===1n&&r.denominator==='1'&&power>0;
  const value=unit?'':String(magnitude)+(r.denominator==='1'?'':'/'+r.denominator);
  const term=value+(power===2?'x^2':power===1?'x':'');
  parts.push((parts.length?n<0n?' - ':' + ':n<0n?'-':'')+term);
 }
 return 'y = '+(parts.join('')||'0');
}
