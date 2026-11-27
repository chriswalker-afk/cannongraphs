import type {Level} from '../levels/schema';
import {anchorAssignments,inventoryCannon,lockedAnchorEquation} from '../levels/anchorSpec';
import {lockedLiftText} from '../levels/liftSpec';
import {cannonTypes} from '../game/cannons';
import {renderCannonArt} from '../rendering/cannonArt';
import {renderBrokenDetails} from '../rendering/foundryScenery';
import {svgNode} from '../rendering/pip';
import type {LearningMode} from '../game/learningModes';

interface TrayOptions{
 getLevel:()=>Level;editable:()=>boolean;mode:LearningMode;
 move:(id:string,anchor:string|null)=>boolean;
 highlight:(id?:string,mount?:string)=>void;
 onSelect?:()=>void;
}
function node<K extends keyof HTMLElementTagNameMap>(tag:K,parent:Element,cls:string,text?:string){const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;parent.append(e);return e;}
export function mountAnchorTray(root:HTMLElement,stage:HTMLElement,options:TrayOptions){
 const puzzle=options.getLevel().anchorPuzzle!;
 root.className='anchor-tray';root.setAttribute('role','group');root.setAttribute('aria-label','Cannon inventory');
 const heading=node('div',root,'anchor-tray-heading'),title=node('strong',heading,'','Cannon tray'),counter=node('span',heading,'anchor-count');
 const cards=node('div',root,'anchor-parts'),controls=node('div',root,'anchor-tray-actions');
 const returnButton=node('button',controls,'anchor-return','Return to tray');returnButton.type='button';
 const cancel=node('button',controls,'anchor-cancel','Cancel selection');cancel.type='button';
 const message=node('p',root,'anchor-instructions');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
 const items=new Map<string,{button:HTMLButtonElement;status:HTMLElement;equation:HTMLElement}>();
 let selected:string|undefined,hover:string|undefined,drag:{id:string;pointer:number;x:number;y:number;moving:boolean;capture:Element}|undefined,ghost:HTMLElement|undefined,suppressClick=false;
 function announce(text:string){message.textContent=text;}
 function paint(){
  const level=options.getLevel(),assignments=anchorAssignments(level),editable=options.editable();
  counter.textContent=assignments.size+' / '+puzzle.inventory.length+' mounted';
  for(const [id,card] of items){
   const item=inventoryCannon(level,id)!,mount=assignments.get(id),c=level.cannons.find(c=>c.id===id),equation=c&&lockedAnchorEquation(level,c);
   card.button.disabled=!editable;card.button.dataset.mounted=String(!!mount);card.button.setAttribute('aria-pressed',String(selected===id));
   card.status.textContent=mount?'Mount '+mount:'In tray';
   card.equation.textContent=equation?lockedLiftText(equation):item.lockedShape!==undefined?'y = '+item.lockedShape+' + c':cannonTypes[item.type].label+' · programmable';
  }
  returnButton.disabled=!editable||!selected||!assignments.has(selected);
  cancel.disabled=!editable||!selected;
  options.highlight(selected,hover);
 }
 function choosePart(id:string){
  if(!options.editable()||!items.has(id))return;
  selected=id;hover=undefined;options.onSelect?.();
  announce('Cannon '+id+' selected. Choose a free mount, or drag it.');
  paint();
 }
 function clearSelection(){
  selected=hover=undefined;announce('Drag a cannon or select it, then choose a free mount.');paint();
 }
 function place(id:string,anchor:string|null){
  if(!options.editable())return false;
  const assignments=anchorAssignments(options.getLevel()),occupied=[...assignments].find(([other,a])=>other!==id&&a===anchor);
  if(occupied){announce('Mount '+anchor+' is occupied. Choose another mount.');return false;}
  try{
   if(!options.move(id,anchor))return false;
   selected=id;hover=undefined;announce(anchor?'Cannon '+id+' mounted at '+anchor+'. Choose another mount to move it.':'Cannon '+id+' returned to the tray.');paint();return true;
  }catch(e){announce(e instanceof Error?e.message:'That placement is unavailable.');return false;}
 }
 function chooseMount(id:string){
  if(!options.editable())return;
  if(!selected){announce('Select a cannon in the tray first.');return;}
  if(place(selected,id))items.get(selected)?.button.focus({preventScroll:true});
 }
 for(const part of puzzle.inventory){
  const b=node('button',cards,'anchor-part');b.type='button';b.dataset.anchorPart=part.id;
  b.style.setProperty('--part-color',cannonTypes[part.type].color);
  const art=svgNode('svg',{viewBox:'-1 -.65 1.5 1.3','aria-hidden':'true',focusable:'false'},b);
  const body=svgNode('g',{transform:'scale('+part.direction+' 1)'},art);
  const barrel=renderCannonArt(body,part.type,22,undefined,part.direction);if(part.lockedShape!==undefined)renderBrokenDetails(body,barrel);
  const copy=node('span',b,'anchor-part-copy');node('strong',copy,'','Cannon '+part.id+(part.lockedShape!==undefined?' · Locked':''));
  const equation=node('span',copy,'anchor-part-equation'),status=node('span',copy,'anchor-part-status');
  items.set(part.id,{button:b,status,equation});b.addEventListener('click',()=>choosePart(part.id));
 }
 returnButton.onclick=()=>{if(selected)place(selected,null);};cancel.onclick=clearSelection;

 // Use the visible SVG muzzle marker, not the decorative bracket bounding
 // box. The camera transform is already reflected in each marker's DOM rect.
 function mountNear(x:number,y:number):string|undefined{
  const area=stage.getBoundingClientRect();
  if(x<area.left||x>area.right||y<area.top||y>area.bottom)return;
  let closest:string|undefined,best=Infinity;
  for(const g of Array.from(stage.querySelectorAll<SVGElement>('[data-mount-id]'))){
   const dot=g.querySelector('[data-anchor-dot]');if(!dot)continue;
   const r=dot.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
   if(cx<area.left||cx>area.right||cy<area.top||cy>area.bottom)continue;
   const d=Math.hypot(cx-x,cy-y),radius=Math.max(25,r.width*.8);
   if(d<=radius&&d<best){best=d;closest=g.getAttribute('data-mount-id')??undefined;}
  }
  return closest;
 }
 const targetPart=(event:PointerEvent)=>{
  const e=(event.pointerType==='touch'?document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-anchor-part],[data-anchor-move]'):null)??(event.target as Element).closest('[data-anchor-part],[data-anchor-move]');
  if(!e||!root.contains(e)&&!stage.contains(e))return;
  const id=e.getAttribute('data-anchor-part')??e.getAttribute('data-anchor-move');
  return id&&items.has(id)?id:undefined;
 };
 function down(e:PointerEvent){
  suppressClick=false;
  if(!options.editable()||drag||e.button!==0)return;
  const id=targetPart(e);if(!id)return;
  // Capture on persistent containers, not a cannon group removed by redraw.
  drag={id,pointer:e.pointerId,x:e.clientX,y:e.clientY,moving:false,capture:root.contains(e.target as Node)?root:stage};
 }
 function move(e:PointerEvent){
  if(!drag||drag.pointer!==e.pointerId||!options.editable())return;
  if(!drag.moving&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
  if(!drag.moving){
   drag.moving=true;choosePart(drag.id);if(!drag.capture.hasPointerCapture(e.pointerId))drag.capture.setPointerCapture(e.pointerId);
   ghost=node('div',document.body,'anchor-drag-ghost','Cannon '+drag.id);
   ghost.setAttribute('aria-hidden','true');
   const card=items.get(drag.id)!.button.querySelector('svg')!.cloneNode(true);
   ghost.prepend(card);root.dataset.dragging='true';
  }
  e.preventDefault();e.stopPropagation();
  if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';}
  hover=mountNear(e.clientX,e.clientY);options.highlight(selected,hover);
 }
 function stop(e:PointerEvent,commit:boolean){
  if(!drag||drag.pointer!==e.pointerId)return;
  const d=drag;drag=undefined;ghost?.remove();ghost=undefined;delete root.dataset.dragging;hover=undefined;
  if(d.capture.hasPointerCapture(e.pointerId))d.capture.releasePointerCapture(e.pointerId);
  if(d.moving){
   if(e.pointerType!=='touch')e.preventDefault();e.stopPropagation();suppressClick=true;
   if(commit&&options.editable()){
    const mount=mountNear(e.clientX,e.clientY),target=document.elementFromPoint(e.clientX,e.clientY);
    if(mount)place(d.id,mount);
    else if(target&&root.contains(target))place(d.id,null);
    else announce('Drop on a mount or back into the tray. Position unchanged.');
   }
  }
  paint();
 }
 const up=(e:PointerEvent)=>stop(e,true),cancelDrag=(e:PointerEvent)=>stop(e,false);
 // Transferring implicit touch capture from the original button to the
 // persistent tray/stage emits lostpointercapture on the original button.
 // Only loss from our actual capture owner cancels an in-progress drag.
 const lostCapture=(e:PointerEvent)=>{if(drag?.capture===e.target)stop(e,false);};
 function click(e:MouseEvent){if(suppressClick&&e.detail!==0&&(root.contains(e.target as Node)||stage.contains(e.target as Node))){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();}}
 function key(e:KeyboardEvent){if(e.key==='Escape'&&selected&&(root.contains(e.target as Node)||stage.contains(e.target as Node))){clearSelection();e.stopPropagation();}}
 document.addEventListener('pointerdown',down,true);document.addEventListener('pointermove',move,{capture:true,passive:false});
 document.addEventListener('pointerup',up,true);document.addEventListener('pointercancel',cancelDrag,true);document.addEventListener('lostpointercapture',lostCapture,true);
 document.addEventListener('click',click,true);document.addEventListener('keydown',key,true);
 clearSelection();
 return {choosePart,chooseMount,clearSelection,update:()=>{if(!options.editable()&&selected){selected=hover=undefined;}paint();},destroy:()=>{document.removeEventListener('pointerdown',down,true);document.removeEventListener('pointermove',move,true);document.removeEventListener('pointerup',up,true);document.removeEventListener('pointercancel',cancelDrag,true);document.removeEventListener('lostpointercapture',lostCapture,true);document.removeEventListener('click',click,true);document.removeEventListener('keydown',key,true);ghost?.remove();}};
}
