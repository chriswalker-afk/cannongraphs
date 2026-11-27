import {cameraTransform,initialCamera,panCamera,zoomCamera,MIN_ZOOM,MAX_ZOOM,type Camera} from '../engine/camera';
import type {Bounds,Point,Viewport} from '../engine/coordinates';
import {cannonTypes} from '../game/cannons';
import {modePolicy,type LearningMode} from '../game/learningModes';
import type {Level} from '../levels/schema';
import {BARREL_ANGLE} from '../animations/launch';
import {routeDuration,sampleRouteAttempt} from '../animations/routeAttempt';
import {routeLegs} from '../engine/simulation/linearRoute';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
import {createLaunchVisual} from './launchVisual';
import type {PipLook} from '../game/pipCosmetics';
import type {CannonLook} from '../game/cannonCosmetics';
import {makeRapidSchedule,sampleRapidFire,type RapidSchedule,type RapidCounts} from '../animations/rapidFire';
import {createRapidVisual} from './rapidVisual';
import {renderTerrain,terrainInspection} from './terrain';
import {renderFloatingScenery} from './floatingScenery';
import {renderPeakScenery} from './peakScenery';
import {renderRuinsScenery} from './ruinsScenery';
import {renderFactoryScenery} from './factoryScenery';
import {renderCosmicScenery} from './cosmicScenery';
import {flightPath} from './flightPath';
import {renderGem} from './gem';
import {renderCannonArt} from './cannonArt';
import {gemTimeline,gemsAt,bankedGems,type TimedGemHit} from '../animations/gemTimeline';

type Inspection={id:string;label:string;detail:string;point:Point;lines?:string[];bounds?:Bounds};
const ns='http://www.w3.org/2000/svg';
function el(tag:string,attrs:Record<string,string|number>={},parent?:Element,content?:string){
 const e=document.createElementNS(ns,tag);
 for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));
 if(content!==undefined)e.textContent=content;
 parent?.append(e);return e;
}
const fmt=(n:number)=>String(Number(n.toFixed(4)));
const coord=(p:Point)=>'('+fmt(p.x)+', '+fmt(p.y)+')';

export function mountScene(stage:HTMLElement,level:Level,controls:{out:HTMLButtonElement;in:HTMLButtonElement;reset:HTMLButtonElement;left:HTMLButtonElement;right:HTMLButtonElement;up:HTMLButtonElement;down:HTMLButtonElement;readout:HTMLElement;info:HTMLElement;onCannonSelect?:(id:string)=>void;mode?:LearningMode;look?:PipLook;cannonLook?:CannonLook}){
 const policy=modePolicy(controls.mode??'pilot');
 const svg=el('svg',{role:'group','aria-label':policy.coordinates?'Coordinate playground. Inspect marked objects for coordinates. Drag the background or use arrows to pan when zoomed.':'Coordinate playground. Read marked positions from the axes. Object descriptions provide nonvisual access. Drag the background or use arrows to pan when zoomed.'},stage) as SVGSVGElement;
 let viewport:Viewport={width:960,height:620,padding:34},camera:Camera=initialCamera(level.bounds);
 let t=cameraTransform(level.bounds,viewport,camera),pinned:string|undefined,hovered:string|undefined,focused:string|undefined;
 let inspections=new Map<string,Inspection>(),tooltip:SVGGElement;
 let drag:{id:number;x:number;y:number}|undefined;
 let selectedCannon:string|undefined,planningEditable=false;
 let previewPaths:readonly (readonly Point[])[]=[],previewLayer:Element|undefined;
 function paintGraphPreview(){
  if(!previewLayer)return;previewLayer.replaceChildren();
  if(!policy.preview||!planningEditable)return;
  for(const path of previewPaths){if(path.length<2)continue;const d=path.map((p,i)=>{const a=t.toScreen(p);return (i?'L':'M')+a.x+' '+a.y;}).join(' ');
   el('path',{d,fill:'none',stroke:'#fff','stroke-width':4.8,opacity:.75,'stroke-linecap':'round'},previewLayer);
   el('path',{d,fill:'none',stroke:'#347b71','stroke-width':2.5,'stroke-dasharray':'5 4','stroke-linecap':'round'},previewLayer);
  }
 }
 function setGraphPreview(paths:readonly (readonly Point[])[]){previewPaths=policy.preview&&planningEditable?paths:[];paintGraphPreview();}
 let cannonTargets=new Map<string,Element>();
 function paintSelection(){
  for(const [id,g] of cannonTargets){
   const selected=planningEditable&&id===selectedCannon;g.setAttribute('data-selected',String(selected));
   if(planningEditable)g.setAttribute('aria-pressed',String(selected));else g.removeAttribute('aria-pressed');
  }
 }
 function setPlanningSelection(id:string,editable:boolean){
  if(id!==selectedCannon&&pinned&&cannonTargets.has(pinned))pinned=undefined;
  if(id!==selectedCannon||!editable){previewPaths=[];paintGraphPreview();}
  selectedCannon=id;planningEditable=editable;paintSelection();inspect();
 }
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let barrels=new Map<string,Element>(),visual:ReturnType<typeof createLaunchVisual>|undefined;
 let active:{result:AttemptResult;started:number;elapsed:number;reduced:boolean;done:()=>void;gemTimeline:readonly TimedGemHit[];gemIds:readonly string[];onGems?:(ids:readonly string[])=>void}|undefined,animationId=0;
 let gemTargets=new Map<string,Element>();
 let lastResult:AttemptResult|undefined,trace:SVGGElement|undefined,marker:SVGGElement|undefined;
 let rapid:{result:AttemptResult;schedule:RapidSchedule;started:number;elapsed:number;variantOffset:number;progress:(counts:RapidCounts)=>void;done:()=>void}|undefined;
 let rapidVisual:ReturnType<typeof createRapidVisual>|undefined,rapidParent:Element|undefined;
 function setBarrel(id:string,angle:number,recoil=0){barrels.get(id)?.setAttribute('transform','rotate('+(-angle)+') translate('+(-recoil)+' 0)');}
 function paintGems(){
  if(!gemTargets.size)return;
  const ids=new Set(active?.gemIds??bankedGems(lastResult));
  for(const [id,g] of gemTargets){
   const next=ids.has(id)?'collected':'waiting';
   if(g.getAttribute('data-gem-state')!==next)g.setAttribute('data-gem-state',next);
  }
 }
 function paintAttempt(){
  paintGems();
  if(!visual||!trace||!marker)return;
  for(const id of barrels.keys())setBarrel(id,BARREL_ANGLE);
  const result=active?.result??lastResult,cue=active?sampleRouteAttempt(active.elapsed,active.result,level,active.reduced):undefined;
  trace.replaceChildren();marker.replaceChildren();marker.setAttribute('display','none');
  const drawLeg=(leg:AttemptResult,to:Point,color:string)=>{
   el('path',{d:flightPath(leg,leg.start,to,t.toScreen),fill:'none',stroke:color,'stroke-width':2.6,'stroke-dasharray':'6 4','stroke-linecap':'round'},trace);
  };
  const angle=(leg:AttemptResult)=>leg.event.kind==='misfire'?BARREL_ANGLE:leg.angle;
  if(!result){visual.hide();return;}
  const completed=cue?cue.completed:routeLegs(result);
  for(const leg of completed){
   setBarrel(leg.cannonId,angle(leg));
   if(leg.event.kind!=='misfire')drawLeg(leg,leg.end,leg.event.kind==='exit'||leg.event.kind==='cannon'&&!(result.event.kind==='loop'&&leg===completed[completed.length-1]&&!cue)?'#16874c':'#cf5148');
  }
  if(cue){
   const {leg,frame}=cue,heading=angle(leg);
   setBarrel(leg.cannonId,heading,frame.recoil);
   visual.paint(frame,leg.source,leg.direction,heading,t.toScreen,t.scale,frame.size);
   if(frame.trace)drawLeg(leg,frame.trace,frame.resolved?(leg.event.kind==='cannon'||leg.event.kind==='exit'?'#16874c':'#cf5148'):'#2583ca');
  }else{
   visual.hide();
   const p=t.toScreen(result.end),ok=result.event.kind==='exit',color=ok?'#16874c':'#cf5148';
   marker.setAttribute('display','inline');marker.setAttribute('transform','translate('+p.x+' '+p.y+')');
   el('circle',{r:6,fill:'#fffaf0',stroke:color,'stroke-width':2},marker);
   el('path',{d:ok?'M-3 0 l2 2 4 -5':'M-2 -2 L2 2 M2 -2 L-2 2',stroke:color,'stroke-width':1.6,fill:'none','stroke-linecap':'round'},marker);
  }
 }
 function paintRapid(){
  if(!rapid||!rapidVisual)return;
  const frame=sampleRapidFire(rapid.elapsed,rapid.result,rapid.schedule);
  for(const [i,leg] of routeLegs(rapid.result).entries())setBarrel(leg.cannonId,leg.angle,frame.cannonCues[i].recoil);
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
  rapidParent.replaceChildren();rapidVisual=createRapidVisual(rapidParent,count,variantOffset,result,controls.look,controls.cannonLook);
  rapid={result,schedule,started:performance.now(),elapsed:0,variantOffset,progress,done};
  paintRapid();animationId=requestAnimationFrame(rapidStep);return true;
 }
 function step(now:number){
  if(!active)return;
  active.elapsed=Math.max(0,now-active.started)*(active.reduced?2:1);
  const ids=gemsAt(active.gemTimeline,active.elapsed);
  if(ids.length!==active.gemIds.length){active.gemIds=ids;active.onGems?.(ids);}
  if(active.elapsed>=routeDuration(active.result,active.reduced)){
   const finished=active;lastResult=finished.result;active=undefined;animationId=0;paintAttempt();finished.done();return;
  }
  paintAttempt();animationId=requestAnimationFrame(step);
 }
 function playFlight(result:AttemptResult,done:()=>void,onGems?:(ids:readonly string[])=>void):boolean{
  if(active||rapid)return false;
  lastResult=undefined;const reduced=motion.matches;
  active={result,started:performance.now(),elapsed:0,reduced,done,gemTimeline:gemTimeline(result,reduced),gemIds:[],onGems};
  paintAttempt();animationId=requestAnimationFrame(step);return true;
 }
 function clearFlight(){if(!active&&!rapid){lastResult=undefined;rapidVisual?.hide();rapidParent?.replaceChildren();rapidVisual=undefined;paintAttempt();}}
 const plot=()=>({x:viewport.padding,y:viewport.padding,w:viewport.width-2*viewport.padding,h:viewport.height-2*viewport.padding});
 function inspect(){
  if(!tooltip)return;
  tooltip.replaceChildren();
  const item=inspections.get(hovered??focused??pinned??'');
  controls.info.textContent=item?(policy.coordinates?item.label+' · '+item.detail:item.label):(policy.coordinates?'Hover, tap or focus an object to inspect its coordinates.':'Read coordinates from the axes.');
  if(!item)return;
  const q=plot();let a=t.toScreen(item.point);
  if(item.bounds){
   const lo=t.toScreen({x:item.bounds.minX,y:item.bounds.maxY}),hi=t.toScreen({x:item.bounds.maxX,y:item.bounds.minY});
   const x1=Math.max(q.x,lo.x),x2=Math.min(q.x+q.w,hi.x),y1=Math.max(q.y,lo.y),y2=Math.min(q.y+q.h,hi.y);
   if(x2<x1||y2<y1)return;a={x:(x1+x2)/2,y:(y1+y2)/2};
  }else if(a.x<q.x||a.x>q.x+q.w||a.y<q.y||a.y>q.y+q.h)return;
  const lines=policy.coordinates?(item.lines??[item.detail]):[];
  const w=Math.min(Math.max(108,...lines.map(line=>line.length*6.7+20),item.label.length*7+20),viewport.width-12),h=26+18*lines.length;
  const x=Math.max(6,Math.min(viewport.width-w-6,a.x-w/2)),y=Math.max(4,Math.min(viewport.height-h-4,a.y>h+15?a.y-h-13:a.y+16));
  el('rect',{x,y,width:w,height:h,rx:8,fill:'#fffaf0',stroke:'#315779','stroke-width':1.5},tooltip);
  el('text',{x:x+w/2,y:y+15,'text-anchor':'middle','font-size':11,fill:'#536579','font-weight':700},tooltip,item.label);
  lines.forEach((line,i)=>el('text',{x:x+w/2,y:y+33+i*18,'text-anchor':'middle','font-size':Math.min(13,(w-12)/Math.max(1,line.length*.60)),fill:'#203e55','font-weight':700},tooltip,line));
 }
 function target(g:Element,item:Inspection,isCannon=false){
  inspections.set(item.id,item);
  g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('data-inspect',item.id);g.setAttribute('aria-label',item.label+' '+item.detail);g.classList.add('inspectable');
  g.addEventListener('pointerenter',(event)=>{if((event as PointerEvent).pointerType!=='touch'){hovered=item.id;inspect();}});
  g.addEventListener('pointerleave',()=>{if(hovered===item.id)hovered=undefined;inspect();});
  g.addEventListener('focus',()=>{focused=item.id;inspect();});
  g.addEventListener('blur',()=>{if(focused===item.id)focused=undefined;inspect();});
  const toggle=()=>{
   if(isCannon&&planningEditable){controls.onCannonSelect?.(item.id);pinned=item.id;inspect();return;}
   pinned=pinned===item.id?undefined:item.id;inspect();
  };
  g.addEventListener('click',event=>{event.stopPropagation();toggle();});
  g.addEventListener('keydown',event=>{const e=event as KeyboardEvent;if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}if(e.key==='Escape'){pinned=hovered=focused=undefined;inspect();}});
 }
 function draw(){
  const {width:W,height:H}=viewport,q=plot();
  t=cameraTransform(level.bounds,viewport,camera);camera={zoom:t.zoom,center:t.center};
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.replaceChildren();inspections=new Map();hovered=focused=undefined;barrels=new Map();cannonTargets=new Map();gemTargets=new Map();visual=undefined;trace=undefined;marker=undefined;rapidVisual=undefined;rapidParent=undefined;
  const defs=el('defs',{},svg),sky=el('linearGradient',{id:'sky',x1:'0',x2:'0',y1:'0',y2:'1'},defs);
  const floating=level.world===2,peaks=level.world===3,ruins=level.world===4,factory=level.world===5,cosmic=level.world===6;
  el('stop',{offset:'0%', 'stop-color':cosmic?'#a8b6df':factory?'#b9c7cb':ruins?'#b7c4ae':peaks?'#aebce8':floating?'#89c5ed':'#80cbee'},sky);el('stop',{offset:'100%','stop-color':cosmic?'#efe0f4':factory?'#f4e2c4':ruins?'#f3e2bd':peaks?'#f2e6f6':floating?'#e7e7fa':'#e6f5e6'},sky);
  const portal=el('radialGradient',{id:'portal'},defs);el('stop',{offset:'0%','stop-color':'#fffbea'},portal);el('stop',{offset:'100%','stop-color':'#f8ba48'},portal);
  const clip=el('clipPath',{id:'plotClip'},defs);el('rect',{x:q.x,y:q.y,width:q.w,height:q.h,rx:5},clip);
  el('rect',{width:W,height:H,fill:'url(#sky)'},svg);
  // Decorative scenery stays behind the grid and has no collision geometry.
  if(cosmic)renderCosmicScenery(svg,W,H);else if(factory)renderFactoryScenery(svg,W,H);else if(ruins)renderRuinsScenery(svg,W,H);else if(peaks)renderPeakScenery(svg,W,H);else if(floating)renderFloatingScenery(svg,W,H);else{
  el('circle',{cx:W*.81,cy:H*.16,r:Math.min(W,H)*.08,fill:'#fff7c4',opacity:.65},svg);
  for(const [x,y,s] of [[.12,.18,1],[.47,.10,.7],[.74,.24,.85]]){
   const g=el('g',{transform:'translate('+W*x+' '+H*y+') scale('+Math.min(W,H)*.0015*s+')',fill:'#fff',opacity:.55},svg);
   el('ellipse',{cx:0,cy:5,rx:47,ry:12},g);el('circle',{cx:-18,cy:-3,r:15},g);el('circle',{cx:8,cy:-8,r:21},g);
  }
  el('path',{d:'M0 '+H*.73+' Q'+W*.13+' '+H*.35+' '+W*.30+' '+H*.69+' T'+W*.63+' '+H*.61+' T'+W+' '+H*.55+' V'+H+' H0Z',fill:'#86b9bd',opacity:.46},svg);
  el('path',{d:'M0 '+H*.88+' Q'+W*.22+' '+H*.6+' '+W*.43+' '+H*.82+' T'+W+' '+H*.72+' V'+H+' H0Z',fill:'#88b89b',opacity:.65},svg);
  }
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
  // Artwork and collision both read the same world bounds.
  for(const o of level.obstacles){
   const g=renderTerrain(content,o,p,scale,floating,peaks,ruins,factory,cosmic),info=terrainInspection(o,level.world);
   target(g,{id:o.id,...info,point:{x:(o.bounds.minX+o.bounds.maxX)/2,y:(o.bounds.minY+o.bounds.maxY)/2},bounds:o.bounds});
  }
  for(const c of level.cannons){
   const a=p(c.position),g=el('g',{transform:'translate('+a.x+' '+a.y+') scale('+scale+')'},content),style=cannonTypes[c.type];
   g.classList.add('cannon-target');cannonTargets.set(c.id,g);
   const body=el('g',{transform:'scale('+c.direction+' 1)'},g);
   el('rect',{x:-.84,y:-.30,width:1.16,height:.93,rx:.18,fill:'#fff1bd','fill-opacity':.65,stroke:'#a86e24','stroke-width':.037,'stroke-dasharray':'.085 .045',class:'planning-halo','pointer-events':'none'},body);
   const barrel=renderCannonArt(body,c.type,BARREL_ANGLE,controls.cannonLook,c.direction);barrels.set(c.id,barrel);
   el('circle',{r:.12,fill:'white','fill-opacity':.2,stroke:'#fff','stroke-width':.028},g);
   el('circle',{r:.044,fill:'#fff',stroke:'#203d54','stroke-width':.022},g);
   el('text',{x:0,y:-.35,'text-anchor':'middle','font-size':.25,'font-weight':800,fill:'#203d54',stroke:'#eaf8f8','stroke-width':.05,'paint-order':'stroke'},g,c.id+(c.direction===-1?' ←':' →'));
   target(g,{id:c.id,label:'Cannon '+c.id+' · '+style.label,detail:coord(c.position)+' · fires '+(c.direction===1?'right':'left'),point:c.position},true);
  }
  const a=p(level.exit),g=el('g',{transform:'translate('+a.x+' '+a.y+') scale('+scale+')'},content);
  el('path',{d:'M-.43 .44 V-.06 A.43 .43 0 0 1 .43 -.06 V.44Z',fill:'#b5a38b',stroke:'#6b665c','stroke-width':.04},g);
  el('path',{d:'M-.29 .44 V-.05 A.29 .29 0 0 1 .29 -.05 V.44Z',fill:'url(#portal)',stroke:'#b27b29','stroke-width':.025},g);
  el('path',{d:'M-.16 .20 Q-.25 -.09 0 -.15 Q.25 -.13 .14 .10 Q.03 .22 -.05 .08',stroke:'#fff7b8','stroke-width':.04,fill:'none','stroke-linecap':'round'},g);
  el('circle',{r:.047,fill:'#fff',stroke:'#7a5a25','stroke-width':.025},g);
  el('text',{x:0,y:-.56,'text-anchor':'middle','font-size':.21,'font-weight':800,fill:'#725024',stroke:'#fff5cf','stroke-width':.05,'paint-order':'stroke'},g,'EXIT');
  target(g,{id:'exit',label:'Exit',detail:coord(level.exit),point:level.exit});
  for(const gem of level.gems??[]){
   const art=renderGem(content,gem,p,scale);gemTargets.set(gem.id,art);
   target(art,{id:gem.id,label:'Optional gem',detail:coord(gem.position),point:gem.position});
  }
  previewLayer=el('g',{'pointer-events':'none','aria-hidden':'true','data-layer':'cadet-graph-preview'},content);paintGraphPreview();
  trace=el('g',{'pointer-events':'none','aria-hidden':'true'},content) as SVGGElement;
  visual=createLaunchVisual(content,controls.look,controls.cannonLook);
  rapidParent=el('g',{'pointer-events':'none','aria-hidden':'true'},content);
  if(rapid)rapidVisual=createRapidVisual(rapidParent,rapid.schedule.count,rapid.variantOffset,rapid.result,controls.look,controls.cannonLook);
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
  svg.classList.toggle('zoomed',camera.zoom>MIN_ZOOM);paintSelection();inspect();
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
 return {playFlight,playRapidFire,clearFlight,setPlanningSelection,setGraphPreview,destroy:()=>{observer.disconnect();if(animationId)cancelAnimationFrame(animationId);active=undefined;rapid=undefined;svg.remove();}};
}
