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
 assert.deepEqual(lostArches.map(l=>l.id),Array.from({length:12},(_,i)=>'4-'+String(i+1).padStart(2,'0')));
 for(const [i,l] of lostArches.entries()){
  assert.equal(l.world,4);assert.equal(l.creatures,5);assert.equal(worldForLevel(l.id),worlds[3]);assert.deepEqual(levelPosition(l.id),{index:i+1,total:12});
  assert.equal(nextLevel(l.id),lostArches[i+1]??worlds[4]?.levels[0]);
 }
});
test('advanced curriculum covers all turning point quadrants, fractional scales and roots, unequal heights and reverse flights',()=>{
 const vertices=refs.slice(0,4).map(r=>{const e=parseQuadraticEquation(r.A),x=-e.linear/(2*e.quadratic);return Math.sign(x)+','+Math.sign(evaluateQuadratic(e,x));});
 assert.deepEqual(vertices,['-1,1','-1,-1','1,-1','1,1']);
 for(const r of refs.slice(0,9))assert.notEqual(parseQuadraticEquation(r.A).exactQuadratic.denominator,'1');
 const roots=parseQuadraticEquation(refs[4].A);near(evaluateQuadratic(roots,-2.5),0);near(evaluateQuadratic(roots,3.5),0);
 assert.notEqual(lostArches[5].cannons[0].position.y,lostArches[5].exit.y);
 assert.notEqual(lostArches[8].cannons[0].position.y,lostArches[8].exit.y);
 assert.deepEqual(lostArches.slice(6,8).map(l=>l.cannons[0].direction),[-1,-1]);
 assert.deepEqual(lostArches[11].cannons.map(c=>c.type),['quadratic','quadratic','linear','quadratic','quadratic']);
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
// Conservative necessary constraints: ignore the Pip radius, allow touching
// boundaries and check only selected slices of the actual authored geometry.
// A direct quadratic through the two anchors is chord(x)+a(x-sx)(x-tx).
// If even these relaxed coefficient intervals have empty intersection, no
// exact quadratic through those anchors can make the skipped journey.
type Interval=[number,number];
function openHeights(l:Level,x:number):Interval[]{
 let ranges:Interval[]=[[l.bounds.minY,l.bounds.maxY]];
 for(const {bounds:b} of l.obstacles)if(x>=b.minX&&x<=b.maxX){
  ranges=ranges.flatMap(([lo,hi])=>{
   if(b.maxY<=lo||b.minY>=hi)return [[lo,hi] as Interval];
   const out:Interval[]=[];if(lo<b.minY)out.push([lo,b.minY]);if(b.maxY<hi)out.push([b.maxY,hi]);return out;
  });
 }
 return ranges;
}
function possibleCoefficients(l:Level,s:Point,t:Point,slices:number[]):Interval[]{
 let ranges:Interval[]=[[-Infinity,Infinity]];
 for(const x of slices){
  if(x<=Math.min(s.x,t.x)||x>=Math.max(s.x,t.x))continue;
  const k=(x-s.x)*(x-t.x),chord=s.y+(t.y-s.y)*(x-s.x)/(t.x-s.x);
  const allowed:Interval[]=openHeights(l,x).map(([lo,hi])=>[(hi-chord)/k,(lo-chord)/k]);
  ranges=ranges.flatMap(([lo,hi])=>allowed.map(([a,b]):Interval=>[Math.max(lo,a),Math.min(hi,b)]).filter(([a,b])=>a<=b+1e-10));
 }
 return ranges;
}
test('every nonadjacent forward shortcut in all three relay levels is blocked',()=>{
 const gates=[[-6,-1,5],[-6,-4.7,-2,0,6],[-9,-3,3,9,15]];
 for(const [i,l] of lostArches.slice(9).entries()){
  const targets=[...l.cannons.map(c=>({id:c.id,position:c.position})),{id:'exit',position:l.exit}];
  for(const [j,c] of l.cannons.entries())for(let k=j+2;k<targets.length;k++){
   const t=targets[k],dx=t.position.x-c.position.x,dy=t.position.y-c.position.y;
   if(dx*c.direction<=0)continue;
   if(c.type==='quadratic')assert.deepEqual(possibleCoefficients(l,c.position,t.position,gates[i]),[],l.id+' bypass '+c.id+' -> '+t.id);
   else {
    const e=parseLinearEquation('('+dy+'*(x-('+c.position.x+')))/('+dx+')+('+c.position.y+')'),r=simulateLinearAttempt(e,c,l);
    assert.ok(t.id==='exit'?r.event.kind!=='exit':r.event.kind!=='cannon'||r.event.cannonId!==t.id,l.id+' bypass '+c.id+' -> '+t.id);
   }
  }
 }
});
test('a different valid quadratic through the same anchors is accepted; a wrong opening direction fails',()=>{
 const l=lostArches[0],alternative=parseQuadraticEquation('4-(x+3)^2/3+(x+6)*x/60');
 assert.equal(simulateRoute(l,new Map([['A',alternative]])).event.kind,'exit');
 const wrong=simulateQuadraticAttempt(parseQuadraticEquation('1+x*(x+6)/3'),l.cannons[0],l);
 assert.notEqual(wrong.event.kind,'exit');
});
test('reverse quadratic flights follow the actual curve and update tangent orientation',()=>{
 for(const i of [6,7]){
  const r=simulateRoute(lostArches[i],plan(i)),leg=r.legs[0],e=parseQuadraticEquation(refs[i].A);
  assert.equal(leg.direction,-1);assert.ok(leg.pointAt(.2).x>leg.pointAt(.8).x);
  assert.equal(Math.sign(leg.angleAt!(.2)),-Math.sign(leg.angleAt!(.8)));
  near(leg.pointAt(.5).y,evaluateQuadratic(e,leg.pointAt(.5).x));
 }
 const l=lostArches[10],r=simulateRoute(l,plan(10)),[a,b]=r.legs;
 const start=attemptDuration(a)+FIRE_MS;
 const early=sampleRouteAttempt(start+flightDuration(b)*.2,r,l),late=sampleRouteAttempt(start+flightDuration(b)*.8,r,l);
 assert.equal(early.leg.cannonId,'B');assert.ok(late.frame.pip!.x<early.frame.pip!.x);near(late.frame.pip!.y,evaluateQuadratic(parseQuadraticEquation(refs[10].B),late.frame.pip!.x));
});
test('five-leg finale rapid fire preserves the curve, line, creature budget and final arrival count',()=>{
 const l=lostArches[11],equations=plan(11),r=simulateRoute(l,equations),schedule=makeRapidSchedule(r,4);
 assert.equal(r.event.kind,'exit');assert.equal(r.legs.length,5);
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
