import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateLevel,type Level} from '../src/levels/schema';
import {anchorAssignments,lockedAnchorEquation,unplacedInventory,type AnchorPuzzle} from '../src/levels/anchorSpec';
import {repositionAnchor,moveAnchorInPlanning,canLaunchAnchorPuzzle} from '../src/game/anchorPlacement';
import {createLevelFlightPlan,editPlan,getPlanEntry,planStatus,countReady,snapshotPlan,recordFlightEvidence} from '../src/game/flightPlan';
import {evaluateEquation,isQuadratic,parseLinearEquation,parseQuadraticEquation} from '../src/engine/equations/linear';
import {cannonEquationKey} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {playedLayout,routeMatchesLayout} from '../src/game/playedLayout';
import {attemptFeedback} from '../src/game/attemptFeedback';
import {modeAttemptFeedback} from '../src/game/modeFeedback';
import {diagnoseFlight} from '../src/game/flightDiagnosis';
import {levels,worlds} from '../src/levels/catalog';

const fixture=():Level=>({id:'anchor-fixture',world:8,title:'Placement test',objective:'Mount the cannon',bounds:{minX:-1,maxX:11,minY:-1,maxY:9},creatures:5,startId:'A',
 cannons:[{id:'A',type:'linear',direction:1,position:{x:0,y:1}}],exit:{x:8,y:1},obstacles:[{id:'floor',kind:'floor',bounds:{minX:-1,maxX:11,minY:-1,maxY:-.6}}],
 anchorPuzzle:{anchors:[{id:'P',position:{x:2,y:3}},{id:'Q',position:{x:4,y:5}},{id:'R',position:{x:6,y:3}},{id:'S',position:{x:5,y:2}}],
 inventory:[{id:'B',type:'linear',direction:1,lockedShape:'-x'}]}});
const first=()=>new Map([['A',parseLinearEquation('x+1')]]);
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
const program=(p:ReturnType<typeof createLevelFlightPlan>,id:string,text:string)=>editPlan(p,id,{text,equation:parseLinearEquation(text)});
const state=()=>createLevelState(5);
const twoParts=():Level=>{
 const l=fixture();return {...l,exit:{x:9,y:4},anchorPuzzle:{anchors:[...l.anchorPuzzle!.anchors,{id:'T',position:{x:7,y:2}}],inventory:[...l.anchorPuzzle!.inventory,{id:'C',type:'linear',direction:1}]}};
};

test('unplaced cannons are inventory entries, not fake positioned targets or launchable drafts',()=>{
 const l=fixture();validateLevel(l);
 assert.deepEqual(l.cannons.map(c=>c.id),['A']);assert.deepEqual(unplacedInventory(l).map(c=>c.id),['B']);
 const p=program(createLevelFlightPlan(l),'A','x+1');
 assert.equal(p.length,2);assert.equal(countReady(p),1);assert.equal(getPlanEntry(p,'B')!.locked,true);
 assert.equal(getPlanEntry(p,'B')!.unplaced,true);assert.equal(snapshotPlan(p),null);
 assert.equal(canLaunchAnchorPuzzle(l,p,state()),false);
 assert.throws(()=>simulateRoute(l,first()),/Place every inventory cannon/);
 const mounted=moveAnchorInPlanning(l,p,state(),'B','Q');
 assert.deepEqual([...anchorAssignments(mounted.level)],[['B','Q']]);
 assert.deepEqual(mounted.level.cannons[1].position,{x:4,y:5});
 assert.equal(getPlanEntry(mounted.plan,'B')!.text,'y = -x + 9');
 assert.equal(canLaunchAnchorPuzzle(mounted.level,mounted.plan,state()),true);
 assert.equal(editPlan(mounted.plan,'B',{text:'x',equation:parseLinearEquation('x')}),mounted.plan);
 assert.equal(l.cannons.length,1);assert.equal(l.anchorPuzzle,mounted.level.anchorPuzzle);
 const removed=moveAnchorInPlanning(mounted.level,mounted.plan,state(),'B',null);
 assert.deepEqual(removed.level.cannons,l.cannons);assert.equal(getPlanEntry(removed.plan,'B')!.equation,null);
 assert.equal(getPlanEntry(removed.plan,'B')!.unplaced,true);assert.equal(canLaunchAnchorPuzzle(removed.level,removed.plan,state()),false);
});

test('partially useful decoys receive OR reach but only Q does both; empty mounts do not capture',()=>{
 const l=fixture(),results=l.anchorPuzzle!.anchors.map(a=>simulateRoute(repositionAnchor(l,'B',a.id),first()));
 assert.notEqual(results[0].event.kind,'exit');assert.deepEqual(results[0].legs.map(x=>x.cannonId),['A','B']);
 assert.equal(results[1].event.kind,'exit');assert.deepEqual(results[1].legs.map(x=>x.cannonId),['A','B']);
 assert.deepEqual(results[1].legs[0].end,{x:4,y:5});near(results[1].end.y,1);
 // P is on the first line, R on the second. Both are empty at the winner.
 assert.equal(results[2].legs.length,1);assert.notEqual(results[2].event.kind,'exit');
 const decoy=repositionAnchor(l,'B','R'),eq=lockedAnchorEquation(decoy,decoy.cannons[1])!;assert.ok(!isQuadratic(eq));assert.equal(eq.exactIntercept.numerator,'9');
 assert.equal(results[3].legs.length,1);
 assert.deepEqual(l.anchorPuzzle!.anchors.filter((_,i)=>results[i].event.kind==='exit').map(a=>a.id),['Q']);
 const good=repositionAnchor(l,'B','Q');
 assert.throws(()=>simulateRoute(good,new Map([...first(),['B',parseLinearEquation('-x+7')]])),/Locked anchor equation/);
 assert.equal(simulateRoute(good,new Map([...first(),['B',parseLinearEquation('9-x')]])).event.kind,'exit');
});

test('ordinary inventory cannon retains its draft across moves and unmounts, and occupied mounts reject drops',()=>{
 const l=twoParts();validateLevel(l);
 let p=program(createLevelFlightPlan(l),'A','x+1');
 assert.equal(program(p,'C','x-5'),p);
 const b=moveAnchorInPlanning(l,p,state(),'B','Q');
 assert.throws(()=>moveAnchorInPlanning(b.level,b.plan,state(),'C','Q'),/occupied/);
 assert.throws(()=>repositionAnchor(b.level,'C','missing'),/Unknown anchor/);
 assert.throws(()=>repositionAnchor(b.level,'A','P'),/Not an inventory/);
 const c=moveAnchorInPlanning(b.level,b.plan,state(),'C','T');
 p=program(c.plan,'C','x-5');
 const win=simulateRoute(c.level,snapshotPlan(p)!);assert.equal(win.event.kind,'exit');
 assert.deepEqual(win.legs.map(x=>x.cannonId),['A','B','C']);
 const tested=recordFlightEvidence(p,p,win);assert.deepEqual(tested.map(planStatus),['tested','tested','tested']);
 const moved=moveAnchorInPlanning(c.level,tested,state(),'C','S');
 assert.deepEqual(moved.plan.map(planStatus),['ready','ready','ready']);
 assert.equal(getPlanEntry(moved.plan,'C')!.text,'x-5');
 const unmounted=moveAnchorInPlanning(moved.level,moved.plan,state(),'C',null);
 assert.equal(getPlanEntry(unmounted.plan,'C')!.text,'x-5');assert.equal(planStatus(getPlanEntry(unmounted.plan,'C')!),'empty');
 assert.equal(snapshotPlan(unmounted.plan),null);assert.equal(countReady(unmounted.plan),2);
 const restored=moveAnchorInPlanning(unmounted.level,unmounted.plan,state(),'C','T');
 assert.equal(simulateRoute(restored.level,snapshotPlan(restored.plan)!).event.kind,'exit');
 assert.deepEqual(restored.level.cannons.map(x=>x.id),['A','B','C']);
 assert.equal(repositionAnchor(restored.level,'C','T'),restored.level);
 assert.equal(simulateRoute(c.level,snapshotPlan(tested)!).event.kind,'exit');
});

test('locked rational coefficients survive horizontal and vertical relocation, including leftward quadratic flight',()=>{
 const l=fixture();l.cannons[0]={id:'A',type:'linear',position:{x:8,y:1},direction:-1};
 l.exit={x:0,y:3};
 l.anchorPuzzle={anchors:[{id:'P',position:{x:2.5,y:3}},{id:'Q',position:{x:4,y:3}},{id:'R',position:{x:6,y:3}}],inventory:[{id:'B',type:'quadratic',direction:-1,lockedShape:'x^2/4-x'}]};
 validateLevel(l);
 const a=repositionAnchor(l,'B','P'),b=repositionAnchor(a,'B','Q');
 const e=lockedAnchorEquation(a,a.cannons[1])!,f=lockedAnchorEquation(b,b.cannons[1])!;
 assert.ok(isQuadratic(e)&&isQuadratic(f));assert.deepEqual(e.exactQuadratic,f.exactQuadratic);assert.deepEqual(e.exactLinear,f.exactLinear);
 assert.deepEqual(e.exactConstant,{numerator:'63',denominator:'16'});assert.deepEqual(f.exactConstant,{numerator:'3',denominator:'1'});
 near(evaluateEquation(e,2.5),3);near(evaluateEquation(f,4),3);
 assert.equal(cannonEquationKey(f),cannonEquationKey(parseQuadraticEquation('x^2/4-x+3')));
 const result=simulateRoute(b,new Map([['A',parseLinearEquation('-x/2+5')]]));
 assert.equal(result.event.kind,'exit');assert.deepEqual(result.legs.map(x=>x.cannonId),['A','B']);assert.equal(result.legs[1].direction,-1);
 const linear={...l,anchorPuzzle:{...l.anchorPuzzle,inventory:[{id:'B',type:'linear' as const,direction:-1 as const,lockedShape:'x/3'}]}};
 const m=repositionAnchor(linear,'B','P'),g=lockedAnchorEquation(m,m.cannons[1])!;
 assert.ok(!isQuadratic(g));assert.deepEqual(g.exactIntercept,{numerator:'13',denominator:'6'});
});

test('placement and launch freeze during flight; shortcut reaches exit but fails the required complete relay',()=>{
 const l=fixture(),p=program(createLevelFlightPlan(l),'A','1'),m=moveAnchorInPlanning(l,p,state(),'B','Q');
 assert.equal(canLaunchAnchorPuzzle(m.level,m.plan,state()),true);
 const result=simulateRoute(m.level,snapshotPlan(m.plan)!);
 assert.deepEqual(result.event,{kind:'incomplete-relay',unusedCannonIds:['B']});
 assert.deepEqual(result.legs[0].event,result.event);assert.equal(result.legs.length,1);
 assert.match(attemptFeedback(result),/skipped cannon B/);assert.equal(modeAttemptFeedback('ace',result),'Incomplete relay — use every cannon.');
 assert.equal(diagnoseFlight(m.level,result,snapshotPlan(m.plan)!)?.kind,'incomplete-relay');
 const active=beginAttempt(state(),result),retry=finishAttempt(active,active.active!.id);
 assert.equal(retry.phase,'retry');assert.equal(retry.failed,1);assert.equal(retry.saved,0);
 assert.equal(moveAnchorInPlanning(m.level,m.plan,active,'B','R').level,m.level);
 assert.equal(canLaunchAnchorPuzzle(m.level,m.plan,active),false);
 const fixed=moveAnchorInPlanning(m.level,program(m.plan,'A','x+1'),retry,'B','P');
 assert.notEqual(fixed.level,m.level);
 const good=simulateRoute(m.level,first()),flying=beginAttempt(state(),good),celebrating=finishAttempt(flying,flying.active!.id);
 for(const phase of [flying,celebrating])assert.equal(moveAnchorInPlanning(m.level,m.plan,phase,'B',null).level,m.level);
 const cel=celebrating.celebration!,success=finishCelebration(advanceCelebration(celebrating,cel.id,cel.count,cel.count),cel.id);
 assert.equal(success.phase,'success');assert.equal(success.saved,5);
 assert.equal(moveAnchorInPlanning(m.level,m.plan,success,'B','P').level,m.level);
});

test('canonical played-layout validation accepts only allowed assignments, and checks all actual relay anchors',()=>{
 const l=fixture(),good=repositionAnchor(l,'B','Q'),other=repositionAnchor(l,'B','P'),win=simulateRoute(good,first());
 assert.deepEqual(playedLayout(l,good),good);assert.equal(playedLayout(l,l),undefined);
 assert.equal(routeMatchesLayout(good,win),true);assert.equal(routeMatchesLayout(other,win),false);
 assert.equal(routeMatchesLayout(l,win),false);
 assert.equal(playedLayout(l,{...good,exit:{x:9,y:1}}),undefined);
 assert.equal(playedLayout(l,{...good,cannons:[good.cannons[0],{...good.cannons[1],direction:-1}]}),undefined);
 assert.equal(playedLayout(l,{...good,cannons:[good.cannons[0],{...good.cannons[1],position:{x:4,y:4}}]}),undefined);
 const forged={...good,anchorPuzzle:{...good.anchorPuzzle!,inventory:[{...good.anchorPuzzle!.inventory[0],lockedShape:'x'}]}};
 assert.equal(playedLayout(l,forged),undefined);
 const shortcut=simulateRoute(good,new Map([['A',parseLinearEquation('1')]]));
 assert.equal(routeMatchesLayout(good,shortcut),false);
});

test('invalid anchor definitions and placements are rejected without changing the original',()=>{
 const l=fixture(),spec=l.anchorPuzzle!;
 const bad=(p:AnchorPuzzle)=>assert.throws(()=>validateLevel({...l,anchorPuzzle:p}));
 bad({...spec,anchors:[]});bad({...spec,inventory:[]});
 bad({...spec,anchors:[...spec.anchors,{id:'P',position:{x:7,y:6}}]});
 bad({...spec,anchors:[...spec.anchors,{id:'X',position:{x:4,y:5}}]});
 bad({...spec,anchors:[...spec.anchors,{id:'A',position:{x:7,y:6}}]});
 bad({...spec,anchors:[...spec.anchors,{id:'X',position:{x:8,y:1}}]});
 bad({...spec,anchors:[...spec.anchors,{id:'X',position:{x:100,y:1}}]});
 bad({...spec,anchors:[...spec.anchors,{id:'X',position:{x:3,y:NaN}}]});
 for(const shape of ['x+1','x^2','<script>',''])bad({...spec,inventory:[{...spec.inventory[0],lockedShape:shape}]});
 bad({...spec,inventory:[{...spec.inventory[0],id:'A'}]});
 bad({...spec,inventory:[spec.inventory[0],spec.inventory[0]]});
 assert.throws(()=>validateLevel({...l,obstacles:[...l.obstacles,{id:'block',kind:'wall',bounds:{minX:3.9,maxX:4.1,minY:4.8,maxY:5.2}}]}),/Anchor overlaps terrain/);
 assert.throws(()=>validateLevel({...l,cannons:[...l.cannons,{id:'B',type:'quadratic',direction:1,position:{x:4,y:5}}]}),/Invalid mounted cannon/);
 assert.equal(l.cannons.length,1);
});

test('existing curriculum remains seven worlds and 84 levels; ordinary flight behavior is unchanged',()=>{
 assert.equal(worlds.length,7);assert.equal(levels.length,84);assert.ok(levels.every(l=>!l.anchorPuzzle));
 const ordinary={...fixture(),anchorPuzzle:undefined,cannons:[...fixture().cannons,{id:'B',type:'linear' as const,direction:1 as const,position:{x:4,y:5}}]};
 assert.equal(simulateRoute(ordinary,new Map([['A',parseLinearEquation('1')],['B',parseLinearEquation('-x+9')]])).event.kind,'exit');
});
