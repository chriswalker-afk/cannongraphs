import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseQuadraticEquation,parseLinearEquation,evaluateQuadratic,isQuadratic,EquationError,type FlightEquation} from '../src/engine/equations/linear';
import {quadraticSegment} from '../src/engine/trajectories/quadratic';
import {rootsInUnitInterval} from '../src/engine/collisions/polynomialRoots';
import {sweepQuadraticDisk,quadraticRectangleDistance} from '../src/engine/collisions/quadraticSweep';
import {simulateQuadraticAttempt} from '../src/engine/simulation/quadraticAttempt';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {quadraticPreview} from '../src/levels/worlds/quadraticPreview';
import {auditSolution} from '../src/levels/qa';
import {flightPath} from '../src/rendering/flightPath';
import {sampleAttempt,flightDuration} from '../src/animations/attempt';
import {FIRE_MS} from '../src/animations/launch';
import {makeRapidSchedule,sampleRapidFire,rapidCounts} from '../src/animations/rapidFire';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {levelStars} from '../src/game/scoring';
import {createFlightPlan,editPlan,snapshotPlan,recordFlightEvidence,planStatus} from '../src/game/flightPlan';
import {diagnoseFlight} from '../src/game/flightDiagnosis';
import type {Level} from '../src/levels/schema';
const near=(a:number,b:number,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,a+' != '+b);
const arch=parseQuadraticEquation('-(x-1)(x-7)/2+2'),line=parseLinearEquation('x/2-3/2');
const mixed=new Map<string,FlightEquation>([['A',arch],['B',line]]);
const c=quadraticPreview.cannons[0];
test('quadratic forms simplify to exact rational coefficients, including completed square and factorised forms',()=>{
 for(const text of ['-x²/2+4x-3/2','-(x-4)^2/2+13/2','-(x-1)(x-7)/2+2','x³-x^3-0.5x²+4x-1.5']){
  const e=parseQuadraticEquation(text);assert.deepEqual(e,arch);assert.ok(isQuadratic(e));near(evaluateQuadratic(e,4),6.5);
 }
 assert.deepEqual(arch.exactQuadratic,{numerator:'-1',denominator:'2'});
 assert.deepEqual(arch.exactConstant,{numerator:'-3',denominator:'2'});
});
test('strict family and domain checks reject degenerate, unsafe and nonpolynomial expressions',()=>{
 for(const text of ['x+2','x²-x²+1','x³','1/x','x^(-2)','sin(x)','x^9','x;alert(1)','x^2/0'])assert.throws(()=>parseQuadraticEquation(text),EquationError);
 assert.throws(()=>parseLinearEquation('x²'),EquationError);
 assert.equal(parseLinearEquation('(x+1)^2-x²').gradient,2);
});
test('root isolation finds crossings and repeated roots without fixed sampling',()=>{
 const roots=rootsInUnitInterval([.09,-.6,1]);assert.ok(roots.some(t=>Math.abs(t-.3)<1e-7));
 const two=rootsInUnitInterval([.16,-1,1]);assert.equal(two.length,2);near(two[0],.2);near(two[1],.8);
 assert.deepEqual(rootsInUnitInterval([1,0,1]),[]);
});
test('mixed preview succeeds with positive body clearance; flight is curved and capture is exact',()=>{
 const {result,minimumClearance}=auditSolution(quadraticPreview,{A:'-(x-4)^2/2+13/2',B:'x/2-3/2'},['A','B']);
 assert.equal(result.event.kind,'exit');assert.ok(minimumClearance>.025);
 const [a,b]=result.legs;assert.equal(a.event.kind,'cannon');near(a.end.x,7);near(a.end.y,2);near(b.start.x,7);near(b.start.y,2);
 for(let i=0;i<=20;i++){const p=a.pointAt(i/20);near(p.y,evaluateQuadratic(arch,p.x));}
 near(a.pointAt(.5).y,6.5);near(a.angle,Math.atan(3)*180/Math.PI);near(a.angleAt!(.5),0);
 assert.ok(a.angleAt!(1)<0);assert.ok(a.length>6);assert.throws(()=>a.pointAt(-1));
});
test('an arch clearing a wall is not rejected because its chord hits the wall',()=>{
 const r=simulateQuadraticAttempt(arch,c,quadraticPreview);
 assert.equal(r.event.kind,'cannon');assert.ok(r.curveControl);
 const shallow=simulateQuadraticAttempt(parseQuadraticEquation('-(x-4)^2/4+17/4'),c,quadraticPreview);
 assert.equal(shallow.event.kind,'obstacle');
 if(shallow.event.kind==='obstacle')assert.equal(shallow.event.obstacleId,'arch-wall');
});
test('continuous curve contact detects thin walls and exact solid precedence at a capture',()=>{
 const thin:Level={...quadraticPreview,obstacles:[{id:'thin',kind:'wall',bounds:{minX:4.01,maxX:4.01001,minY:0,maxY:9}}]};
 const r=simulateQuadraticAttempt(arch,c,thin);assert.equal(r.event.kind,'obstacle');near(r.end.x,3.81);near(r.end.y,evaluateQuadratic(arch,r.end.x));
 const tie:Level={...quadraticPreview,obstacles:[{id:'tie',kind:'wall',bounds:{minX:7.2,maxX:8,minY:0,maxY:9}}]};
 const contact=simulateQuadraticAttempt(arch,c,tie);assert.equal(contact.event.kind,'obstacle');near(contact.end.x,7,1e-6);
});
test('rounded-corner and horizontal-face tangencies are detected, but a nearby clear curve is not',()=>{
 const rect={minX:4,maxX:5,minY:1,maxY:2};
 const touch=quadraticSegment(parseQuadraticEquation('(x-3.88)^2+0.75(x-3.88)+2.16'),3.4,4.4);
 const corner=sweepQuadraticDisk(touch,.2,rect)!;assert.ok(corner);near(corner.center.x,3.88,2e-6);near(corner.center.y,2.16,2e-6);
 near(corner.normal.x,-.6,2e-5);near(corner.normal.y,.8,2e-5);
 near(quadraticRectangleDistance(touch,rect),.2);
 const clear=quadraticSegment(parseQuadraticEquation('(x-3.88)^2+0.75(x-3.88)+2.16001'),3.4,4.4);
 assert.equal(sweepQuadraticDisk(clear,.2,rect),null);
 const face=quadraticSegment(parseQuadraticEquation('(x-4.5)^2+2.2'),3,6);
 const h=sweepQuadraticDisk(face,.2,rect)!;assert.ok(h);near(h.center.x,4.5,2e-6);near(h.center.y,2.2);
});
test('first world boundary contact terminates the curve even if it would re-enter',()=>{
 const level:Level={...quadraticPreview,cannons:[{...c,position:{x:1,y:2}}],obstacles:[],exit:{x:7,y:2},bounds:{minX:0,maxX:13,minY:0,maxY:5}};
 const r=simulateQuadraticAttempt(arch,level.cannons[0],level);assert.equal(r.event.kind,'boundary');
 if(r.event.kind==='boundary')assert.equal(r.event.edge,'top');
 near(r.end.y,5);assert.ok(r.end.x<4);
 const tangent:Level={...level,bounds:{...level.bounds,maxY:6.5}};
 const t=simulateQuadraticAttempt(arch,tangent.cannons[0],tangent);assert.equal(t.event.kind,'boundary');near(t.end.x,4,1e-6);
});
test('reverse flight stays on the same parabola with correct tangent sign and exact exit',()=>{
 const reverse={...c,position:{x:7,y:2},direction:-1 as const};
 const l:Level={...quadraticPreview,cannons:[reverse],exit:{x:1,y:2}};
 const r=simulateQuadraticAttempt(arch,reverse,l);assert.equal(r.event.kind,'exit');near(r.end.x,1);near(r.end.y,2);
 assert.ok(r.pointAt(.2).x>r.pointAt(.8).x);near(r.pointAt(.5).y,6.5);near(r.angle,Math.atan(3)*180/Math.PI);
});
test('wrong family blocks launch; a valid source mismatch is one ordinary failed attempt',()=>{
 assert.throws(()=>simulateRoute(quadraticPreview,new Map([['A',line],['B',line]])),/Program every/);
 assert.throws(()=>simulateRoute(quadraticPreview,new Map([['A',arch]])),/Program every/);
 const equations=new Map<string,FlightEquation>([['A',parseQuadraticEquation('x²')],['B',line]]);
 const r=simulateRoute(quadraticPreview,equations);assert.equal(r.event.kind,'misfire');assert.deepEqual(r.end,c.position);
 const d=diagnoseFlight(quadraticPreview,r,equations)!;assert.equal(d.kind,'source');assert.match(d.prompts[2],/ax²/);assert.doesNotMatch(d.prompts[2],/mx/);
 const frame=sampleAttempt(FIRE_MS+200,r.legs[0]);assert.equal(frame.pose,'rolling');assert.equal(frame.trace,null);assert.equal(frame.burst,null);
 let s=beginAttempt(createLevelState(5),r);s=finishAttempt(s,s.active!.id);assert.equal(s.failed,1);assert.equal(s.waiting,4);
});
test('Bezier trace matches the actual graph and airborne pose uses the changing tangent',()=>{
 const r=simulateRoute(quadraticPreview,mixed),leg=r.legs[0],control=leg.curveControl!(leg.start,leg.end);
 const mid={x:(leg.start.x+2*control.x+leg.end.x)/4,y:(leg.start.y+2*control.y+leg.end.y)/4};
 near(mid.y,leg.pointAt(.5).y);near(mid.x,leg.pointAt(.5).x);
 assert.match(flightPath(leg,leg.start,leg.end,p=>p),/ Q/);
 assert.match(flightPath(r.legs[1],r.legs[1].start,r.legs[1].end,p=>p),/ L/);
 const f=sampleAttempt(FIRE_MS+flightDuration(leg)/2,leg);near(f.pip!.y,6.5);near(f.tilt,0);
 const early=sampleAttempt(FIRE_MS+flightDuration(leg)*.2,leg);assert.ok(early.tilt<0);
});
test('mixed rapid-fire follows each leg, counts only final arrival and preserves scores',()=>{
 const r=simulateRoute(quadraticPreview,mixed),schedule=makeRapidSchedule(r,4);
 const first=schedule.lead+schedule.load+schedule.legs[0].flight;assert.equal(rapidCounts(first,schedule).arrived,0);
 const frame=sampleRapidFire(schedule.lead+schedule.load+100,r,schedule);
 const pip=frame.pips.find(p=>p.phase==='flying')!;assert.ok(pip);near(pip.point.y,evaluateQuadratic(arch,pip.point.x));
 let s=beginAttempt(createLevelState(5),r);s=finishAttempt(s,s.active!.id);
 const id=s.celebration!.id,counts=rapidCounts(schedule.duration,schedule);s=advanceCelebration(s,id,counts.dispatched,counts.arrived);s=finishCelebration(s,id);
 assert.equal(s.saved,5);assert.equal(levelStars(s),3);
});
test('flight plan retains local evidence for mixed equations and clears it on editing',()=>{
 let p=createFlightPlan(['A','B']);p=editPlan(p,'A',{text:'arch',equation:arch});p=editPlan(p,'B',{text:'line',equation:line});
 const r=simulateRoute(quadraticPreview,snapshotPlan(p)!);p=recordFlightEvidence(p,p,r);assert.deepEqual(p.map(planStatus),['tested','tested']);
 p=editPlan(p,'A',{text:'arch',equation:parseQuadraticEquation('x²')});assert.deepEqual(p.map(planStatus),['ready','tested']);
});
test('curve collision feedback asks for turning point checks rather than constant slope',()=>{
 const e=new Map<string,FlightEquation>([['A',parseQuadraticEquation('-(x-4)^2/4+17/4')],['B',line]]);
 const r=simulateRoute(quadraticPreview,e),d=diagnoseFlight(quadraticPreview,r,e)!;assert.equal(d.kind,'collision');
 assert.match(d.prompts[2],/turning point/);assert.doesNotMatch(d.prompts[2],/mx/);
});
