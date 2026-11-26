import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLevelState,beginAttempt,finishAttempt,restartLevel,canPlan,canLaunch,isTerminal,type LevelState} from '../src/game/levelState';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {simulateLinearAttempt} from '../src/engine/simulation/linearAttempt';
import {meadowPreview} from '../src/levels/worlds/meadow';
const attempt=(s:string)=>simulateLinearAttempt(parseLinearEquation(s),meadowPreview.cannons[0],meadowPreview);
const misfire=attempt('x+1'),splat=attempt('2-x'),miss=attempt('1.01x-.01'),success=attempt('x');
const check=(s:LevelState)=>assert.equal(s.waiting+s.failed+s.saved+(s.active?1:0),s.total);
function launch(s:LevelState,r=misfire){const next=beginAttempt(s,r);check(next);assert.ok(next.active);return next;}
function finish(s:LevelState){const next=finishAttempt(s,s.active!.id);check(next);return next;}
test('a new level has five available creatures and no result',()=>{
 const s=createLevelState(5);assert.equal(s.waiting,5);assert.equal(s.phase,'planning');assert.ok(canLaunch(s));assert.ok(canPlan(s));assert.equal(s.lastResult,null);check(s);
 assert.throws(()=>createLevelState(0));assert.throws(()=>createLevelState(1.5));
});
test('misfire reserves exactly one creature and resolves as a failure, not a splat or success',()=>{
 const s=createLevelState(5),a=launch(s);assert.equal(a.waiting,4);assert.equal(a.phase,'launching');assert.equal(a.failed,0);assert.equal(s.waiting,5);
 assert.equal(beginAttempt(a,success),a);assert.equal(finishAttempt(a,a.active!.id+1),a);assert.equal(restartLevel(a),a);assert.ok(!canPlan(a));
 const b=finish(a);assert.equal(b.phase,'retry');assert.equal(b.failed,1);assert.equal(b.saved,0);assert.equal(b.lastResult?.event.kind,'misfire');
 assert.equal(finishAttempt(b,a.active!.id),b);assert.ok(canLaunch(b));
});
test('all five failures exhaust the level, including misfires, splats and boundary misses',()=>{
 let s=createLevelState(5);
 for(const r of [misfire,splat,miss,misfire,splat])s=finish(launch(s,r));
 assert.equal(s.phase,'gameOver');assert.equal(s.waiting,0);assert.equal(s.failed,5);assert.equal(s.saved,0);
 assert.ok(isTerminal(s));assert.ok(!canLaunch(s));assert.equal(beginAttempt(s,success),s);
});
test('success on first, middle or last attempt terminates with correct remaining budget',()=>{
 for(const failures of [0,2,4]){
  let s=createLevelState(5);for(let i=0;i<failures;i++)s=finish(launch(s));
  s=finish(launch(s,success));assert.equal(s.phase,'success');assert.equal(s.saved,1);assert.equal(s.failed,failures);assert.equal(s.waiting,4-failures);
  assert.ok(!canLaunch(s));assert.ok(isTerminal(s));assert.equal(beginAttempt(s,success),s);
 }
});
test('restart refills queue and prevents stale callbacks from resolving new launches',()=>{
 const a=launch(createLevelState(5)),b=finish(a),c=restartLevel(b);
 assert.equal(c.phase,'planning');assert.equal(c.waiting,5);assert.equal(c.failed,0);assert.equal(c.lastResult,null);check(c);
 const d=launch(c,success);assert.notEqual(d.active!.id,a.active!.id);assert.equal(finishAttempt(d,a.active!.id),d);assert.equal(finish(d).phase,'success');
});
