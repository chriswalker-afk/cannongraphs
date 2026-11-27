import {test} from 'node:test';
import assert from 'node:assert/strict';
import {levels,worlds} from '../src/levels/catalog';
import {beginSelection,selectCategory,worldsInCategory,categoryForWorld,selectWorld as chooseDestination,selectMode,selectLevel,backToWorlds,selectedWorld,selectedLevel,summarizeLevel} from '../src/game/levelSelection';
import {identityForWorld,worldIdentities} from '../src/game/worldIdentity';
import type {SelectionState} from '../src/game/levelSelection';
const selectWorld=(s:SelectionState,w:number)=>selectMode(chooseDestination(s,w),'pilot');
test('fresh selection begins with seven destinations and requires a world then a level',()=>{
 const start=beginSelection();assert.equal(start.step,'worlds');assert.equal(selectedLevel(start),undefined);
 assert.equal(selectLevel(start,'1-01'),start);
 const world=selectWorld(start,1);assert.equal(world.step,'levels');assert.equal(selectedWorld(world),worlds[0]);assert.equal(selectedLevel(world),undefined);
 const chosen=selectLevel(world,'1-01');assert.equal(selectedLevel(chosen),levels[0]);
});
test('every one of the 84 levels is immediately selectable without any completion state',()=>{
 const ids=new Set<string>();
 for(const w of worlds){
  const s=selectWorld(beginSelection(undefined,false,'pilot',categoryForWorld(w)),w.number);assert.equal(selectedWorld(s),w);
  assert.equal(selectedLevel(s),undefined);
  for(const l of w.levels){const picked=selectLevel(s,l.id);assert.equal(selectedLevel(picked),l);ids.add(l.id);}
 }
 assert.equal(ids.size,84);assert.equal(ids.size,levels.length);
});
test('invalid worlds, unknown levels and cross-world IDs cannot start an unintended puzzle',()=>{
 const start=beginSelection('bad-id',true);assert.equal(start.step,'worlds');
 assert.equal(selectWorld(start,0),start);assert.equal(selectWorld(start,99),start);
 const s=selectWorld(start,4);assert.equal(selectLevel(s,'3-01'),s);assert.equal(selectLevel(s,'missing'),s);
 assert.equal(selectWorld(s,2),s);assert.equal(selectedLevel(s),undefined);
});
test('returning from gameplay opens the current world and highlights its actual level',()=>{
 const s=beginSelection('6-r12',true);assert.equal(s.step,'levels');assert.equal(selectedWorld(s),worlds[5]);assert.equal(selectedLevel(s),levels[71]);
 const back=backToWorlds(s);assert.equal(back.step,'worlds');assert.equal(selectedLevel(back),undefined);
 assert.equal(selectedLevel(selectWorld(back,6)),levels[71]);
 assert.equal(selectedLevel(selectWorld(back,1)),undefined);
});
test('fresh home Play still shows all worlds, with only the last played level remembered',()=>{
 const start=beginSelection('3-r07');assert.equal(start.step,'worlds');
 const first=selectWorld(start,3);assert.equal(selectedLevel(first)?.id,'3-r07');
 const edited=selectLevel(first,'3-r09');assert.equal(selectedLevel(edited)?.id,'3-r09');
 // Browsing without launching does not rewrite the remembered level.
 assert.equal(selectedLevel(selectWorld(backToWorlds(edited),3))?.id,'3-r07');
 assert.equal(selectedLevel(selectWorld(backToWorlds(edited),4)),undefined);
});
test('all world cards have unique visual identities and mathematically relevant family descriptions',()=>{
 assert.equal(Object.keys(worldIdentities).length,worlds.length);
 assert.equal(new Set(worlds.map(w=>identityForWorld(w.number).accent)).size,7);
 for(const w of worlds){
  const i=identityForWorld(w.number),families=new Set(w.levels.flatMap(l=>l.cannons.map(c=>c.type)));
  assert.ok(i.focus&&i.description&&i.families.length);
  assert.ok(i.families.every(f=>families.has(f)));
 }
 assert.throws(()=>identityForWorld(99));
});
test('details are derived from each selected puzzle, including exact objectives and family counts',()=>{
 for(const w of worlds)for(const [i,l] of w.levels.entries()){
  const summary=summarizeLevel(l);
  assert.equal(summary.index,i+1);assert.equal(summary.title,l.title);assert.equal(summary.objective,l.objective);
  assert.equal(summary.cannonCount,l.cannons.length);assert.equal(summary.tier.count,w.number===7?Math.floor(i/3)+1:l.cannons.length);assert.equal(summary.pipCount,l.creatures);
  assert.equal(summary.liftCount,l.cannons.filter(c=>c.lift).length);assert.equal(summary.gemCount,l.gems?.length??0);assert.equal(summary.families.reduce((n,f)=>n+f.count,0),l.cannons.length);
  for(const f of summary.families)assert.equal(f.count,l.cannons.filter(c=>c.type===f.type).length);
 }
 const finale=summarizeLevel(levels[71]);assert.equal(finale.families.length,4);assert.equal(finale.gemCount,7);
});

test('normal and broken categories show only their own worlds, remember category on back, and never change IDs',()=>{
 const normal=beginSelection();
 assert.equal(normal.step,'worlds');if(normal.step==='worlds')assert.equal(normal.category,'normal');
 assert.equal(worldsInCategory('normal').length,6);assert.equal(worldsInCategory('normal').reduce((n,w)=>n+w.levels.length,0),72);
 assert.equal(chooseDestination(normal,7),normal);
 const broken=selectCategory(normal,'broken');assert.equal(worldsInCategory('broken').length,1);assert.equal(worldsInCategory('broken')[0],worlds[6]);
 assert.equal(chooseDestination(broken,1),broken);
 const levelsState=selectWorld(broken,7);assert.equal(selectedWorld(levelsState),worlds[6]);assert.equal(selectCategory(levelsState,'normal'),levelsState);
 const picked=selectLevel(levelsState,worlds[6].levels[4].id),back=backToWorlds(picked);
 assert.equal(back.step,'worlds');if(back.step==='worlds')assert.equal(back.category,'broken');
 assert.equal(selectedLevel(beginSelection(worlds[6].levels[4].id,true,'ace')),worlds[6].levels[4]);
 const last=beginSelection(worlds[6].levels[4].id);if(last.step==='worlds')assert.equal(last.category,'broken');
 assert.equal(selectCategory(broken,'normal').step,'worlds');
});
