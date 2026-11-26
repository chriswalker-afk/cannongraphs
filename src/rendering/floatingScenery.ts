import {svgNode as el} from './pip';
// Screen-space distant scenery, intentionally translucent and noninteractive.
// None of these shapes belongs to the solid terrain model.
export function renderFloatingScenery(parent:Element,width:number,height:number){
 const layer=el('g',{'pointer-events':'none','aria-hidden':'true','data-scenery':'floating-isles'},parent);
 el('circle',{cx:width*.83,cy:height*.16,r:Math.min(width,height)*.115,fill:'#fff7d7',opacity:.65},layer);
 const unit=Math.min(width,height)/440;
 for(const [x,y,s] of [[.15,.21,.75],[.46,.13,1],[.74,.33,.72],[.91,.69,1.2],[.25,.78,1.15],[.57,.87,.65]]){
  const g=el('g',{transform:'translate('+width*x+' '+height*y+') scale('+unit*s+')',opacity:.36},layer);
  el('path',{d:'M-66 0 Q-38 -18 0 -9 T65 1 L48 25 22 39 4 76 -17 54 -43 34Z',fill:'#a2a3c7'},g);
  el('path',{d:'M-66 0 Q-39 -22 0 -12 T65 1 L42 9 -34 11Z',fill:'#80b9b4'},g);
  el('path',{d:'M-30 11 L-13 39 4 76 -3 30 22 12',fill:'#868bb2',opacity:.45},g);
  el('path',{d:'M22 3 Q27 21 23 37 T24 67 T19 104',fill:'none',stroke:'#e3fbff','stroke-width':8,'stroke-linecap':'round'},g);
  el('path',{d:'M22 3 Q27 21 23 37 T24 67 T19 104',fill:'none',stroke:'#79cce7','stroke-width':3,'stroke-linecap':'round'},g);
  el('ellipse',{cx:17,cy:105,rx:17,ry:5,fill:'#fff',opacity:.8},g);
  el('path',{d:'M-36 -9 v-24 l-10 14 h20 l-10 -14 M-13 -10 v-18 l-8 11 h16 l-8 -11',stroke:'#73959b','stroke-width':2,fill:'#8fbbb8','stroke-linejoin':'round'},g);
 }
 for(const [x,y,s] of [[.08,.48,1],[.36,.4,.8],[.66,.17,1.2],[.85,.53,.9],[.48,.65,.75]]){
  const g=el('g',{transform:'translate('+width*x+' '+height*y+') scale('+unit*s+')',fill:'#fff',opacity:.48},layer);
  el('ellipse',{rx:55,ry:11},g);el('circle',{cx:-23,cy:-6,r:16},g);el('circle',{cx:8,cy:-9,r:21},g);el('circle',{cx:32,cy:-3,r:13},g);
 }
}
