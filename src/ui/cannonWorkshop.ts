import {achievementDefinitions} from '../game/achievements';
import {cannonTypes,type CannonType} from '../game/cannons';
import {cannonSlots,cannonSlotLabels,cannonCosmetics,cannonCosmeticFor,cannonCosmeticUnlocked,canEquipCannonLook,chooseCannonCosmetic,sameCannonLook,defaultCannonLook,type CannonLook,type CannonSlot,type CannonCosmetic} from '../game/cannonCosmetics';
import type {createCannonLookStore} from '../game/cannonLookStore';
import {svgNode} from '../rendering/pip';
import {renderCannonArt} from '../rendering/cannonArt';
import {createBurstParticles} from '../rendering/cannonBurst';
import {sampleLaunchCue,FIRE_MS,CUE_END_MS,barrelVector} from '../animations/launch';
function node<K extends keyof HTMLElementTagNameMap>(tag:K,cls:string,parent:Element,text?:string):HTMLElementTagNameMap[K]{
 const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;parent.append(e);return e;
}
function button(parent:Element,cls:string,text:string,action:()=>void){
 const b=node('button',cls,parent,text);b.type='button';b.addEventListener('click',action);return b;
}
const achievementFor=(c:CannonCosmetic)=>achievementDefinitions.find(a=>a.id===c.achievement);
const angle=24;
function cannonPreview(host:Element,look:CannonLook,family:CannonType,direction:1|-1,showEffect:boolean){
 const svg=svgNode('svg',{viewBox:'-1.12 -.80 2.24 1.42','aria-hidden':'true',focusable:'false'},host);
 const mirrored=svgNode('g',{transform:'scale('+direction+' 1)'},svg);
 const barrel=renderCannonArt(mirrored,family,angle,look,direction),effect=createBurstParticles(svg,look.effect);
 const vector=barrelVector(direction,angle);
 function paint(burst:number|null,recoil=0){
  barrel.setAttribute('transform','rotate('+(-angle)+') translate('+(-recoil)+' 0)');
  effect.paint(burst,vector.x,-vector.y);
 }
 paint(showEffect?.35:null);
 return {paint};
}
export function mountCannonWorkshop(root:HTMLElement,earned:ReadonlySet<string>,store:ReturnType<typeof createCannonLookStore>,onHome:()=>void,onTestFire?:()=>void,reducedMotion:()=>boolean=()=>false){
 let equipped=store.read(earned),draft={...equipped},slot:CannonSlot='barrel',family:CannonType='linear',direction:1|-1=1,disposed=false,raf=0;
 root.replaceChildren();
 const main=node('main','selection-screen workshop-screen cannon-workshop',root),top=node('div','selection-top',main);
 button(top,'selection-back','← Home',()=>{if(!disposed)onHome();});
 const title=node('div','selection-heading',top),h1=node('h1','',title,'Cannon Workshop');h1.tabIndex=-1;
 node('p','',title,'Build your signature style');const soundButton=node('button','sound-settings workshop-sound-settings',top,'♪ Off');soundButton.type='button';soundButton.id='sound-settings';
 const shell=node('div','workshop-shell',main),left=node('section','workshop-preview-panel',shell),right=node('section','workshop-options-panel',shell);
 const previewHeader=node('div','workshop-preview-heading',left);
 node('h2','',previewHeader,'Your cannon');const previewStatus=node('span','workshop-preview-status',previewHeader);
 const preview=node('div','workshop-preview',left);preview.setAttribute('aria-hidden','true');
 let previewArt:ReturnType<typeof cannonPreview>|undefined;
 const controls=node('div','cannon-preview-controls',left);
 const label=node('label','',controls,'Family'),familySelect=node('select','',label);
 for(const [id,c] of Object.entries(cannonTypes)){const option=node('option','',familySelect,c.label);option.value=id;}
 familySelect.addEventListener('change',()=>{if(disposed||!Object.hasOwn(cannonTypes,familySelect.value))return;family=familySelect.value as CannonType;renderChoices();refresh();});
 const flip=button(controls,'workshop-pose','Fires right →',()=>{if(disposed)return;direction=direction===1?-1:1;flip.textContent=direction===1?'Fires right →':'← Fires left';renderChoices();refresh();});
 function stopPreview(){if(raf){cancelAnimationFrame(raf);raf=0;}}
 button(controls,'workshop-pose','Test fire',()=>{
  if(disposed||!previewArt)return;stopPreview();onTestFire?.();
  if(reducedMotion()){previewArt.paint(.35);return;}
  const art=previewArt,start=performance.now(),duration=CUE_END_MS-FIRE_MS;
  function tick(now:number){
   raf=0;if(disposed||art!==previewArt)return;
   const elapsed=Math.max(0,now-start);
   if(elapsed>=duration){art.paint(slot==='effect'?.35:null);return;}
   const cue=sampleLaunchCue(FIRE_MS+elapsed,{x:0,y:0},direction,false,angle);
   art.paint(cue.burst,cue.recoil);raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);
 });
 node('p','cannon-family-note',left,'Style applies to every cannon. Function colours and symbols stay the same.');
 const status=node('p','workshop-status',left);status.setAttribute('role','status');
 const actions=node('div','workshop-actions',left);
 const equip=button(actions,'selection-play','Equip style',()=>{
  if(disposed||!canEquipCannonLook(draft,earned))return;
  const result=store.equip(draft,earned);if(!result.equipped)return;
  equipped=result.look;draft={...equipped};refresh();status.textContent=result.persisted?'Style equipped and saved.':'Style equipped for this session; local saving is unavailable.';
 });
 button(actions,'workshop-reset','Restore original',()=>{if(disposed)return;draft={...defaultCannonLook};renderChoices();refresh();});
 const heading=node('div','workshop-options-heading',right);node('h2','',heading,'Choose your parts');
 node('span','',heading,cannonCosmetics.filter(c=>cannonCosmeticUnlocked(c,earned)).length+' / '+cannonCosmetics.length+' available');
 const tabs=node('div','workshop-tabs',right);tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Cannon cosmetic categories');
 const tabButtons=new Map<CannonSlot,HTMLButtonElement>();
 for(const s of cannonSlots)tabButtons.set(s,button(tabs,'workshop-tab',cannonSlotLabels[s],()=>{if(disposed)return;slot=s;renderChoices();refresh();}));
 const options=node('div','workshop-options',right);options.setAttribute('role','group');
 const details=node('div','workshop-item-detail',right);details.setAttribute('aria-live','polite');
 const choices=new Map<string,HTMLButtonElement>();
 function renderChoices(){
  choices.clear();options.replaceChildren();options.setAttribute('aria-label',cannonSlotLabels[slot]);
  for(const c of cannonCosmetics.filter(c=>c.slot===slot)){
   const available=cannonCosmeticUnlocked(c,earned),a=achievementFor(c);
   const card=button(options,'workshop-option','',()=>{if(disposed)return;draft=chooseCannonCosmetic(draft,slot,c.id);refresh();});
   choices.set(c.id,card);card.dataset.locked=String(!available);
   card.setAttribute('aria-label',c.name+(available?', available':', locked: '+(a?.title??'Achievement required')));
   const art=node('span','workshop-option-art',card);art.setAttribute('aria-hidden','true');cannonPreview(art,{...draft,[slot]:c.id},family,direction,slot==='effect');
   const copy=node('span','workshop-option-copy',card);node('strong','',copy,c.name);node('small','workshop-option-state',copy,available?'Available':'🔒 '+(a?.title??'Achievement'));
  }
 }
 function refresh(){
  stopPreview();preview.replaceChildren();previewArt=cannonPreview(preview,draft,family,direction,slot==='effect');
  for(const [s,b] of tabButtons)b.setAttribute('aria-pressed',String(s===slot));
  for(const [id,b] of choices){
   b.setAttribute('aria-pressed',String(draft[slot]===id));
   const c=cannonCosmeticFor(slot,id)!;
   b.querySelector<HTMLElement>('.workshop-option-state')!.textContent=equipped[slot]===id?'✓ Equipped':cannonCosmeticUnlocked(c,earned)?'Available':'🔒 '+(achievementFor(c)?.title??'Achievement');
  }
  const chosen=cannonCosmeticFor(slot,draft[slot])!,achievement=achievementFor(chosen),available=cannonCosmeticUnlocked(chosen,earned);
  details.replaceChildren();node('strong','',details,chosen.name);
  node('p','',details,achievement?(available?'Unlocked by ':'Unlock with ')+achievement.title+' — '+achievement.description:'Available from the start.');
  const blocked=cannonSlots.map(s=>cannonCosmeticFor(s,draft[s])!).filter(c=>!cannonCosmeticUnlocked(c,earned)),changed=!sameCannonLook(draft,equipped),persisted=store.persisted();
  previewStatus.textContent=blocked.length?'Preview only':changed?'Unequipped style':'Equipped style';previewStatus.dataset.locked=String(!!blocked.length);
  equip.disabled=blocked.length>0||!changed&&persisted;
  equip.textContent=blocked.length?'Locked parts':changed?'Equip style':persisted?'Equipped ✓':'Save style';
  status.textContent=blocked.length?'Preview only. Earn '+[...new Set(blocked.map(c=>achievementFor(c)?.title??'the required achievement'))].join(', ')+' to equip.':changed?'Equip to use this style in every world.':persisted?'Your cannons are ready to fire.':'Local saving is unavailable. Your style may be session only.';
 }
 renderChoices();refresh();h1.focus();
 return ()=>{disposed=true;stopPreview();};
}
