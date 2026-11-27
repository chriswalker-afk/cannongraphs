import type {Point} from '../engine/coordinates';
import type {AnchorPoint} from '../levels/anchorSpec';
import {svgNode as el} from './pip';
import {CANNON_FOOTPRINT} from '../game/anchorArtGeometry';

// Quiet reclaimed-machine yard. Decorative steel and cranes are not terrain.
export function renderSalvageScenery(parent:Element,w:number,h:number,variant=0){
 const layer=el('g',{'aria-hidden':'true','pointer-events':'none','data-scenery':'salvage-yard','data-salvage-area':variant===0?'salvage-depot':'dismantling-yard'},parent);
 const k=Math.min(w/800,h/380),floor=h*.91;
 el('rect',{y:floor,width:w,height:h-floor,fill:'#829082',opacity:.30},layer);
 const distant=el('g',{opacity:.28},layer);
 for(const f of [.12,.82]){
  const x=w*f;
  el('path',{d:'M'+x+' '+floor+' V'+h*.13+' H'+(x+w*.23),fill:'none',stroke:'#74827a','stroke-width':Math.max(5,14*k),'stroke-linejoin':'round'},distant);
  el('path',{d:'M'+x+' '+h*.13+' l'+w*.1+' '+h*.08+' l'+w*.09+' '+(-h*.08),fill:'none',stroke:'#84938a','stroke-width':Math.max(2,5*k)},distant);
  const hook=x+w*.18;el('path',{d:'M'+hook+' '+h*.13+' V'+h*.34+' q-12 0 -12 10 q0 12 12 8',fill:'none',stroke:'#77847c','stroke-width':Math.max(2,4*k),'stroke-linecap':'round'},distant);
 }
 if(variant===1){const g=el('g',{opacity:.24},layer);for(const f of [.32,.67]){const x=w*f;el('path',{d:'M'+x+' '+floor+' V'+h*.25+' H'+(x+w*.11)+' V'+floor,fill:'none',stroke:'#657b72','stroke-width':Math.max(5,12*k),'stroke-linejoin':'round'},g);el('rect',{x:x+w*.025,y:h*.27,width:w*.06,height:h*.10,rx:4,fill:'#ae936d',stroke:'#667b70','stroke-width':Math.max(1,3*k)},g);el('path',{d:'M'+(x+w*.055)+' '+h*.37+' V'+h*.61,stroke:'#63786f','stroke-width':Math.max(3,7*k)},g);}}
 for(const [i,f] of [.09,.27,.59,.87].entries()){
  const g=el('g',{transform:'translate('+(w*f)+' '+floor+') scale('+k+')',opacity:.33},layer);
  for(const [x,y,angle] of [[-46,-22,12],[9,-19,-17],[-15,-53,6]]){
   const piece=el('g',{transform:'translate('+x+' '+y+') rotate('+angle+')'},g);
   el('rect',{x:-25,y:-13,width:50,height:26,rx:4,fill:i%2?'#9a8769':'#85918a',stroke:'#64776e','stroke-width':3},piece);
   el('path',{d:'M-20 -7 H20 M-20 7 H20',stroke:'#c6bb9b','stroke-width':3},piece);
  }
  const gear=el('g',{transform:'translate(37 -42)'},g);
  for(let j=0;j<8;j++)el('rect',{x:-5,y:-31,width:10,height:12,rx:1,fill:'#958a6c',transform:'rotate('+j*45+')'},gear);
  el('circle',{r:23,fill:'#a49a7b',stroke:'#748176','stroke-width':4},gear);
  el('circle',{r:9,fill:'#d9d8c2',stroke:'#748176','stroke-width':4},gear);
 }
 return layer;
}

// Marks identify true muzzle coordinates. The deck and bolts are art only;
// the current occupant is rendered separately by the ordinary cannon renderer.
export function renderAnchorMount(parent:Element,anchor:AnchorPoint,p:(p:Point)=>Point,scale:number,occupant?:{id:string;direction:1|-1}){
 const a=p(anchor.position),g=el('g',{transform:'translate('+a.x+' '+a.y+')','data-mount-id':anchor.id,'data-mount-occupied':occupant?.id??'',class:'salvage-mount'},parent);
 const s=Math.max(10,scale),deckY=CANNON_FOOTPRINT.drop*scale,dir=occupant?.direction??1;
 const body=el('g',{transform:'scale('+dir+' 1)','pointer-events':'none'},g);
 el('rect',{x:-.82*scale,y:deckY,width:.96*scale,height:Math.max(4,.13*scale),rx:2,fill:'#b4a078',stroke:'#6f7057','stroke-width':1.1},body);
 for(const x of [-.71,.05])el('circle',{cx:x*scale,cy:deckY+Math.max(2,.06*scale),r:Math.max(1,scale*.025),fill:'#f0dca9',stroke:'#6f7057','stroke-width':.7},body);
 if(!occupant){
  el('rect',{x:-Math.max(18,.48*s),y:-Math.max(18,.48*s),width:Math.max(36,.96*s),height:Math.max(36,.96*s),rx:6,fill:'transparent','pointer-events':'all'},g);
  el('circle',{r:Math.max(7,.17*s),fill:'#fff8df',stroke:'#9b7c43','stroke-width':1.8,'stroke-dasharray':'3 2',class:'mount-ring','data-anchor-dot':'','pointer-events':'none'},g);
  const r=Math.max(3,.08*s);el('path',{d:'M-'+r+' 0 H'+r+' M0 -'+r+' V'+r,stroke:'#887244','stroke-width':1.25,'pointer-events':'none'},g);
  el('text',{x:0,y:-Math.max(13,.29*s),'text-anchor':'middle','font-size':Math.max(11,Math.min(16,.23*s)),'font-weight':800,fill:'#71582e',stroke:'#fffaf0','stroke-width':3,'paint-order':'stroke','pointer-events':'none'},g).textContent=anchor.id;
 }else{
  // Occupied dots remain measurable for drop hit testing, but are invisible
  // and never intercept a click intended for the mounted cannon.
  g.setAttribute('pointer-events','none');
  el('circle',{r:3,fill:'transparent','data-anchor-dot':'','pointer-events':'none'},g);
  el('text',{x:dir*Math.max(12,.30*s),y:deckY+Math.max(13,.23*s),'text-anchor':'middle','font-size':Math.max(10,Math.min(13,.20*s)),'font-weight':750,fill:'#71582e',stroke:'#fffaf0','stroke-width':2.5,'paint-order':'stroke'},g).textContent=anchor.id;
 }
 return g;
}
export function renderAnchorGrip(parent:Element,point:Point,scale:number,id:string,direction:1|-1,editable:boolean){
 const x=point.x-direction*.36*scale,y=point.y+CANNON_FOOTPRINT.drop*scale;
 const g=el('g',{transform:'translate('+x+' '+y+')','data-anchor-move':id,class:'anchor-grip',role:'button',tabindex:editable?'0':'-1','aria-label':'Move cannon '+id,'aria-disabled':String(!editable)},parent);
 const w=Math.max(44,scale*.95),h=Math.max(32,scale*.25),gw=Math.max(12,Math.min(22,scale*.40));
 el('rect',{x:-w/2,y:0,width:w,height:h,rx:4,fill:'transparent','pointer-events':editable?'all':'none','data-anchor-grip-hit':''},g);
 el('rect',{x:-gw/2,y:Math.max(2,scale*.14),width:gw,height:11,rx:3,fill:'#6a624b',stroke:'#f1d9a0','stroke-width':.8,'pointer-events':'none'},g);
 el('path',{d:'M-4 6 h8 M-4 9 h8',transform:'translate(0 '+Math.max(2,scale*.14)+')',stroke:'#fff3d1','stroke-width':1.2,'stroke-linecap':'round','pointer-events':'none'},g);
 return g;
}
