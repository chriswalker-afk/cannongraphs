import type {Point} from '../engine/coordinates';
import type {AnchorPoint} from '../levels/anchorSpec';
import {svgNode as el} from './pip';
import {CANNON_FOOTPRINT} from '../game/anchorArtGeometry';

// Quiet reclaimed-machine yard. Decorative steel and cranes are not terrain.
export function renderSalvageScenery(parent:Element,w:number,h:number,variant=0){
 const layer=el('g',{'aria-hidden':'true','pointer-events':'none','data-scenery':'salvage-yard','data-salvage-area':['salvage-depot','dismantling-yard','sorting-station','reconstruction-plant'][variant]??'salvage-depot'},parent);
 const k=Math.min(w/800,h/380),floor=h*.91;
 el('rect',{y:floor,width:w,height:h-floor,fill:'#829082',opacity:.30},layer);
 const distant=el('g',{opacity:.24},layer);
 for(const f of (variant===0?[.12,.82]:variant===1?[.10,.86]:variant===2?[.86]:[])){
  const x=w*f;
  el('path',{d:'M'+x+' '+floor+' V'+h*.13+' H'+(x+w*.23),fill:'none',stroke:'#74827a','stroke-width':Math.max(5,14*k),'stroke-linejoin':'round'},distant);
  el('path',{d:'M'+x+' '+h*.13+' l'+w*.1+' '+h*.08+' l'+w*.09+' '+(-h*.08),fill:'none',stroke:'#84938a','stroke-width':Math.max(2,5*k)},distant);
  const hook=x+w*.18;el('path',{d:'M'+hook+' '+h*.13+' V'+h*.34+' q-12 0 -12 10 q0 12 12 8',fill:'none',stroke:'#77847c','stroke-width':Math.max(2,4*k),'stroke-linecap':'round'},distant);
 }
 if(variant===1){const g=el('g',{opacity:.24},layer);for(const f of [.32,.67]){const x=w*f;el('path',{d:'M'+x+' '+floor+' V'+h*.25+' H'+(x+w*.11)+' V'+floor,fill:'none',stroke:'#657b72','stroke-width':Math.max(5,12*k),'stroke-linejoin':'round'},g);el('rect',{x:x+w*.025,y:h*.27,width:w*.06,height:h*.10,rx:4,fill:'#ae936d',stroke:'#667b70','stroke-width':Math.max(1,3*k)},g);el('path',{d:'M'+(x+w*.055)+' '+h*.37+' V'+h*.61,stroke:'#63786f','stroke-width':Math.max(3,7*k)},g);}}
 if(variant===2){
  const g=el('g',{opacity:.28},layer);
  for(const f of [.15,.62]){
   const x=w*f,y=floor-50*k,ww=w*.25;
   el('rect',{x,y,width:ww,height:24*k,rx:10*k,fill:'#9b9a7f',stroke:'#6c8075','stroke-width':Math.max(2,4*k)},g);
   for(let i=0;i<7;i++)el('circle',{cx:x+(i+.5)*ww/7,cy:y+12*k,r:7*k,fill:'#d0c9ad',stroke:'#728278','stroke-width':2*k},g);
   for(const q of [.12,.88])el('path',{d:'M'+(x+q*ww)+' '+(y+24*k)+' V'+floor,stroke:'#71847a','stroke-width':8*k},g);
   el('path',{d:'M'+(x+ww*.32)+' '+(y-85*k)+' H'+(x+ww*.68)+' L'+(x+ww*.56)+' '+(y-25*k)+' H'+(x+ww*.44)+'Z',fill:'#b8a17b',stroke:'#748579','stroke-width':3*k},g);
   el('path',{d:'M'+(x+ww*.5)+' '+(y-25*k)+' V'+(y-8*k),stroke:'#728379','stroke-width':9*k},g);
  }
 }
 if(variant===3){
  const g=el('g',{opacity:.27},layer);
  for(const f of [.25,.66]){
   const x=w*f,ww=w*.18,top=h*.22;
   el('path',{d:'M'+x+' '+floor+' V'+top+' H'+(x+ww)+' V'+floor,fill:'none',stroke:'#647b70','stroke-width':Math.max(3,12*k),'stroke-linejoin':'round'},g);
   el('rect',{x:x+ww*.12,y:top+12*k,width:ww*.76,height:28*k,rx:4*k,fill:'#ac966a',stroke:'#687e72','stroke-width':3*k},g);
   el('path',{d:'M'+(x+ww*.5)+' '+(top+40*k)+' V'+(floor-85*k)+' q-14 0 -14 11 q0 14 14 8',fill:'none',stroke:'#687c72','stroke-width':5*k},g);
   el('rect',{x:x+ww*.12,y:floor-26*k,width:ww*.76,height:26*k,rx:3*k,fill:'#849484',stroke:'#677f70','stroke-width':3*k},g);
   for(let i=0;i<5;i++)el('path',{d:'M'+(x+ww*(.18+i*.14))+' '+(floor-21*k)+' l'+ww*.06+' 0 -'+ww*.05+' '+(16*k)+' h-'+ww*.06+'Z',fill:'#b5a06b'},g);
  }
 }
 // Each area has its own foreground silhouette; avoid identical piles on every level.
 for(const [i,f] of (variant===0?[.09,.27,.59,.87]:variant===1?[.11,.90]:variant===2?[.08,.91]:[.08,.92]).entries()){
  const g=el('g',{transform:'translate('+(w*f)+' '+floor+') scale('+k+')',opacity:.33},layer);
  g.setAttribute('data-salvage-landmark',['parts-rack','steel-offcuts','sorting-bins','finished-assemblies'][variant]??'parts-rack');
  if(variant===1){
   for(const [x,y,angle] of [[-44,-14,7],[8,-16,-5],[-14,-42,15]]){
    const beam=el('g',{transform:'translate('+x+' '+y+') rotate('+angle+')'},g);
    el('path',{d:'M-36 -9 H36 V-4 H7 V4 H36 V9 H-36 V4 H-7 V-4 H-36Z',fill:'#8c9b8d',stroke:'#667e73','stroke-width':2.4},beam);
   }
   continue;
  }
  if(variant===2){
   for(const x of [-25,27]){
    el('path',{d:'M'+(x-22)+' -46 h44 l-7 44 h-30Z',fill:'#adab89',stroke:'#6b8172','stroke-width':2.8},g);
    el('path',{d:'M'+(x-19)+' -38 h38 M'+x+' -35 v25',stroke:'#7f8d78','stroke-width':3},g);
    el('rect',{x:x-24,y:-50,width:48,height:7,rx:2,fill:'#879985'},g);
   }
   continue;
  }
  if(variant===3){
   for(const x of [-26,27]){
    el('rect',{x:x-22,y:-45,width:44,height:42,rx:5,fill:'#98a58e',stroke:'#6b8073','stroke-width':3},g);
    el('circle',{cx:x,cy:-24,r:13,fill:'#c2b994',stroke:'#738774','stroke-width':3},g);
    el('circle',{cx:x,cy:-24,r:5,fill:'#738774'},g);
    el('path',{d:'M'+(x-18)+' -4 h36',stroke:'#697f72','stroke-width':5},g);
   }
   continue;
  }
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
 const radius=Math.max(8,Math.min(12,.19*s));
 const body=el('g',{transform:'scale('+dir+' 1)','pointer-events':'none'},g);
 el('rect',{x:-.82*scale,y:deckY,width:.96*scale,height:Math.max(4,.13*scale),rx:2,fill:'#b4a078',stroke:'#6f7057','stroke-width':1.1},body);
 for(const x of [-.71,.05])el('circle',{cx:x*scale,cy:deckY+Math.max(2,.06*scale),r:Math.max(1,scale*.025),fill:'#f0dca9',stroke:'#6f7057','stroke-width':.7},body);
 if(!occupant){
  el('rect',{x:-Math.max(18,.48*s),y:-Math.max(18,.48*s),width:Math.max(36,.96*s),height:Math.max(36,.96*s),rx:6,fill:'transparent','pointer-events':'all'},g);
  el('circle',{r:radius+2,fill:'#fffdf2',opacity:.9,'pointer-events':'none'},g);
  el('circle',{r:radius,fill:'#fff8df',stroke:'#76531e','stroke-width':2.2,'stroke-dasharray':'3 2',class:'mount-ring','data-anchor-dot':'','pointer-events':'none'},g);
  const r=Math.max(3,radius*.48);el('path',{d:'M-'+r+' 0 H'+r+' M0 -'+r+' V'+r,stroke:'#76531e','stroke-width':1.6,'stroke-linecap':'round',class:'mount-cross','pointer-events':'none'},g);
  el('text',{x:0,y:-radius-5,'text-anchor':'middle','font-size':Math.max(12,Math.min(15,.23*s)),'font-weight':900,fill:'#67481e',stroke:'#fffdf2','stroke-width':3.5,'paint-order':'stroke',class:'mount-label','pointer-events':'none'},g).textContent=anchor.id;
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
