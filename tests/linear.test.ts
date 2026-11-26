import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseLinearEquation,evaluateLinear,EquationError,type EquationErrorCode} from '../src/engine/equations/linear';
import {buildLinearFlight} from '../src/engine/trajectories/linear';
const line=(s:string,m:number,c:number)=>{const e=parseLinearEquation(s);assert.equal(e.gradient,m,s);assert.equal(e.intercept,c,s);};
const reject=(s:string,code:EquationErrorCode)=>assert.throws(()=>parseLinearEquation(s),(e:unknown)=>e instanceof EquationError&&e.code===code,s);
test('equivalent linear forms, signs, implicit multiplication and fractions',()=>{
 line('y=2x+3',2,3);line('3+2*x',2,3);line('2(x+1)+1',2,3);line('(4x+6)/2',2,3);line('y = −x + 2',-1,2);line('x/2-3/4',.5,-.75);line('1/2x',.5,0);line('2×(x−1)÷4',.5,-.5);line('y=4',0,4);line('0',0,0);line(' .5x + 2. ',.5,2);
});
test('exact polynomial simplification distinguishes nonlinear from equivalent linear expressions',()=>{
 line('(x+1)^2-x²',2,1);line('x³-x^3+x',1,0);line('0.1x+0.2x-0.3x+2',0,2);
 reject('x²+1','nonlinear');reject('x^3+2x','nonlinear');reject('x^(1/2)','nonlinear');
});
test('fraction coefficients remain exact and are evaluated numerically',()=>{const e=parseLinearEquation('y=2x/6-4/8');assert.deepEqual(e.exactGradient,{numerator:'1',denominator:'3'});assert.deepEqual(e.exactIntercept,{numerator:'-1',denominator:'2'});assert.equal(evaluateLinear(e,6),1.5);});
test('precedence, unary minus and exponentiation',()=>{line('-2^2+x',1,-4);line('(-2)^2+x',1,4);line('2^(-2)x',.25,0);line('2^2^2+x',1,16);line('2--x',1,2);});
test('reject undefined or unsafe inputs without executing text',()=>{
 for(const s of ['x/0','1/(x-1)','x/x','x^-1','0^0'])reject(s,'domain');
 for(const s of ['x=3','y=1=2','sin(x)','alert(1)','2 3','x+','(x+2','2**x','y=Infinity','y=NaN','x;window.close()'])reject(s,'syntax');
 reject('','empty');reject('y=','empty');reject('x^9','complexity');reject('1'.repeat(181),'complexity');
});
const bounds={minX:-2,maxX:12,minY:0,maxY:8};
test('flight uses actual equation, not a corrected or snapped path',()=>{
 const source={x:1,y:1},f=buildLinearFlight(parseLinearEquation('x+2'),source,1,bounds);
 assert.equal(f.passesLaunchPoint,false);assert.equal(f.startError,2);assert.deepEqual(f.start,{x:1,y:3});assert.deepEqual(f.end,{x:12,y:14});assert.deepEqual(f.pointAt(.5),{x:6.5,y:8.5});assert.throws(()=>f.pointAt(1.1));
});
test('valid flight includes horizontal, negative and reverse-direction paths',()=>{
 const f=buildLinearFlight(parseLinearEquation('x'),{x:1,y:1},1,bounds);assert.equal(f.passesLaunchPoint,true);assert.deepEqual(f.pointAt(5/11),{x:6,y:6});
 const horizontal=buildLinearFlight(parseLinearEquation('2'),{x:4,y:2},-1,bounds);assert.deepEqual(horizontal.end,{x:-2,y:2});
 const descending=buildLinearFlight(parseLinearEquation('3-x'),{x:1,y:2},1,bounds);assert.deepEqual(descending.end,{x:12,y:-9});
});
