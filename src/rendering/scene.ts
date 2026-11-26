import {cameraTransform,initialCamera,panCamera,zoomCamera,MIN_ZOOM,MAX_ZOOM,type Camera} from '../engine/camera';
import type {Point,Viewport} from '../engine/coordinates';
import {cannonTypes} from '../game/cannons';
import type {Level} from '../levels/schema';
import {BARREL_ANGLE} from '../animations/launch';
import {attemptDuration,sampleAttempt} from '../animations/attempt';
import {stageMisfire} from '../animations/misfire';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
import {createLaunchVisual} from './launchVisual';
import {makeRapidSchedule,sampleRapidFire,type RapidSchedule,type RapidCounts} from '../animations/rapidFire';
import {createRapidVisual} from './rapidVisual';

type Inspection={id:string;label:string;detail:string;point:Point};
const ns='http://www.w3.org/2000/svg';
function el(tag:string,attrs:Record<string,string|number>={},parent?:Element,content?:string){
 const e=document.createElementNS(ns,tag);
 for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));
 if(content!==undefined)e.textContent=content;
 parent?.append(e);return e;
}
const fmt=(n:number)=>String(Number(n.toFixed(4)));
const coord=(p:Point)=>'('+fmt(p.x)+', '+fmt(p.y)+')';

export function mountScene(stage:HTMLElement,level:Level,controls:{out:HTMLButtonElement;in:HTMLButtonElement;reset:HTMLButtonElement;left:HTMLButtonElement;right:HTMLButtonElement;up:HTMLButtonElement;down:HTMLButtonElement;readout:HTMLElement;info:HTMLElement}){
 const svg=el('svg',{role:'group','aria-label':'Coordinate playground. Inspect marked objects for coordinates. Drag the background or use arrows to pan when zoomed.'},stage) as SVGSVGElement;
 let viewport:Viewport={width:960,height:620,padding:34},camera:Camera=initialCamera(level.bounds);
 let t=cameraTransform(level.bounds,viewport,camera),pinned:string|undefined,hovered:string|undefined,focused:string|undefined;
 let inspections=new Map<string,Inspection>(),tooltip:SVGGElement;
 let drag:{id:number;x:number;y:number}|undefined;
 const source=level.cannons.find(c=>c.id===level.startId)!;
 const misfireStaging=stageMisfire(source.position,source.direction,level.bounds,level.obstacles);
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let startBarrel:Element|undefined,visual:ReturnType<typeof createLaunchVisual>|undefined;
 let active:{result:AttemptResult;started:number;elapsed:number;reduced:boolean;done:()=>void}|undefined,animationId=0;
 let lastResult:AttemptResult|undefined,trace:SVGLineElement|undefined,marker:SVGGElement|undefined;
 let rapid:{result:AttemptResult;schedule:RapidSchedule;started:number;elapsed:number;variantOffset:number;progress:(counts:RapidCounts)=>void;done:()=>void}|undefined;
 let rapidVisual:ReturnType<typeof createRapidVisual>|undefined,rapidParent:Element|undefined;
 function paintAttempt(){
  if(!visual||!startBarrel||!trace||!marker)return;
  const result=active?.result??lastResult,frame=active?sampleAttempt(active.elapsed,active.result,active.reduced,misfireStaging):undefined;
  const angle=result?.event.kind==='misfire'?BARREL_ANGLE:result?.angle??BARREL_ANGLE;
  startBarrel.setAttribute('transform','rotate('+(-angle)+') translate('+(-(frame?.recoil??0))+' 0)');
  if(frame&&result)visual.paint(frame,result.source,result.direction,angle,t.toScreen,t.scale,frame.size);else visual.hide();
  const to=frame?frame.trace:lastResult?.event.kind==='misfire'?null:lastResult?.end;
  const resolved=frame?.resolved??!!lastResult;
  const color=resolved?(result?.event.kind==='exit'?'#16874c':'#cf5148'):'#2583ca';
  trace.setAttribute('display',to&&result?'inline':'none');
  if(to&&result){
   const a=t.toScreen(result.start),b=t.toScreen(to);
   for(const [k,v] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:color}))trace.setAttribute(k,String(v));
  }
  marker.replaceChildren();marker.setAttribute('display',resolved&&result?'inline':'none');
  if(resolved&&result){
   const p=t.toScreen(result.end);marker.setAttribute('transform','translate('+p.x+' '+p.y+')');
   el('circle',{r:6,fill:'#fffaf0',stroke:color,'stroke-width':2},marker);
   el('path',{d:result.event.kind==='exit'?'M-3 0 l2 2 4 -5':'M-2 -2 L2 2 M2 -2 L-2 2',stroke:color,'stroke-width':1.6,fill:'none','stroke-linecap':'round'},marker);
  }
 }
 function paintRapid(){
  if(!rapid||!rapidVisual||!startBarrel)return;
  const frame=sampleRapidFire(rapid.elapsed,rapid.result,rapid.schedule);
  startBarrel.setAttribute('transform','rotate('+(-rapid.result.angle)+') translate('+(-frame.recoil)+' 0)');
  rapidVisual.paint(frame,rapid.result,t.toScreen,t.scale,rapid.schedule.reduced);
 }
 function rapidStep(now:number){
  if(!rapid)return;
  const current=rapid;
  current.elapsed=Math.max(0,now-current.started);
  const frame=sampleRapidFire(current.elapsed,current.result,current.schedule);
  current.progress({dispatched:frame.dispatched,arrived:frame.arrived});
  if(frame.done){
   rapidVisual?.hide();rapid=undefined;animationId=0;paintAttempt();current.done();return;
  }
  paintRapid();animationId=requestAnimationFrame(rapidStep);
 }
 function playRapidFire(result:AttemptResult,count:number,variantOffset:number,progress:(counts:RapidCounts)=>void,done:()=>void):boolean{
  if(active||rapid||!rapidParent||result!==lastResult)return false;
  const schedule=makeRapidSchedule(result,count,motion.matches);
  rapidParent.replaceChildren();rapidVisual=createRapidVisual(rapidParent,count,variantOffset);
  rapid={result,schedule,started:performance.now(),elapsed:0,variantOffset,progress,done};
  paintRapid();animationId=requestAnimationFrame(rapidStep);return true;
 }
 function step(now:number){
  if(!active)return;
  active.elapsed=Math.max(0,now-active.started)*(active.reduced?2:1);
  if(active.elapsed>=attemptDuration(active.result,active.reduced)){
   const finished=active;lastResult=finished.result;active=undefined;animationId=0;paintAttempt();finished.done();return;
  }
  paintAttempt();animationId=requestAnimationFrame(step);
 }
 function playFlight(result:AttemptResult,done:()=>void):boolean{
  if(active||rapid)return false;
  lastResult=undefined;active={result,started:performance.now(),elapsed:0,reduced:motion.matches,done};
  paintAttempt();animationId=requestAnimationFrame(step);return true;
 }
 function clearFlight(){if(!active&&!rapid){lastResult=undefined;rapidVisual?.hide();rapidParent?.replaceChildren();rapidVisual=undefined;paintAttempt();}}
 const plot=()=>({x:viewport.padding,y:viewport.padding,w:viewport.width-2*viewport.padding,h:viewport.height-2*viewport.padding});
 function inspect(){
  if(!tooltip)return;
  tooltip.replaceChildren();
  const item=inspections.get(hovered??focused??pinned??'');
  controls.info.textContent=item?item.label+' · '+item.detail:'Hover, tap or focus a cannon, exit or terrain to inspect its coordinates.';
  if(!item)return;
  const a=t.toScreen(item.point),q=plot();
  if(a.x<q.x||a.x>q.x+q.w||a.y<q.y||a.y>q.y+q.h)return;
  const w=Math.min(Math.max(108,item.detail.length*6.7+20,item.label.length*7+20),viewport.width-12),h=44;
  const x=Math.max(6,Math.min(viewport.width-w-6,a.x-w/2)),y=Math.max(4,Math.min(viewport.height-h-4,a.y>h+15?a.y-h-13:a.y+16));
  el('rect',{x,y,width:w,height:h,rx:8,fill:'#fffaf0',stroke:'#315779','stroke-width':1.5},tooltip);
  el('text',{x:x+w/2,y:y+15,'text-anchor':'middle','font-size':11,fill:'#536579','font-weight':700},tooltip,item.label);
  el('text',{x:x+w/2,y:y+33,'text-anchor':'middle','font-size':13,fill:'#203e55','font-weight':700},tooltip,item.detail);
 }
 function target(g:Element,item:Inspection){
  inspections.set(item.id,item);
  g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('data-inspect',item.id);g.setAttribute('aria-label',item.label+' '+item.detail);g.classList.add('inspectable');
  g.addEventListener('pointerenter',(event)=>{if((event as PointerEvent).pointerType!=='touch'){hovered=item.id;inspect();}});
  g.addEventListener('pointerleave',()=>{if(hovered===item.id)hovered=undefined;inspect();});
  g.addEventListener('focus',()=>{focused=item.id;inspect();});
  g.addEventListener('blur',()=>{if(focused===item.id)focused=undefined;inspect();});
  const toggle=()=>{pinned=pinned===item.id?undefined:item.id;inspect();};
  g.addEventListener('click',event=>{event.stopPropagation();toggle();});
  g.addEventListener('keydown',event=>{const e=event as KeyboardEvent;if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}if(e.key==='Escape'){pinned=hovered=focused=undefined;inspect();}});
 }
 function draw(){
  const {width:W,height:H}=viewport,q=plot();
  t=cameraTransform(level.bounds,viewport,camera);camera={zoom:t.zoom,center:t.center};
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.replaceChildren();inspections=new Map();hovered=focused=undefined;startBarrel=undefined;visual=undefined;trace=undefined;marker=undefined;rapidVisual=undefined;rapidParent=undefined;
  const defs=el('defs',{},svg),sky=el('linearGradient',{id:'sky',x1:'0',x2:'0',y1:'0',y2:'1'},defs);
  el('stop',{offset:'0%', 'stop-color':'#80cbee'},sky);el('stop',{offset:'100%','stop-color':'#e6f5e6'},sky);
  const portal=el('radialGradient',{id:'portal'},defs);el('stop',{offset:'0%','stop-color':'#fffbea'},portal);el('stop',{offset:'100%','stop-color':'#f8ba48'},portal);
  const clip=el('clipPath',{id:'plotClip'},defs);el('rect',{x:q.x,y:q.y,width:q.w,height:q.h,rx:5},clip);
  el('rect',{width:W,height:H,fill:'url(#sky)'},svg);
  // Decorative scenery stays behind the grid and has no collision geometry.
  el('circle',{cx:W*.81,cy:H*.16,r:Math.min(W,H)*.08,fill:'#fff7c4',opacity:.65},svg);
  for(const [x,y,s] of [[.12,.18,1],[.47,.10,.7],[.74,.24,.85]]){
   const g=el('g',{transform:'translate('+W*x+' '+H*y+') scale('+Math.min(W,H)*.0015*s+')',fill:'#fff',opacity:.55},svg);
   el('ellipse',{cx:0,cy:5,rx:47,ry:12},g);el('circle',{cx:-18,cy:-3,r:15},g);el('circle',{cx:8,cy:-8,r:21},g);
  }
  el('path',{d:'M0 '+H*.73+' Q'+W*.13+' '+H*.35+' '+W*.30+' '+H*.69+' T'+W*.63+' '+H*.61+' T'+W+' '+H*.55+' V'+H+' H0Z',fill:'#86b9bd',opacity:.46},svg);
  el('path',{d:'M0 '+H*.88+' Q'+W*.22+' '+H*.6+' '+W*.43+' '+H*.82+' T'+W+' '+H*.72+' V'+H+' H0Z',fill:'#88b89b',opacity:.65},svg);
  const content=el('g',{'clip-path':'url(#plotClip)'},svg);
  const b=level.bounds,p=t.toScreen,v=t.visible,scale=t.scale;
  const loX=Math.max(b.minX,v.minX),hiX=Math.min(b.maxX,v.maxX),loY=Math.max(b.minY,v.minY),hiY=Math.min(b.maxY,v.maxY);
  const tl=p({x:b.minX,y:b.maxY}),br=p({x:b.maxX,y:b.minY});
  el('rect',{x:tl.x,y:tl.y,width:br.x-tl.x,height:br.y-tl.y,fill:'#fff','fill-opacity':.13,stroke:'#527d92','stroke-opacity':.4},content);
  const step=scale>=24?1:Math.ceil(24/scale);
  const ticks=(lo:number,hi:number)=>{const a:number[]=[];for(let k=Math.ceil(lo/step)*step;k<=hi+1e-9;k+=step)a.push(k===0?0:k);return a;};
  const xs=ticks(loX,hiX),ys=ticks(loY,hiY);
  for(const x of xs){const a=p({x,y:b.minY}),z=p({x,y:b.maxY});el('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#315b75','stroke-opacity':.26},content);}
  for(const y of ys){const a=p({x:b.minX,y}),z=p({x:b.maxX,y});el('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#315b75','stroke-opacity':.26},content);}
  if(b.minX<=0&&b.maxX>=0){const a=p({x:0,y:b.minY}),z=p({x:0,y:b.maxY});el('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#315779','stroke-width':2},content);}
  if(b.minY<=0&&b.maxY>=0){const a=p({x:b.minX,y:0}),z=p({x:b.maxX,y:0});el('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#315779','stroke-width':2},content);}
  // All solid terrain is drawn from the same world rectangles the future collision engine will use.
  for(const o of level.obstacles){
   const a=p({x:o.bounds.minX,y:o.bounds.maxY}),z=p({x:o.bounds.maxX,y:o.bounds.minY}),w=z.x-a.x,h=z.y-a.y;
   const g=el('g',{},content),grass=Math.min(h*.28,scale*.12);
   el('rect',{x:a.x,y:a.y,width:w,height:h,fill:'#a18d78',stroke:'#6e665e','stroke-width':1},g);
   for(let row=1;row<Math.ceil(h/(scale*.28));row++){
    const y=a.y+row*scale*.28;if(y>=z.y)break;
    el('line',{x1:a.x,x2:z.x,y1:y,y2:y,stroke:'#73665d','stroke-opacity':.55},g);
    for(let x=a.x+(row%2===0?.28:.56)*scale;x<z.x;x+=scale*.65)el('line',{x1:x,x2:x,y1:y,y2:Math.min(z.y,y+scale*.28),stroke:'#73665d','stroke-opacity':.5},g);
   }
   el('rect',{x:a.x,y:a.y,width:w,height:grass,fill:'#79a94f'},g);
   el('line',{x1:a.x,y1:a.y+grass,x2:z.x,y2:a.y+grass,stroke:'#4e803e','stroke-width':1},g);
   target(g,{id:o.id,label:o.kind==='floor'?'Floor':o.kind==='platform'?'Platform':o.kind==='wall'?'Stone wall':'Ceiling',detail:'x: '+fmt(o.bounds.minX)+' to '+fmt(o.bounds.maxX)+' · y: '+fmt(o.bounds.minY)+' to '+fmt(o.bounds.maxY),point:{x:(o.bounds.minX+o.bounds.maxX)/2,y:o.bounds.maxY}});
  }
  for(const c of level.cannons){
   const a=p(c.position),g=el('g',{transform:'translate('+a.x+' '+a.y+') scale('+scale+')'},content),style=cannonTypes[c.type];
   const body=el('g',{transform:'scale('+c.direction+' 1)'},g);
   // Mouth is at (0,0); artwork extends away from the exact launch point.
   el('ellipse',{cx:-.37,cy:.47,rx:.37,ry:.09,fill:'#584d42','fill-opacity':.35},body);
   el('rect',{x:-.74,y:.35,width:.73,height:.12,rx:.05,fill:'#a77347',stroke:'#694c38','stroke-width':.025},body);
   el('circle',{cx:-.38,cy:.29,r:.18,fill:'#b38856',stroke:'#715039','stroke-width':.035},body);
   const barrel=el('g',{transform:'rotate(-'+BARREL_ANGLE+')'},body);
   if(c.id===level.startId)startBarrel=barrel;
   el('rect',{x:-.70,y:-.17,width:.65,height:.34,rx:.1,fill:style.color,stroke:'#254763','stroke-width':.035},barrel);
   el('path',{d:'M-.60 -.105 H-.23',stroke:'#d9f4ff','stroke-width':.045,'stroke-linecap':'round',opacity:.75},barrel);
   el('rect',{x:-.15,y:-.21,width:.15,height:.42,rx:.035,fill:style.color,stroke:'#254763','stroke-width':.035},barrel);
   el('ellipse',{cx:0,cy:0,rx:.045,ry:.16,fill:'#153147'},barrel);
   el('text',{x:-.37,y:.06,'text-anchor':'middle','font-size':.21,fill:'white','font-weight':800},barrel,style.symbol);
   el('circle',{r:.12,fill:'white','fill-opacity':.2,stroke:'#fff','stroke-width':.028},g);
   el('circle',{r:.044,fill:'#fff',stroke:'#203d54','stroke-width':.022},g);
   el('text',{x:0,y:-.35,'text-anchor':'middle','font-size':.25,'font-weight':800,fill:'#203d54',stroke:'#eaf8f8','stroke-width':.05,'paint-order':'stroke'},g,c.id);
   target(g,{id:c.id,label:'Cannon '+c.id+' · '+style.label,detail:coord(c.position),point:c.position});
  }
  const a=p(level.exit),g=el('g',{transform:'translate('+a.x+' '+a.y+') scale('+scale+')'},content);
  el('path',{d:'M-.43 .44 V-.06 A.43 .43 0 0 1 .43 -.06 V.44Z',fill:'#b5a38b',stroke:'#6b665c','stroke-width':.04},g);
  el('path',{d:'M-.29 .44 V-.05 A.29 .29 0 0 1 .29 -.05 V.44Z',fill:'url(#portal)',stroke:'#b27b29','stroke-width':.025},g);
  el('path',{d:'M-.16 .20 Q-.25 -.09 0 -.15 Q.25 -.13 .14 .10 Q.03 .22 -.05 .08',stroke:'#fff7b8','stroke-width':.04,fill:'none','stroke-linecap':'round'},g);
  el('circle',{r:.047,fill:'#fff',stroke:'#7a5a25','stroke-width':.025},g);
  el('text',{x:0,y:-.56,'text-anchor':'middle','font-size':.21,'font-weight':800,fill:'#725024',stroke:'#fff5cf','stroke-width':.05,'paint-order':'stroke'},g,'EXIT');
  target(g,{id:'exit',label:'Exit',detail:coord(level.exit),point:level.exit});
  trace=el('line',{'stroke-width':2.6,'stroke-dasharray':'6 4','stroke-linecap':'round','pointer-events':'none','aria-hidden':'true'},content) as SVGLineElement;
  visual=createLaunchVisual(content);
  rapidParent=el('g',{'pointer-events':'none','aria-hidden':'true'},content);
  if(rapid)rapidVisual=createRapidVisual(rapidParent,rapid.schedule.count,rapid.variantOffset);
  marker=el('g',{'pointer-events':'none','aria-hidden':'true'},content) as SVGGElement;paintAttempt();paintRapid();
  // Edge tick labels remain visible when the origin is offscreen.
  const bottom=Math.min(q.y+q.h,br.y),left=Math.max(q.x,tl.x);
  for(const x of xs){const s=p({x,y:0});el('text',{x:s.x,y:bottom+15,'text-anchor':'middle','font-size':11,fill:'#23475e','font-weight':650},svg,fmt(x));}
  for(const y of ys){const s=p({x:0,y});el('text',{x:left-8,y:s.y+4,'text-anchor':'end','font-size':11,fill:'#23475e','font-weight':650},svg,fmt(y));}
  el('text',{x:Math.min(q.x+q.w,br.x),y:bottom+28,'text-anchor':'end','font-size':12,fill:'#23475e','font-weight':800},svg,'x');
  el('text',{x:left-8,y:Math.max(q.y,tl.y)-9,'text-anchor':'end','font-size':12,fill:'#23475e','font-weight':800},svg,'y');
  tooltip=el('g',{'pointer-events':'none','aria-hidden':'true'},svg) as SVGGElement;
  controls.readout.textContent=Math.round(camera.zoom*100)+'%';controls.out.disabled=camera.zoom<=MIN_ZOOM;controls.in.disabled=camera.zoom>=MAX_ZOOM;
  controls.reset.disabled=camera.zoom===MIN_ZOOM;for(const button of [controls.left,controls.right,controls.up,controls.down])button.disabled=camera.zoom===MIN_ZOOM;
  svg.classList.toggle('zoomed',camera.zoom>MIN_ZOOM);inspect();
 }
 const zoom=(factor:number)=>{camera=zoomCamera(level.bounds,viewport,camera,Number((camera.zoom*factor).toFixed(3)),pinned?inspections.get(pinned)?.point:undefined);draw();};
 controls.in.addEventListener('click',()=>zoom(1.25));controls.out.addEventListener('click',()=>zoom(.8));controls.reset.addEventListener('click',()=>{camera=initialCamera(level.bounds);draw();});
 const pan=(dx:number,dy:number)=>{camera=panCamera(level.bounds,viewport,camera,dx,dy);draw();};
 controls.left.addEventListener('click',()=>pan(viewport.width*.16,0));controls.right.addEventListener('click',()=>pan(-viewport.width*.16,0));
 controls.up.addEventListener('click',()=>pan(0,viewport.height*.16));controls.down.addEventListener('click',()=>pan(0,-viewport.height*.16));
 svg.addEventListener('pointerdown',e=>{if((e.target as Element).closest('[data-inspect]'))return;pinned=undefined;inspect();if(camera.zoom<=1||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};svg.setPointerCapture(e.pointerId);svg.classList.add('dragging');});
 svg.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;pan(dx,dy);});
 const stop=(e:PointerEvent)=>{if(drag?.id===e.pointerId){drag=undefined;svg.classList.remove('dragging');}};
 svg.addEventListener('pointerup',stop);svg.addEventListener('pointercancel',stop);svg.addEventListener('lostpointercapture',stop);
 svg.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=hovered=focused=undefined;inspect();}});
 const observer=new ResizeObserver(()=>{const width=Math.round(stage.clientWidth),height=Math.round(stage.clientHeight);if(width<100||height<100)return;viewport={width,height,padding:Math.min(34,Math.max(27,Math.floor(Math.min(width,height)*.09)))};draw();});
 observer.observe(stage);draw();
 return {playFlight,playRapidFire,clearFlight,destroy:()=>{observer.disconnect();if(animationId)cancelAnimationFrame(animationId);active=undefined;rapid=undefined;svg.remove();}};
}
