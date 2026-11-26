import {svgNode as el} from './pip';
// Subdued original astronomical scenery. All shapes are screen-space art
// behind the mathematical plot, not physical obstacles or pick-up regions.
export function renderCosmicScenery(parent:Element,w:number,h:number){
 const g=el('g',{'pointer-events':'none','aria-hidden':'true','data-scenery':'beyond-graphiverse'},parent);
 const unit=Math.min(w,h)/420;
 const nebula=el('g',{opacity:.32},g);
 el('path',{d:'M0 '+h*.62+' C'+w*.2+' '+h*.26+' '+w*.36+' '+h*.84+' '+w*.57+' '+h*.45+' S'+w*.86+' '+h*.1+' '+w+' '+h*.26+' V'+h*.52+' C'+w*.68+' '+h*.34+' '+w*.57+' '+h*.94+' '+w*.33+' '+h*.76+' S'+w*.1+' '+h*.46+' 0 '+h*.85+'Z',fill:'#a7a3de'},nebula);
 el('path',{d:'M0 '+h*.2+' C'+w*.21+' '+h*.08+' '+w*.34+' '+h*.62+' '+w*.57+' '+h*.36+' S'+w*.78+' '+h*.19+' '+w+' '+h*.42+' V'+h*.55+' C'+w*.7+' '+h*.26+' '+w*.53+' '+h*.66+' '+w*.31+' '+h*.45+' S'+w*.13+' '+h*.13+' 0 '+h*.37+'Z',fill:'#d7abcf',opacity:.64},nebula);
 // Deterministic star positions keep camera redraws visually stable.
 for(let i=0;i<56;i++){
  const x=w*((i*71+13)%257)/257,y=h*((i*43+7)%197)/197,r=(i%9===0?1.8:.75)*unit;
  el('circle',{cx:x,cy:y,r,fill:i%9===0?'#fff6c7':'#fff',opacity:i%9===0?.9:.58},g);
  if(i%13===0)el('path',{d:'M'+(x-4*unit)+' '+y+' H'+(x+4*unit)+' M'+x+' '+(y-4*unit)+' V'+(y+4*unit),stroke:'#fff','stroke-width':unit,opacity:.55},g);
 }
 const planet=el('g',{transform:'translate('+w*.8+' '+h*.22+') rotate(-17) scale('+unit+')',opacity:.43},g);
 el('ellipse',{rx:99,ry:25,fill:'none',stroke:'#7f90bd','stroke-width':7},planet);
 el('circle',{r:55,fill:'#b29dce',stroke:'#9587b8','stroke-width':2},planet);
 el('path',{d:'M-50 -19 Q0 -2 50 -19 M-53 4 Q0 22 53 4 M-44 26 Q0 42 44 26',fill:'none',stroke:'#e8c8e0','stroke-width':8,opacity:.58},planet);
 el('path',{d:'M-99 0 A99 25 0 0 0 99 0',fill:'none',stroke:'#dbe2f8','stroke-width':9},planet);
 const moon=el('g',{transform:'translate('+w*.14+' '+h*.24+') scale('+unit+')',opacity:.38},g);
 el('circle',{r:35,fill:'#c4c6e7',stroke:'#929ac8','stroke-width':2},moon);
 for(const [x,y,r] of [[-12,-14,9],[11,-5,6],[-7,16,5],[19,15,8]])el('circle',{cx:x,cy:y,r,fill:'#9c9ec6',opacity:.55},moon);
 // Distant satellite with paired solar wings and a communications dish.
 for(const [x,y,s,a] of [[.25,.7,.8,12],[.58,.1,.65,-14],[.91,.72,.8,-8]]){
  const satellite=el('g',{transform:'translate('+w*x+' '+h*y+') rotate('+a+') scale('+unit*s+')',opacity:.32},g);
  for(const side of [-1,1]){
   const wing=el('g',{transform:'scale('+side+' 1)'},satellite);
   el('rect',{x:21,y:-12,width:48,height:24,rx:2,fill:'#7183b0',stroke:'#586b9d','stroke-width':2},wing);
   for(let j=1;j<4;j++)el('path',{d:'M'+(21+j*12)+' -12 V12',stroke:'#cad5ef','stroke-width':1.5},wing);
   el('path',{d:'M21 0 H69',stroke:'#cad5ef','stroke-width':1.5},wing);
   el('rect',{x:12,y:-2,width:9,height:4,fill:'#8994ad'},wing);
  }
  el('rect',{x:-12,y:-16,width:24,height:32,rx:6,fill:'#c6c3d5',stroke:'#7884a3','stroke-width':2},satellite);
  el('path',{d:'M0 -16 V-24 M-13 -32 Q0 -18 13 -32',fill:'none',stroke:'#7884a3','stroke-width':3,'stroke-linecap':'round'},satellite);
  el('circle',{cy:-29,r:2.5,fill:'#fff2c5'},satellite);
 }
}
