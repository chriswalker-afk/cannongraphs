import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateLevel,type Level} from '../src/levels/schema';
import {lockedLiftEquation,lockedLiftText} from '../src/levels/liftSpec';
import {evaluateEquation,parseLinearEquation,parseQuadraticEquation,isQuadratic} from '../src/engine/equations/linear';
import {cannonEquationKey} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {createLevelFlightPlan,editPlan,getPlanEntry,snapshotPlan,recordFlightEvidence,planStatus} from '../src/game/flightPlan';
import {moveLiftInPlanning,repositionLift} from '../src/game/movableCannons';
import {createLevelState,beginAttempt,finishAttempt} from '../src/game/levelState';

const fixture=():Level=>({id:'lift-test',world:1,title:'Lift test',objective:'Move B',bounds:{minX:0,maxX:10,minY:0,maxY:9},creatures:5,startId:'A',
 cannons:[{id:'A',type:'linear',position:{x:1,y:2},direction:1},
 {id:'B',type:'linear',position:{x:4,y:2},direction:1,lift:{minY:1,maxY:7,lockedShape:'-x'}}],
 exit:{x:8,y:1},obstacles:[{id:'wall',kind:'wall',bounds:{minX:5.6,maxX:6.4,minY:0,maxY:1.65}}]});
const first=new Map([['A',parseLinearEquation('x+1')]]);
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
test('integer rail clamps and snaps without altering x, shape, direction or authored level',()=>{
 const l=fixture();validateLevel(l);
 const raised=repositionLift(l,'B',4.6),b=raised.cannons[1];
 assert.deepEqual(b.position,{x:4,y:5});assert.equal(b.lift,l.cannons[1].lift);assert.equal(b.direction,1);
 assert.equal(l.cannons[1].position.y,2);assert.equal(repositionLift(raised,'B',5.1),raised);
 assert.equal(repositionLift(l,'B',100).cannons[1].position.y,7);
 assert.equal(repositionLift(l,'B',-5).cannons[1].position.y,1);
 assert.throws(()=>repositionLift(l,'A',5),/Not a movable/);
 assert.throws(()=>repositionLift(l,'B',NaN),/Invalid lift destination/);
 const a=lockedLiftEquation(l.cannons[1]),z=lockedLiftEquation(b);
 assert.equal(lockedLiftText(z),'y = -x + 9');
 for(const x of [0,4,8])near(evaluateEquation(z,x)-evaluateEquation(a,x),3);
});
test('the real engine misses the low lift and captures the raised lift; locked shape cannot be overridden',()=>{
 const l=fixture(),bad=simulateRoute(l,first);
 assert.notEqual(bad.event.kind,'exit');assert.equal(bad.legs.length,1);
 const moved=repositionLift(l,'B',5),good=simulateRoute(moved,first);
 assert.equal(good.event.kind,'exit');assert.deepEqual(good.legs.map(x=>x.cannonId),['A','B']);
 assert.deepEqual(good.legs[0].end,{x:4,y:5});near(good.end.y,1);
 assert.throws(()=>simulateRoute(moved,new Map([...first,['B',parseLinearEquation('5')]])),/Locked lift equation/);
 assert.throws(()=>simulateRoute(moved,new Map()),/Program every/);
 assert.equal(simulateRoute(moved,new Map([...first,['B',parseLinearEquation('9-x')]])).event.kind,'exit');
});
test('quadratic lift preserves both nonconstant coefficients and clears a wall in a mixed relay',()=>{
 const l=fixture();l.cannons[0]={...l.cannons[0],position:{x:0,y:1}};
 l.cannons[1]={...l.cannons[1],type:'quadratic',position:{x:4,y:6},lift:{minY:1,maxY:7,lockedShape:'-x^2/2+6x'}};
 l.exit={x:8,y:3};l.obstacles[0]={...l.obstacles[0],bounds:{minX:5.6,maxX:6.4,minY:0,maxY:4.2}};
 const moved=repositionLift(l,'B',3),a=lockedLiftEquation(l.cannons[1]),z=lockedLiftEquation(moved.cannons[1]);
 assert.ok(isQuadratic(a)&&isQuadratic(z));assert.deepEqual(z.exactQuadratic,a.exactQuadratic);assert.deepEqual(z.exactLinear,a.exactLinear);
 assert.equal(z.constant,-13);assert.equal(cannonEquationKey(parseQuadraticEquation(lockedLiftText(z))),cannonEquationKey(z));
 for(const x of [0,4,6,8])near(evaluateEquation(z,x)-evaluateEquation(a,x),-3);
 const result=simulateRoute(moved,new Map([['A',parseLinearEquation('x/2+1')]]));
 assert.equal(result.event.kind,'exit');assert.deepEqual(result.legs.map(x=>x.cannonId),['A','B']);near(result.end.y,3);
});
test('fractional x coordinates and coefficients retain exact intercepts, including horizontal lines',()=>{
 const c={...fixture().cannons[1],position:{x:2.5,y:3},lift:{minY:1,maxY:7,lockedShape:'x/3'}};
 const e=lockedLiftEquation(c);
 assert.ok(!isQuadratic(e));assert.deepEqual(e.exactIntercept,{numerator:'13',denominator:'6'});
 near(evaluateEquation(e,2.5),3);
 assert.equal(lockedLiftText(lockedLiftEquation({...c,lift:{...c.lift,lockedShape:'0'}})),'y = 3');
});
test('validation rejects bad rails, invalid family or shape, and obstructed or duplicate anchors',()=>{
 const l=fixture(),b=l.cannons[1];
 for(const lift of [{minY:1,maxY:10,lockedShape:'x'},{minY:3,maxY:7,lockedShape:'x'},{minY:1.5,maxY:7,lockedShape:'x'},{minY:1,maxY:7,lockedShape:'x+1'},{minY:1,maxY:7,lockedShape:'x^2'}]){
  assert.throws(()=>validateLevel({...l,cannons:[l.cannons[0],{...b,lift}]}));
 }
 assert.throws(()=>validateLevel({...l,cannons:[l.cannons[0],{...b,type:'cubic'}]}),/Lift requires/);
 assert.throws(()=>repositionLift({...l,exit:{x:4,y:5}},'B',5),/Invalid cannon/);
 assert.throws(()=>repositionLift({...l,obstacles:[{id:'block',kind:'wall',bounds:{minX:3.9,maxX:4.1,minY:4.5,maxY:5.5}}]},'B',5),/overlaps terrain/);
});
test('level-aware plans protect locked entries, preserve drafts, and clear all evidence on movement',()=>{
 const l=fixture(),state=createLevelState(5);
 let p=createLevelFlightPlan(l);
 assert.deepEqual(p.map(planStatus),['empty','ready']);assert.equal(snapshotPlan(p),null);
 assert.equal(editPlan(p,'B',{text:'x',equation:parseLinearEquation('x')}),p);
 p=editPlan(p,'A',{text:'x+1',equation:parseLinearEquation('x+1')});
 const moved=moveLiftInPlanning(l,p,state,'B',5);
 assert.equal(getPlanEntry(moved.plan,'A'),getPlanEntry(p,'A'));
 assert.equal(getPlanEntry(moved.plan,'B')!.text,'y = -x + 9');
 const result=simulateRoute(moved.level,snapshotPlan(moved.plan)!);
 const evidence=recordFlightEvidence(moved.plan,moved.plan,result);
 assert.deepEqual(evidence.map(planStatus),['tested','tested']);
 const changed=moveLiftInPlanning(moved.level,evidence,state,'B',4);
 assert.deepEqual(changed.plan.map(planStatus),['ready','ready']);
 assert.equal(getPlanEntry(changed.plan,'A')!.text,'x+1');
 const flying=beginAttempt(state,result),celebrating=finishAttempt(flying,flying.active!.id);
 for(const phase of [flying,celebrating]){
  const refused=moveLiftInPlanning(moved.level,evidence,phase,'B',3);
  assert.equal(refused.level,moved.level);assert.equal(refused.plan,evidence);
 }
 assert.equal(simulateRoute(moved.level,snapshotPlan(moved.plan)!).event.kind,'exit');
});
