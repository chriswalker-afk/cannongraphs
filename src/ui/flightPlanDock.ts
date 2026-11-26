import {cannonTypes} from '../game/cannons';
import {planStatus,countReady,type FlightPlan,type PlanStatus} from '../game/flightPlan';
import type {Cannon} from '../levels/schema';
const descriptions:Record<PlanStatus,{label:string;icon:string;detail:string}>={
 empty:{label:'Unprogrammed',icon:'○',detail:'Enter an equation'},
 invalid:{label:'Check input',icon:'!',detail:'Invalid equation'},
 ready:{label:'Ready',icon:'•',detail:'Valid input; not flight tested'},
 tested:{label:'Tested',icon:'✓',detail:'This unchanged equation completed a leg in an earlier attempt'},
 revise:{label:'Revise',icon:'!',detail:'This equation ended the attempted route'}
};
function node<K extends keyof HTMLElementTagNameMap>(tag:K,className:string,parent:HTMLElement,text?:string):HTMLElementTagNameMap[K]{
 const n=document.createElement(tag);n.className=className;if(text!==undefined)n.textContent=text;parent.append(n);return n;
}
export function mountFlightPlanDock(root:HTMLElement,cannons:readonly Cannon[],onSelect:(id:string)=>void){
 root.replaceChildren();root.classList.add('flight-plan');
 const head=node('div','plan-head',root),title=node('strong','plan-title',head,'Flight plan');
 title.id='plan-heading';
 const readiness=node('span','plan-ready',head);readiness.setAttribute('role','status');
 const cards=node('div','plan-cards',root);cards.setAttribute('role','group');cards.setAttribute('aria-labelledby',title.id);
 const elements=new Map<string,{button:HTMLButtonElement;equation:HTMLSpanElement;status:HTMLSpanElement}>();
 for(const c of cannons){
  const type=cannonTypes[c.type],button=node('button','plan-card',cards);button.type='button';button.style.setProperty('--cannon-color',type.color);
  button.dataset.cannonId=c.id;button.setAttribute('aria-controls','equation-editor');
  const glyph=node('span','plan-glyph',button,type.symbol);glyph.setAttribute('aria-hidden','true');
  const copy=node('span','plan-copy',button);
  node('span','plan-cannon',copy,'Cannon '+c.id+' · '+type.label);
  const equation=node('span','plan-equation',copy),status=node('span','plan-status',copy);
  button.addEventListener('click',()=>onSelect(c.id));elements.set(c.id,{button,equation,status});
 }
 let lastSelected:string|undefined;
 function update(plan:FlightPlan,selected:string,editable:boolean){
  const ready=countReady(plan),text=ready+' / '+plan.length+' ready';
  if(readiness.textContent!==text)readiness.textContent=text;
  root.dataset.locked=String(!editable);
  for(const entry of plan){
   const els=elements.get(entry.id);if(!els)continue;
   const c=cannons.find(c=>c.id===entry.id)!,state=planStatus(entry),d=descriptions[state],active=selected===entry.id;
   const raw=entry.text.trim(),display=raw?(/^y\s*=/i.test(raw)?raw:'y = '+raw):'Enter equation…';
   els.button.dataset.status=state;els.button.setAttribute('aria-pressed',String(active));els.button.disabled=!editable;
   els.button.setAttribute('aria-label','Cannon '+c.id+', '+cannonTypes[c.type].label+', '+display+'. '+d.label+'. '+d.detail);
   els.button.title=display+' — '+d.detail;
   els.equation.textContent=display;els.status.textContent=d.icon+' '+d.label;
  }
  if(selected!==lastSelected){
   const card=elements.get(selected)?.button;
   // Only scroll the horizontal rail, not the document or the game stage.
   if(card){const outer=cards.getBoundingClientRect(),inner=card.getBoundingClientRect();
    if(inner.left<outer.left)cards.scrollLeft+=inner.left-outer.left-4;
    else if(inner.right>outer.right)cards.scrollLeft+=inner.right-outer.right+4;}
   lastSelected=selected;
  }
 }
 return {update};
}
