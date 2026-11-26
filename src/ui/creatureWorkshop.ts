import {achievementDefinitions} from '../game/achievements';
import {pipSlots,slotLabels,pipCosmetics,cosmeticFor,cosmeticUnlocked,canEquipPipLook,choosePipCosmetic,samePipLook,defaultPipLook,type PipLook,type PipSlot,type Cosmetic} from '../game/pipCosmetics';
import type {createPipLookStore} from '../game/pipLookStore';
import type {PipPose} from '../animations/launch';
import {createPip,svgNode} from '../rendering/pip';
function node<K extends keyof HTMLElementTagNameMap>(tag:K,cls:string,parent:Element,text?:string):HTMLElementTagNameMap[K]{
 const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;parent.append(e);return e;
}
function button(parent:Element,cls:string,text:string,action:()=>void){
 const b=node('button',cls,parent,text);b.type='button';b.addEventListener('click',action);return b;
}
const achievementFor=(c:Cosmetic)=>achievementDefinitions.find(a=>a.id===c.achievement);
const poses:readonly {id:PipPose;label:string}[]=[{id:'idle',label:'Idle'},{id:'excited',label:'Happy'},{id:'flying',label:'Flying'},{id:'disappointed',label:'Disappointed'},{id:'splat',label:'Splat'}];
function sprite(host:Element,look:PipLook,pose:PipPose,variant=0){
 const svg=svgNode('svg',{viewBox:'-.34 -.36 .68 .70','aria-hidden':'true',focusable:'false'},host);
 const pip=createPip(svg,variant,look);pip.setPose(pose);
 if(pose==='splat')pip.setStretch(1.25);
 return svg;
}
export function mountCreatureWorkshop(root:HTMLElement,earned:ReadonlySet<string>,store:ReturnType<typeof createPipLookStore>,onHome:()=>void){
 let equipped=store.read(earned),draft={...equipped},slot:PipSlot='fur',pose:PipPose='excited',disposed=false;
 root.replaceChildren();
 const main=node('main','selection-screen workshop-screen',root),top=node('div','selection-top',main);
 const back=button(top,'selection-back','← Home',()=>{if(!disposed)onHome();});
 const title=node('div','selection-heading',top),h1=node('h1','',title,'Creature Workshop');h1.tabIndex=-1;
 node('p','',title,'Make your crew your own');node('div','selection-top-end',top);
 const shell=node('div','workshop-shell',main),left=node('section','workshop-preview-panel',shell),right=node('section','workshop-options-panel',shell);
 const previewHeader=node('div','workshop-preview-heading',left);
 node('h2','',previewHeader,'Your Pip');const previewStatus=node('span','workshop-preview-status',previewHeader);
 const preview=node('div','workshop-preview',left);preview.setAttribute('aria-hidden','true');
 const poseRow=node('div','workshop-poses',left);poseRow.setAttribute('role','group');poseRow.setAttribute('aria-label','Preview expression');
 const poseButtons=new Map<PipPose,HTMLButtonElement>();
 for(const option of poses){
  const b=button(poseRow,'workshop-pose',option.label,()=>{if(disposed)return;pose=option.id;refreshPreview();});
  poseButtons.set(option.id,b);
 }
 const status=node('p','workshop-status',left);status.setAttribute('role','status');
 const actions=node('div','workshop-actions',left);
 const equip=button(actions,'selection-play','Equip look',()=>{
  if(disposed||!canEquipPipLook(draft,earned))return;
  const result=store.equip(draft,earned);if(!result.equipped)return;
  equipped=result.look;draft={...equipped};refresh();status.textContent=result.persisted?'Look equipped and saved.':'Look equipped for this session; local saving is unavailable.';
 });
 button(actions,'workshop-reset','Restore original',()=>{if(disposed)return;draft={...defaultPipLook};renderChoices();refresh();});
 const heading=node('div','workshop-options-heading',right);node('h2','',heading,'Choose your parts');
 const unlocked=pipCosmetics.filter(c=>cosmeticUnlocked(c,earned)).length;
 node('span','',heading,unlocked+' / '+pipCosmetics.length+' available');
 const tabs=node('div','workshop-tabs',right);tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Cosmetic categories');
 const tabButtons=new Map<PipSlot,HTMLButtonElement>();
 for(const s of pipSlots){tabButtons.set(s,button(tabs,'workshop-tab',slotLabels[s],()=>{if(disposed)return;slot=s;renderChoices();refresh();}));}
 const options=node('div','workshop-options',right);options.setAttribute('role','group');
 const details=node('div','workshop-item-detail',right);details.setAttribute('aria-live','polite');
 const choices=new Map<string,HTMLButtonElement>();
 function refreshPreview(){
  preview.replaceChildren();sprite(preview,draft,pose);
  for(const [id,b] of poseButtons)b.setAttribute('aria-pressed',String(pose===id));
  const locked=!canEquipPipLook(draft,earned),changed=!samePipLook(draft,equipped);
  previewStatus.textContent=locked?'Preview only':changed?'Unequipped look':'Equipped look';
  previewStatus.dataset.locked=String(locked);
 }
 function renderChoices(){
  choices.clear();options.replaceChildren();options.setAttribute('aria-label',slotLabels[slot]);
  for(const c of pipCosmetics.filter(c=>c.slot===slot)){
   const available=cosmeticUnlocked(c,earned),a=achievementFor(c);
   const card=button(options,'workshop-option','',()=>{
    if(disposed)return;draft=choosePipCosmetic(draft,slot,c.id);refresh();
   });
   choices.set(c.id,card);card.dataset.locked=String(!available);
   card.setAttribute('aria-label',c.name+(available?', available':', locked: '+(a?.title??'Achievement required')));
   const art=node('span','workshop-option-art',card);art.setAttribute('aria-hidden','true');sprite(art,{...draft,[slot]:c.id},'idle');
   const copy=node('span','workshop-option-copy',card);node('strong','',copy,c.name);
   node('small','workshop-option-state',copy,available?'Available':'🔒 '+(a?.title??'Achievement'));
  }
 }
 function refresh(){
  refreshPreview();
  for(const [s,b] of tabButtons)b.setAttribute('aria-pressed',String(s===slot));
  for(const [id,b] of choices){
   b.setAttribute('aria-pressed',String(draft[slot]===id));
   const label=b.querySelector<HTMLElement>('.workshop-option-state')!,c=cosmeticFor(slot,id)!;
   label.textContent=equipped[slot]===id?'✓ Equipped':cosmeticUnlocked(c,earned)?'Available':'🔒 '+(achievementFor(c)?.title??'Achievement');
  }
  const chosen=cosmeticFor(slot,draft[slot])!,achievement=achievementFor(chosen),available=cosmeticUnlocked(chosen,earned);
  details.replaceChildren();node('strong','',details,chosen.name);
  node('p','',details,achievement?(available?'Unlocked by ':'Unlock with ')+achievement.title+' — '+achievement.description:'Available from the start.');
  const blocked=pipSlots.map(s=>cosmeticFor(s,draft[s])!).filter(c=>!cosmeticUnlocked(c,earned));
  const changed=!samePipLook(draft,equipped),persisted=store.persisted();
  equip.disabled=blocked.length>0||!changed&&persisted;
  equip.textContent=blocked.length?'Locked parts':changed?'Equip look':persisted?'Equipped ✓':'Save look';
  status.textContent=blocked.length?'Preview only. Earn '+[...new Set(blocked.map(c=>achievementFor(c)?.title??'the required achievement'))].join(', ')+' to equip.':changed?'Equip to use this look in every flight.':persisted?'Your current look is ready to fly.':'Local saving is unavailable. Your look may be session only.';
 }
 renderChoices();refresh();h1.focus();
 return ()=>{disposed=true;back.replaceWith(back.cloneNode(true));};
}
