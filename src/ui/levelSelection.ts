import {worlds,levels,type World} from '../levels/catalog';
import type {Level} from '../levels/schema';
import {cannonTypes,type CannonType} from '../game/cannons';
import {identityForWorld} from '../game/worldIdentity';
import {beginSelection,selectWorld,selectMode,backToModes,selectLevel,backToWorlds,selectedWorld,selectedLevel,summarizeLevel} from '../game/levelSelection';
import {renderWorldMenuArt} from '../rendering/worldMenuArt';
import {learningModes,modePolicy,modeBudgetLabel,modeObjective,type LearningMode} from '../game/learningModes';
import {createPip,svgNode} from '../rendering/pip';
import {emptyProgress,getRecord,recordStars,summarizeProgress,type Progress} from '../game/progress';

interface Options {bindAudio?:(button:HTMLButtonElement)=>()=>void;progress?:Progress;preferredId?:string;preferredMode?:LearningMode;openCurrentWorld?:boolean;onHome:()=>void;onPlay:(level:Level,mode:LearningMode)=>void}
function element<K extends keyof HTMLElementTagNameMap>(tag:K,className:string,parent:Element,text?:string):HTMLElementTagNameMap[K]{
 const e=document.createElement(tag);e.className=className;if(text!==undefined)e.textContent=text;parent.append(e);return e;
}
function action(parent:Element,className:string,text:string,callback:()=>void){
 const b=element('button',className,parent,text);b.type='button';b.addEventListener('click',callback);return b;
}
function theme(el:HTMLElement,w:World){
 const i=identityForWorld(w.number);el.style.setProperty('--world-accent',i.accent);el.style.setProperty('--world-ink',i.ink);el.style.setProperty('--world-tint',i.tint);
}
function familyChip(parent:Element,type:CannonType,count?:number){
 const chip=element('span','selection-family',parent);
 const dot=element('span','selection-family-dot',chip,cannonTypes[type].symbol);dot.style.background=cannonTypes[type].color;dot.setAttribute('aria-hidden','true');
 element('span','',chip,cannonTypes[type].label+(count!==undefined&&count>1?' ×'+count:''));
}
export function mountLevelSelection(root:HTMLElement,options:Options){
 const progress=options.progress??emptyProgress();
 let state=beginSelection(options.preferredId,options.openCurrentWorld,options.preferredMode),disposed=false;
 let refreshLevel:()=>void=()=>{},unbindAudio:()=>void=()=>{};
 function screen(title:string,subtitle:string,backText:string,back:()=>void){
  unbindAudio();root.replaceChildren();
  const main=element('main','selection-screen',root);
  const bar=element('div','selection-top',main);
  action(bar,'selection-back',backText,()=>{if(!disposed)back();});
  const heading=element('div','selection-heading',bar);
  const h1=element('h1','',heading,title);h1.tabIndex=-1;
  element('p','',heading,subtitle);
  if(options.bindAudio){bar.classList.add('has-audio');const sound=element('button','sound-settings workshop-sound-settings',bar,'♪ Off');sound.type='button';unbindAudio=options.bindAudio(sound);}
  else {const end=element('div','selection-top-end',bar);end.setAttribute('aria-hidden','true');}
  return {main,h1};
 }
 function renderWorlds(focusNumber?:number){
  const {main,h1}=screen('Choose a world',worlds.length+' worlds · '+levels.length+' levels','← Home',options.onHome);
  main.dataset.selection='worlds';
  const grid=element('div','world-grid',main);grid.setAttribute('role','group');grid.setAttribute('aria-label','Worlds');
  const cards=new Map<number,HTMLButtonElement>();
  for(const w of worlds){
   const identity=identityForWorld(w.number),summary=summarizeProgress(progress,w.levels);
   const card=action(grid,'world-card','',()=>{
    if(disposed)return;
    state=selectWorld(state,w.number);if(state.step==='modes')renderModes();
   });
   theme(card,w);cards.set(w.number,card);
   card.setAttribute('aria-label','World '+w.number+': '+w.name+'. '+identity.focus+'. '+summary.completed+' of '+w.levels.length+' levels completed.');
   const art=element('span','world-card-art',card);art.setAttribute('aria-hidden','true');renderWorldMenuArt(art,w.number);
   const flag=element('span','world-number',art,'WORLD '+String(w.number).padStart(2,'0'));
   flag.setAttribute('aria-hidden','true');
   const copy=element('span','world-card-copy',card);
   element('strong','world-card-name',copy,w.name);
   element('span','world-card-focus',copy,identity.focus);
   const row=element('span','world-card-bottom',copy);
   element('span','',row,summary.completed+' / '+w.levels.length+' completed');
   element('span','world-card-arrow',row,'→').setAttribute('aria-hidden','true');
  }
  if(focusNumber!==undefined&&cards.has(focusNumber))cards.get(focusNumber)!.focus();
  else h1.focus();
 }
 function renderModes(){
  const w=selectedWorld(state);if(!w||state.step!=='modes'){renderWorlds();return;}
  const previous=state.previousMode;
  const {main,h1}=screen('Choose how to learn',w.name+' · '+identityForWorld(w.number).focus,'← Worlds',()=>{state=backToWorlds(state);renderWorlds(w.number);});
  main.dataset.selection='modes';theme(main,w);
  const cards=element('div','mode-grid',main);cards.setAttribute('role','group');cards.setAttribute('aria-label','Learning modes');
  let focusCard:HTMLButtonElement|undefined;
  for(const [i,p] of learningModes.entries()){
   const card=action(cards,'mode-card','',()=>{if(disposed)return;state=selectMode(state,p.id);if(state.step==='levels')renderLevels();});
   card.style.setProperty('--mode-accent',p.accent);card.style.setProperty('--mode-tint',p.tint);
   card.setAttribute('aria-label',p.name+'. '+p.description);if(previous===p.id)focusCard=card;
   const art=element('span','mode-art',card);art.setAttribute('aria-hidden','true');
   const svg=svgNode('svg',{viewBox:'-1.55 -.72 3.1 1.3',focusable:'false'},art);
   for(let j=0;j<(p.id==='pilot'?5:3);j++){const pip=createPip(svg,i+j);const n=p.id==='pilot'?5:3;pip.root.setAttribute('transform','translate('+((j-(n-1)/2)*.49)+' .02) scale('+ (j===Math.floor(n/2)?1.13:.94)+')');pip.setPose(j===Math.floor(n/2)?'excited':'idle');}
   const copy=element('span','mode-card-copy',card);
   element('strong','mode-card-name',copy,p.name);element('span','mode-card-tagline',copy,p.tagline);
   element('span','mode-card-budget',copy,modeBudgetLabel(p.id));element('span','mode-card-description',copy,p.description);
   const summary=summarizeProgress(progress,w.levels).modes[p.id];
   element('span','mode-card-rating',copy,summary.completed+' / '+w.levels.length+' completed'+(p.unlimited?' · Practice':' · '+summary.stars+' stars'));
   element('span','mode-card-action',copy,'Choose '+p.name+' →');
  }
  if(focusCard)focusCard.focus();else h1.focus();
 }
 function renderLevels(){
  const w=selectedWorld(state);if(!w||state.step!=='levels'){renderWorlds();return;}
  const mode=state.mode,policy=modePolicy(mode);
  const identity=identityForWorld(w.number);
  const {main,h1}=screen(w.name,'World '+w.number+' · '+policy.name+' · '+identity.focus,'← Modes',()=>{
   state=backToModes(state);renderModes();
  });
  main.dataset.selection='levels';theme(main,w);
  const shell=element('div','level-selection-shell',main);
  const board=element('section','level-board',shell);
  const banner=element('div','level-world-banner',board);
  const art=element('div','level-world-art',banner);art.setAttribute('aria-hidden','true');renderWorldMenuArt(art,w.number);
  const copy=element('div','level-world-copy',banner);
  element('strong','',copy,identity.focus);
  element('p','',copy,identity.description);
  element('span','selected-mode-label',copy,policy.name+' · '+modeBudgetLabel(mode));
  const families=element('div','selection-families',copy);
  for(const family of identity.families)familyChip(families,family);
  element('h2','level-board-heading',board,'Choose a level');
  const tiles=element('div','level-number-grid',board);tiles.setAttribute('role','group');tiles.setAttribute('aria-label',w.name+' levels');
  const buttons=new Map<string,HTMLButtonElement>();
  for(const [i,l] of w.levels.entries()){
   const tile=action(tiles,'level-number',String(i+1),()=>{
    if(disposed)return;
    state=selectLevel(state,l.id);refreshLevel();
   });
   const record=getRecord(progress,l.id,mode),rating=recordStars(record,l,mode);
   if(record){tile.dataset.completed='true';const mark=element('span','level-progress-mark',tile,rating===null?'✓':'★'.repeat(rating));mark.setAttribute('aria-hidden','true');}
   tile.setAttribute('aria-label','Level '+(i+1)+(record?(rating===null?', practice complete':', '+rating+' out of 3 stars'):', not completed'));tile.setAttribute('aria-pressed','false');buttons.set(l.id,tile);
  }
  const panel=element('section','level-details',shell);panel.setAttribute('aria-label','Selected level');
  const info=element('div','level-details-info',panel);info.setAttribute('aria-live','polite');info.setAttribute('aria-atomic','true');
  const play=action(panel,'selection-play','Play level ▶',()=>{
   const level=selectedLevel(state);if(!disposed&&level&&state.step==='levels')options.onPlay(level,state.mode);
  });
  refreshLevel=()=>{
   const level=selectedLevel(state);
   for(const [id,b] of buttons)b.setAttribute('aria-pressed',String(id===level?.id));
   info.replaceChildren();
   play.disabled=!level;
   if(!level){
    element('div','level-details-kicker',info,'YOUR NEXT FLIGHT');
    element('h2','level-details-title',info,'Select a number');
    element('p','level-details-objective',info,'Choose any level to see its challenge.');
    play.textContent='Play level ▶';panel.dataset.selected='false';return;
   }
   panel.dataset.selected='true';
   const s=summarizeLevel(level);
   element('div','level-details-kicker',info,'LEVEL '+String(s.index).padStart(2,'0')+' / '+w.levels.length);
   element('h2','level-details-title',info,s.title);
   element('p','level-details-objective',info,modeObjective(mode,level));
   const types=element('div','selection-families',info);for(const f of s.families)familyChip(types,f.type,f.count);
   const facts=element('div','level-facts',info);
   element('span','level-fact',facts,s.cannonCount+' '+(s.cannonCount===1?'cannon':'cannons'));
   element('span','level-fact',facts,modeBudgetLabel(mode,level));
   if(s.gemCount)element('span','level-fact',facts,s.gemCount+' optional '+(s.gemCount===1?'gem':'gems'));
   const record=getRecord(progress,level.id,mode),rating=recordStars(record,level,mode);
   if(record){const best=element('div','level-best',info);element('strong','',best,rating===null?'✓ Practice completed':'★'.repeat(rating)+' · Best '+rating+'/3 stars');element('span','',best,'Fewest test flights: '+record.bestAttempts+(s.gemCount?' · Gems: '+record.gems.length+'/'+s.gemCount:''));}
   play.textContent=(record?'Replay level ':'Play level ')+s.index+' ▶';
  };
  refreshLevel();h1.focus();
 }
 if(state.step==='levels')renderLevels();else if(state.step==='modes')renderModes();else renderWorlds();
 return ()=>{disposed=true;unbindAudio();refreshLevel=()=>{};};
}
