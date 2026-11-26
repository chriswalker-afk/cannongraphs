import type {Point} from '../engine/coordinates';
import {GEM_RADIUS,type Gem} from '../levels/schema';
import {svgNode as el} from './pip';
// Art is centered on the authored circular pickup area. The tiny coordinate
// dot stays visible after collection; the generous invisible focus target is
// for inspection only and never enlarges the physical pickup radius.
export function renderGem(parent:Element,gem:Gem,project:(p:Point)=>Point,scale:number):SVGGElement{
 const p=project(gem.position),g=el('g',{transform:'translate('+p.x+' '+p.y+') scale('+scale+')',class:'trajectory-gem','data-gem-state':'waiting'},parent) as SVGGElement;
 el('circle',{r:Math.max(GEM_RADIUS,9/scale),fill:'transparent'},g);
 const core=el('g',{class:'gem-core','pointer-events':'none'},g);
 // A non-colliding locator ring keeps the tiny gem discoverable at wide zooms.
 el('circle',{r:Math.max(.22,5/scale),fill:'none',stroke:'#176e70','stroke-width':Math.max(.02,1.15/scale),'stroke-dasharray':Math.max(.035,2/scale)+' '+Math.max(.035,2/scale),opacity:.85},core);
 el('path',{d:'M0 -.14 L.12 -.045 .08 .075 0 .14 -.08 .075 -.12 -.045Z',fill:'#45c6bc',stroke:'#175e64','stroke-width':.022,'stroke-linejoin':'round'},core);
 el('path',{d:'M0 -.14 L.04 -.04 0 .14 -.04 -.04Z',fill:'#b9fff0',opacity:.8},core);
 el('path',{d:'M-.12 -.045 H.12 L.04 -.04 0 .14 -.04 -.04Z',fill:'#198d92',opacity:.65},core);
 el('circle',{r:.029,fill:'#fff',stroke:'#175e64','stroke-width':.012},core);
 const burst=el('g',{class:'gem-spark','pointer-events':'none'},g);
 el('circle',{r:.27,fill:'none',stroke:'#f5c65c','stroke-width':.025},burst);
 for(const [x,y] of [[.27,0],[-.27,0],[0,.27],[0,-.27]])el('path',{d:'M0 -.065 L.018 -.018 .065 0 .018 .018 0 .065 -.018 .018 -.065 0 -.018 -.018Z',fill:'#ffe19a',transform:'translate('+x+' '+y+')'},burst);
 el('circle',{r:.025,fill:'#175e64','pointer-events':'none'},g);
 return g;
}
