import {test} from 'node:test';
import assert from 'node:assert/strict';
import {salvageQuadratic} from '../src/levels/salvageQuadratic';
import {salvageLevels,initialSalvagePlan,nextSalvageLevel,salvageSceneryVariant} from '../src/levels/salvage';
import {auditLinearPlacement} from './helpers/salvageAudit';
import {getPlanEntry,countReady,editPlan,snapshotPlan} from '../src/game/flightPlan';
import {moveAnchorInPlanning,canLaunchAnchorPuzzle} from '../src/game/anchorPlacement';
import {createLevelState} from '../src/game/levelState';
import {modeBudget,modeObjective} from '../src/game/learningModes';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {parseLinearEquation,isQuadratic,equationCoefficients} from '../src/engine/equations/linear';
import {lockedAnchorEquation,materializeAnchorLayout} from '../src/levels/anchorSpec';
import {levels,worlds} from '../src/levels/catalog';

// Reference data deliberately lives only in tests.
const reference=[
 {assignments:[['B','R']],program:{A:'x/2+1'},order:['A','B']},
 {assignments:[['B','R'],['C','Q']],program:{A:'x/2+2'},order:['A','B','C']},
 {assignments:[['B','Q'],['C','S']],program:{A:'x+1',C:'-3x/4+37/4'},order:['A','B','C']},
 {assignments:[['B','Q'],['C','R'],['D','S']],program:{A:'x+2'},order:['A','B','C','D']},
 {assignments:[['B','R'],['C','P'],['D','T']],program:{A:'2x/3+1'},order:['A','C','B','D']},
 {assignments:[['B','P'],['C','Q'],['D','R']],program:{A:'2x/3+2',C:'-x/2+15/2'},order:['A','B','C','D']}
] as const;
for(const [i,l] of salvageQuadratic.entries()){
 test(l.title+' has exactly one complete assignment over all legal mounts and programmable straight-line destinations',()=>{
  const ref=reference[i],key=ref.assignments.map(([id,a])=>id+':'+a).join(',');
  const audit=auditLinearPlacement(l);
  assert.deepEqual([...audit.winners.keys()],[key],l.id+' layouts='+audit.layouts+' routes='+audit.routes);
  const expected=Array.from({length:l.anchorPuzzle!.inventory.length},(_,j)=>l.anchorPuzzle!.anchors.length-j).reduce((a,b)=>a*b,1);
  assert.equal(audit.layouts,expected);assert.ok(audit.routes>=expected);assert.deepEqual(audit.winners.get(key)!.order,ref.order);
  for(const mode of ['cadet','pilot','ace'] as const){
   const state=createLevelState(modeBudget(mode,l),1,mode==='cadet');
   let layout=l,plan=initialSalvagePlan(l);
   assert.equal(countReady(plan),0);assert.equal(canLaunchAnchorPuzzle(layout,plan,state),false);
   for(const [id,mount] of ref.assignments){const next=moveAnchorInPlanning(layout,plan,state,id,mount);layout=next.level;plan=next.plan;}
   for(const [id,text] of Object.entries(ref.program))plan=editPlan(plan,id,{text,equation:parseLinearEquation(text)});
   assert.equal(canLaunchAnchorPuzzle(layout,plan,state),true);
   const result=simulateRoute(layout,snapshotPlan(plan)!);
   assert.equal(result.event.kind,'exit',l.id+' '+mode);assert.deepEqual(result.legs.map(leg=>leg.cannonId),ref.order);
   assert.ok(Math.abs(result.end.x-l.exit.x)<1e-7&&Math.abs(result.end.y-l.exit.y)<1e-7);
  }
  console.info(l.id+': '+audit.layouts+' assignments, '+audit.routes+' possible flight programs, '+audit.shortcuts+' rejected shortcuts, '+audit.winners.size+' winning assignment');
 });
 test(l.title+' retains the exact nonconstant coefficients at every candidate mount',()=>{
  for(const item of l.anchorPuzzle!.inventory.filter(c=>c.type==='quadratic')){
   let coefficients:unknown;
   for(const a of l.anchorPuzzle!.anchors){
    const layout=materializeAnchorLayout(l,new Map([[item.id,a.id]]));
    const eq=lockedAnchorEquation(layout,layout.cannons.find(c=>c.id===item.id)!)!;
    assert.ok(isQuadratic(eq));
    const actual=equationCoefficients(eq).slice(0,-1);
    if(coefficients===undefined)coefficients=actual;else assert.deepEqual(actual,coefficients);
   }
  }
 });
}
test('all twelve puzzles form one practice sequence and preserve the existing official curriculum',()=>{
 assert.equal(salvageLevels.length,12);assert.equal(new Set(salvageLevels.map(l=>l.id)).size,12);
 assert.deepEqual(salvageQuadratic.map(l=>l.anchorPuzzle!.anchors.length),[5,6,7,8,9,10]);
 assert.deepEqual(salvageQuadratic.map(l=>l.anchorPuzzle!.inventory.length),[1,2,2,3,3,3]);
 assert.ok(salvageQuadratic.every(l=>l.anchorPuzzle!.inventory.some(i=>i.type==='quadratic'&&i.lockedShape!==undefined)));
 for(const [i,l] of salvageLevels.entries()){
  assert.equal(nextSalvageLevel(l.id),salvageLevels[i+1]);assert.equal(salvageSceneryVariant(l.id),Math.floor(i/3));
  assert.equal(countReady(initialSalvagePlan(l)),i<2?1:0);
 }
 assert.equal(nextSalvageLevel('anchor-demo-linear'),undefined);
 assert.equal(levels.length,84);assert.equal(worlds.length,7);
 assert.ok(salvageLevels.every(l=>!levels.some(x=>x.id===l.id)));
 assert.match(modeObjective('ace',salvageQuadratic[2]),/Mount P \(2.25, 2.21875\)/);
});
