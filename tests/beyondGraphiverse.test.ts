import {test} from 'node:test';
import {referenceSolutions} from './fixtures/referenceSolutions';
import assert from 'node:assert/strict';
import {beyondGraphiverse} from '../src/levels/worlds/beyondGraphiverse';
import {worlds,levels,nextLevel,levelPosition,worldForLevel} from '../src/levels/catalog';
import {cannonTypes} from '../src/game/cannons';
import type {Level} from '../src/levels/schema';
import {parseCannonEquation,isAdvanced,evaluateCannonEquation,type CannonEquation,type AdvancedEquation} from '../src/engine/equations/advanced';
import {auditSolution} from '../src/levels/qa';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {simulateAdvancedAttempt} from '../src/engine/simulation/advancedAttempt';
import {CAPTURE_EPSILON} from '../src/engine/simulation/linearAttempt';
import {bankedGems} from '../src/animations/gemTimeline';
import {makeRapidSchedule,sampleRapidFire,rapidCounts} from '../src/animations/rapidFire';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {levelStars} from '../src/game/scoring';
const refs=referenceSolutions[5];
const plan=(i:number)=>new Map<string,CannonEquation>(beyondGraphiverse[i].cannons.map(c=>[c.id,parseCannonEquation(refs[i][c.id],c.type)]));
const near=(a:number,b:number,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,a+' != '+b);
const advanced=(i:number,id='A')=>{const e=plan(i).get(id)!;assert.ok(isAdvanced(e));return e;};
test('six complete worlds expose all 72 levels, with no remaining playable preview or finale wraparound',()=>{
 assert.equal(worlds.length,6);assert.equal(levels.length,72);
 assert.ok(worlds.every(w=>w.levels.length===12&&!w.name.includes('preview')));
 assert.equal(new Set(levels.map(l=>l.id)).size,72);
 assert.equal(worlds[5].name,'Beyond the Graphiverse');assert.equal(nextLevel(worlds[4].levels.at(-1)!.id),beyondGraphiverse[0]);
 assert.equal(new Set(beyondGraphiverse.map(l=>l.id)).size,12);
 assert.deepEqual(beyondGraphiverse.map(l=>l.cannons.length),[1,1,1,2,2,2,3,3,3,4,4,4]);
 for(const [i,l] of beyondGraphiverse.entries()){
  assert.equal(l.creatures,5);assert.equal(worldForLevel(l.id),worlds[5]);assert.deepEqual(levelPosition(l.id),{index:i+1,total:12});
  assert.equal(nextLevel(l.id),beyondGraphiverse[i+1]);
 }
 assert.deepEqual(new Set(beyondGraphiverse.slice(9).flatMap(l=>l.cannons.map(c=>c.type))),new Set(Object.keys(cannonTypes)));
});
test('curriculum covers growth, decay, reflected natural exponential, both log bases and all three trig functions',()=>{
 assert.deepEqual(beyondGraphiverse.slice(0,3).map(l=>l.cannons[0].type),['exponential','logarithmic','wave']);
 assert.ok(advanced(0).slopeAt(1)>0);assert.ok(advanced(3).slopeAt(1)<0);assert.ok(advanced(6,'C').slopeAt(1)<0);
 near(advanced(1).valueAt(.1),-1);near(advanced(4,'B').valueAt(1+Math.E),2);
 assert.deepEqual([advanced(2).primitive,advanced(5,'B').primitive,advanced(7,'C').primitive,advanced(10,'D').primitive],['sin','cos','sin','tan']);
 assert.ok(beyondGraphiverse[5].cannons.every(c=>c.direction===-1));assert.ok(beyondGraphiverse[7].cannons.every(c=>c.direction===-1));
});
test('irrational coordinates are exact in authored data and explicitly identified in the objectives',()=>{
 const natural=beyondGraphiverse[6],log=beyondGraphiverse[4];
 near(natural.exit.x,1+Math.log(4),1e-12);near(natural.gems!.at(-1)!.position.x,1+Math.log(2),1e-12);
 near(log.exit.x,1+Math.E**2,1e-12);near(log.gems!.at(-1)!.position.x,1+Math.E,1e-12);
 assert.match(natural.objective,/1\+ln\(4\)/);assert.match(log.objective,/1\+e²/);
});
for(const [i,l] of beyondGraphiverse.entries())test(l.id+' '+l.title+' has an audited continuous route and all optional gems',()=>{
 const audit=auditSolution(l,refs[i],l.cannons.map(c=>c.id));
 assert.equal(audit.result.event.kind,'exit');near(audit.result.end.x,l.exit.x);near(audit.result.end.y,l.exit.y);
 assert.ok(audit.minimumClearance>.025,l.id+' clearance '+audit.minimumClearance);
 assert.equal(bankedGems(audit.result).length,l.gems!.length);
 const equations=plan(i);
 for(const leg of audit.result.legs){
  const e=equations.get(leg.cannonId)!;
  for(const t of [0,.1,.3,.5,.8,1]){const p=leg.pointAt(t);near(p.y,evaluateCannonEquation(e,p.x));}
 }
});
test('reflected logarithm and phase-shifted sine travel leftward on their actual graph',()=>{
 for(const [i,k] of [[5,0],[7,2]] as const){
  const r=simulateRoute(beyondGraphiverse[i],plan(i)),leg=r.legs[k],e=advanced(i,leg.cannonId);
  assert.equal(r.event.kind,'exit');assert.equal(leg.direction,-1);assert.ok(leg.pointAt(.2).x>leg.pointAt(.8).x);
  near(leg.pointAt(.5).y,e.valueAt(leg.pointAt(.5).x));
 }
 const e=advanced(5);near(e.domainEdge(3.9,1)!.x,4);assert.equal(e.domainEdge(3.9,-1),undefined);
});
test('a tangent equation matching both anchors on different branches cannot complete the tunnel',()=>{
 const l=beyondGraphiverse[10],e=parseCannonEquation('4-2tan(5pi*(x-12)/4)','wave') as AdvancedEquation;
 near(e.valueAt(11),6);near(e.valueAt(13),2);
 const r=simulateAdvancedAttempt(e,l.cannons[3],l);
 assert.notEqual(r.event.kind,'exit');assert.ok(r.end.x<11.7);
});
test('equivalent bases and phases are accepted without a stored-answer comparison',()=>{
 const l=beyondGraphiverse[3],equivalent=parseCannonEquation('2^(3-x)','exponential');
 const decayPlan=plan(3);decayPlan.set('A',equivalent);assert.equal(simulateRoute(l,decayPlan).event.kind,'exit');
 const w=beyondGraphiverse[5],alternative=parseCannonEquation('3sin(pi*(x+6)/3+pi/2)-1','wave');
 const wavePlan=plan(5);wavePlan.set('B',alternative);assert.equal(simulateRoute(w,wavePlan).event.kind,'exit');
});
test('four-family finale rapid fire preserves each leg, banks gems once and awards creature-based stars',()=>{
 const l=beyondGraphiverse[11],equations=plan(11),r=simulateRoute(l,equations),schedule=makeRapidSchedule(r,4);
 assert.equal(r.event.kind,'exit');assert.equal(r.legs.length,4);assert.equal(bankedGems(r).length,l.gems!.length);
 for(const [i,timing] of schedule.legs.entries()){
  const frame=sampleRapidFire(schedule.lead+timing.offset+timing.load+30,r,schedule);
  const pip=frame.pips.find(p=>p.index===0&&p.legIndex===i&&p.phase==='flying')!;assert.ok(pip);
  near(pip.point.y,evaluateCannonEquation(equations.get(r.legs[i].cannonId)!,pip.point.x));assert.equal(frame.arrived,0);
 }
 let s=beginAttempt(createLevelState(5),r);s=finishAttempt(s,s.active!.id);
 const id=s.celebration!.id,counts=rapidCounts(schedule.duration,schedule);s=advanceCelebration(s,id,counts.dispatched,counts.arrived);s=finishCelebration(s,id);
 assert.equal(s.saved,5);assert.equal(levelStars(s),3);assert.equal(bankedGems(s.lastResult).length,l.gems!.length);
});
