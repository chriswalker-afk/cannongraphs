import {test} from 'node:test';
import assert from 'node:assert/strict';
import {anchorDemos,initialAnchorDemoPlan} from '../src/levels/anchorDemos';
import {validateLevel,type Level} from '../src/levels/schema';
import {emptyAnchorSupport,levelSupports} from '../src/levels/supports';
import {anchorAssignments,lockedAnchorEquation,unplacedInventory} from '../src/levels/anchorSpec';
import {repositionAnchor,moveAnchorInPlanning,canLaunchAnchorPuzzle} from '../src/game/anchorPlacement';
import {countReady,getPlanEntry,editPlan,snapshotPlan} from '../src/game/flightPlan';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {lockedLiftText} from '../src/levels/liftSpec';
import {modeBudget,modeObjective} from '../src/game/learningModes';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {levels,worlds} from '../src/levels/catalog';

for(const demo of anchorDemos)test(demo.title+' has a unique winning mount for its scaffolded incoming line',()=>{
 validateLevel(demo);
 const puzzle=demo.anchorPuzzle!,initial=initialAnchorDemoPlan(demo);
 assert.equal(demo.cannons.length,1);assert.equal(unplacedInventory(demo).length,1);
 assert.equal(countReady(initial),1);assert.equal(snapshotPlan(initial),null);
 const winners:string[]=[];
 for(const a of puzzle.anchors){
  assert.equal(emptyAnchorSupport(demo,a).anchor,a.position);
  const l=repositionAnchor(demo,'B',a.id);levelSupports(l);
  const result=simulateRoute(l,new Map([['A',getPlanEntry(initial,'A')!.equation!]]));
  if(result.event.kind==='exit'){
   winners.push(a.id);assert.deepEqual(result.legs.map(leg=>leg.cannonId),['A','B']);
   assert.ok(Math.abs(result.end.x-l.exit.x)<1e-7&&Math.abs(result.end.y-l.exit.y)<1e-7);
  }
 }
 assert.deepEqual(winners,['Q']);
 for(const mode of ['cadet','pilot','ace'] as const){
  const state=createLevelState(modeBudget(mode,demo),1,mode==='cadet');
  const moved=moveAnchorInPlanning(demo,initial,state,'B','Q');
  assert.equal(countReady(moved.plan),2);assert.equal(canLaunchAnchorPuzzle(moved.level,moved.plan,state),true);
  const result=simulateRoute(moved.level,snapshotPlan(moved.plan)!);
  const active=beginAttempt(state,result),resolved=finishAttempt(active,active.active!.id),batch=resolved.celebration!;
  const success=finishCelebration(advanceCelebration(resolved,batch.id,batch.count,batch.count),batch.id);
  assert.equal(success.phase,'success');assert.equal(success.saved,modeBudget(mode,demo));
  assert.deepEqual([...anchorAssignments(moved.level)],[['B','Q']]);
 }
 assert.equal(lockedLiftText(lockedAnchorEquation(repositionAnchor(demo,'B','Q'),repositionAnchor(demo,'B','Q').cannons[1])!),demo.id==='anchor-demo-arc'?'y = -1/2x^2 + 6x - 13':'y = -x + 9');
});
test('Ace instructions retain the full relay requirement and exact noninteger coordinate data without giving the solution',()=>{
 const l=anchorDemos[0],p=l.anchorPuzzle!;
 const fractional:Level={...l,anchorPuzzle:{...p,anchors:[...p.anchors,{id:'T',position:{x:3.5,y:1.5}}]}};
 const text=modeObjective('ace',fractional);
 assert.match(text,/use every cannon/);assert.match(text,/Mount T \(3.5, 1.5\)/);assert.ok(!text.includes('Mount Q'));
});
test('placement demos stay outside the 96-level curriculum',()=>{
 assert.equal(worlds.length,8);assert.equal(levels.length,96);assert.ok(anchorDemos.every(l=>!levels.some(c=>c.id===l.id)));
});
