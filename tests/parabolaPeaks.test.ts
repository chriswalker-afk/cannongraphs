import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parabolaPeaks} from '../src/levels/worlds/parabolaPeaks';
import {floatingIsles} from '../src/levels/worlds/floatingIsles';
import {worlds,levels,worldForLevel,nextLevel,levelPosition} from '../src/levels/catalog';
import {auditSolution} from '../src/levels/qa';
import {parseFlightEquation,parseQuadraticEquation,isQuadratic,evaluateQuadratic,type FlightEquation} from '../src/engine/equations/linear';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {simulateQuadraticAttempt} from '../src/engine/simulation/quadraticAttempt';
import {makeRapidSchedule,sampleRapidFire,rapidCounts} from '../src/animations/rapidFire';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {levelStars} from '../src/game/scoring';
// Deliberately test-only; the level data does not specify a unique accepted polynomial.
const refs:readonly Readonly<Record<string,string>>[]=[
 {A:'x²'}, {A:'x²/2'}, {A:'-x²'}, {A:'x²+2'}, {A:'(x-3)²'},
 {A:'7-(x-4)²/2'}, {A:'(x-1)(x-5)'}, {A:'-(x+3)(x-3)/3'}, {A:'(x-2)²/2+1'},
 {A:'-(x-1)(x-7)/2+2',B:'x/2-3/2'},
 {A:'-(x-4)²/2+13/2',B:'(x-10)²/3-1'},
 {A:'-(x-4)²/2+13/2',B:'(x-10)²/3-1',C:'-(x-16)²/2+13/2',D:'2'}
];
const plan=(i:number)=>new Map<string,FlightEquation>(parabolaPeaks[i].cannons.map(c=>{
 if(c.type!=='quadratic'&&c.type!=='linear')throw new Error('Unexpected cannon');
 return [c.id,parseFlightEquation(refs[i][c.id],c.type)];
}));
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
test('three complete worlds expose 36 unique unlocked levels in curriculum order',()=>{
 assert.equal(worlds.slice(0,3).flatMap(w=>w.levels).length,36);
 assert.equal(new Set(levels.map(l=>l.id)).size,levels.length);assert.equal(worlds[2].name,'Parabola Peaks');
 assert.equal(nextLevel(floatingIsles[11].id),parabolaPeaks[0]);
 assert.deepEqual(parabolaPeaks.map(l=>l.id),Array.from({length:12},(_,i)=>'3-'+String(i+1).padStart(2,'0')));
 assert.deepEqual(parabolaPeaks.map(l=>l.cannons.length),[1,1,1,1,1,1,1,1,1,2,2,4]);
 for(const [i,l] of parabolaPeaks.entries()){
  assert.equal(l.world,3);assert.equal(l.creatures,5);assert.equal(worldForLevel(l.id),worlds[2]);
  assert.deepEqual(levelPosition(l.id),{index:i+1,total:12});
  assert.equal(nextLevel(l.id),parabolaPeaks[i+1]??worlds[3]?.levels[0]);
 }
});
test('the intended curriculum covers square functions, translations, roots, vertices and mixed families',()=>{
 const e=refs.slice(0,9).map(r=>parseQuadraticEquation(r.A));
 assert.equal(e[0].quadratic,1);assert.equal(e[0].linear,0);assert.equal(e[0].constant,0);
 assert.equal(e[1].quadratic,.5);assert.equal(e[2].quadratic,-1);assert.equal(e[3].constant,2);
 near(-e[4].linear/(2*e[4].quadratic),3);near(evaluateQuadratic(e[4],3),0);
 near(evaluateQuadratic(e[5],4),7);
 for(const i of [6,7])for(const p of [parabolaPeaks[i].cannons[0].position,parabolaPeaks[i].exit])near(evaluateQuadratic(e[i],p.x),0);
 near(-e[8].linear/(2*e[8].quadratic),parabolaPeaks[8].cannons[0].position.x);
 assert.deepEqual(parabolaPeaks[9].cannons.map(c=>c.type),['quadratic','linear']);
 assert.deepEqual(parabolaPeaks[11].cannons.map(c=>c.type),['quadratic','quadratic','quadratic','linear']);
});
for(const [i,l] of parabolaPeaks.entries())test(l.id+' '+l.title+' has a verified clear route',()=>{
 const audit=auditSolution(l,refs[i],l.cannons.map(c=>c.id));
 assert.equal(audit.result.event.kind,'exit');near(audit.result.end.x,l.exit.x);near(audit.result.end.y,l.exit.y);
 assert.ok(audit.minimumClearance>.025,l.id+' clearance '+audit.minimumClearance);
 for(const leg of audit.result.legs){const e=plan(i).get(leg.cannonId)!;
  if(isQuadratic(e)){assert.ok(leg.curveControl);for(const t of [0,.25,.5,.75,1]){const p=leg.pointAt(t);near(p.y,evaluateQuadratic(e,p.x));}}
 }
});
test('the basic puzzle accepts another mathematically valid quadratic rather than a stored answer',()=>{
 const l=parabolaPeaks[0],e=parseQuadraticEquation('x²/2+2x-3/2');
 assert.equal(simulateRoute(l,new Map([['A',e]])).event.kind,'exit');
});
test('equal endpoint quadratics with insufficient or excessive curvature collide with the valley gate',()=>{
 const l=parabolaPeaks[10],b=l.cannons[1];
 for(const expression of ['(x-7)(x-13)/10+2','(x-7)(x-13)*5/12+2']){
  const r=simulateQuadraticAttempt(parseQuadraticEquation(expression),b,l);
  assert.equal(r.event.kind,'obstacle');if(r.event.kind==='obstacle')assert.ok(r.event.obstacleId.startsWith('valley-slot'));
 }
});
test('alternating arch/valley constraints and a symmetric gate block sampled nonadjacent shortcuts',()=>{
 // Every quadratic through equal-height endpoints has the form
 // y = 2 + a(x - sourceX)(x - targetX). All samples use exact rational a.
 // The geometry additionally gives a sign contradiction for A/B skips and
 // equal heights at x=16 and x=22 for C -> exit in the finale.
 for(const l of parabolaPeaks.slice(10)){
  const targets=[...l.cannons.map(c=>({id:c.id,position:c.position})),{id:'exit',position:l.exit}];
  for(const [i,c] of l.cannons.entries())for(let j=i+2;j<targets.length;j++){
   const t=targets[j];if(c.type!=='quadratic')continue;
   for(const k of [-24,-12,-6,-3,-1,1,3,6,12,24]){
    const e=parseQuadraticEquation('('+k+'/12)(x-'+c.position.x+')(x-'+t.position.x+')+2');
    const r=simulateQuadraticAttempt(e,c,l);
    assert.ok(t.id==='exit'?r.event.kind!=='exit':r.event.kind!=='cannon'||r.event.cannonId!==t.id,l.id+' '+c.id+' -> '+t.id+' '+k);
   }
  }
 }
});
test('the four-leg finale keeps every rapid-fire Pip on its assigned curve or line and counts only exit arrivals',()=>{
 const l=parabolaPeaks[11],equations=plan(11),r=simulateRoute(l,equations),schedule=makeRapidSchedule(r,4);
 assert.equal(r.event.kind,'exit');assert.equal(r.legs.length,4);
 for(const [i,timing] of schedule.legs.entries()){
  const t=schedule.lead+timing.offset+timing.load+30,f=sampleRapidFire(t,r,schedule);
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
