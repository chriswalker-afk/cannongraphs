import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration,restartLevel,activeCount,canLaunch,canPlan,isTerminal,type LevelState} from '../src/game/levelState';
import {levelStars,scoreStars} from '../src/game/scoring';
import {makeRapidSchedule,rapidCounts,sampleRapidFire} from '../src/animations/rapidFire';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {simulateLinearAttempt} from '../src/engine/simulation/linearAttempt';
import {meadowPreview} from '../src/levels/worlds/meadow';
const run=(s:string)=>simulateLinearAttempt(parseLinearEquation(s),meadowPreview.cannons[0],meadowPreview);
const win=run('x'),lose=run('x+1');
function initial(failures=0){
 let s=createLevelState(5);
 for(let i=0;i<failures;i++){s=beginAttempt(s,lose);s=finishAttempt(s,s.active!.id);}
 s=beginAttempt(s,win);return finishAttempt(s,s.active!.id);
}
const check=(s:LevelState)=>assert.equal(s.waiting+s.failed+s.saved+activeCount(s),s.total);
test('first successful Pip reserves a verified celebration but does not pre-credit the waiting queue',()=>{
 const s=initial();assert.equal(s.phase,'celebrating');assert.equal(s.saved,1);assert.equal(s.waiting,4);
 assert.equal(s.celebration!.result,win);assert.equal(s.celebration!.count,4);assert.equal(levelStars(s),null);
 assert.equal(canLaunch(s),false);assert.equal(canPlan(s),false);assert.equal(isTerminal(s),false);assert.equal(restartLevel(s),s);check(s);
});
test('dispatch and arrivals update budget independently; stale and duplicate snapshots ignored',()=>{
 let s=initial(1);const id=s.celebration!.id;
 s=advanceCelebration(s,id,2,0);assert.equal(s.waiting,1);assert.equal(activeCount(s),2);assert.equal(s.saved,1);check(s);
 assert.equal(advanceCelebration(s,id+1,3,2),s);assert.equal(advanceCelebration(s,id,2,0),s);assert.equal(advanceCelebration(s,id,1,1),s);
 assert.equal(advanceCelebration(s,id,2,3),s);assert.equal(advanceCelebration(s,id,4,0),s);assert.equal(finishCelebration(s,id),s);
 s=advanceCelebration(s,id,3,2);assert.equal(s.saved,3);assert.equal(activeCount(s),1);check(s);
 s=advanceCelebration(s,id,3,3);assert.equal(s.saved,4);assert.equal(s.waiting,0);assert.equal(s.phase,'celebrating');assert.equal(levelStars(s),null);check(s);
 s=finishCelebration(s,id);assert.equal(s.phase,'success');assert.equal(levelStars(s),2);assert.equal(finishCelebration(s,id),s);assert.equal(advanceCelebration(s,id,3,3),s);
 const fresh=restartLevel(s);assert.equal(fresh.waiting,5);assert.equal(advanceCelebration(fresh,id,3,3),fresh);
});
test('all five possible success attempts and complete failure produce the agreed ratings',()=>{
 for(let failures=0;failures<5;failures++){
  let s=initial(failures);const c=s.celebration;
  if(c){s=advanceCelebration(s,c.id,c.count,c.count);s=finishCelebration(s,c.id);}
  assert.equal(s.saved,5-failures);assert.equal(s.waiting,0);assert.equal(s.phase,'success');
  assert.equal(levelStars(s),[3,2,2,1,1][failures]);check(s);
 }
 let s=createLevelState(5);for(let i=0;i<5;i++){s=beginAttempt(s,lose);s=finishAttempt(s,s.active!.id);}
 assert.equal(levelStars(s),0);assert.equal(s.celebration,null);
 assert.equal(scoreStars(3,3),3);assert.equal(scoreStars(6,10),2);assert.throws(()=>scoreStars(6,5));
});
test('staggered launches overlap and each airborne centre remains on the original equation',()=>{
 const s=makeRapidSchedule(win,4);
 assert.deepEqual(rapidCounts(s.lead-1,s),{dispatched:0,arrived:0});
 assert.deepEqual(rapidCounts(s.lead,s),{dispatched:1,arrived:0});
 const t=s.lead+s.load+s.interval+60,f=sampleRapidFire(t,win,s);
 assert.ok(f.pips.filter(p=>p.phase==='flying').length>=2);assert.equal(f.arrived,0);
 for(const p of f.pips.filter(p=>p.phase==='flying'))assert.ok(Math.abs(p.point.x-p.point.y)<1e-8);
 const first=s.lead+s.load+s.flight;
 assert.equal(rapidCounts(first-1,s).arrived,0);assert.equal(rapidCounts(first,s).arrived,1);
 const arrival=sampleRapidFire(first,win,s).pips.find(p=>p.index===0)!;assert.deepEqual(arrival.point,win.end);
 const end=sampleRapidFire(s.duration,win,s);assert.equal(end.done,true);assert.equal(end.arrived,4);assert.equal(end.dispatched,4);assert.equal(end.pips.length,0);
});
test('reduced motion preserves all event counts and no recoil, moving trail or tilt',()=>{
 const s=makeRapidSchedule(win,4,true),f=sampleRapidFire(s.lead+s.load+30,win,s);
 assert.equal(f.recoil,0);assert.equal(f.burst,null);
 for(const p of f.pips){assert.equal(p.trailStart,null);assert.equal(p.tilt,0);assert.equal(p.stretch,1);}
 assert.deepEqual(rapidCounts(s.duration,s),{dispatched:4,arrived:4});
 assert.throws(()=>makeRapidSchedule(lose,2));assert.throws(()=>makeRapidSchedule(win,0));
});
