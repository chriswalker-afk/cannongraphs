import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cannonSlots,cannonCosmetics,defaultCannonLook,cannonCosmeticFor,cannonCosmeticUnlocked,cannonRewardsForAchievement,sanitizeCannonLook,canEquipCannonLook,chooseCannonCosmetic,sameCannonLook,cannonTrim,type CannonLook} from '../src/game/cannonCosmetics';
import {createCannonLookStore,parseCannonLook,CANNON_LOOK_KEY} from '../src/game/cannonLookStore';
import {PIP_LOOK_KEY} from '../src/game/pipLookStore';
import {PROGRESS_KEY,type ProgressStorage} from '../src/game/progressStore';
import {achievementDefinitions,earnedAchievementIds} from '../src/game/achievements';
import {emptyProgress,decodeProgress,recordCompletion} from '../src/game/progress';
import {levels} from '../src/levels/catalog';
import {cannonTypes,type CannonType} from '../src/game/cannons';
import {parseCannonEquation} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {renderCannonArt} from '../src/rendering/cannonArt';
import {createBurstParticles} from '../src/rendering/cannonBurst';
import {createLaunchVisual} from '../src/rendering/launchVisual';
import {createRapidVisual} from '../src/rendering/rapidVisual';
import {sampleAttempt} from '../src/animations/attempt';
import {FIRE_MS} from '../src/animations/launch';
import {makeRapidSchedule,sampleRapidFire} from '../src/animations/rapidFire';
const none=earnedAchievementIds(emptyProgress()),all=new Set(achievementDefinitions.map(a=>a.id));
const l=levels[0],win=simulateRoute(l,new Map([['A',parseCannonEquation('x','linear')]])),fail=simulateRoute(l,new Map([['A',parseCannonEquation('x+1','linear')]]));
const encode=(look:unknown)=>JSON.stringify({version:1,look});
function memory(){
 const data=new Map<string,string>();let writes=0;
 const storage:ProgressStorage={getItem:key=>data.get(key)??null,setItem(key,value){writes++;data.set(key,value);}};
 return {storage,data,writes:()=>writes};
}
test('24 parts in four categories have eight free choices and existing achievement gates',()=>{
 assert.equal(cannonCosmetics.length,24);
 assert.equal(new Set(cannonCosmetics.map(c=>c.slot+':'+c.id)).size,24);
 assert.equal(cannonCosmetics.filter(c=>cannonCosmeticUnlocked(c,none)).length,8);
 assert.equal(cannonCosmetics.filter(c=>cannonCosmeticUnlocked(c,all)).length,24);
 for(const slot of cannonSlots){assert.equal(cannonCosmetics.filter(c=>c.slot===slot).length,6);assert.ok(cannonCosmeticUnlocked(cannonCosmeticFor(slot,defaultCannonLook[slot])!,none));}
 for(const c of cannonCosmetics)if(c.achievement)assert.ok(all.has(c.achievement),c.name);
 for(const a of achievementDefinitions.filter(a=>!['foundry-explorer','all-worlds-explorer'].includes(a.id)))assert.ok(cannonRewardsForAchievement(a.id).length,a.id);
});
test('actual Pilot completion unlocks corresponding parts; full progress unlocks all',()=>{
 let s=beginAttempt(createLevelState(5),win);s=finishAttempt(s,s.active!.id);
 const {id,count}=s.celebration!;s=advanceCelebration(s,id,count,count);s=finishCelebration(s,id);
 const earned=earnedAchievementIds(recordCompletion(emptyProgress(),l,'pilot',s));
 for(const [slot,id] of [['barrel','fluted'],['barrel','precision'],['trim','brass'],['trim','crystal']] as const)assert.ok(cannonCosmeticUnlocked(cannonCosmeticFor(slot,id)!,earned));
 for(const [slot,id] of [['base','hover'],['effect','comet'],['effect','starburst']] as const)assert.ok(!cannonCosmeticUnlocked(cannonCosmeticFor(slot,id)!,earned));
 const rows=Object.fromEntries(levels.map(l=>[l.id,Object.fromEntries(['cadet','pilot','ace'].map(mode=>[mode,{bestAttempts:1,gems:(l.gems??[]).map(g=>g.id)}]))]));
 const full=earnedAchievementIds(decodeProgress({version:1,records:rows}));
 assert.equal(full.size,all.size);assert.ok(cannonCosmetics.every(c=>cannonCosmeticUnlocked(c,full)));
});
test('preview can include locked parts but cannot equip them or overwrite saved state',()=>{
 const mem=memory(),store=createCannonLookStore(mem.storage),original=store.read(none);
 const free=chooseCannonCosmetic(original,'base','stone'),locked=chooseCannonCosmetic(free,'effect','comet');
 assert.equal(locked.effect,'comet');assert.equal(original.base,'timber');
 assert.ok(canEquipCannonLook(free,none));assert.ok(!canEquipCannonLook(locked,none));
 assert.equal(store.equip(locked,none).equipped,false);assert.equal(mem.writes(),0);
 assert.ok(store.equip(free,none).equipped);assert.deepEqual(store.read(none),free);
 assert.equal(store.equip(locked,none).equipped,false);assert.deepEqual(store.read(none),free);
 assert.equal(chooseCannonCosmetic(free,'base','unknown'),free);assert.ok(sameCannonLook(free,{...free}));
});
test('invalid or no-longer-earned parts are independently restored to defaults',()=>{
 for(const raw of [null,'{','null','[]','{"version":2,"look":{}}','{"version":1,"look":null}'])assert.deepEqual(parseCannonLook(raw,none),defaultCannonLook);
 const mixed={barrel:'riveted',base:'hover',trim:'wrong',effect:'sparks',extra:'ignored'};
 assert.deepEqual(parseCannonLook(encode(mixed),none),{...defaultCannonLook,barrel:'riveted',effect:'sparks'});
 assert.deepEqual(parseCannonLook(encode(mixed),new Set(['ace-world'])),{...defaultCannonLook,barrel:'riveted',base:'hover',effect:'sparks'});
 assert.deepEqual(sanitizeCannonLook({barrel:'__proto__',base:4,trim:{},effect:null},all),defaultCannonLook);
 assert.ok(!canEquipCannonLook({barrel:'riveted'},all));assert.ok(!canEquipCannonLook(null,all));
});
test('cannon styles persist separately from progress and Pip appearance, including explicit restore',()=>{
 const mem=memory();mem.data.set(PROGRESS_KEY,'existing progress');mem.data.set(PIP_LOOK_KEY,'existing pip look');
 const store=createCannonLookStore(mem.storage),look:CannonLook={barrel:'orbital',base:'hover',trim:'crystal',effect:'comet'};
 assert.ok(store.equip(look,all).persisted);assert.equal(mem.data.get(PROGRESS_KEY),'existing progress');assert.equal(mem.data.get(PIP_LOOK_KEY),'existing pip look');
 assert.equal(JSON.parse(mem.data.get(CANNON_LOOK_KEY)!).version,1);
 assert.deepEqual(createCannonLookStore(mem.storage).read(all),look);assert.deepEqual(createCannonLookStore(mem.storage).read(none),defaultCannonLook);
 assert.ok(store.equip(defaultCannonLook,all).persisted);assert.deepEqual(createCannonLookStore(mem.storage).read(all),defaultCannonLook);assert.equal(mem.writes(),2);
});
test('unavailable or quota-limited storage keeps a valid session style and retries on equip',()=>{
 const look={...defaultCannonLook,base:'stone',effect:'sparks'},session=createCannonLookStore();
 assert.equal(session.equip(look,none).persisted,false);assert.deepEqual(session.read(none),look);
 const mem=memory();let blocked=true;
 const store=createCannonLookStore({getItem:key=>mem.storage.getItem(key),setItem(key,value){if(blocked)throw Error('quota');mem.storage.setItem(key,value);}});
 assert.equal(store.equip(look,none).persisted,false);assert.deepEqual(store.read(none),look);assert.ok(!store.persisted());
 blocked=false;assert.ok(store.equip(look,none).persisted);assert.deepEqual(createCannonLookStore(mem.storage).read(none),look);
 const denied=createCannonLookStore({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});
 assert.deepEqual(denied.read(none),defaultCannonLook);assert.ok(!denied.persisted());assert.ok(denied.equip(look,none).equipped);assert.deepEqual(denied.read(none),look);
});
class SvgElement{
 readonly attrs=new Map<string,string>();readonly children:SvgElement[]=[];textContent='';
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
const nodes=(host:SvgElement)=>[...host.walk()];
const effectNodes=(host:SvgElement)=>nodes(host).filter(n=>n.attrs.has('data-cannon-effect'));
const project=(p:{x:number;y:number})=>({x:p.x*40,y:-p.y*40});
test('every part in every family and direction retains exact muzzle, family colour and readable symbol',()=>withSvg(()=>{
 for(const c of cannonCosmetics)for(const type of Object.keys(cannonTypes) as CannonType[])for(const direction of [1,-1] as const){
  const look=chooseCannonCosmetic(defaultCannonLook,c.slot,c.id),host=new SvgElement('svg');
  renderCannonArt(host as unknown as Element,type,35,look,direction);
  const elements=nodes(host),family=elements.find(n=>n.attrs.get('data-family-colour')===type)!;
  assert.equal(family.attrs.get('fill'),cannonTypes[type].color,c.name);
  const muzzle=elements.find(n=>n.attrs.has('data-cannon-muzzle'))!;
  assert.equal(muzzle.attrs.get('cx'),'0');assert.equal(muzzle.attrs.get('cy'),'0');
  const symbol=elements.find(n=>n.attrs.get('data-family-symbol')===type)!;
  assert.equal(symbol.textContent,cannonTypes[type].symbol);assert.equal(symbol.attrs.get('transform'),'translate(-.37 .06) scale('+direction+' 1)');
  assert.ok(elements.some(n=>n.attrs.get('data-cannon-barrel')===look.barrel));
  assert.ok(elements.some(n=>n.attrs.get('data-cannon-base')===look.base));
  assert.ok(elements.some(n=>n.attrs.get('data-cannon-trim')===look.trim));
  for(const n of elements)for(const value of n.attrs.values())assert.ok(!/NaN|Infinity|undefined/.test(value),c.name);
 }
 assert.equal(cannonTrim(defaultCannonLook,cannonTypes.linear.color).metal,cannonTypes.linear.color);
}));
test('all six burst designs are bounded, direction-aware and hide immediately for null cues',()=>withSvg(()=>{
 for(const c of cannonCosmetics.filter(c=>c.slot==='effect')){
  const host=new SvgElement('svg'),fx=createBurstParticles(host as unknown as Element,c.id,6),group=effectNodes(host)[0];
  assert.equal(group.attrs.get('display'),'none');assert.equal(group.children.length,6);
  for(const direction of [1,-1] as const)for(const phase of [0,.35,.9,1]){
   fx.paint(phase,direction,0);assert.equal(group.attrs.get('display'),'inline');
   for(const n of group.children){
    const x=n.tag==='circle'?Number(n.attrs.get('cx')):Number(/^translate\(([^ ]+)/.exec(n.attrs.get('transform')!)![1]);
    assert.ok(x*direction>0&&Math.abs(x)<1,c.id);
    for(const value of n.attrs.values())assert.ok(!/NaN|Infinity|undefined/.test(value),c.id);
   }
  }
  fx.paint(null,1,0);assert.equal(group.attrs.get('display'),'none');
 }
}));
test('single-flight effects respect actual launch, misfire and reduced-motion cues',()=>withSvg(()=>{
 const host=new SvgElement('svg'),look={...defaultCannonLook,effect:'frost'},visual=createLaunchVisual(host as unknown as Element,undefined,look);
 const group=effectNodes(host)[0],leg=win.legs[0],wrong=fail.legs[0];
 assert.equal(group.attrs.get('data-cannon-effect'),'frost');
 const draw=(r:typeof leg,ms:number,reduced=false)=>visual.paint(sampleAttempt(ms,r,reduced),r.source,r.direction,r.angle,project,40);
 draw(leg,0);assert.equal(group.attrs.get('display'),'none');
 draw(leg,FIRE_MS+40);assert.equal(group.attrs.get('display'),'inline');
 draw(wrong,FIRE_MS+40);assert.equal(group.attrs.get('display'),'none');
 draw(leg,FIRE_MS+40,true);assert.equal(group.attrs.get('display'),'none');
}));
test('rapid-fire uses equipped particles on every leg and suppresses effects for reduced motion',()=>withSvg(()=>{
 const host=new SvgElement('svg'),look={...defaultCannonLook,effect:'comet'},visual=createRapidVisual(host as unknown as Element,4,1,win,undefined,look),groups=effectNodes(host);
 assert.equal(groups.length,win.legs.length);assert.ok(groups.every(g=>g.attrs.get('data-cannon-effect')==='comet'));
 const s=makeRapidSchedule(win,4),time=s.lead+s.legs[0].load+40;
 visual.paint(sampleRapidFire(time,win,s),win,project,40,false);
 assert.equal(groups[0].attrs.get('display'),'inline');
 visual.paint(sampleRapidFire(time,win,s),win,project,40,true);
 assert.ok(groups.every(g=>g.attrs.get('display')==='none'));
 visual.paint(sampleRapidFire(s.duration,win,s),win,project,40,false);
 assert.ok(groups.every(g=>g.attrs.get('display')==='none'));
}));
