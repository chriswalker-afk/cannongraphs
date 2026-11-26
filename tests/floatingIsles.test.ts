import {test} from 'node:test';
import assert from 'node:assert/strict';
import {floatingIsles} from '../src/levels/worlds/floatingIsles';
import {meadowLaunchers} from '../src/levels/worlds/meadowLaunchers';
import {worlds,levels,nextLevel,levelPosition,worldForLevel} from '../src/levels/catalog';
import {auditLinearSolution} from '../src/levels/qa';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {simulateLinearAttempt} from '../src/engine/simulation/linearAttempt';
import {simulateLinearRoute} from '../src/engine/simulation/linearRoute';
import {makeRapidSchedule,rapidCounts,sampleRapidFire} from '../src/animations/rapidFire';
import {sampleRouteAttempt} from '../src/animations/routeAttempt';
import {attemptDuration,flightDuration} from '../src/animations/attempt';
import {FIRE_MS} from '../src/animations/launch';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {levelStars} from '../src/game/scoring';
import {initialCamera,cameraTransform} from '../src/engine/camera';
// Deliberately absent from the browser's runtime catalog.
const refs:readonly Readonly<Record<string,string>>[]=[
 {A:'x/2'},{A:'2x/3'},{A:'7-x/2'},{A:'x/2+3/2'},
 {A:'x/3+3'},{A:'x/2'},{A:'-2x/3-1'},
 {A:'11/3-x/3'},{A:'2x/3+1'},
 {A:'2x/3+10/3',B:'8/5-x/5'},
 {A:'2x/3+16/3',B:'2-x',C:'x/2-4'},
 {A:'x/2',B:'4-x/2',C:'6',D:'22-2x'}
];
const plan=(i:number)=>new Map(Object.entries(refs[i]).map(([id,e])=>[id,parseLinearEquation(e)]));
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
test('the first two complete unlocked worlds contain 24 unique levels and transition in order',()=>{
 assert.equal(worlds.slice(0,2).flatMap(w=>w.levels).length,24);assert.equal(new Set(levels.map(l=>l.id)).size,levels.length);
 assert.equal(worlds[1].name,'The Floating Isles');
 assert.equal(nextLevel(meadowLaunchers[11].id),floatingIsles[0]);
 assert.equal(nextLevel(floatingIsles[11].id),worlds[2].levels[0]);
 assert.deepEqual(floatingIsles.map(l=>l.id),Array.from({length:12},(_,i)=>'2-'+String(i+1).padStart(2,'0')));
 for(const [i,l] of floatingIsles.entries()){
  assert.deepEqual(levelPosition(l.id),{index:i+1,total:12});
  assert.equal(worldForLevel(l.id),worlds[1]);assert.equal(l.creatures,5);
  assert.ok(l.cannons.every(c=>c.type==='linear'));
  assert.equal(nextLevel(l.id),floatingIsles[i+1]??worlds[2].levels[0]);
 }
});
test('curriculum introduces fractions, negative intercepts, all four quadrants and reverse firing',()=>{
 const first=refs.slice(0,9).map(r=>parseLinearEquation(r.A));
 assert.equal(first[0].exactGradient.denominator,'2');assert.equal(first[1].exactGradient.denominator,'3');
 assert.equal(first[2].gradient,-.5);assert.equal(first[3].exactIntercept.denominator,'2');
 const points=floatingIsles.flatMap(l=>[...l.cannons.map(c=>c.position),l.exit]);
 assert.equal(new Set(points.filter(p=>p.x!==0&&p.y!==0).map(p=>Math.sign(p.x)+','+Math.sign(p.y))).size,4);
 assert.deepEqual(floatingIsles.slice(7,9).map(l=>l.cannons[0].direction),[-1,-1]);
 assert.ok(first.some(e=>e.intercept<0));
});
for(const [i,l] of floatingIsles.entries())test(l.id+' '+l.title+' has a clear exact reference route',()=>{
 const audit=auditLinearSolution(l,refs[i],l.cannons.map(c=>c.id));
 assert.equal(audit.result.event.kind,'exit');near(audit.result.end.x,l.exit.x);near(audit.result.end.y,l.exit.y);
 assert.ok(audit.minimumClearance>.025,l.id+' clearance '+audit.minimumClearance);
});
test('every forward shortcut past an intermediate cannon fails in the authored relays',()=>{
 for(const l of floatingIsles.slice(9)){
  const targets=[...l.cannons.map(c=>({id:c.id,position:c.position})),{id:'exit',position:l.exit}];
  for(const [i,c] of l.cannons.entries())for(let j=i+2;j<targets.length;j++){
   const t=targets[j],dx=t.position.x-c.position.x,dy=t.position.y-c.position.y;
   if(dx*c.direction<=0)continue;
   const e=parseLinearEquation('('+dy+'*(x-('+c.position.x+')))/('+dx+')+('+c.position.y+')');
   const r=simulateLinearAttempt(e,c,l);
   assert.ok(t.id==='exit'?r.event.kind!=='exit':r.event.kind!=='cannon'||r.event.cannonId!==t.id,l.id+' bypass '+c.id+' → '+t.id);
  }
 }
});
test('signed coordinates retain equal axis scale and accurate camera round trips',()=>{
 const l=floatingIsles[11],camera=initialCamera(l.bounds),t=cameraTransform(l.bounds,{width:840,height:480,padding:34},camera);
 const o=t.toScreen({x:0,y:0}),x=t.toScreen({x:1,y:0}),y=t.toScreen({x:0,y:1});
 near(x.x-o.x,o.y-y.y);
 for(const c of l.cannons){const round=t.toWorld(t.toScreen(c.position));near(round.x,c.position.x);near(round.y,c.position.y);}
});
test('reverse flights distinguish movement direction from gradient sign',()=>{
 for(const i of [7,8]){
  const l=floatingIsles[i],r=simulateLinearRoute(l,plan(i)),e=plan(i).get('A')!;
  assert.equal(r.direction,-1);assert.ok(r.pointAt(.75).x<r.pointAt(.25).x);
  near(r.pointAt(.4).y,e.gradient*r.pointAt(.4).x+e.intercept);
  assert.equal(Math.sign(r.angle),-Math.sign(e.gradient));
 }
});
test('four-leg switchback animation and rapid fire reverse along the actual second equation',()=>{
 const l=floatingIsles[11],r=simulateLinearRoute(l,plan(11)),a=r.legs[0],b=r.legs[1];
 assert.deepEqual(r.legs.map(leg=>leg.direction),[1,-1,1,1]);assert.equal(r.event.kind,'exit');
 const start=attemptDuration(a)+FIRE_MS,early=sampleRouteAttempt(start+flightDuration(b)*.2,r,l),late=sampleRouteAttempt(start+flightDuration(b)*.7,r,l);
 assert.equal(early.leg.cannonId,'B');assert.ok(late.frame.pip!.x<early.frame.pip!.x);near(late.frame.pip!.y,4-late.frame.pip!.x/2);
 const s=makeRapidSchedule(r,4),begin=s.lead+s.legs[1].offset+s.legs[1].load;
 const f=sampleRapidFire(begin+40,r,s);assert.ok(f.pips.some(p=>p.legIndex===1&&p.phase==='flying'));assert.equal(f.arrived,0);
 for(const pip of f.pips.filter(p=>p.legIndex===1&&p.phase==='flying'))near(pip.point.y,4-pip.point.x/2);
 let state=beginAttempt(createLevelState(5),r);state=finishAttempt(state,state.active!.id);
 const id=state.celebration!.id,counts=rapidCounts(s.duration,s);state=advanceCelebration(state,id,counts.dispatched,counts.arrived);state=finishCelebration(state,id);
 assert.equal(state.saved,5);assert.equal(levelStars(state),3);
});
