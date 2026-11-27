import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyDesign,placeObject,moveObject,deleteObject,setCustomLift,setCustomAnchorMode,addCustomInventory,setCustomInventory,customCannonCount,objectPoint,buildCustomLevel,decodeDesign,encodeCustomFile,decodeCustomFile,designKey,createCustomWorkshopStore,CUSTOM_LIBRARY_KEY,type CustomDesign} from '../src/game/customLevels';
import {repositionAnchor} from '../src/game/anchorPlacement';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {modeBudget,type LearningMode} from '../src/game/learningModes';
import type {Level} from '../src/levels/schema';

function design(arc=false){
 let d=setCustomAnchorMode(emptyDesign(),true);
 d=placeObject(d,'linear',{x:1,y:2}).design;d=placeObject(d,'exit',{x:9,y:arc?6:2}).design;
 for(const p of [{x:3,y:4},{x:5,y:6},{x:7,y:3},{x:6,y:2}])d=placeObject(d,'anchor',p).design;
 d=addCustomInventory(d,arc?'quadratic':'linear').design;
 return setCustomInventory(d,'B',{type:arc?'quadratic':'linear',direction:1,lockedShape:arc?'-x^2/2+7x':'-x'});
}
function done(l:Level,mode:LearningMode='cadet',line='x+1'){
 const r=simulateRoute(l,new Map([['A',parseLinearEquation(line)]]));
 const active=beginAttempt(createLevelState(modeBudget(mode,l),1,mode==='cadet'),r),resolved=finishAttempt(active,active.active!.id),c=resolved.celebration;
 return c?finishCelebration(advanceCelebration(resolved,c.id,c.count,c.count),c.id):resolved;
}
test('anchor drafts allow authoring in either order, share the cannon ID namespace and never silently discard parts',()=>{
 let d=setCustomAnchorMode(emptyDesign(),true);assert.equal(d.world,8);assert.throws(()=>buildCustomLevel(d));
 d=addCustomInventory(d,'quadratic').design;assert.equal(d.anchorPuzzle!.inventory[0].id,'A');
 d=placeObject(d,'linear',{x:1,y:2}).design;assert.equal(d.startId,'B');
 const placed=placeObject(d,'anchor',{x:5,y:6});d=placed.design;assert.equal(placed.selected,'m1');
 assert.deepEqual(objectPoint(d,'m1'),{x:5,y:6});assert.equal(objectPoint(d,'A'),undefined);
 d=moveObject(d,'m1',{x:5.25,y:6.5});assert.deepEqual(d.anchorPuzzle!.anchors[0].position,{x:5.25,y:6.5});
 assert.equal(customCannonCount(d),2);assert.throws(()=>setCustomAnchorMode(d,false),/Delete/);
 assert.throws(()=>setCustomLift(d,'B',{minY:1,maxY:8,lockedShape:'x'}),/cannot be combined/);
 d=deleteObject(deleteObject(d,'m1'),'A');assert.equal(setCustomAnchorMode(d,false).anchorPuzzle,undefined);
 const ordinary=placeObject(emptyDesign(),'linear',{x:1,y:2}).design;
 assert.throws(()=>setCustomAnchorMode(setCustomLift(ordinary,'A',{minY:1,maxY:8,lockedShape:'x'}),true),/Remove vertical lifts/);
 assert.throws(()=>placeObject(ordinary,'anchor',{x:3,y:3}),/Enable anchor placement/);
});
test('version 3 retains only authored mounts and inventory; v1/v2 preserve existing compatibility',()=>{
 const d=design(),l=buildCustomLevel(d),raw=encodeCustomFile(d);
 assert.equal(JSON.parse(raw).version,3);assert.deepEqual(decodeCustomFile(raw),d);assert.equal(l.cannons.length,1);
 for(const version of [1,2])assert.throws(()=>decodeCustomFile(JSON.stringify({...JSON.parse(raw),version})),/version 3/);
 const ordinary=placeObject(placeObject(emptyDesign(),'linear',{x:1,y:2}).design,'exit',{x:9,y:2}).design;
 assert.equal(JSON.parse(encodeCustomFile(ordinary)).version,1);
 assert.equal(JSON.parse(encodeCustomFile({...ordinary,world:7})).version,2);
 const malicious=JSON.parse(raw);malicious.confirmed=true;malicious.design.equations={A:'x+1'};malicious.design.anchorPuzzle.assignments={B:'m2'};
 malicious.design.anchorPuzzle.inventory[0].position={x:5,y:6};malicious.design.anchorPuzzle.inventory[0].constant=11;
 const store=createCustomWorkshopStore();store.importFile(JSON.stringify(malicious));
 assert.deepEqual(store.read().design,d);assert.equal(store.read().confirmed,false);assert.equal(store.read().tested,false);
});
test('invalid locked shapes, ID collisions, incompatible mechanics, impossible mounts and incomplete designs cannot be imported or playtested',()=>{
 const d=design(),p=d.anchorPuzzle!,item=p.inventory[0];
 for(const lockedShape of ['-x+1','x^2','alert(1)',''])assert.throws(()=>setCustomInventory(d,'B',{...item,lockedShape}));
 assert.throws(()=>decodeDesign({...d,anchorPuzzle:{...p,inventory:[{...item,id:'A'}]}}));
 assert.throws(()=>decodeDesign({...d,anchorPuzzle:{...p,inventory:[{...item,type:'cubic'}]}}));
 assert.throws(()=>decodeDesign({...d,world:7}));
 assert.throws(()=>decodeDesign({...emptyDesign(),world:8}));
 assert.throws(()=>buildCustomLevel({...d,anchorPuzzle:{...p,anchors:[]}}),/enough candidate mounts/);
 assert.throws(()=>buildCustomLevel({...d,anchorPuzzle:{...p,inventory:[]}}),/inventory cannon/);
 assert.throws(()=>buildCustomLevel(moveObject(d,'m1',{x:1,y:2})),/overlaps/);
 assert.throws(()=>buildCustomLevel(moveObject(d,'m1',{x:0,y:4})),/outside usable grid/);
 assert.throws(()=>buildCustomLevel(moveObject(d,'m1',{x:5,y:6})),/overlaps/);
 assert.throws(()=>buildCustomLevel(placeObject(d,'wall',{x:3,y:3}).design),/overlaps terrain/);
});
test('playtest requires every part and actual allowed mounts; confirmation and mode records are revision-bound',()=>{
 const mem=new Map<string,string>(),storage={getItem:(k:string)=>mem.get(k)??null,setItem:(k:string,v:string)=>{mem.set(k,v);}};
 const store=createCustomWorkshopStore(storage),d=design();store.edit(d);const run=store.beginTest();
 const solved=repositionAnchor(run.level,'B','m2'),state=done(solved);
 assert.equal(state.phase,'success');
 assert.equal(store.completeTest(run,state),false);
 assert.equal(store.completeTest(run,done(solved,'cadet','2'),solved),false);
 assert.equal(store.completeTest(run,state,repositionAnchor(run.level,'B','m1')),false);
 assert.equal(store.completeTest(run,state,{...solved,exit:{x:10,y:2}}),false);
 assert.equal(store.completeTest(run,state,{...solved,anchorPuzzle:{...solved.anchorPuzzle!,inventory:[{...solved.anchorPuzzle!.inventory[0],lockedShape:'x'}]}}),false);
 assert.equal(store.completeTest(run,state,solved),true);assert.equal(store.confirm(),true);
 const raw=JSON.parse(store.download());assert.equal(raw.version,3);assert.deepEqual(raw.design,d);
 assert.equal(raw.design.cannons.length,1);assert.equal('position' in raw.design.anchorPuzzle.inventory[0],false);
 const play=store.beginPlay(run.id,'pilot'),placed=repositionAnchor(play.level,'B','m2');
 assert.ok(store.completePlay(play,done(placed,'pilot'),placed)?.improved);
 const restored=createCustomWorkshopStore(storage);assert.ok(restored.read().confirmed);assert.equal(restored.library().entries[0].records.pilot?.bestAttempts,1);assert.ok(mem.has(CUSTOM_LIBRARY_KEY));
 store.edit(moveObject(d,'m1',{x:3,y:3.5}));assert.equal(store.read().tested,false);assert.equal(store.read().confirmed,false);
 assert.deepEqual(store.library().entries[0].records,{});assert.equal(store.completeTest(run,state,solved),false);assert.throws(()=>store.download());
});
test('quadratic confirmation rejects a different arc that connects the same marked endpoints',()=>{
 const d=design(true),store=createCustomWorkshopStore();store.edit(d);const run=store.beginTest();
 const legal=repositionAnchor(run.level,'B','m2'),state=done(legal);assert.equal(state.phase,'success');
 const changed={...legal,anchorPuzzle:{...legal.anchorPuzzle!,inventory:[{...legal.anchorPuzzle!.inventory[0],lockedShape:'-x^2/4+7x/2'}]}};
 const falseProof=done(changed);assert.equal(falseProof.phase,'success');
 assert.equal(store.completeTest(run,falseProof,legal),false);
 assert.equal(store.completeTest(run,state,legal),true);assert.equal(store.confirm(),true);
});
