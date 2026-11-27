import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyDesign,placeObject,moveObject,deleteObject,buildCustomLevel,decodeDesign,decodeCustomFile,encodeCustomFile,designKey,createCustomWorkshopStore,CUSTOM_KEY,CUSTOM_LIBRARY_KEY,MAX_CUSTOM_LEVELS,CUSTOM_FILE_LIMIT,MAX_CANNONS,snapPoint} from '../src/game/customLevels';
import {cannonTypes,type CannonType} from '../src/game/cannons';
import {parseCannonEquation} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {recordCompletion,emptyProgress} from '../src/game/progress';
import {levels} from '../src/levels/catalog';
import {modeBudget,type LearningMode} from '../src/game/learningModes';
import {recordStars} from '../src/game/progress';
import type {CustomDesign} from '../src/game/customLevels';
function example(){
 let d=placeObject(emptyDesign(),'linear',{x:1,y:3}).design;
 d=placeObject(d,'linear',{x:4,y:6}).design;d=placeObject(d,'exit',{x:8,y:2}).design;
 d=placeObject(d,'wall',{x:2.5,y:.5},{x:2.75,y:3.25}).design;
 return d;
}
function stateFor(d:CustomDesign,wrong=false,mode:LearningMode='cadet',failFirst=false){
 const l=buildCustomLevel(d),r=simulateRoute(l,new Map([['A',parseCannonEquation('x+2','linear')],['B',parseCannonEquation(wrong?'-2x+14':'10-x','linear')]]));
 let initial=createLevelState(modeBudget(mode,l),1,mode==='cadet');
 if(failFirst){const bad=simulateRoute(l,new Map([['A',parseCannonEquation('x+2','linear')],['B',parseCannonEquation('-2x+14','linear')]]));const flight=beginAttempt(initial,bad);initial=finishAttempt(flight,flight.active!.id);}
 const active=beginAttempt(initial,r),resolved=finishAttempt(active,active.active!.id);
 if(!resolved.celebration)return resolved;
 const c=resolved.celebration;return finishCelebration(advanceCelebration(resolved,c.id,c.count,c.count),c.id);
}
function storage(){const map=new Map<string,string>();return {map,storage:{getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);}}};}
test('custom workshop supports every cannon family, terrain dimensions, gems, start selection and deletion',()=>{
 let d=emptyDesign();
 for(const [i,type] of (Object.keys(cannonTypes) as CannonType[]).entries())d=placeObject(d,type,{x:i+1,y:3}).design;
 assert.deepEqual(d.cannons.map(c=>c.type),Object.keys(cannonTypes));assert.equal(d.startId,'A');
 d=placeObject(d,'linear',{x:8,y:3}).design;assert.equal(d.cannons.length,MAX_CANNONS);
 assert.throws(()=>placeObject(d,'linear',{x:9,y:3}),/limit/i);
 d=deleteObject(d,'A');assert.equal(d.startId,'B');d=placeObject(d,'linear',{x:1,y:4}).design;assert.equal(d.cannons.at(-1)!.id,'A');
 d=placeObject(d,'exit',{x:10,y:4}).design;d=placeObject(d,'exit',{x:11,y:5}).design;assert.deepEqual(d.exit,{x:11,y:5});
 const w=placeObject(d,'wall',{x:2,y:1},{x:2.5,y:2.5});d=w.design;
 assert.deepEqual(d.obstacles[0].bounds,{minX:2,maxX:2.5,minY:1,maxY:2.5});
 d=moveObject(d,w.selected,{x:3,y:1.5});assert.deepEqual(d.obstacles[0].bounds,{minX:3,maxX:3.5,minY:1.5,maxY:3});
 d=placeObject(d,'gem',{x:4,y:4}).design;assert.equal(d.gems.length,1);
 assert.deepEqual(snapPoint({x:4.26,y:-1},.5,d.bounds),{x:4.5,y:0});
});
test('a draft must be structurally playable, with real anchor clearance, supports and staging, before testing',()=>{
 assert.throws(()=>buildCustomLevel(emptyDesign()),/cannon/);
 const d=example(),l=buildCustomLevel(d);
 assert.equal(l.cannons.length,2);assert.equal(l.obstacles[0].id,'base-floor');assert.equal(l.creatures,5);
 assert.throws(()=>buildCustomLevel({...d,exit:null}),/exit/);
 assert.throws(()=>buildCustomLevel(moveObject(d,'A',{x:2.5,y:2})),/solid terrain/);
 assert.throws(()=>buildCustomLevel(moveObject(d,'A',{x:0,y:3})),/grid edges/);
 assert.throws(()=>buildCustomLevel(moveObject(d,'A',{x:4,y:6})),/separate/);
 assert.throws(()=>decodeDesign({...d,bounds:{minX:0,maxX:400,minY:0,maxY:9}}));
 assert.equal(levels.length,72);assert.ok(!levels.some(l=>l.id==='custom-workshop-level'));
});
test('confirmation needs completion of the exact current design, not failure or a pending celebration',()=>{
 const mem=storage(),store=createCustomWorkshopStore(mem.storage),d=example();
 store.edit(d);const t=store.beginTest();assert.equal(store.confirm(),false);assert.throws(()=>store.download(),/confirm/);
 assert.equal(store.completeTest(t,stateFor(d,true)),false);assert.equal(store.read().tested,false);
 const success=stateFor(d);assert.equal(success.phase,'success');assert.equal(success.saved,5);
 assert.equal(store.completeTest({...t,key:'stale'},success),false);
 assert.equal(store.completeTest(t,{...success,phase:'celebrating'}),false);
 assert.equal(store.completeTest(t,success),true);assert.equal(store.read().confirmed,false);
 assert.equal(store.confirm(),true);assert.equal(store.read().confirmed,true);
 const raw=store.download();assert.equal(designKey(decodeCustomFile(raw)),t.key);
 assert.ok(!raw.includes('x+2')&&!raw.includes('10-x')&&!raw.includes('confirmed'));
 assert.equal(createCustomWorkshopStore(mem.storage).read().confirmed,true);
 const updated=moveObject(d,'exit',{x:9,y:2});store.edit(updated);
 assert.equal(store.read().tested,false);assert.equal(store.read().confirmed,false);assert.equal(store.completeTest(t,success),false);
 store.edit(d);assert.equal(store.confirm(),false);assert.throws(()=>store.download());
 assert.ok(mem.map.has(CUSTOM_LIBRARY_KEY));
 const p=emptyProgress();assert.equal(recordCompletion(p,t.level,'cadet',success),p);
});
test('upload accepts only a supported, bounded design and cannot transfer confirmation or executable content',()=>{
 const d=example(),raw=encodeCustomFile(d),store=createCustomWorkshopStore();
 store.edit(d);store.completeTest(store.beginTest(),stateFor(d));store.confirm();
 const imported=JSON.parse(raw);imported.confirmed=true;imported.tested=true;imported.design.supports={A:{kind:'wall'}};imported.design.equations={A:'alert(1)'};
 store.importFile(JSON.stringify(imported));assert.equal(store.read().confirmed,false);assert.equal(store.read().tested,false);
 assert.equal(designKey(store.read().design),designKey(d));
 for(const invalid of ['garbage','null','{"format":"cannon-graphs-level","version":2}',' '.repeat(CUSTOM_FILE_LIMIT+1),encodeCustomFile(emptyDesign()),JSON.stringify({...imported,design:{...d,world:99}}),JSON.stringify({...imported,design:{...d,cannons:[{...d.cannons[0],type:'__proto__'}]}})]){
  assert.throws(()=>store.importFile(invalid));assert.equal(designKey(store.read().design),designKey(d));
 }
 const blocked=createCustomWorkshopStore({getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}});
 blocked.edit(d);assert.equal(blocked.read().persisted,false);assert.equal(blocked.completeTest(blocked.beginTest(),stateFor(d)),true);assert.equal(blocked.confirm(),true);
});

test('migrate an old confirmed workshop draft without deleting its original storage or losing proof',()=>{
 const mem=storage(),d=example(),key=designKey(d);
 const raw=JSON.stringify({version:1,design:d,tested:key,confirmed:key});mem.map.set(CUSTOM_KEY,raw);
 const store=createCustomWorkshopStore(mem.storage),entry=store.library().entries[0];
 assert.equal(store.library().entries.length,1);assert.equal(entry.confirmed,true);assert.equal(entry.tested,true);
 assert.equal(designKey(entry.design),key);assert.equal(store.read().id,entry.id);
 assert.equal(mem.map.get(CUSTOM_KEY),raw);assert.ok(mem.map.has(CUSTOM_LIBRARY_KEY));
 assert.equal(createCustomWorkshopStore(mem.storage).library().entries.length,1);
});
test('new drafts, imports, copies, selections and deletions have independent identities and proofs',()=>{
 const mem=storage(),store=createCustomWorkshopStore(mem.storage),d=example();
 assert.equal(store.library().entries.length,0);
 store.edit(d);const first=store.read().id!;assert.ok(store.completeTest(store.beginTest(),stateFor(d)));assert.ok(store.confirm());
 const second=store.newDraft();assert.notEqual(first,second);assert.equal(store.read().design.cannons.length,0);
 const imported=store.importFile(encodeCustomFile(d));assert.equal(store.library().entries.length,3);
 assert.equal(store.library().entries.find(e=>e.id===imported)!.source,'imported');
 assert.equal(store.read().confirmed,false);assert.throws(()=>store.download(imported));
 const copy=store.duplicate(first);assert.equal(store.read().design.title,d.title+' (copy)');assert.equal(store.read().tested,false);
 store.select(first);assert.ok(store.read().confirmed);assert.equal(store.download(first),encodeCustomFile(d));
 store.remove(second);store.remove(copy);assert.equal(store.library().entries.length,2);
 const restored=createCustomWorkshopStore(mem.storage);assert.equal(restored.read().id,first);assert.ok(restored.read().confirmed);
 assert.notEqual(restored.newDraft(),copy);assert.equal(restored.library().entries.length,3);
});
test('play records are separate by level, revision and learning mode; normal play never confirms the design',()=>{
 const mem=storage(),store=createCustomWorkshopStore(mem.storage),d=example();
 store.edit(d);const id=store.read().id!,testRun=store.beginTest();
 for(const mode of ['cadet','pilot','ace'] as const){
  const run=store.beginPlay(id,mode),state=stateFor(d,false,mode,true);
  assert.equal(state.phase,'success');
  assert.equal(store.completeTest(run,state),false);assert.equal(store.completePlay(testRun,state),undefined);
  const result=store.completePlay(run,state)!;assert.ok(result.improved);assert.equal(result.record.bestAttempts,2);
  assert.equal(store.completePlay(run,state)!.improved,false);
  assert.equal(store.completePlay(run,stateFor(d,true,mode)),undefined);
  assert.equal(store.completePlay(run,stateFor(d,false,mode))!.record.bestAttempts,1);
  assert.equal(recordStars(store.library().entries[0].records[mode],{creatures:5},mode),mode==='cadet'?null:3);
 }
 assert.equal(store.read().tested,false);assert.equal(store.confirm(),false);
 assert.ok(store.completeTest(testRun,stateFor(d)));assert.ok(store.confirm());
 const other=store.importFile(encodeCustomFile(d));assert.deepEqual(store.library().entries.find(e=>e.id===other)!.records,{});
 const stale=store.beginPlay(id,'pilot');store.select(id);store.edit({...d,title:'Changed'});store.edit(d);
 assert.equal(store.completePlay(stale,stateFor(d,false,'pilot')),undefined);assert.equal(store.completeTest(testRun,stateFor(d)),false);
 assert.deepEqual(store.library().entries.find(e=>e.id===id)!.records,{});assert.equal(store.read().confirmed,false);
 const restored=createCustomWorkshopStore(mem.storage);assert.equal(restored.library().entries.length,2);
 assert.deepEqual(restored.library().entries.find(e=>e.id===id)!.records,{});
 assert.ok(!restored.library().entries.some(e=>e.confirmed));
});
test('invalid saved entries cannot erase the valid entries or bypass confirmation and capacity limits',()=>{
 const mem=storage(),store=createCustomWorkshopStore(mem.storage),d=example();store.edit(d);
 const id=store.read().id!,raw=JSON.parse(mem.map.get(CUSTOM_LIBRARY_KEY)!);
 raw.entries[0].testedKey='wrong';raw.entries[0].confirmedKey=designKey(d);raw.entries[0].recordKey=designKey(d);raw.entries[0].records={pilot:{bestAttempts:999,gems:[]},ace:{bestAttempts:1,gems:['unknown']}};
 raw.entries.push({id:'bad',design:null});mem.map.set(CUSTOM_LIBRARY_KEY,JSON.stringify(raw));
 const recovered=createCustomWorkshopStore(mem.storage);assert.equal(recovered.library().entries.length,1);assert.equal(recovered.read().id,id);
 assert.equal(recovered.read().confirmed,false);assert.equal(recovered.library().entries[0].records.pilot,undefined);assert.deepEqual(recovered.library().entries[0].records.ace?.gems,[]);
 const full=createCustomWorkshopStore();for(let i=0;i<MAX_CUSTOM_LEVELS;i++)full.newDraft();assert.throws(()=>full.newDraft(),/full/);assert.equal(full.library().entries.length,MAX_CUSTOM_LEVELS);
});
