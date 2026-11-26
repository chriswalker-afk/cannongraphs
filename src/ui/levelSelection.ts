import {worlds,levels,type World} from '../levels/catalog';
import type {Level} from '../levels/schema';
import {cannonTypes,type CannonType} from '../game/cannons';
import {identityForWorld} from '../game/worldIdentity';
import {beginSelection,selectWorld,selectLevel,backToWorlds,selectedWorld,selectedLevel,summarizeLevel} from '../game/levelSelection';
import {renderWorldMenuArt} from '../rendering/worldMenuArt';

interface Options {preferredId?:string;openCurrentWorld?:boolean;onHome:()=>void;onPlay:(level:Level)=>void}
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
 let state=beginSelection(options.preferredId,options.openCurrentWorld),disposed=false;
 let refreshLevel:()=>void=()=>{};
 function screen(title:string,subtitle:string,backText:string,back:()=>void){
  root.replaceChildren();
  const main=element('main','selection-screen',root);
  const bar=element('div','selection-top',main);
  action(bar,'selection-back',backText,()=>{if(!disposed)back();});
  const heading=element('div','selection-heading',bar);
  const h1=element('h1','',heading,title);h1.tabIndex=-1;
  element('p','',heading,subtitle);
  const end=element('div','selection-top-end',bar);end.setAttribute('aria-hidden','true');
  return {main,h1};
 }
 function renderWorlds(focusNumber?:number){
  const {main,h1}=screen('Choose a world',worlds.length+' worlds · '+levels.length+' levels','← Home',options.onHome);
  main.dataset.selection='worlds';
  const grid=element('div','world-grid',main);grid.setAttribute('role','group');grid.setAttribute('aria-label','Worlds');
  const cards=new Map<number,HTMLButtonElement>();
  for(const w of worlds){
   const identity=identityForWorld(w.number);
   const card=action(grid,'world-card','',()=>{
    if(disposed)return;
    state=selectWorld(state,w.number);if(state.step==='levels')renderLevels();
   });
   theme(card,w);cards.set(w.number,card);
   card.setAttribute('aria-label','World '+w.number+': '+w.name+'. '+identity.focus+'. '+w.levels.length+' levels.');
   const art=element('span','world-card-art',card);art.setAttribute('aria-hidden','true');renderWorldMenuArt(art,w.number);
   const flag=element('span','world-number',art,'WORLD '+String(w.number).padStart(2,'0'));
   flag.setAttribute('aria-hidden','true');
   const copy=element('span','world-card-copy',card);
   element('strong','world-card-name',copy,w.name);
   element('span','world-card-focus',copy,identity.focus);
   const row=element('span','world-card-bottom',copy);
   element('span','',row,w.levels.length+' levels');
   element('span','world-card-arrow',row,'→').setAttribute('aria-hidden','true');
  }
  if(focusNumber!==undefined&&cards.has(focusNumber))cards.get(focusNumber)!.focus();
  else h1.focus();
 }
 function renderLevels(){
  const w=selectedWorld(state);if(!w){renderWorlds();return;}
  const identity=identityForWorld(w.number);
  const {main,h1}=screen(w.name,'World '+w.number+' · '+identity.focus,'← Worlds',()=>{
   state=backToWorlds(state);renderWorlds(w.number);
  });
  main.dataset.selection='levels';theme(main,w);
  const shell=element('div','level-selection-shell',main);
  const board=element('section','level-board',shell);
  const banner=element('div','level-world-banner',board);
  const art=element('div','level-world-art',banner);art.setAttribute('aria-hidden','true');renderWorldMenuArt(art,w.number);
  const copy=element('div','level-world-copy',banner);
  element('strong','',copy,identity.focus);
  element('p','',copy,identity.description);
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
   tile.setAttribute('aria-label','Level '+(i+1));tile.setAttribute('aria-pressed','false');buttons.set(l.id,tile);
  }
  const panel=element('section','level-details',shell);panel.setAttribute('aria-label','Selected level');
  const info=element('div','level-details-info',panel);info.setAttribute('aria-live','polite');info.setAttribute('aria-atomic','true');
  const play=action(panel,'selection-play','Play level ▶',()=>{
   const level=selectedLevel(state);if(!disposed&&level)options.onPlay(level);
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
   element('p','level-details-objective',info,s.objective);
   const types=element('div','selection-families',info);for(const f of s.families)familyChip(types,f.type,f.count);
   const facts=element('div','level-facts',info);
   element('span','level-fact',facts,s.cannonCount+' '+(s.cannonCount===1?'cannon':'cannons'));
   element('span','level-fact',facts,s.pipCount+' Pips');
   if(s.gemCount)element('span','level-fact',facts,s.gemCount+' optional '+(s.gemCount===1?'gem':'gems'));
   play.textContent='Play level '+s.index+' ▶';
  };
  refreshLevel();h1.focus();
 }
 if(state.step==='levels')renderLevels();else renderWorlds();
 return ()=>{disposed=true;refreshLevel=()=>{};};
}
