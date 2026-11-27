import {test} from 'node:test';
import assert from 'node:assert/strict';
import {salvageLinear,initialSalvageLinearPlan,nextSalvageLinear} from '../src/levels/salvageLinear';
import {auditLinearPlacement} from './helpers/salvageAudit';
import {getPlanEntry,countReady,editPlan,snapshotPlan} from '../src/game/flightPlan';
import {moveAnchorInPlanning,canLaunchAnchorPuzzle} from '../src/game/anchorPlacement';
import {createLevelState} from '../src/game/levelState';
import {modeBudget} from '../src/game/learningModes';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {levels,worlds} from '../src/levels/catalog';

const reference=[
 {assignments:[['B','Q']],program:{A:'5-x'}},
 {assignments:[['B','R']],program:{A:'x+1'}},
 {assignments:[['B','T']],program:{A:'3x/4+2'}},
 {assignments:[['B','P'],['C','T']],program:{A:'x+2'}},
 {assignments:[['B','U'],['C','R']],program:{A:'x+2',B:'-x/5+28/5'}},
 {assignments:[['B','R'],['C','V']],program:{A:'4x/3+2',C:'x-7'}}
] as const;
for(const [i,l] of salvageLinear.entries()){
 test(l.title+' has exactly one complete assignment over all legal mounts and programmable straight-line destinations',()=>{
  const audit=auditLinearPlacement(l),ref=reference[i],key=ref.assignments.map(([id,a])=>id+':'+a).join(',');
  assert.deepEqual([...audit.winners.keys()],[key],l.id+' layouts='+audit.layouts+' routes='+audit.routes);
  const expected=l.anchorPuzzle!.inventory.length===1?l.anchorPuzzle!.anchors.length:l.anchorPuzzle!.anchors.length*(l.anchorPuzzle!.anchors.length-1);
  assert.equal(audit.layouts,expected);assert.ok(audit.routes>=expected);
  assert.deepEqual(audit.winners.get(key)!.order,l.anchorPuzzle!.inventory.length===1?['A','B']:['A','B','C']);
  for(const mode of ['cadet','pilot','ace'] as const){
   const state=createLevelState(modeBudget(mode,l),1,mode==='cadet');
   let layout=l,plan=initialSalvageLinearPlan(l);
   assert.equal(countReady(plan),i<2?1:0);assert.equal(canLaunchAnchorPuzzle(layout,plan,state),false);
   for(const [id,mount] of ref.assignments){const next=moveAnchorInPlanning(layout,plan,state,id,mount);layout=next.level;plan=next.plan;}
   for(const [id,text] of Object.entries(ref.program))if(!getPlanEntry(plan,id)?.equation)plan=editPlan(plan,id,{text,equation:parseLinearEquation(text)});
   assert.equal(canLaunchAnchorPuzzle(layout,plan,state),true);
   const result=simulateRoute(layout,snapshotPlan(plan)!);
   assert.equal(result.event.kind,'exit',l.id+' '+mode);
   assert.deepEqual(result.legs.map(leg=>leg.cannonId),l.anchorPuzzle!.inventory.length===1?['A','B']:['A','B','C']);
  }
  console.info(l.id+': '+audit.layouts+' assignments, '+audit.routes+' possible flight programs, '+audit.shortcuts+' rejected shortcuts, '+audit.winners.size+' winning assignment');
 });
}
test('six-level progression keeps stable IDs and steps up placement complexity while preserving the original curriculum',()=>{
 assert.deepEqual(salvageLinear.map(l=>l.anchorPuzzle!.anchors.length),[3,4,5,5,6,7]);
 assert.deepEqual(salvageLinear.map(l=>l.anchorPuzzle!.inventory.length),[1,1,1,2,2,2]);
 assert.ok(salvageLinear.every(l=>l.cannons.length===1&&l.anchorPuzzle!.inventory.some(i=>i.lockedShape!==undefined)));
 for(const [i,l] of salvageLinear.entries())assert.equal(nextSalvageLinear(l.id),salvageLinear[i+1]);
 assert.equal(nextSalvageLinear('anchor-demo-linear'),undefined);
 assert.equal(levels.length,96);assert.equal(worlds.length,8);
 assert.ok(salvageLinear.every(l=>levels.includes(l)));
});
