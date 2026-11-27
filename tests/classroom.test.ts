import {test} from 'node:test';
import assert from 'node:assert/strict';
import {levels,worlds} from '../src/levels/catalog';
import {referenceSolutions} from './fixtures/referenceSolutions';
import {referenceLayout} from './fixtures/referenceLayout';
import {parseCannonEquation,evaluateCannonEquation} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {CAPTURE_EPSILON} from '../src/engine/simulation/linearAttempt';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {learningModes,modeBudget} from '../src/game/learningModes';
import {levelStars} from '../src/game/scoring';
import {emptyProgress,recordCompletion,getRecord,summarizeProgress,parseProgress} from '../src/game/progress';
import {earnedAchievementIds,achievementDefinitions} from '../src/game/achievements';
import {pipCosmetics,cosmeticUnlocked} from '../src/game/pipCosmetics';
import {cannonCosmetics,cannonCosmeticUnlocked} from '../src/game/cannonCosmetics';
import {bankedGems} from '../src/animations/gemTimeline';
import {gridTicks,integerTicks,labelStep} from '../src/rendering/grid';
test('unit grid is independent from label density, including negative and zoomed ranges',()=>{
 for(const scale of [3,8,15,24,28,32,70]){
  const ticks=gridTicks(-5.2,6.1,scale);assert.deepEqual(ticks.units,[-5,-4,-3,-2,-1,0,1,2,3,4,5,6]);
  assert.ok(ticks.labels.includes(0));assert.ok(ticks.labels.every(k=>ticks.units.includes(k)));
  assert.ok(ticks.step>=1);if(scale>=28)assert.deepEqual(ticks.labels,ticks.units);
 }
 assert.deepEqual(integerTicks(-.9,.9),[0]);assert.deepEqual(integerTicks(2.1,2.9),[]);assert.equal(labelStep(NaN),1);
});
test('all 84 mathematical routes complete in all 252 level/mode combinations and persist valid records',()=>{
 let progress=emptyProgress(),runs=0;
 assert.equal(referenceSolutions.length,7);
 for(const [wi,w] of worlds.entries()){
  assert.equal(referenceSolutions[wi].length,12);
  for(const [li,l] of w.levels.entries()){
   const references=referenceSolutions[wi][li],equations=new Map(l.cannons.map(c=>[c.id,parseCannonEquation(references[c.id],c.type)]));
   const layout=referenceLayout(l),route=simulateRoute(layout,equations);
   assert.equal(route.event.kind,'exit',l.id);
   assert.deepEqual(route.legs.map(leg=>leg.cannonId),l.cannons.map(c=>c.id),l.id);
   assert.ok(Math.abs(route.end.x-l.exit.x)<=CAPTURE_EPSILON&&Math.abs(route.end.y-l.exit.y)<=CAPTURE_EPSILON,l.id);
   for(const leg of route.legs)for(const t of [0,.25,.5,.75,1]){
    const p=leg.pointAt(t),y=evaluateCannonEquation(equations.get(leg.cannonId)!,p.x);
    assert.ok(Number.isFinite(y)&&Math.abs(p.y-y)<1e-6,l.id);
   }
   for(const mode of learningModes){
    const budget=modeBudget(mode.id,l);
    let s=beginAttempt(createLevelState(budget,1,mode.unlimited),route);
    s=finishAttempt(s,s.active!.id);
    if(s.celebration){const {id,count}=s.celebration;s=advanceCelebration(s,id,count,count);s=finishCelebration(s,id);}
    assert.equal(s.phase,'success',l.id+' '+mode.id);
    assert.equal(s.saved,budget);assert.equal(levelStars(s),mode.unlimited?null:3);
    progress=recordCompletion(progress,l,mode.id,s,layout);const record=getRecord(progress,l.id,mode.id);
    assert.equal(record?.bestAttempts,1,l.id);assert.deepEqual(new Set(record!.gems),new Set(bankedGems(route)));runs++;
   }
  }
 }
 assert.equal(runs,252);
 const restored=parseProgress(JSON.stringify(progress)),summary=summarizeProgress(restored);
 assert.deepEqual(restored,progress);assert.equal(summary.completed,levels.length);assert.equal(summary.gems,summary.gemTotal);
 for(const mode of learningModes){assert.equal(summary.modes[mode.id].completed,84);assert.equal(summary.modes[mode.id].stars,mode.unlimited?0:252);}
 const earned=earnedAchievementIds(restored);assert.equal(earned.size,achievementDefinitions.length);
 assert.ok(pipCosmetics.every(c=>cosmeticUnlocked(c,earned)));assert.ok(cannonCosmetics.every(c=>cannonCosmeticUnlocked(c,earned)));
});
