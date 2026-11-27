import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyDesign,placeObject,moveObject,deleteObject,buildCustomLevel,decodeDesign,decodeCustomFile,encodeCustomFile,designKey,createCustomWorkshopStore,CUSTOM_KEY,CUSTOM_FILE_LIMIT,MAX_CANNONS,snapPoint} from '../src/game/customLevels';
import {cannonTypes,type CannonType} from '../src/game/cannons';
import {parseCannonEquation} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {recordCompletion,emptyProgress} from '../src/game/progress';
import {levels} from '../src/levels/catalog';
import type {CustomDesign} from '../src/game/customLevels';
function example(){
 let d=placeObject(emptyDesign(),'linear',{x:1,y:3}).design;
 d=placeObject(d,'linear',{x:4,y:6}).design;d=placeObject(d,'exit',{x:8,y:2}).design;
 d=placeObject(d,'wall',{x:2.5,y:.5},{x:2.75,y:3.25}).design;
 return d;
}
function stateFor(d:CustomDesign,wrong=false){
 const l=buildCustomLevel(d),r=simulateRoute(l,new Map([['A',parseCannonEquation('x+2','linear')],['B',parseCannonEquation(wrong?'-2x+14':'10-x','linear')]]));
 const initial=createLevelState(5,1,true),active=beginAttempt(initial,r),resolved=finishAttempt(active,active.active!.id);
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
 assert.equal(store.completeTest(t.key,stateFor(d,true)),false);assert.equal(store.read().tested,false);
 const success=stateFor(d);assert.equal(success.phase,'success');assert.equal(success.saved,5);
 assert.equal(store.completeTest('stale',success),false);
 assert.equal(store.completeTest(t.key,{...success,phase:'celebrating'}),false);
 assert.equal(store.completeTest(t.key,success),true);assert.equal(store.read().confirmed,false);
 assert.equal(store.confirm(),true);assert.equal(store.read().confirmed,true);
 const raw=store.download();assert.equal(designKey(decodeCustomFile(raw)),t.key);
 assert.ok(!raw.includes('x+2')&&!raw.includes('10-x')&&!raw.includes('confirmed'));
 assert.equal(createCustomWorkshopStore(mem.storage).read().confirmed,true);
 const updated=moveObject(d,'exit',{x:9,y:2});store.edit(updated);
 assert.equal(store.read().tested,false);assert.equal(store.read().confirmed,false);assert.equal(store.completeTest(t.key,success),false);
 store.edit(d);assert.equal(store.confirm(),false);assert.throws(()=>store.download());
 assert.ok(mem.map.has(CUSTOM_KEY));
 const p=emptyProgress();assert.equal(recordCompletion(p,t.level,'cadet',success),p);
});
test('upload accepts only a supported, bounded design and cannot transfer confirmation or executable content',()=>{
 const d=example(),raw=encodeCustomFile(d),store=createCustomWorkshopStore();
 store.edit(d);store.completeTest(store.beginTest().key,stateFor(d));store.confirm();
 const imported=JSON.parse(raw);imported.confirmed=true;imported.tested=true;imported.design.supports={A:{kind:'wall'}};imported.design.equations={A:'alert(1)'};
 store.importFile(JSON.stringify(imported));assert.equal(store.read().confirmed,false);assert.equal(store.read().tested,false);
 assert.equal(designKey(store.read().design),designKey(d));
 for(const invalid of ['garbage','null','{"format":"cannon-graphs-level","version":2}',' '.repeat(CUSTOM_FILE_LIMIT+1),encodeCustomFile(emptyDesign()),JSON.stringify({...imported,design:{...d,world:99}}),JSON.stringify({...imported,design:{...d,cannons:[{...d.cannons[0],type:'__proto__'}]}})]){
  assert.throws(()=>store.importFile(invalid));assert.equal(designKey(store.read().design),designKey(d));
 }
 const blocked=createCustomWorkshopStore({getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}});
 blocked.edit(d);assert.equal(blocked.read().persisted,false);assert.equal(blocked.completeTest(blocked.beginTest().key,stateFor(d)),true);assert.equal(blocked.confirm(),true);
});
