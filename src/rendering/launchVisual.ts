import type {Point} from '../engine/coordinates';
import {barrelVector,type DemoFrame} from '../animations/launch';
import {createPip,svgNode} from './pip';
export function createLaunchVisual(parent:Element){
 const layer=svgNode('g',{'pointer-events':'none','aria-hidden':'true','data-launch-visual':''},parent);
 const smoke=svgNode('g',{},layer);
 const clouds=Array.from({length:6},()=>svgNode('circle',{fill:'#fff8e5',stroke:'#b9b4a9','stroke-width':.009},smoke));
 const flash=svgNode('path',{d:'M0 -.16 L.035 -.045 L.15 -.10 L.075 0 L.15 .10 L.035 .045 L0 .16 L-.035 .045 L-.12 .07 L-.065 0 L-.12 -.07 L-.035 -.045Z',fill:'#ffe78b',stroke:'#f0a33b','stroke-width':.018},smoke);
 const charge=svgNode('circle',{r:.19,fill:'none',stroke:'#ffe28a','stroke-width':.035},smoke);
 const pip=createPip(layer);
 const hide=()=>layer.setAttribute('display','none');
 hide();
 return {hide,paint(frame:DemoFrame,origin:Point,direction:1|-1,angle:number,project:(p:Point)=>Point,scale:number){
  layer.setAttribute('display','inline');
  const a=project(origin),v=barrelVector(direction,angle);
  smoke.setAttribute('transform','translate('+a.x+' '+a.y+') scale('+scale+')');
  charge.setAttribute('opacity',String(frame.charge*.85));
  const b=frame.burst;
  flash.setAttribute('opacity',String(b===null?0:Math.max(0,1-3*b)));
  clouds.forEach((c,i)=>{
   const p=b??0,side=(i-2.5)*.045,dist=.08+p*(.22+i*.025);
   c.setAttribute('cx',String(v.x*dist+v.y*side*(1+p)));
   c.setAttribute('cy',String(-v.y*dist+v.x*side*(1+p)));
   c.setAttribute('r',String(.045+p*.08+(i%2)*.02));
   c.setAttribute('opacity',String(b===null?0:.75*(1-p)));
  });
  if(frame.pip){
   const p=project(frame.pip);
   pip.root.setAttribute('display','inline');pip.root.setAttribute('opacity',String(frame.opacity));
   pip.root.setAttribute('transform','translate('+p.x+' '+p.y+') scale('+scale+') rotate('+frame.tilt+')');
   pip.setPose(frame.pose);pip.setStretch(frame.stretch);
  }else pip.root.setAttribute('display','none');
 }};
}
