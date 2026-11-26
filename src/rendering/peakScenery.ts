import {svgNode as el} from './pip';
// Original decorative alpine silhouettes; solid terrain is rendered separately.
export function renderPeakScenery(parent:Element,w:number,h:number){
 const g=el('g',{'pointer-events':'none','aria-hidden':'true','data-scenery':'parabola-peaks'},parent);
 el('circle',{cx:w*.83,cy:h*.17,r:Math.min(w,h)*.11,fill:'#fff3d7',opacity:.7},g);
 const mountains=[{x:.12,y:.28,s:.27,c:'#aca9d3'},{x:.34,y:.15,s:.34,c:'#a29fc9'},{x:.62,y:.24,s:.29,c:'#b7b5da'},{x:.88,y:.13,s:.32,c:'#9e9dc6'}];
 for(const m of mountains){
  const x=w*m.x,y=h*m.y,left=x-w*m.s,right=x+w*m.s,base=h*.89;
  el('path',{d:'M'+left+' '+base+' L'+x+' '+y+' L'+right+' '+base+'Z',fill:m.c,opacity:.47},g);
  const z=h*.16,dx=w*m.s*z/(base-y);
  el('path',{d:'M'+(x-dx)+' '+(y+z)+' L'+x+' '+y+' L'+(x+dx)+' '+(y+z)+' l'+(-dx*.55)+' '+(-z*.25)+' l'+(-dx*.38)+' '+(z*.16)+' l'+(-dx*.45)+' '+(-z*.2)+'Z',fill:'#fffaf9',opacity:.72},g);
 }
 el('path',{d:'M0 '+h*.87+' Q'+w*.16+' '+h*.69+' '+w*.32+' '+h*.84+' T'+w*.67+' '+h*.79+' T'+w+' '+h*.83+' V'+h+' H0Z',fill:'#88b6b2',opacity:.47},g);
 for(const [x,y,s] of [[.07,.76,.85],[.29,.81,1.15],[.71,.79,.9],[.94,.71,1.1]]){
  const k=Math.min(w,h)/420*s;
  const tree=el('g',{transform:'translate('+w*x+' '+h*y+') scale('+k+')',opacity:.38},g);
  el('rect',{x:-2,y:-4,width:4,height:17,fill:'#75628b'},tree);
  el('path',{d:'M0 -44 L-13 -23 H-7 L-17 -5 H17 L7 -23 H13Z',fill:'#618f92'},tree);
  el('path',{d:'M0 -44 L-7 -32 L0 -35 L7 -32Z',fill:'#f7f2ff'},tree);
 }
}
