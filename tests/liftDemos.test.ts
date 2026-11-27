import {test} from 'node:test';
import assert from 'node:assert/strict';
import {liftDemos,initialDemoPlan} from '../src/levels/liftDemos';
import {validateLevel} from '../src/levels/schema';
import {levelSupports} from '../src/levels/supports';
import {moveLiftInPlanning} from '../src/game/movableCannons';
import {createLevelState} from '../src/game/levelState';
import {snapshotPlan} from '../src/game/flightPlan';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
for(const [index,demo] of liftDemos.entries())test(demo.title+' uses a real two-leg relay and starts misaligned',()=>{
 validateLevel(demo);assert.equal(levelSupports(demo).length,2);
 const plan=initialDemoPlan(demo);assert.notEqual(simulateRoute(demo,snapshotPlan(plan)!).event.kind,'exit');
 const moved=moveLiftInPlanning(demo,plan,createLevelState(5),'B',index===0?5:3);
 assert.equal(simulateRoute(moved.level,snapshotPlan(moved.plan)!).event.kind,'exit');
 assert.equal(simulateRoute(moved.level,snapshotPlan(moved.plan)!).legs.length,2);
 assert.equal(levelSupports(moved.level).length,2);
});
