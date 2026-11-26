import {worlds} from '../levels/catalog';
import {summarizeProgress,type Progress} from '../game/progress';
import {achievements} from '../game/achievements';
import {learningModes} from '../game/learningModes';
import {identityForWorld} from '../game/worldIdentity';
import {cosmeticsForAchievement} from '../game/pipCosmetics';
function node<K extends keyof HTMLElementTagNameMap>(tag:K,cls:string,parent:Element,text?:string):HTMLElementTagNameMap[K]{
 const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;parent.append(e);return e;
}
function meter(parent:Element,value:number,total:number,label:string){
 const track=node('div','log-meter',parent);track.setAttribute('role','progressbar');track.setAttribute('aria-label',label);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(total));track.setAttribute('aria-valuenow',String(value));
 const fill=node('span','',track);fill.style.width=(total?100*value/total:0)+'%';
}
export function mountFlightLog(root:HTMLElement,p:Progress,persisted:boolean,onHome:()=>void){
 root.replaceChildren();const main=node('main','selection-screen flight-log',root);
 const bar=node('div','selection-top',main),back=node('button','selection-back',bar,'← Home');back.type='button';back.addEventListener('click',onHome);
 const header=node('div','selection-heading',bar),heading=node('h1','',header,'Flight log');heading.tabIndex=-1;
 node('p','',header,'Your graph-powered journey');node('div','selection-top-end',bar);
 const content=node('div','log-content',main),summary=summarizeProgress(p),badges=achievements(p);
 if(!persisted)node('p','log-warning',content,'Local saving is unavailable. Progress may be lost when this page closes.');
 const stats=node('div','log-stats',content);
 for(const [value,label] of [[summary.completed+' / '+summary.total,'Different levels'],[String(summary.modes.pilot.stars),'Pilot stars'],[String(summary.modes.ace.stars),'Ace stars'],[summary.gems+' / '+summary.gemTotal,'Unique gems']]){
  const stat=node('div','log-stat',stats);node('strong','',stat,value);node('span','',stat,label);
 }
 const columns=node('div','log-columns',content),journey=node('section','log-panel',columns),trophies=node('section','log-panel',columns);
 node('h2','',journey,'Learning modes');
 const modes=node('div','log-modes',journey);
 for(const mode of learningModes){
  const s=summary.modes[mode.id],row=node('div','log-mode',modes);row.style.setProperty('--log-accent',mode.accent);
  const title=node('div','log-mode-title',row);node('strong','',title,mode.name);node('span','',title,s.completed+' / '+summary.total);
  meter(row,s.completed,summary.total,mode.name+' completed levels');
  node('small','',row,(mode.unlimited?'Practice completions':s.stars+' / '+(summary.total*3)+' stars')+' · '+s.gems+' gems');
 }
 node('h2','',journey,'Worlds');
 const list=node('div','log-worlds',journey);
 for(const w of worlds){
  const s=summarizeProgress(p,w.levels),row=node('div','log-world',list);row.style.setProperty('--log-accent',identityForWorld(w.number).accent);
  const title=node('div','log-mode-title',row);node('strong','',title,w.name);node('span','',title,s.completed+' / '+s.total);
  meter(row,s.completed,s.total,w.name+' completed levels in any mode');
  node('small','',row,'Cadet '+s.modes.cadet.completed+' · Pilot '+s.modes.pilot.completed+' · Ace '+s.modes.ace.completed);
 }
 const trophyTitle=node('div','log-trophy-heading',trophies);node('h2','',trophyTitle,'Achievements');node('span','',trophyTitle,badges.filter(a=>a.earned).length+' / '+badges.length);
 const grid=node('div','log-achievements',trophies);
 for(const a of badges){
  const card=node('article','log-achievement',grid);card.dataset.earned=String(a.earned);
  const glyph=node('span','log-achievement-icon',card,a.symbol);glyph.setAttribute('aria-hidden','true');
  const copy=node('div','',card);node('strong','',copy,a.title);node('p','',copy,a.description);
  node('small','',copy,a.earned?'✓ Earned':a.current+' / '+a.target);
  const rewards=cosmeticsForAchievement(a.id);if(rewards.length)node('p','log-cosmetic-rewards',copy,'Workshop: '+rewards.map(c=>c.name).join(', '));
 }
 node('p','log-local-note',content,'Saved on this browser only. No account or cloud sync. All levels remain unlocked.');
 heading.focus();return ()=>back.removeEventListener('click',onHome);
}
