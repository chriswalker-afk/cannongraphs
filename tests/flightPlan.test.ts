import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFlightPlan,editPlan,planStatus,countReady,snapshotPlan,recordFlightEvidence,clearEvidence,getPlanEntry,type FlightPlan} from '../src/game/flightPlan';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {simulateLinearRoute} from '../src/engine/simulation/linearRoute';
import {meadowRelay} from '../src/levels/worlds/meadow';
import type {Level} from '../src/levels/schema';
const entry=(plan:FlightPlan,id:string)=>getPlanEntry(plan,id)!;
const set=(plan:FlightPlan,id:string,text:string)=>editPlan(plan,id,{text,equation:parseLinearEquation(text)});
const statuses=(plan:FlightPlan)=>plan.map(planStatus);
const planAB=(a='x',b='8-3x/5')=>set(set(createFlightPlan(['A','B']),'A',a),'B',b);
const run=(p:FlightPlan,l:Level=meadowRelay)=>simulateLinearRoute(l,snapshotPlan(p)!);
test('all equations must be valid before launch; syntax state never implies flight success',()=>{
 let p=createFlightPlan(['A','B']);assert.deepEqual(statuses(p),['empty','empty']);assert.equal(snapshotPlan(p),null);
 p=set(p,'A','x+1');assert.equal(countReady(p),1);assert.equal(planStatus(entry(p,'A')),'ready');
 p=editPlan(p,'B',{text:'x^2',equation:null});assert.deepEqual(statuses(p),['ready','invalid']);assert.equal(snapshotPlan(p),null);
 p=editPlan(p,'B',{text:'y = ',equation:null});assert.equal(planStatus(entry(p,'B')),'empty');
 p=set(p,'B','8-3x/5');assert.equal(countReady(p),2);assert.equal(snapshotPlan(p)!.size,2);
 assert.equal(getPlanEntry(p,'C'),undefined);assert.throws(()=>createFlightPlan(['A','A']));
});
test('downstream misfire marks only the reached successful and failed legs',()=>{
 const p=planAB('x','x+1'),r=run(p);assert.equal(r.event.kind,'misfire');
 assert.deepEqual(statuses(p),['ready','ready']);
 const tested=recordFlightEvidence(p,p,r);assert.deepEqual(statuses(tested),['tested','revise']);
 assert.equal(countReady(tested),2);assert.ok(snapshotPlan(tested));
});
test('editing a cannon removes only its own evidence, retaining other tested equations',()=>{
 const p=planAB('x','x+1'),tested=recordFlightEvidence(p,p,run(p));
 const fixed=set(tested,'B','8-3x/5');assert.deepEqual(statuses(fixed),['tested','ready']);
 assert.deepEqual(statuses(tested),['tested','revise']);
 assert.equal(editPlan(fixed,'A',{text:'x',equation:parseLinearEquation('x')}),fixed);
 const equivalent=set(fixed,'A','1x');assert.deepEqual(statuses(equivalent),['ready','ready']);
});
test('an unreachable cannon remains untested and a prior tested leg may remain locally tested',()=>{
 const p=planAB('x+1'),r=run(p);assert.equal(r.legs.length,1);
 assert.deepEqual(statuses(recordFlightEvidence(p,p,r)),['revise','ready']);
 const good=planAB(),tested=recordFlightEvidence(good,good,run(good));
 const changed=set(tested,'A','x+1');
 assert.deepEqual(statuses(recordFlightEvidence(changed,changed,run(changed))),['revise','tested']);
});
test('stale results cannot certify a changed equation',()=>{
 const p=planAB(),r=run(p),edited=set(p,'B','x+1');
 assert.deepEqual(statuses(recordFlightEvidence(edited,p,r)),['tested','ready']);
 const bad=editPlan(p,'A',{text:'',equation:null});assert.deepEqual(statuses(recordFlightEvidence(bad,p,r)),['empty','tested']);
});
test('a loop is marked revise at the final firing cannon',()=>{
 const l:Level={...meadowRelay,obstacles:[],exit:{x:10,y:6},cannons:[{...meadowRelay.cannons[0],position:{x:1,y:2}},{...meadowRelay.cannons[1],position:{x:5,y:2},direction:-1}]};
 const p=planAB('2','2'),r=run(p,l);assert.equal(r.event.kind,'loop');
 assert.deepEqual(statuses(recordFlightEvidence(p,p,r)),['tested','revise']);
});
test('replay retains equations but clears evidence; fresh restart clears everything',()=>{
 const p=planAB(),done=recordFlightEvidence(p,p,run(p));assert.deepEqual(statuses(done),['tested','tested']);
 const replay=clearEvidence(done);assert.deepEqual(statuses(replay),['ready','ready']);
 assert.equal(entry(replay,'B').text,entry(p,'B').text);assert.equal(countReady(replay),2);
 assert.deepEqual(statuses(createFlightPlan(['A','B'])),['empty','empty']);
});
