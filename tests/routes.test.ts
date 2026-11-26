import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {simulateLinearAttempt} from '../src/engine/simulation/linearAttempt';
import {simulateLinearRoute,routeLegs} from '../src/engine/simulation/linearRoute';
import {meadowPreview,meadowRelay} from '../src/levels/worlds/meadow';
import {validateLevel,type Level} from '../src/levels/schema';
import {attemptFeedback} from '../src/game/attemptFeedback';
import {attemptDuration,flightDuration} from '../src/animations/attempt';
import {routeDuration,sampleRouteAttempt} from '../src/animations/routeAttempt';
import {FIRE_MS} from '../src/animations/launch';
import {makeRapidSchedule,rapidCounts,sampleRapidFire} from '../src/animations/rapidFire';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration,activeCount} from '../src/game/levelState';
import {levelStars} from '../src/game/scoring';
const plan=(a:string,b:string)=>new Map([['A',parseLinearEquation(a)],['B',parseLinearEquation(b)]]);
const good=()=>simulateLinearRoute(meadowRelay,plan('x','8-3x/5'));
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
test('original single-cannon level still works and the relay requires both cannons',()=>{
 const original=simulateLinearRoute(meadowPreview,new Map([['A',parseLinearEquation('x')]]));
 assert.equal(original.event.kind,'exit');assert.equal(original.legs.length,1);
 const r=good();assert.equal(r.event.kind,'exit');assert.deepEqual(r.legs.map(l=>l.cannonId),['A','B']);assert.deepEqual(r.legs[0].event,{kind:'cannon',cannonId:'B'});
 assert.deepEqual(r.legs[0].end,{x:5,y:5});assert.deepEqual(r.legs[1].start,{x:5,y:5});assert.deepEqual(r.end,{x:10,y:2});
 near(r.pointAt(r.legs[0].length/r.length).y,5);
 const direct=simulateLinearRoute(meadowRelay,plan('(x+8)/9','8-3x/5'));assert.equal(direct.event.kind,'obstacle');assert.equal(direct.legs.length,1);
});
test('closest forward capture wins irrespective of order; terrain wins a capture tie',()=>{
 const base:Level={...meadowRelay,obstacles:[],exit:{x:10,y:1},cannons:[
  {...meadowRelay.cannons[0],position:{x:1,y:1}},
  {...meadowRelay.cannons[1],position:{x:7,y:1}},
  {...meadowRelay.cannons[1],id:'C',position:{x:3,y:1}}
 ]};
 const line=parseLinearEquation('1');
 assert.deepEqual(simulateLinearAttempt(line,base.cannons[0],base).event,{kind:'cannon',cannonId:'C'});
 const blocked:Level={...base,obstacles:[{id:'wall',kind:'wall',bounds:{minX:3.2,maxX:4,minY:0,maxY:2}}]};
 assert.equal(simulateLinearAttempt(line,blocked.cannons[0],blocked).event.kind,'obstacle');
 const reverse={...base.cannons[1],direction:-1 as const};
 assert.deepEqual(simulateLinearAttempt(line,reverse,base).event,{kind:'cannon',cannonId:'C'});
});
test('a near miss does not trigger an intermediate cannon and missing plans are not attempts',()=>{
 const l={...meadowRelay,obstacles:[]};
 assert.notEqual(simulateLinearAttempt(parseLinearEquation('1.0001x-.0001'),l.cannons[0],l).event.kind,'cannon');
 assert.throws(()=>simulateLinearRoute(l,new Map([['A',parseLinearEquation('x')]])),/Program every/);
 assert.throws(()=>validateLevel({...l,cannons:[...l.cannons,{...l.cannons[0],id:'C'}]}));
});
test('downstream misfire is local to B and consumes only one Pip',()=>{
 const r=simulateLinearRoute(meadowRelay,plan('x','x+1'));assert.equal(r.event.kind,'misfire');assert.equal(r.terminalCannonId,'B');assert.equal(r.legs.length,2);
 assert.match(attemptFeedback(r),/Cannon B.*Misfire/);
 const t=attemptDuration(r.legs[0])+FIRE_MS+100,f=sampleRouteAttempt(t,r,meadowRelay);
 assert.equal(f.leg.cannonId,'B');assert.equal(f.frame.pose,'rolling');assert.equal(f.frame.trace,null);assert.equal(f.completed.length,1);
 let s=beginAttempt(createLevelState(5),r);s=finishAttempt(s,s.active!.id);assert.equal(s.failed,1);assert.equal(s.waiting,4);assert.equal(s.phase,'retry');
});
test('a repeated cannon is a bounded failed route, not an endless animation',()=>{
 const loop:Level={...meadowRelay,obstacles:[],exit:{x:10,y:6},cannons:[{...meadowRelay.cannons[0],position:{x:1,y:2}},{...meadowRelay.cannons[1],position:{x:5,y:2},direction:-1}]};
 const r=simulateLinearRoute(loop,plan('2','2'));assert.deepEqual(r.event,{kind:'loop',cannonId:'A'});assert.equal(r.legs.length,2);assert.match(attemptFeedback(r),/Loop/);
 let s=beginAttempt(createLevelState(5),r);s=finishAttempt(s,s.active!.id);assert.equal(s.failed,1);assert.equal(s.celebration,null);
});
test('normal relay timeline enters B before firing its independent equation',()=>{
 const r=good(),a=r.legs[0],b=r.legs[1],at=FIRE_MS+flightDuration(a);
 const capture=sampleRouteAttempt(at,r,meadowRelay);assert.equal(capture.leg.cannonId,'A');assert.equal(capture.frame.pose,'excited');assert.deepEqual(capture.frame.pip,a.end);
 const next=sampleRouteAttempt(attemptDuration(a)+FIRE_MS+flightDuration(b)/2,r,meadowRelay);
 assert.equal(next.leg.cannonId,'B');assert.equal(next.completed.length,1);near(next.frame.pip!.y,8-3*next.frame.pip!.x/5);
 assert.equal(routeDuration(r),attemptDuration(a)+attemptDuration(b));assert.equal(routeLegs(r).length,2);
});
test('rapid-fire pipeline uses both actual legs and only counts final exit arrivals',()=>{
 const r=good(),s=makeRapidSchedule(r,4),firstLegEnd=s.lead+s.legs[0].load+s.legs[0].flight;
 assert.equal(rapidCounts(firstLegEnd,s).arrived,0);
 const bStart=s.lead+s.legs[1].offset+s.legs[1].load;
 const f=sampleRapidFire(bStart+30,r,s);
 assert.ok(f.pips.some(p=>p.legIndex===1&&p.phase==='flying'));assert.ok(f.pips.some(p=>p.legIndex===0&&p.phase==='flying'));
 assert.ok(f.cannonCues[1].recoil>0);
 for(const p of f.pips.filter(p=>p.phase==='flying'))near(p.point.y,p.legIndex===0?p.point.x:8-3*p.point.x/5);
 const arrival=s.lead+s.load+s.flight;assert.equal(rapidCounts(arrival-1,s).arrived,0);assert.equal(rapidCounts(arrival,s).arrived,1);
 assert.deepEqual(rapidCounts(s.duration,s),{dispatched:4,arrived:4});
 let state=beginAttempt(createLevelState(5),r);state=finishAttempt(state,state.active!.id);
 const id=state.celebration!.id,counts=rapidCounts(firstLegEnd,s);state=advanceCelebration(state,id,counts.dispatched,counts.arrived);
 assert.equal(state.saved,1);assert.equal(state.waiting+state.saved+state.failed+activeCount(state),5);
 state=advanceCelebration(state,id,4,4);state=finishCelebration(state,id);assert.equal(levelStars(state),3);
});
test('reduced motion follows the same route and preserves exit counting',()=>{
 const r=good(),s=makeRapidSchedule(r,4,true),f=sampleRapidFire(s.lead+s.legs[1].offset+s.legs[1].load+30,r,s);
 assert.equal(f.arrived,0);assert.ok(f.pips.some(p=>p.legIndex===1));assert.ok(f.cannonCues.every(c=>c.recoil===0&&c.burst===null));assert.ok(f.pips.every(p=>p.trailStart===null));
 assert.equal(sampleRapidFire(s.duration,r,s).arrived,4);
});
