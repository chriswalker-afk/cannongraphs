import {test} from 'node:test';
import assert from 'node:assert/strict';
import {meadowLaunchers} from '../src/levels/worlds/meadowLaunchers';
import {worlds,levels,nextLevel,levelPosition,worldForLevel} from '../src/levels/catalog';
import {auditLinearSolution} from '../src/levels/qa';
import {simulateLinearAttempt} from '../src/engine/simulation/linearAttempt';
import {simulateLinearRoute} from '../src/engine/simulation/linearRoute';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {makeRapidSchedule,rapidCounts,sampleRapidFire} from '../src/animations/rapidFire';
import {levelStars} from '../src/game/scoring';
// Answer fixtures are test-only. The app imports only the authored coordinates.
const references:readonly Readonly<Record<string,string>>[]=[
 {A:'x'},{A:'2x'},{A:'3x'},{A:'x+2'},{A:'2x+1'},{A:'3'},
 {A:'9-x'},{A:'2x-3'},{A:'15-2x'},
 {A:'x+1',B:'11-x'},
 {A:'2x',B:'12-x',C:'4'},
 {A:'2x',B:'12-x',C:'x-4',D:'20-x'}
];
test('World 1 contains twelve accessible levels in deliberate curriculum order',()=>{
 assert.equal(worlds.length,1);assert.equal(levels.length,12);
 assert.deepEqual(levels.map(l=>l.id),Array.from({length:12},(_,i)=>'1-'+String(i+1).padStart(2,'0')));
 assert.deepEqual(levels.map(l=>l.cannons.length),[1,1,1,1,1,1,1,1,1,2,3,4]);
 assert.equal(new Set(levels.map(l=>l.title)).size,12);
 for(const l of levels){
  assert.equal(l.creatures,5);assert.equal(l.world,1);assert.ok(l.objective.length>10);
  assert.ok(l.cannons.every(c=>c.type==='linear'&&c.direction===1&&Number.isInteger(c.position.x)&&Number.isInteger(c.position.y)));
  assert.ok(Number.isInteger(l.exit.x)&&Number.isInteger(l.exit.y));
  assert.equal(worldForLevel(l.id)!.name,'Meadow Launchers');
 }
});
test('curriculum introduces integer slopes, intercepts, horizontal and descending lines before relays',()=>{
 const equations=references.slice(0,9).map(r=>parseLinearEquation(r.A));
 assert.deepEqual(equations.map(e=>e.gradient),[1,2,3,1,2,0,-1,2,-2]);
 assert.deepEqual(equations.map(e=>e.intercept),[0,0,0,2,1,3,9,-3,15]);
 for(const reference of references)for(const input of Object.values(reference)){
  const e=parseLinearEquation(input);assert.equal(e.exactGradient.denominator,'1');assert.equal(e.exactIntercept.denominator,'1');
 }
});
for(const [i,l] of meadowLaunchers.entries()){
 test(l.id+' '+l.title+' has an exact, clear reference route',()=>{
  const audit=auditLinearSolution(l,references[i],l.cannons.map(c=>c.id));
  assert.equal(audit.result.event.kind,'exit');
  assert.ok(Math.abs(audit.result.end.x-l.exit.x)<1e-7&&Math.abs(audit.result.end.y-l.exit.y)<1e-7);
  assert.ok(audit.minimumClearance>.025,l.id+' clearance '+audit.minimumClearance);
 });
}
test('every possible forward shortcut in each relay fails to reach the skipped destination',()=>{
 for(const l of meadowLaunchers.slice(9)){
  const targets=[...l.cannons.map(c=>({id:c.id,position:c.position})),{id:'exit',position:l.exit}];
  for(let i=0;i<l.cannons.length;i++){
   const c=l.cannons[i];
   for(let j=i+2;j<targets.length;j++){
    const target=targets[j],dx=target.position.x-c.position.x,dy=target.position.y-c.position.y;
    // Exact line through the two anchors, including fractional shortcuts.
    const eq=parseLinearEquation('('+dy+'*(x-'+c.position.x+'))/'+dx+'+'+c.position.y);
    const leg=simulateLinearAttempt(eq,c,l);
    assert.ok(target.id==='exit'?leg.event.kind!=='exit':leg.event.kind!=='cannon'||leg.event.cannonId!==target.id,l.id+' bypass '+c.id+' → '+target.id);
   }
  }
 }
});
test('next-level navigation follows catalog order without locking levels or wrapping the finale',()=>{
 for(let i=0;i<levels.length;i++){
  assert.deepEqual(levelPosition(levels[i].id),{index:i+1,total:12});
  assert.equal(nextLevel(levels[i].id),levels[i+1]);
 }
 assert.equal(nextLevel('missing'),undefined);assert.equal(levelPosition('missing'),undefined);
});
test('finale celebration travels the same four legs, counts only exit arrivals and awards three stars',()=>{
 const l=meadowLaunchers[11],plan=new Map(Object.entries(references[11]).map(([id,s])=>[id,parseLinearEquation(s)]));
 const r=simulateLinearRoute(l,plan);assert.equal(r.legs.length,4);assert.equal(r.event.kind,'exit');
 let state=beginAttempt(createLevelState(l.creatures),r);state=finishAttempt(state,state.active!.id);
 const schedule=makeRapidSchedule(r,4),id=state.celebration!.id;
 const firstTransfer=schedule.lead+schedule.legs[0].load+schedule.legs[0].flight;
 assert.equal(rapidCounts(firstTransfer,schedule).arrived,0);
 const finalLeg=schedule.lead+schedule.legs[3].offset+schedule.legs[3].load+30;
 const frame=sampleRapidFire(finalLeg,r,schedule);
 assert.ok(frame.pips.some(p=>p.legIndex===3&&p.phase==='flying'));
 const counts=rapidCounts(schedule.duration,schedule);
 state=advanceCelebration(state,id,counts.dispatched,counts.arrived);state=finishCelebration(state,id);
 assert.equal(levelStars(state),3);assert.equal(state.saved,5);
});
