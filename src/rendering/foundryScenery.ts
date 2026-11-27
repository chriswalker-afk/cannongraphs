import {svgNode as el,createPip} from './pip';
import {renderCannonArt} from './cannonArt';
import {cannonTypes} from '../game/cannons';
import {CANNON_FOOTPRINT} from '../game/anchorArtGeometry';
import type {Point} from '../engine/coordinates';
import type {Cannon,Level} from '../levels/schema';

// Amber-lit steelworks. Distant scenery never contributes collision geometry.
// Work in a fixed 800×380 design space with aspect-preserving scale. Draw the
// wide pieces across the viewport; graph axes remain the dominant marks.
export function renderFoundryScenery(parent:Element,w:number,h:number,variant=0,postcard=false){
 const layer=el('g',{'aria-hidden':'true','pointer-events':'none','data-scenery':'broken-foundry','data-foundry-hall':['repair-bay','hydraulic-workshop','furnace-hall','assembly-line'][variant]??'repair-bay'},parent);
 const alpha=postcard?.95:.28,unit=Math.min(w/800,h/380),floor=h*.91;
 const wall=el('g',{opacity:alpha*.55},layer);
 for(let i=0;i<5;i++){
  const x=w*(.025+i*.2),width=w*.15,top=h*.18,bottom=h*.74;
  el('path',{d:'M'+x+' '+bottom+' V'+(top+width*.28)+' Q'+(x+width/2)+' '+(top-width*.25)+' '+(x+width)+' '+(top+width*.28)+' V'+bottom+'Z',fill:i%2?'#d8c3a0':'#e9d6af',stroke:'#89918a','stroke-width':Math.max(1,4*unit)},wall);
  for(const f of [.33,.66])el('line',{x1:x+width*f,y1:top+width*.23,x2:x+width*f,y2:bottom,stroke:'#a3a097','stroke-width':Math.max(.7,2.5*unit)},wall);
  el('line',{x1:x,y1:h*.46,x2:x+width,y2:h*.46,stroke:'#a3a097','stroke-width':Math.max(.7,3*unit)},wall);
 }
 const truss=el('g',{opacity:alpha*.75,fill:'none','stroke-linecap':'round'},layer);
 const y=h*.11,beam=Math.max(3,9*unit);
 for(const off of [0,h*.075])el('path',{d:'M0 '+(y+off)+' H'+w,stroke:'#687a78','stroke-width':beam},truss);
 for(let i=0;i<10;i++){const a=w*i/10,b=w*(i+1)/10;el('path',{d:'M'+a+' '+y+' L'+b+' '+(y+h*.075),stroke:'#78877f','stroke-width':Math.max(1,4*unit)},truss);}
 for(const x of [w*.075,w*.48,w*.925]){
  el('path',{d:'M'+x+' '+y+' V'+floor,stroke:'#778580','stroke-width':Math.max(4,15*unit)},truss);
  el('path',{d:'M'+(x-2*unit)+' '+(y+10*unit)+' V'+floor,stroke:'#d0c8aa','stroke-width':Math.max(1,3*unit)},truss);
 }
 // Four distinct halls: repair benches, hydraulic presses, furnaces and assembly line.
 const hall=el('g',{opacity:alpha*.84,'data-hall-machinery':''},layer);
 const positions=variant===0?[.12,.84]:variant===1?[.22,.79]:variant===2?[.11,.51,.88]:[.13,.37,.82];
 for(const [i,f] of positions.entries()){
  const g=el('g',{transform:'translate('+(w*f)+' '+floor+') scale('+unit+')'},hall);
  if(variant===0){
   // Repair bay: workbench, drawers and hanging tools.
   el('rect',{x:-64,y:-55,width:128,height:12,rx:3,fill:'#7f8172',stroke:'#596964','stroke-width':3},g);
   for(const x of [-52,40])el('rect',{x,y:-43,width:13,height:43,fill:'#82918a'},g);
   el('rect',{x:-29,y:-43,width:58,height:40,rx:2,fill:'#b8ad8d',stroke:'#748078','stroke-width':3},g);
   for(const y of [-34,-20,-7])el('path',{d:'M-25 '+y+' h50 M-7 '+(y-5)+' h14',stroke:'#778580','stroke-width':3},g);
   el('rect',{x:-54,y:-133,width:108,height:65,rx:4,fill:'#bcc5b3',stroke:'#7b887d','stroke-width':3},g);
   for(const x of [-34,0,34])el('path',{d:'M'+x+' -122 v32 m-7 -30 l7 8 7 -8',fill:'none',stroke:'#667a72','stroke-width':5,'stroke-linecap':'round'},g);
   continue;
  }
  if(variant===1){
   // Hydraulic workshop: steel press frames and piston cylinders.
   el('path',{d:'M-47 0 V-141 H47 V0',fill:'none',stroke:'#74867e','stroke-width':13,'stroke-linejoin':'round'},g);
   el('rect',{x:-20,y:-138,width:40,height:44,rx:5,fill:'#aa956c',stroke:'#65756d','stroke-width':3},g);
   el('rect',{x:-8,y:-94,width:16,height:52,fill:'#c1cbc1',stroke:'#7d8880','stroke-width':3},g);
   el('rect',{x:-36,y:-42,width:72,height:14,rx:2,fill:'#b9a274',stroke:'#65756d','stroke-width':3},g);
   el('path',{d:'M-56 0 H56 M-42 -13 H42',stroke:'#778980','stroke-width':10},g);
   continue;
  }
  if(variant===3){
   // Assembly line: conveyor, rollers and overhead hoist.
   el('rect',{x:-78,y:-35,width:156,height:25,rx:10,fill:'#88978a',stroke:'#687b72','stroke-width':3},g);
   for(let x=-62;x<=62;x+=25)el('circle',{cx:x,cy:-22,r:8,fill:'#c5cbb5',stroke:'#748278','stroke-width':3},g);
   for(const x of [-60,60])el('path',{d:'M'+x+' -9 V0',stroke:'#687b72','stroke-width':12},g);
   el('path',{d:'M-58 -45 V-145 H58 V-45',fill:'none',stroke:'#829187','stroke-width':9,'stroke-linejoin':'round'},g);
   el('rect',{x:-19,y:-142,width:38,height:24,rx:4,fill:'#b59a67',stroke:'#758175','stroke-width':3},g);
   el('path',{d:'M0 -118 V-76 q-15 0 -15 12 q0 14 15 9',fill:'none',stroke:'#71827a','stroke-width':5},g);
   continue;
  }
  const tall=variant===2||i%2===0,top=tall?-128:-91;
  el('path',{d:'M-42 0 V'+(top+21)+' Q-42 '+top+' -21 '+top+' H21 Q42 '+top+' 42 '+(top+21)+' V0Z',fill:'#7a8985',stroke:'#616c69','stroke-width':3},g);
  el('rect',{x:-17,y:top-26,width:34,height:27,rx:4,fill:'#8b8e80',stroke:'#6d7167','stroke-width':3},g);
  el('path',{d:'M-29 -9 V-46 Q-29 -70 0 -70 Q29 -70 29 -46 V-9Z',fill:'#a36e46',stroke:'#685e51','stroke-width':4},g);
  el('path',{d:'M-20 -12 V-45 Q-20 -61 0 -61 Q20 -61 20 -45 V-12Z',fill:'#e5a356'},g);
  el('path',{d:'M-12 -14 Q-24 -35 -5 -44 Q-7 -29 4 -31 Q18 -43 16 -23 L14 -14Z',fill:'#fff0ba',opacity:.95},g);
  el('rect',{x:-48,y:-9,width:96,height:11,rx:3,fill:'#697a75'},g);
  for(const x of [-33,33])for(const yy of [top+16,-15])el('circle',{cx:x,cy:yy,r:3,fill:'#c8ba92'},g);
 }
 const pipe=el('g',{opacity:alpha*.52,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},layer);
 for(const [x,yy] of [[.25,.33],[.71,.4]]){
  const a=w*x,b=h*yy,d='M'+a+' '+h*.015+' V'+b+' H'+(a+w*.13);
  el('path',{d,stroke:'#697f7c','stroke-width':Math.max(5,18*unit)},pipe);
  el('path',{d,stroke:'#c99c62','stroke-width':Math.max(2,10*unit)},pipe);
 }
 el('rect',{y:floor,width:w,height:h-floor,fill:'#87908a',opacity:alpha*.52},layer);
 return layer;
}

// Draw the same mechanism on the playable cannon, workshop and postcard.
// The art is measured from the real muzzle, not from the barrel rotation.
export function renderLiftDeck(parent:Element){
 const g=el('g',{'pointer-events':'none','aria-hidden':'true','data-lift-deck':''},parent),y=CANNON_FOOTPRINT.drop;
 el('rect',{x:-.88,y,width:1.04,height:.17,rx:.025,fill:'#e9b74e',stroke:'#574b37','stroke-width':.035},g);
 for(let i=0;i<4;i++)el('path',{d:'M'+(-.85+i*.24)+' '+(y+.025)+' l.10 0 -.085 .12 -.10 0Z',fill:'#554a3a'},g);
 el('path',{d:'M-.86 '+(y+.17)+' H.14 L.02 '+(y+.27)+' H-.75Z',fill:'#778580',stroke:'#495953','stroke-width':.025},g);
 for(const x of [-.8,.08])el('circle',{cx:x,cy:y+.08,r:.022,fill:'#fff1c9',stroke:'#7d6643','stroke-width':.012},g);
 return g;
}
export function renderBrokenDetails(body:Element,barrel:Element){
 el('path',{d:'M-.51 -.16 l.08 .07 -.065 .055 .08 .09',stroke:'#443e39','stroke-width':.037,fill:'none','pointer-events':'none','stroke-linecap':'round','data-broken-crack':''},barrel);
 const lock=el('g',{transform:'translate(-.65 -.40)','pointer-events':'none','aria-hidden':'true','data-broken-lock':''},body);
 el('rect',{x:-.11,y:-.02,width:.22,height:.16,rx:.03,fill:'#eab64e',stroke:'#56462d','stroke-width':.025},lock);
 el('path',{d:'M-.06 -.02 V-.075 a.06 .06 0 0 1 .12 0 V-.02',stroke:'#56462d','stroke-width':.034,fill:'none'},lock);
 el('circle',{cx:0,cy:.05,r:.023,fill:'#594a35'},lock);
}

// The first line remains the actual rail range (used for dragging/inspection).
// The rest is decorative structural bracing; all positions use world coords.
export function renderLiftRail(parent:Element,c:Cannon,level:Level,p:(point:Point)=>Point,scale:number){
 if(!c.lift)return;
 const x=c.position.x-c.direction*.5,a=p({x,y:c.lift.maxY}),z=p({x,y:c.lift.minY-CANNON_FOOTPRINT.drop});
 const rail=el('g',{'data-layer':'lift-rail','data-lift-for':c.id,'pointer-events':'none','aria-hidden':'true'},parent);
 el('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#4c5d5b','stroke-width':Math.max(7,scale*.25),'stroke-linecap':'round'},rail);
 const left=p({x:x-.18,y:c.lift.maxY}),right=p({x:x+.18,y:c.lift.maxY}),footY=Math.max(level.bounds.minY,...level.obstacles.filter(o=>x>=o.bounds.minX&&x<=o.bounds.maxX&&o.bounds.maxY<c.lift!.minY-CANNON_FOOTPRINT.drop).map(o=>o.bounds.maxY)),foot=p({x,y:footY});
 for(const q of [left,right])el('line',{x1:q.x,y1:a.y,x2:q.x,y2:foot.y,stroke:'#7e8a80','stroke-width':Math.max(1.5,scale*.055)},rail);
 el('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#c5d1c3','stroke-width':Math.max(2,scale*.065)},rail);
 for(let y=c.lift.minY;y<=c.lift.maxY&&y<c.lift.minY+100;y++){const m=p({x,y});el('line',{x1:left.x,y1:m.y,x2:right.x,y2:m.y,stroke:'#ad894a','stroke-width':Math.max(1,scale*.045)},rail);}
 const baseWidth=Math.max(8,scale*.62),capWidth=Math.max(8,scale*.5);
 el('rect',{x:foot.x-baseWidth/2,y:foot.y-Math.max(2,scale*.08),width:baseWidth,height:Math.max(2,scale*.08),rx:1,fill:'#6e7d73',stroke:'#465952','stroke-width':1},rail);
 el('rect',{x:a.x-capWidth/2,y:a.y-Math.max(3,scale*.10),width:capWidth,height:Math.max(4,scale*.15),rx:2,fill:'#b7a16d',stroke:'#5d6558','stroke-width':1},rail);
 return rail;
}

export function renderFoundryPostcard(parent:Element,w:number,h:number){
 renderFoundryScenery(parent,w,h,2,true);
 const fg=el('g',{'aria-hidden':'true','pointer-events':'none'},parent);
 el('rect',{x:0,y:137,width:360,height:13,fill:'#778681'},fg);
 el('path',{d:'M0 137 H360',stroke:'#c7a65f','stroke-width':4},fg);
 // Two clearly movable cannons, each attached to a grounded gantry. Dotted
 // route is only an illustrative motif, never a reference puzzle answer.
 for(const [x,y,type,angle] of [[105,99,'linear',35],[220,55,'quadratic',42]] as const){
  const rx=x-22;
  el('rect',{x:rx-7,y:15,width:14,height:122,rx:3,fill:'#586a65',stroke:'#485a55','stroke-width':1.5},fg);
  el('line',{x1:rx,y1:17,x2:rx,y2:137,stroke:'#c7cdbb','stroke-width':4},fg);
  for(const yy of [28,46,64,82,100,118])el('line',{x1:rx-7,y1:yy,x2:rx+7,y2:yy,stroke:'#cda254','stroke-width':2},fg);
  el('rect',{x:rx-15,y:132,width:30,height:5,rx:2,fill:'#5c6d65'},fg);
  const arrowX=rx-20;el('path',{d:'M'+arrowX+' '+(y-15)+' v38 m-5 -33 l5 -5 5 5 M'+(arrowX-5)+' '+(y+18)+' l5 5 5 -5',fill:'none',stroke:'#84602b','stroke-width':2.6,'stroke-linecap':'round','stroke-linejoin':'round'},fg);
  const cannon=el('g',{transform:'translate('+x+' '+y+') scale(43)'},fg);renderLiftDeck(cannon);const barrel=renderCannonArt(cannon,type,angle);renderBrokenDetails(cannon,barrel);
 }
 for(const [d,type] of [['M105 99 L220 55','linear'],['M220 55 Q270 0 322 65','quadratic']] as const){
  el('path',{d,stroke:'#fff7de','stroke-width':5,fill:'none','stroke-linecap':'round'},fg);
  el('path',{d,stroke:cannonTypes[type].color,'stroke-width':2.8,'stroke-dasharray':'5 4',fill:'none','stroke-linecap':'round'},fg);
 }
 const pip=createPip(fg,7);pip.root.setAttribute('transform','translate(122 78) scale(40)');pip.setPose('excited');
 el('path',{d:'M305 86 V70 Q305 51 322 51 Q339 51 339 70 V86Z',fill:'#9a937f',stroke:'#666756','stroke-width':2},fg);
 el('path',{d:'M311 86 V70 Q311 59 322 59 Q333 59 333 70 V86Z',fill:'#f4c86f'},fg);
}
