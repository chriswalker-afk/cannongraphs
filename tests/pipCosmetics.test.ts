import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pipSlots,pipCosmetics,defaultPipLook,cosmeticFor,cosmeticsForAchievement,cosmeticUnlocked,sanitizePipLook,canEquipPipLook,choosePipCosmetic,samePipLook,pipArtColours,type PipLook} from '../src/game/pipCosmetics';
import {createPipLookStore,parsePipLook,PIP_LOOK_KEY} from '../src/game/pipLookStore';
import {PROGRESS_KEY,type ProgressStorage} from '../src/game/progressStore';
import {achievementDefinitions,earnedAchievementIds} from '../src/game/achievements';
import {emptyProgress,decodeProgress,recordCompletion} from '../src/game/progress';
import {levels} from '../src/levels/catalog';
import {parseCannonEquation} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {createPip} from '../src/rendering/pip';
import {createLaunchVisual} from '../src/rendering/launchVisual';
import {createRapidVisual} from '../src/rendering/rapidVisual';
import type {PipPose} from '../src/animations/launch';
const none=earnedAchievementIds(emptyProgress()),all=new Set(achievementDefinitions.map(a=>a.id));
const l=levels[0],route=simulateRoute(l,new Map([['A',parseCannonEquation('x','linear')]]));
const memory=()=>{
 const data=new Map<string,string>();let writes=0;
 const storage:ProgressStorage={getItem:key=>data.get(key)??null,setItem(key,value){writes++;data.set(key,value);}};
 return {storage,data,writes:()=>writes};
};
const encode=(look:unknown)=>JSON.stringify({version:1,look});
test('catalog has four independent slots, 24 unique parts, eight free parts and a reward for every existing achievement',()=>{
 assert.equal(pipCosmetics.length,24);assert.equal(new Set(pipCosmetics.map(c=>c.slot+':'+c.id)).size,24);
 assert.equal(pipCosmetics.filter(c=>cosmeticUnlocked(c,none)).length,8);
 assert.equal(pipCosmetics.filter(c=>cosmeticUnlocked(c,all)).length,24);
 for(const c of pipCosmetics)if(c.achievement)assert.ok(all.has(c.achievement),c.name);
 for(const a of achievementDefinitions)assert.ok(cosmeticsForAchievement(a.id).length,a.id);
 for(const slot of pipSlots)assert.ok(cosmeticUnlocked(cosmeticFor(slot,defaultPipLook[slot])!,none));
});
test('real successful Pilot flight unlocks exactly its actual achievement rewards, not every cosmetic',()=>{
 let s=beginAttempt(createLevelState(5),route);s=finishAttempt(s,s.active!.id);
 const {id,count}=s.celebration!;s=advanceCelebration(s,id,count,count);s=finishCelebration(s,id);
 const earned=earnedAchievementIds(recordCompletion(emptyProgress(),l,'pilot',s));
 for(const [slot,id] of [['fur','lavender'],['goggles','brass'],['accessory','gem'],['accessory','scarf']] as const)assert.ok(cosmeticUnlocked(cosmeticFor(slot,id)!,earned));
 for(const [slot,id] of [['fur','nebula'],['headgear','astral'],['goggles','emerald']] as const)assert.ok(!cosmeticUnlocked(cosmeticFor(slot,id)!,earned));
});
test('full catalog progress unlocks every part while retaining original free parts',()=>{
 const rows=Object.fromEntries(levels.map(l=>[l.id,Object.fromEntries(['cadet','pilot','ace'].map(mode=>[mode,{bestAttempts:1,gems:(l.gems??[]).map(g=>g.id)}]))]));
 const earned=earnedAchievementIds(decodeProgress({version:1,records:rows}));
 assert.equal(earned.size,all.size);assert.ok(pipCosmetics.every(c=>cosmeticUnlocked(c,earned)));
});
test('locked parts may be previewed without mutating equipped look; equip rejects a partially locked draft',()=>{
 const mem=memory(),store=createPipLookStore(mem.storage),original=store.read(none);
 const free=choosePipCosmetic(original,'fur','mint'),locked=choosePipCosmetic(free,'headgear','crown');
 assert.equal(locked.headgear,'crown');assert.equal(original.headgear,'aviator');
 assert.ok(canEquipPipLook(free,none));assert.ok(!canEquipPipLook(locked,none));
 assert.equal(store.equip(locked,none).equipped,false);assert.equal(mem.writes(),0);
 assert.deepEqual(store.read(none),original);
 assert.equal(choosePipCosmetic(free,'goggles','unknown'),free);
 assert.equal(choosePipCosmetic(free,'fur','mint'),free);
 assert.ok(store.equip(free,none).equipped);assert.deepEqual(store.read(none),free);
});
test('unknown, malformed or no-longer-earned parts fall back independently to the defaults',()=>{
 for(const raw of [null,'{','null','[]','{"version":2,"look":{}}','{"version":1,"look":null}'])assert.deepEqual(parsePipLook(raw,none),defaultPipLook);
 const mixed={fur:'mint',goggles:'brass',headgear:'wrong',accessory:'bow',extra:'ignored'};
 assert.deepEqual(parsePipLook(encode(mixed),none),{...defaultPipLook,fur:'mint',accessory:'bow'});
 assert.deepEqual(parsePipLook(encode(mixed),new Set(['perfect-pilot'])),{...defaultPipLook,fur:'mint',goggles:'brass',accessory:'bow'});
 assert.deepEqual(sanitizePipLook({fur:'__proto__',goggles:4,headgear:{},accessory:null},all),defaultPipLook);
 assert.ok(!canEquipPipLook({fur:'mint'},all));assert.ok(!canEquipPipLook(null,all));
});
test('outfit saves separately from progress, survives reload and restores original on explicit equip',()=>{
 const mem=memory();mem.data.set(PROGRESS_KEY,'existing progress');
 const store=createPipLookStore(mem.storage),look:PipLook={fur:'nebula',goggles:'aurora',headgear:'astral',accessory:'wing'};
 assert.ok(store.equip(look,all).persisted);assert.equal(mem.data.get(PROGRESS_KEY),'existing progress');
 assert.equal(JSON.parse(mem.data.get(PIP_LOOK_KEY)!).version,1);
 assert.deepEqual(createPipLookStore(mem.storage).read(all),look);
 assert.deepEqual(createPipLookStore(mem.storage).read(none),defaultPipLook);
 assert.ok(store.equip(defaultPipLook,all).persisted);assert.deepEqual(createPipLookStore(mem.storage).read(all),defaultPipLook);
 assert.equal(mem.writes(),2);
});
test('quota and storage access failures keep a valid equipped look in session memory, with retry',()=>{
 const noStorage=createPipLookStore(),look={...defaultPipLook,fur:'rose',accessory:'bow'};
 const first=noStorage.equip(look,none);assert.ok(first.equipped);assert.equal(first.persisted,false);assert.deepEqual(noStorage.read(none),look);
 const mem=memory();let blocked=true;
 const store=createPipLookStore({getItem:key=>mem.storage.getItem(key),setItem(key,value){if(blocked)throw Error('quota');mem.storage.setItem(key,value);}});
 assert.equal(store.equip(look,none).persisted,false);assert.deepEqual(store.read(none),look);assert.ok(!store.persisted());
 blocked=false;assert.ok(store.equip(look,none).persisted);assert.deepEqual(createPipLookStore(mem.storage).read(none),look);
 const denied=createPipLookStore({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});
 assert.deepEqual(denied.read(none),defaultPipLook);assert.ok(!denied.persisted());assert.ok(denied.equip(look,none).equipped);assert.deepEqual(denied.read(none),look);
});
test('pure palette selection retains original varied crew and uniform chosen fur, with independent goggles',()=>{
 const original=pipArtColours(defaultPipLook,0);assert.equal(original.fur,'#ffd78c');assert.equal(original.lens,'#a6e1ee');
 assert.notEqual(pipArtColours(defaultPipLook,1).fur,original.fur);
 assert.deepEqual(pipArtColours(defaultPipLook,-1),pipArtColours(defaultPipLook,4));
 const look={...defaultPipLook,fur:'ocean',goggles:'emerald'};
 assert.deepEqual(pipArtColours(look,0),pipArtColours(look,7));assert.notEqual(pipArtColours(look).lens,original.lens);
 assert.ok(samePipLook(look,{...look}));assert.ok(!samePipLook(look,defaultPipLook));
});
// A small SVG DOM double checks every art branch and sprite factory without
// introducing a browser dependency. It does not replace visual browser QA.
class SvgElement{
 readonly attrs=new Map<string,string>();readonly children:SvgElement[]=[];
 constructor(readonly tag:string){}
 setAttribute(key:string,value:string){this.attrs.set(key,value);}
 append(...nodes:SvgElement[]){this.children.push(...nodes);}
 *walk():Generator<SvgElement>{yield this;for(const c of this.children)yield* c.walk();}
}
function withSvg(fn:()=>void){
 const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElementNS:(_ns:string,tag:string)=>new SvgElement(tag)}});
 try{fn();}finally{if(previous)Object.defineProperty(globalThis,'document',previous);else Reflect.deleteProperty(globalThis,'document');}
}
test('every cosmetic renders in every pose with the selected appearance and finite SVG attributes',()=>withSvg(()=>{
 const poses:PipPose[]=['idle','excited','flying','splat','rolling','disappointed','walking'];
 for(const c of pipCosmetics){
  const look=choosePipCosmetic(defaultPipLook,c.slot,c.id),parent=new SvgElement('svg');
  const sprite=createPip(parent as unknown as Element,2,look);
  for(const pose of poses){sprite.setPose(pose);sprite.setStretch(pose==='splat'?1.25:1);sprite.setWalkCycle(pose==='walking'?.4:undefined);
   for(const n of parent.walk())for(const value of n.attrs.values())assert.ok(!/NaN|Infinity|undefined/.test(value),c.name+' '+pose+' '+value);
  }
  assert.equal(parent.children[0].attrs.get('data-pip-'+c.slot),c.id);
  const allNodes=[...parent.walk()],palette=pipArtColours(look,2);
  assert.ok(allNodes.some(n=>n.attrs.get('fill')===palette.fur));assert.ok(allNodes.some(n=>n.attrs.get('fill')===palette.lens));
  for(const slot of ['headgear','accessory'])assert.ok(allNodes.some(n=>n.attrs.get('data-cosmetic-slot')===slot));
  if(c.slot==='accessory'&&c.id!=='none')assert.ok(allNodes.find(n=>n.attrs.get('data-cosmetic-slot')==='accessory')!.children.length>0);
 }
}));
test('test flight and rapid-fire sprite factories both use the equipped look for every creature',()=>withSvg(()=>{
 const look:PipLook={fur:'ocean',goggles:'brass',headgear:'captain',accessory:'scarf'};
 const first=new SvgElement('svg'),batch=new SvgElement('svg');
 createLaunchVisual(first as unknown as Element,look);
 createRapidVisual(batch as unknown as Element,4,2,route,look);
 for(const [host,n] of [[first,1],[batch,4]] as const){
  const pips=[...host.walk()].filter(el=>el.attrs.has('data-pip-fur'));assert.equal(pips.length,n);
  for(const p of pips)for(const slot of pipSlots)assert.equal(p.attrs.get('data-pip-'+slot),look[slot]);
 }
}));
