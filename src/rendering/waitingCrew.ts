import type {Level} from '../levels/schema';
import type {Point} from '../engine/coordinates';
import type {PipLook} from '../game/pipCosmetics';
import {waitingCrewSlots,waitingIndices} from '../animations/waitingCrew';
import {createPip,svgNode} from './pip';
export function createWaitingCrew(parent:Element,level:Level,total:number,project:(p:Point)=>Point,scale:number,look?:PipLook){
 const layer=svgNode('g',{'data-waiting-crew':'','pointer-events':'none','aria-hidden':'true'},parent);
 const positions=waitingCrewSlots(level,total);
 const slots=positions.map((position,i)=>{
  const a=project(position);
  // Position and bounce use separate SVG groups so CSS transforms never
  // overwrite the world-to-screen translation or change the graph scale.
  const holder=svgNode('g',{transform:'translate('+a.x+' '+a.y+') scale('+scale+')','data-waiting-pip':i,display:'none'},layer);
  svgNode('ellipse',{cy:.21,rx:.16,ry:.045,fill:'#233c4d',opacity:.20},holder);
  const pip=createPip(holder,i,look);pip.setPose('excited');
  pip.root.classList.add('pip-bob');pip.root.style.setProperty('--pip-delay',(-i*.23)+'s');
  return holder;
 });
 function update(waiting:number){
  const visible=new Set(waitingIndices(total,waiting,slots.length));
  for(const [i,holder] of slots.entries()){
   const display=visible.has(i)?'inline':'none';if(holder.getAttribute('display')!==display)holder.setAttribute('display',display);
  }
 }
 return {positions,update};
}
