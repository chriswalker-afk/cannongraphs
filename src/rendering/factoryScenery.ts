import {svgNode as el} from './pip';
// Distant machinery is purely scenic. Nothing in this layer is solid,
// interactive, animated across the grid, or part of a mathematical trajectory.
function gear(parent:Element,x:number,y:number,r:number,teeth:number,turn:number){
 const group=el('g',{transform:'translate('+x+' '+y+') rotate('+turn+')'},parent);
 const points:string[]=[];
 for(let i=0;i<teeth*4;i++){
  const angle=i*Math.PI*2/(teeth*4),radius=i%4===1||i%4===2?r:r*.82;
  points.push(radius*Math.cos(angle)+','+radius*Math.sin(angle));
 }
 el('polygon',{points:points.join(' '),fill:'#a99d84',stroke:'#7d807c','stroke-width':r*.045,'stroke-linejoin':'round'},group);
 el('circle',{r:r*.62,fill:'#d6c2a0',stroke:'#83867c','stroke-width':r*.045},group);
 for(let i=0;i<5;i++){
  const a=i*Math.PI*2/5;
  el('line',{x1:0,y1:0,x2:r*.55*Math.cos(a),y2:r*.55*Math.sin(a),stroke:'#92958b','stroke-width':r*.14,'stroke-linecap':'round'},group);
 }
 el('circle',{r:r*.19,fill:'#d9e4df',stroke:'#858b83','stroke-width':r*.055},group);
}
export function renderFactoryScenery(parent:Element,w:number,h:number){
 const layer=el('g',{'aria-hidden':'true','pointer-events':'none','data-scenery':'contraption-factory'},parent);
 const unit=Math.min(w,h)/420;
 const shell=el('g',{opacity:.23},layer);
 // Recessed wall frames and overhead pipe runs, behind the coordinate plane.
 for(let i=0;i<5;i++){
  const x=w*i/5;
  el('rect',{x:x+w*.02,y:h*.13,width:w*.16,height:h*.76,rx:8*unit,fill:'#c3c4b7',stroke:'#848f8b','stroke-width':4*unit},shell);
  el('path',{d:'M'+(x+w*.03)+' '+h*.19+' V'+h*.83,stroke:'#f5e8cf','stroke-width':3*unit},shell);
 }
 const pipes=el('g',{opacity:.24,fill:'none','stroke-linejoin':'round','stroke-linecap':'round'},layer);
 for(const [offset,drop] of [[.14,.52],[.75,.67]]){
  const x=w*offset,y=h*drop,d='M'+x+' '+h*.05+' V'+(y-26*unit)+' Q'+x+' '+y+' '+(x+26*unit)+' '+y+' H'+(x+w*.13);
  el('path',{d,stroke:'#727f83','stroke-width':22*unit},pipes);
  el('path',{d,stroke:'#bd9a69','stroke-width':13*unit},pipes);
  el('rect',{x:x-15*unit,y:h*.18,width:30*unit,height:9*unit,rx:2*unit,fill:'#808e8d'},pipes);
 }
 const wheels=el('g',{opacity:.28},layer);
 gear(wheels,w*.18,h*.32,55*unit,12,10);
 gear(wheels,w*.30,h*.49,42*unit,10,0);
 gear(wheels,w*.76,h*.29,68*unit,14,8);
 gear(wheels,w*.87,h*.47,40*unit,10,0);
 for(const x of [w*.08,w*.46,w*.91]){
  const furnace=el('g',{transform:'translate('+x+' '+h*.87+') scale('+unit+')',opacity:.26},layer);
  el('rect',{x:-32,y:-59,width:64,height:70,rx:9,fill:'#858e8b',stroke:'#727c78','stroke-width':3},furnace);
  el('path',{d:'M-20 0 V-23 A20 20 0 0 1 20 -23 V0Z',fill:'#cd925e'},furnace);
  el('path',{d:'M-11 0 V-17 A11 11 0 0 1 11 -17 V0Z',fill:'#ffe5a9'},furnace);
  el('rect',{x:-12,y:-75,width:24,height:18,rx:3,fill:'#898e83'},furnace);
  el('rect',{x:-37,y:8,width:74,height:7,rx:2,fill:'#73817e'},furnace);
 }
 el('rect',{y:h*.94,width:w,height:h*.06,fill:'#a5a69c',opacity:.24},layer);
}
