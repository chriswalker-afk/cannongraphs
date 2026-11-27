import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyDesign,placeObject,moveObject,setCustomLift,buildCustomLevel,decodeDesign,encodeCustomFile,decodeCustomFile,designKey,createCustomWorkshopStore,CUSTOM_LIBRARY_KEY,type CustomDesign} from '../src/game/customLevels';
import {repositionLift} from '../src/game/movableCannons';
import {lockedLiftEquation,lockedLiftText} from '../src/levels/liftSpec';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {modeBudget,type LearningMode} from '../src/game/learningModes';
import type {Level} from '../src/levels/schema';

function design(){
 let d=placeObject(emptyDesign(),'linear',{x:1,y:2}).design;
 d=placeObject(d,'exit',{x:7,y:7}).design;
 return setCustomLift(d,'A',{minY:1,maxY:8,lockedShape:'x/2'});
}
function done(l:Level,mode:LearningMode='cadet',equations=new Map<string,ReturnType<typeof parseLinearEquation>>()){
 const result=simulateRoute(l,equations);
 const active=beginAttempt(createLevelState(modeBudget(mode,l),1,mode==='cadet'),result),resolved=finishAttempt(active,active.active!.id);
 const c=resolved.celebration;
 return c?finishCelebration(advanceCelebration(resolved,c.id,c.count,c.count),c.id):resolved;
}
test('optional lift metadata round trips in version 2 while ordinary v1 bytes and design keys remain stable',()=>{
 const d=design(),raw=encodeCustomFile(d);
 assert.equal(JSON.parse(raw).version,2);assert.equal(designKey(decodeCustomFile(raw)),designKey(d));
 const ordinary=setCustomLift(d,'A',null);
 assert.equal(JSON.parse(encodeCustomFile(ordinary)).version,1);assert.ok(!encodeCustomFile(ordinary).includes('lift'));
 assert.deepEqual(decodeCustomFile(encodeCustomFile(ordinary)),ordinary);
 assert.throws(()=>decodeCustomFile(JSON.stringify({...JSON.parse(raw),version:1})),/version 2/);
 assert.equal(lockedLiftText(lockedLiftEquation(buildCustomLevel(d).cannons[0])),'y = 1/2x + 3/2');
 const moved=moveObject(d,'A',{x:2.5,y:99});
 assert.deepEqual(moved.cannons[0].position,{x:2.5,y:8});
 assert.deepEqual(moved.cannons[0].lift,d.cannons[0].lift);
});
test('invalid shape, rail and family are rejected; uploaded fields cannot inject a solution or confirmation',()=>{
 const d=design(),c=d.cannons[0];
 for(const lift of [{minY:0,maxY:8,lockedShape:'x'},{minY:1,maxY:9,lockedShape:'x'},{minY:1,maxY:2.5,lockedShape:'x'},{minY:2,maxY:2,lockedShape:'x'},{minY:1,maxY:8,lockedShape:'x+1'},{minY:1,maxY:8,lockedShape:'alert(1)'},{minY:1,maxY:8,lockedShape:'x^2'}]){
  assert.throws(()=>decodeDesign({...d,cannons:[{...c,lift}]}));
 }
 assert.throws(()=>decodeDesign({...d,cannons:[{...c,type:'cubic'}]}));
 const quad=setCustomLift({...d,cannons:[{...c,type:'quadratic',lift:undefined}]},'A',{minY:1,maxY:8,lockedShape:'-x^2/2+4x'});
 assert.equal(decodeCustomFile(encodeCustomFile(quad)).cannons[0].lift?.lockedShape,'-x^2/2+4x');
 const raw=JSON.parse(encodeCustomFile(d));raw.confirmed=true;raw.design.equations={A:'y=x'};raw.design.cannons[0].lift.extra='solved';
 const store=createCustomWorkshopStore();store.importFile(JSON.stringify(raw));
 assert.equal(store.read().tested,false);assert.equal(store.read().confirmed,false);assert.deepEqual(store.read().design,d);
});
test('moved starting cannon can confirm and earn mode records without saving its solved height',()=>{
 const map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);}};
 const store=createCustomWorkshopStore(storage),d=design();store.edit(d);
 const run=store.beginTest(),solved=repositionLift(run.level,'A',4),state=done(solved);
 assert.equal(state.phase,'success');
 assert.equal(store.completeTest(run,done(run.level),run.level),false);
 assert.equal(store.completeTest(run,state),false);
 assert.equal(store.completeTest(run,state,{...solved,exit:{x:8,y:7}}),false);
 assert.equal(store.completeTest(run,state,{...solved,cannons:[{...solved.cannons[0],position:{x:1,y:9}}]}),false);
 assert.equal(store.completeTest(run,state,{...solved,cannons:[{...solved.cannons[0],lift:{...solved.cannons[0].lift!,lockedShape:'x'}}]}),false);
 assert.equal(store.completeTest(run,state,solved),true);assert.equal(store.confirm(),true);
 assert.equal(store.read().design.cannons[0].position.y,2);
 assert.equal(decodeCustomFile(store.download()).cannons[0].position.y,2);
 const play=store.beginPlay(run.id,'pilot'),played=repositionLift(play.level,'A',4);
 assert.ok(store.completePlay(play,done(played,'pilot'),played)?.improved);
 assert.equal(store.library().entries[0].records.pilot?.bestAttempts,1);
 const restored=createCustomWorkshopStore(storage);assert.ok(restored.read().confirmed);assert.ok(map.has(CUSTOM_LIBRARY_KEY));
 store.edit(setCustomLift(d,'A',{...d.cannons[0].lift!,maxY:7}));
 assert.equal(store.read().confirmed,false);assert.equal(store.completeTest(run,state,solved),false);assert.deepEqual(store.library().entries[0].records,{});
});
test('relay confirmation checks the actual moved intermediate anchor, not merely start and exit',()=>{
 let d=placeObject(emptyDesign(),'linear',{x:1,y:3}).design;
 d=placeObject(d,'linear',{x:4,y:2}).design;d=placeObject(d,'exit',{x:8,y:2}).design;
 d=setCustomLift(d,'B',{minY:1,maxY:8,lockedShape:'-x'});
 const store=createCustomWorkshopStore();store.edit(d);const run=store.beginTest();
 const solved=repositionLift(run.level,'B',6),state=done(solved,'cadet',new Map([['A',parseLinearEquation('x+2')]]));
 assert.equal(state.phase,'success');assert.equal(store.completeTest(run,state),false);
 assert.equal(store.completeTest(run,state,solved),true);assert.equal(store.read().design.cannons[1].position.y,2);
});

test('Foundry theme alone requires v2 while old theme files retain their original format',()=>{
 const ordinary=setCustomLift(design(),'A',null),foundry={...ordinary,world:7};
 const raw=encodeCustomFile(foundry);assert.equal(JSON.parse(raw).version,2);
 assert.equal(decodeCustomFile(raw).world,7);
 assert.throws(()=>decodeCustomFile(JSON.stringify({...JSON.parse(raw),version:1})),/version 2/);
 assert.equal(JSON.parse(encodeCustomFile(ordinary)).version,1);
});
