import type {CannonType} from '../game/cannons';
import {cannonTypes} from '../game/cannons';
import {svgNode as el} from './pip';
// Shared cannon artwork. The mouth is always local (0,0); mirroring and
// placement are caller-owned. Recoil affects only the barrel artwork.
export function renderCannonArt(body:Element,type:CannonType,angle:number){
 const style=cannonTypes[type];
 el('ellipse',{cx:-.37,cy:.47,rx:.37,ry:.09,fill:'#584d42','fill-opacity':.35},body);
 el('rect',{x:-.74,y:.35,width:.73,height:.12,rx:.05,fill:'#a77347',stroke:'#694c38','stroke-width':.025},body);
 el('circle',{cx:-.38,cy:.29,r:.18,fill:'#b38856',stroke:'#715039','stroke-width':.035},body);
 const barrel=el('g',{transform:'rotate('+(-angle)+')'},body);
 el('rect',{x:-.70,y:-.17,width:.65,height:.34,rx:.1,fill:style.color,stroke:'#254763','stroke-width':.035},barrel);
 el('path',{d:'M-.60 -.105 H-.23',stroke:'#d9f4ff','stroke-width':.045,'stroke-linecap':'round',opacity:.75},barrel);
 el('rect',{x:-.15,y:-.21,width:.15,height:.42,rx:.035,fill:style.color,stroke:'#254763','stroke-width':.035},barrel);
 el('ellipse',{cx:0,cy:0,rx:.045,ry:.16,fill:'#153147'},barrel);
 const symbol=el('text',{x:-.37,y:.06,'text-anchor':'middle','font-size':.21,fill:'white','font-weight':800},barrel);symbol.textContent=style.symbol;
 return barrel;
}
