import type {Point} from '../engine/coordinates';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
import type {RapidFrame} from '../animations/rapidFire';
import {createPip,svgNode} from './pip';
import {routeLegs} from '../engine/simulation/linearRoute';
import {flightPath} from './flightPath';
export function createRapidVisual(parent:Element,count:number,variantOffset:number,result:AttemptResult){
 const layer=svgNode('g',{'pointer-events':'none','aria-hidden':'true','data-rapid-visual':''},parent);
 const trailLayer=svgNode('g',{},layer),spritesLayer=svgNode('g',{},layer);
 // Pool only the visible celebration's sprites; redraw restores the same sample.
 const slots=Array.from({length:count},(_,i)=>{
  const trail=svgNode('path',{fill:'none','stroke-width':2.5,'stroke-linecap':'round',stroke:'#f1b346',opacity:.8},trailLayer);
  const pip=createPip(spritesLayer,variantOffset+i);return {trail,pip};
 });
 const smokeGroups=routeLegs(result).map(leg=>{const smoke=svgNode('g',{},layer);const clouds=Array.from({length:5},()=>svgNode('circle',{fill:'#fff8e5',stroke:'#b9b4a9','stroke-width':.01},smoke));return {leg,smoke,clouds};});
 const flare=svgNode('g',{},layer);
 const ring=svgNode('circle',{r:.34,fill:'none',stroke:'#ffe16d','stroke-width':.045},flare);
 const sparks=Array.from({length:8},()=>svgNode('path',{d:'M0 -.08 L.025 -.025 .08 0 .025 .025 0 .08 -.025 .025 -.08 0 -.025 -.025Z',fill:'#ffdc68',stroke:'#b87e31','stroke-width':.012},flare));
 const hide=()=>layer.setAttribute('display','none');hide();
 return {hide,paint(frame:RapidFrame,result:AttemptResult,project:(p:Point)=>Point,scale:number,reduced:boolean){
  layer.setAttribute('display','inline');
  for(const {trail,pip} of slots){trail.setAttribute('display','none');pip.root.setAttribute('display','none');}
  for(const f of frame.pips){
   const {trail,pip}=slots[f.index],p=project(f.point);
   pip.root.setAttribute('display','inline');pip.root.setAttribute('opacity',String(f.opacity));
   pip.root.setAttribute('transform','translate('+p.x+' '+p.y+') scale('+(scale*f.scale)+') rotate('+f.tilt+')');
   pip.setPose(f.phase==='flying'?'flying':'excited');pip.setStretch(f.stretch);
   if(f.trailStart){trail.setAttribute('display','inline');trail.setAttribute('d',flightPath(routeLegs(result)[f.legIndex],f.trailStart,f.point,project));}
  }
  const b=project(result.end);
  smokeGroups.forEach(({leg,smoke,clouds},i)=>{
   const a=project(leg.source),angle=leg.angle*Math.PI/180,vx=Math.cos(angle)*leg.direction,vy=-Math.sin(angle),burst=frame.cannonCues[i].burst;
   smoke.setAttribute('transform','translate('+a.x+' '+a.y+') scale('+scale+')');
   smoke.setAttribute('opacity',String(burst===null?0:1-burst));
   clouds.forEach((c,i)=>{const k=burst??0,d=.08+k*(.19+i*.04),side=(i-2)*.055;c.setAttribute('cx',String(vx*d-vy*side));c.setAttribute('cy',String(vy*d+vx*side));c.setAttribute('r',String(.045+k*.08));});
  });
  flare.setAttribute('transform','translate('+b.x+' '+b.y+') scale('+scale+')');
  flare.setAttribute('opacity',String(frame.portal));
  ring.setAttribute('r',String(.34+(reduced?0:.38*(1-frame.portal))));
  sparks.forEach((star,i)=>{const a=i*Math.PI/4,r=reduced?.46:.35+(1-frame.portal)*.6;star.setAttribute('transform','translate('+(r*Math.cos(a))+' '+(r*Math.sin(a))+')');});
 }};
}
