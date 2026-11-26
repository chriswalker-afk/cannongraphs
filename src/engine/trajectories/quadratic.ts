import type {Point} from '../coordinates';
import {evaluateQuadratic,type QuadraticEquation} from '../equations/linear';
import {polynomialValue} from '../collisions/polynomialRoots';
export interface QuadraticSegment {
 readonly x0:number;readonly dx:number;
 // y(t) = y[0]+y[1]t+y[2]t², x(t) = x0+dx*t.
 readonly y:readonly [number,number,number];
 pointAt(t:number):Point;
}
export function quadraticSegment(e:QuadraticEquation,x0:number,x1:number):QuadraticSegment{
 const dx=x1-x0,y=[evaluateQuadratic(e,x0),(2*e.quadratic*x0+e.linear)*dx,e.quadratic*dx*dx] as const;
 if(![x0,dx,...y].every(Number.isFinite))throw new RangeError('Non-finite quadratic segment');
 return {x0,dx,y,pointAt(t){return {x:x0+dx*t,y:polynomialValue(y,t)};}};
}
export function restrictSegment(s:QuadraticSegment,lo:number,hi:number):QuadraticSegment{
 const dx=s.dx*(hi-lo),x0=s.x0+s.dx*lo,d=hi-lo;
 const y=[polynomialValue(s.y,lo),(s.y[1]+2*s.y[2]*lo)*d,s.y[2]*d*d] as const;
 return {x0,dx,y,pointAt(t){return {x:x0+dx*t,y:polynomialValue(y,t)};}};
}
// Arc length is used for animation timing only. The actual path, capture and
// collision are independent of this bounded quadrature.
export function approximateLength(s:QuadraticSegment):number{
 let length=0,last=s.pointAt(0);
 for(let i=1;i<=64;i++){const p=s.pointAt(i/64);length+=Math.hypot(p.x-last.x,p.y-last.y);last=p;}
 return length;
}
