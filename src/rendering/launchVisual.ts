import type {Point} from '../engine/coordinates';
import {barrelVector,type DemoFrame} from '../animations/launch';
import {createPip,svgNode} from './pip';
import type {PipLook} from '../game/pipCosmetics';
import type {CannonLook} from '../game/cannonCosmetics';
import {createBurstParticles,burstPalette} from './cannonBurst';
export function createLaunchVisual(parent:Element,look?:PipLook,cannonLook?:CannonLook,variant=0){
 const layer=svgNode('g',{'pointer-events':'none','aria-hidden':'true','data-launch-visual':''},parent);
 const smoke=svgNode('g',{},layer);
 const effect=cannonLook?.effect??'smoke',particles=createBurstParticles(smoke,effect),[,stroke,flashFill]=burstPalette(effect);
 const flash=svgNode('path',{d:'M0 -.16 L.035 -.045 L.15 -.10 L.075 0 L.15 .10 L.035 .045 L0 .16 L-.035 .045 L-.12 .07 L-.065 0 L-.12 -.07 L-.035 -.045Z',fill:flashFill,stroke:effect==='smoke'?'#f0a33b':stroke,'stroke-width':.018},smoke);
 const charge=svgNode('circle',{r:.19,fill:'none',stroke:'#ffe28a','stroke-width':.035},smoke);
 const pip=createPip(layer,variant,look);pip.root.setAttribute('data-flight-pip','');
 const halo=svgNode('circle',{fill:'none',stroke:'#fff3bb','stroke-width':1.5,'pointer-events':'none','data-flight-halo':'',display:'none'},layer);
 const hide=()=>layer.setAttribute('display','none');
 hide();
 return {hide,paint(frame:DemoFrame,origin:Point,direction:1|-1,angle:number,project:(p:Point)=>Point,scale:number,size=1){
  layer.setAttribute('display','inline');
  const a=project(origin),v=barrelVector(direction,angle);
  smoke.setAttribute('transform','translate('+a.x+' '+a.y+') scale('+scale+')');
  charge.setAttribute('opacity',String(frame.charge*.85));
  const b=frame.burst;
  flash.setAttribute('opacity',String(b===null?0:Math.max(0,1-3*b)));
  particles.paint(b,v.x,-v.y);
  layer.setAttribute('data-launch-phase',frame.pose);
  if(frame.pip){
   const p=project(frame.pip);
   pip.root.setAttribute('display','inline');pip.root.setAttribute('opacity',String(frame.opacity));
   pip.root.setAttribute('transform','translate('+p.x+' '+p.y+') scale('+(scale*size)+') rotate('+frame.tilt+')');
   const highlight=frame.pose==='flying'&&scale*.20<7;
   halo.setAttribute('display',highlight?'inline':'none');
   if(highlight){halo.setAttribute('cx',String(p.x));halo.setAttribute('cy',String(p.y));halo.setAttribute('r',String(Math.max(7,scale*.24)));halo.setAttribute('opacity',String(frame.opacity*.8));}
   pip.setPose(frame.pose);pip.setStretch(frame.stretch);pip.setWalkCycle(frame.walkCycle);
  }else {pip.root.setAttribute('display','none');halo.setAttribute('display','none');}
 }};
}
