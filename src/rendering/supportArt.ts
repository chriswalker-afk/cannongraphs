import type {Point} from '../engine/coordinates';
import type {SupportPlan} from '../levels/supports';
import type {CannonLook} from '../game/cannonCosmetics';
import {svgNode as el} from './pip';
interface SupportPalette{frame:string;edge:string;light:string;fastener:string}
const palettes:Readonly<Record<number,SupportPalette>>={
 1:{frame:'#936e4d',edge:'#72523e',light:'#d5b38b',fastener:'#b7a17e'},
 2:{frame:'#82949d',edge:'#596d80',light:'#c7d8db',fastener:'#e3d8ae'},
 3:{frame:'#8e899d',edge:'#656579',light:'#c4c6d4',fastener:'#d3e8e4'},
 4:{frame:'#a58a62',edge:'#746044',light:'#d6bf93',fastener:'#c4a774'},
 5:{frame:'#809195',edge:'#475d65',light:'#c4d1d1',fastener:'#d7b36c'},
 6:{frame:'#798bab',edge:'#465b83',light:'#bdcfe7',fastener:'#a2e0e1'}
};
export function supportPalette(world:number):SupportPalette{return palettes[world]??palettes[1];}
// Decorative open frames are deliberately thinner/lighter than collision
// terrain. Render behind the coordinate grid, obstacles and moving sprites.
export function renderSupportArt(parent:Element,plan:SupportPlan,world:number,project:(p:Point)=>Point,scale:number,look?:CannonLook){
 const p=supportPalette(world),origin=project({x:0,y:0}),d=plan.deck;
 const g=el('g',{'data-support-for':plan.id,'data-support-kind':plan.kind,'data-support-terrain':plan.terrainId??'background-roof','data-deck-y':d.y,'data-deck-min-x':d.minX,'data-deck-max-x':d.maxX,'pointer-events':'none','aria-hidden':'true',transform:'translate('+origin.x+' '+origin.y+') scale('+scale+' '+(-scale)+')'},parent);
 const braces=el('g',{opacity:.72},g);
 for(const segment of plan.segments){
  const {from,to,role}=segment,attr={x1:from.x,y1:from.y,x2:to.x,y2:to.y};
  if(Math.hypot(from.x-to.x,from.y-to.y)<1e-7)continue;
  if(role==='hanger'){
   el('line',{...attr,stroke:p.edge,'stroke-width':.045,'stroke-dasharray':world===1||world===2?'none':'.075 .035','stroke-linecap':'round'},braces);
   el('line',{...attr,stroke:p.light,'stroke-width':.016,opacity:.75},braces);
  }else{
   el('line',{...attr,stroke:p.edge,'stroke-width':.075,'stroke-linecap':'round'},braces);
   el('line',{...attr,stroke:p.frame,'stroke-width':.047,'stroke-linecap':'round'},braces);
  }
 }
 // Terminations sit on the actual terrain face; if no ceiling is present,
 // the suspension plates are flush with the top background boundary.
 if(plan.backgroundRoof){
  const [a,b]=plan.attachment;
  el('path',{d:'M'+(a.x-.07)+' '+a.y+' H'+(b.x+.07),stroke:p.edge,'stroke-width':.085,'stroke-linecap':'round',opacity:.62},g);
 }
 for(const a of plan.attachment){
  el('circle',{cx:a.x,cy:a.y,r:.065,fill:p.frame,stroke:p.edge,'stroke-width':.018,opacity:.78},g);
  el('circle',{cx:a.x,cy:a.y,r:.023,fill:p.fastener},g);
 }
 // The deck's top is exactly the shared visual contact plane. A narrow
 // open-frame mounting rail is visually distinct from solid terrain.
 const rail=el('g',{'data-support-deck':'','data-support-contact-y':d.y},g);
 el('rect',{x:d.minX,y:d.y-.07,width:d.maxX-d.minX,height:.07,rx:.018,fill:p.frame,stroke:p.edge,'stroke-width':.018,'fill-opacity':.86},rail);
 el('line',{x1:d.minX+.018,x2:d.maxX-.018,y1:d.y-.012,y2:d.y-.012,stroke:p.light,'stroke-width':.022,'stroke-linecap':'round'},rail);
 for(const x of [d.minX+.065,d.maxX-.065])el('circle',{cx:x,cy:d.y-.034,r:.021,fill:p.fastener,stroke:p.edge,'stroke-width':.008},rail);
 if(plan.id!=='exit'&&look?.base==='hover'){
  const mid=(d.minX+d.maxX)/2;
  const magnet=el('g',{'data-magnetic-dock':''},g);
  el('path',{d:'M'+(mid-.24)+' '+d.y+' v.035 h.48 v-.035',fill:'#5a718e',stroke:'#465b83','stroke-width':.015},magnet);
  el('path',{d:'M'+(mid-.19)+' '+(d.y+.048)+' h.38',stroke:'#92e9e4','stroke-width':.035,'stroke-linecap':'round',opacity:.9},magnet);
 }
 return g;
}
