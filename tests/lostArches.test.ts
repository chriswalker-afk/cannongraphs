import {test} from 'node:test';
import {referenceSolutions} from './fixtures/referenceSolutions';
import assert from 'node:assert/strict';
import {lostArches} from '../src/levels/worlds/lostArches';
import {parabolaPeaks} from '../src/levels/worlds/parabolaPeaks';
import {worlds,levels,worldForLevel,nextLevel,levelPosition} from '../src/levels/catalog';
import type {Level} from '../src/levels/schema';
import type {Point} from '../src/engine/coordinates';
import {auditSolution} from '../src/levels/qa';
import {parseFlightEquation,parseLinearEquation,parseQuadraticEquation,isQuadratic,evaluateQuadratic,type FlightEquation} from '../src/engine/equations/linear';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {simulateLinearAttempt} from '../src/engine/simulation/linearAttempt';
import {simulateQuadraticAttempt} from '../src/engine/simulation/quadraticAttempt';
import {sampleRouteAttempt} from '../src/animations/routeAttempt';
import {attemptDuration,flightDuration} from '../src/animations/attempt';
import {FIRE_MS} from '../src/animations/launch';
import {makeRapidSchedule,sampleRapidFire,rapidCounts} from '../src/animations/rapidFire';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {levelStars} from '../src/game/scoring';
const refs=referenceSolutions[3];
const plan=(i:number)=>new Map<string,FlightEquation>(lostArches[i].cannons.map(c=>{
 if(c.type!=='linear'&&c.type!=='quadratic')throw new Error('Unexpected cannon');
 return [c.id,parseFlightEquation(refs[i][c.id],c.type)];
}));
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
test('four complete unlocked worlds contain 48 unique levels and transition in catalog order',()=>{
 assert.equal(worlds.slice(0,4).flatMap(w=>w.levels).length,48);
 assert.equal(new Set(levels.map(l=>l.id)).size,levels.length);assert.equal(worlds[3].name,'Lost Arches');
 assert.equal(nextLevel(parabolaPeaks[11].id),lostArches[0]);
 assert.equal(new Set(lostArches.map(l=>l.id)).size,12);
 assert.deepEqual(lostArches.map(l=>l.cannons.length),[1,1,1,2,2,2,3,3,3,4,4,4]);
 for(const [i,l] of lostArches.entries()){
  assert.equal(l.world,4);assert.equal(l.creatures,5);assert.equal(worldForLevel(l.id),worlds[3]);assert.deepEqual(levelPosition(l.id),{index:i+1,total:12});
  assert.equal(nextLevel(l.id),lostArches[i+1]??worlds[4]?.levels[0]);
 }
});
test('advanced curriculum covers all turning point quadrants, fractional scales and roots, unequal heights and reverse flights',()=>{
 const vertices=refs.flatMap((r,i)=>lostArches[i].cannons.filter(c=>c.type==='quadratic').map(c=>{const e=parseQuadraticEquation(r[c.id]),x=-e.linear/(2*e.quadratic);return Math.sign(x)+','+Math.sign(evaluateQuadratic(e,x));}));
 for(const quadrant of ['-1,1','-1,-1','1,-1','1,1'])assert.ok(vertices.includes(quadrant),quadrant);
 const roots=parseQuadraticEquation(refs[2].A);near(evaluateQuadratic(roots,-2.5),0);near(evaluateQuadratic(roots,3.5),0);
 assert.notEqual(lostArches[4].cannons[0].position.y,lostArches[4].cannons[1].position.y);
 assert.notEqual(lostArches[7].cannons[0].position.y,lostArches[7].cannons[1].position.y);
 assert.equal(lostArches[5].cannons[0].direction,-1);assert.ok(lostArches[10].cannons.every(c=>c.direction===-1));
 assert.ok(lostArches.every(l=>l.cannons.some(c=>c.type==='quadratic')));
 assert.deepEqual(lostArches[11].cannons.map(c=>c.type),['quadratic','quadratic','linear','quadratic']);
});
for(const [i,l] of lostArches.entries())test(l.id+' '+l.title+' has a clear exact reference route',()=>{
 const audit=auditSolution(l,refs[i],l.cannons.map(c=>c.id));
 assert.equal(audit.result.event.kind,'exit');near(audit.result.end.x,l.exit.x);near(audit.result.end.y,l.exit.y);
 assert.ok(audit.minimumClearance>.025,l.id+' clearance '+audit.minimumClearance);
 const equations=plan(i);
 for(const leg of audit.result.legs){
  const e=equations.get(leg.cannonId)!;
  for(const t of [0,.2,.5,.8,1]){const p=leg.pointAt(t);near(p.y,isQuadratic(e)?evaluateQuadratic(e,p.x):e.gradient*p.x+e.intercept);}
 }
});
test('a different valid quadratic through the same anchors is accepted; a wrong opening direction fails',()=>{
 const l=lostArches[0],alternative=parseQuadraticEquation('4-(x+3)^2/3+(x+6)*x/60');
 assert.equal(simulateRoute(l,new Map([['A',alternative]])).event.kind,'exit');
 const wrong=simulateQuadraticAttempt(parseQuadraticEquation('1+x*(x+6)/3'),l.cannons[0],l);
 assert.notEqual(wrong.event.kind,'exit');
});
test('reverse quadratic flights follow the actual curve and update tangent orientation',()=>{
 for(const i of [5,10]){
  const r=simulateRoute(lostArches[i],plan(i)),leg=r.legs[0],e=parseQuadraticEquation(refs[i].A);
  assert.equal(leg.direction,-1);assert.ok(leg.pointAt(.2).x>leg.pointAt(.8).x);
  assert.equal(Math.sign(leg.angleAt!(.2)),-Math.sign(leg.angleAt!(.8)));
  near(leg.pointAt(.5).y,evaluateQuadratic(e,leg.pointAt(.5).x));
 }
 const l=lostArches[8],r=simulateRoute(l,plan(8)),[a,b]=r.legs;
 const start=attemptDuration(a)+FIRE_MS;
 const early=sampleRouteAttempt(start+flightDuration(b)*.2,r,l),late=sampleRouteAttempt(start+flightDuration(b)*.8,r,l);
 assert.equal(early.leg.cannonId,'B');assert.ok(late.frame.pip!.x<early.frame.pip!.x);near(late.frame.pip!.y,evaluateQuadratic(parseQuadraticEquation(refs[8].B),late.frame.pip!.x));
});
test('four-leg finale rapid fire preserves the curve, line, creature budget and final arrival count',()=>{
 const l=lostArches[11],equations=plan(11),r=simulateRoute(l,equations),schedule=makeRapidSchedule(r,4);
 assert.equal(r.event.kind,'exit');assert.equal(r.legs.length,4);
 for(const [i,timing] of schedule.legs.entries()){
  const f=sampleRapidFire(schedule.lead+timing.offset+timing.load+30,r,schedule);
  const pip=f.pips.find(p=>p.index===0&&p.legIndex===i&&p.phase==='flying')!;
  assert.ok(pip);const e=equations.get(r.legs[i].cannonId)!;
  near(pip.point.y,isQuadratic(e)?evaluateQuadratic(e,pip.point.x):e.gradient*pip.point.x+e.intercept);
  assert.equal(f.arrived,0);
 }
 let s=beginAttempt(createLevelState(5),r);s=finishAttempt(s,s.active!.id);
 const id=s.celebration!.id,counts=rapidCounts(schedule.duration,schedule);
 s=advanceCelebration(s,id,counts.dispatched,counts.arrived);s=finishCelebration(s,id);
 assert.equal(s.saved,5);assert.equal(levelStars(s),3);
});
