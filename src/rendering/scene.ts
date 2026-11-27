import {gridTicks} from './grid';
import {cameraTransform,initialCamera,panCamera,zoomCamera,MIN_ZOOM,MAX_ZOOM,type Camera} from '../engine/camera';
import type {Bounds,Point,Viewport} from '../engine/coordinates';
import {cannonTypes} from '../game/cannons';
import {planStatus,type FlightPlan,type PlanStatus} from '../game/flightPlan';
import {modePolicy,type LearningMode} from '../game/learningModes';
import type {Level} from '../levels/schema';
import type {CoordinateGuide} from '../game/firstFlightTutorial';
import {BARREL_ANGLE} from '../animations/launch';
import {attemptSounds,rapidSounds,createSoundCursor} from '../audio/timeline';
import type {SoundEffect} from '../audio/effects';
import {routeDuration,sampleRouteAttempt} from '../animations/routeAttempt';
import {routeLegs} from '../engine/simulation/linearRoute';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
import {createLaunchVisual} from './launchVisual';
import {createWaitingCrew} from './waitingCrew';
import {departingIndex} from '../animations/waitingCrew';
import type {PipLook} from '../game/pipCosmetics';
import type {CannonLook} from '../game/cannonCosmetics';
import {makeRapidSchedule,sampleRapidFire,type RapidSchedule,type RapidCounts} from '../animations/rapidFire';
import {createRapidVisual} from './rapidVisual';
import {renderTerrain,terrainInspection} from './terrain';
import {renderFloatingScenery} from './floatingScenery';
import {renderPeakScenery} from './peakScenery';
import {renderRuinsScenery} from './ruinsScenery';
import {renderFactoryScenery} from './factoryScenery';
import {renderFoundryScenery,renderLiftRail,renderLiftDeck,renderBrokenDetails} from './foundryScenery';
import {foundryPadding,liftGrip} from './foundryLayout';
import {renderCosmicScenery} from './cosmicScenery';
import {flightPath} from './flightPath';
import {renderGem} from './gem';
import {renderCannonArt} from './cannonArt';
import {levelSupports,emptyAnchorSupport} from '../levels/supports';
import {anchorAssignments,inventoryCannon,lockedAnchorEquation} from '../levels/anchorSpec';
import {renderSalvageScenery,renderAnchorMount,renderAnchorGrip} from './salvageArt';
import {salvageSceneryVariant} from '../levels/salvage';
import {renderSupportArt} from './supportArt';
import {lockedLiftEquation,lockedLiftText} from '../levels/liftSpec';
import {isQuadratic} from '../engine/equations/linear';
import {EXIT_FOOTPRINT,CANNON_FOOTPRINT} from '../game/anchorArtGeometry';
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

export function mountScene(stage:HTMLElement,level:Level,controls:{out:HTMLButtonElement;in:HTMLButtonElement;reset:HTMLButtonElement;left:HTMLButtonElement;right:HTMLButtonElement;up:HTMLButtonElement;down:HTMLButtonElement;readout:HTMLElement;info:HTMLElement;onCannonSelect?:(id:string)=>void;onLiftMove?:(id:string,y:number)=>void;onAnchorSelect?:(id:string)=>void;onAnchorPartSelect?:(id:string)=>void;mode?:LearningMode;look?:PipLook;cannonLook?:CannonLook;onSound?:(sound:SoundEffect)=>void;budget?:number;reducedMotion?:()=>boolean;onViewChange?:()=>void}){
 const policy=modePolicy(controls.mode??'pilot');let supports=levelSupports(level);
 const hasLifts=level.cannons.some(c=>c.lift),hasAnchors=!!level.anchorPuzzle;
 const guidance=()=>hasAnchors?'Select or drag a cannon from the tray onto a free mount. Click a mounted cannon to inspect its equation.':hasLifts?'Drag a striped platform to move it. Click a cannon to inspect its equation.':policy.coordinates?'Click a cannon to program it. Hover or focus an object to inspect it.':'Click a cannon to program it. Read coordinates from the axes.';
 const svg=el('svg',{role:'group',tabindex:'-1','aria-label':(policy.coordinates?'Coordinate playground. Inspect marked objects for coordinates.':'Coordinate playground. Read marked positions from the axes. Object descriptions provide nonvisual access.')+(hasAnchors?' Select a cannon in the tray, then choose an empty mount.':hasLifts?' Drag striped decks or use their arrow keys to move broken cannons.':'')+' Drag the background or use arrows to pan when zoomed.'},stage) as SVGSVGElement;
 let viewport:Viewport={width:960,height:620,padding:level.world===7||hasAnchors?foundryPadding(level.bounds,960,620):34},camera:Camera=initialCamera(level.bounds);
 let t=cameraTransform(level.bounds,viewport,camera),pinned:string|undefined,hovered:string|undefined,focused:string|undefined;
 let inspections=new Map<string,Inspection>(),tooltip:SVGGElement;
 let drag:{id:number;x:number;y:number}|undefined,liftDrag:{pointer:number;id:string;offset:number}|undefined;
 let selectedCannon:string|undefined,planningEditable=false,popupOpen=false,selectedPart:string|undefined,hoverMount:string|undefined;
 function paintAnchorSelection(){
  for(const mount of Array.from(svg.querySelectorAll('[data-mount-id]'))){const free=!mount.getAttribute('data-mount-occupied');mount.setAttribute('data-drop-ready',String(planningEditable&&!!selectedPart&&free));mount.setAttribute('data-drop-hover',String(planningEditable&&!!selectedPart&&free&&mount.getAttribute('data-mount-id')===hoverMount));}
  for(const grip of Array.from(svg.querySelectorAll('[data-anchor-move]'))){grip.setAttribute('aria-disabled',String(!planningEditable));grip.setAttribute('tabindex',planningEditable?'0':'-1');grip.querySelector('[data-anchor-grip-hit]')?.setAttribute('pointer-events',planningEditable?'all':'none');grip.setAttribute('data-active',String(grip.getAttribute('data-anchor-move')===selectedPart));}
 }
 function setAnchorSelection(id?:string,hover?:string){selectedPart=id;hoverMount=hover;paintAnchorSelection();}
 let statuses=new Map<string,PlanStatus>();
 const statusLabels:Record<PlanStatus,string>={empty:'Unprogrammed',invalid:'Invalid or incomplete equation',ready:'Programmed, not tested',revise:'Failed flight — revise',tested:'Successful flight'};
 let tutorialGuides:readonly CoordinateGuide[]=[],tutorialLayer:Element|undefined;
 function paintTutorialGuides(){
  if(!tutorialLayer)return;tutorialLayer.replaceChildren();
  for(const item of tutorialGuides){
   const a=t.toScreen(item.point),base=t.toScreen({x:item.point.x,y:0}),left=t.toScreen({x:0,y:item.point.y});
   const colour=item.id==='Exit'?'#8b5a12':item.id==='A'?'#176ca0':'#7a469d';
   el('path',{d:'M'+left.x+' '+left.y+' H'+a.x+' V'+base.y,fill:'none',stroke:'#fff','stroke-width':4,opacity:.85,'stroke-dasharray':'5 4'},tutorialLayer);
   el('path',{d:'M'+left.x+' '+left.y+' H'+a.x+' V'+base.y,fill:'none',stroke:colour,'stroke-width':2,'stroke-dasharray':'5 4'},tutorialLayer);
   el('circle',{cx:a.x,cy:a.y,r:Math.max(5,t.scale*.16),fill:'none',stroke:colour,'stroke-width':2},tutorialLayer);
   const q=plot(),x=Math.min(q.x+q.w-4,Math.max(q.x+4,a.x+9)),y=Math.min(q.y+q.h-6,Math.max(q.y+14,a.y-18)),end=x+78>q.x+q.w;
   el('text',{x:end?a.x-8:x,y,'text-anchor':end?'end':'start','font-size':12,'font-weight':850,fill:colour,stroke:'#fffaf0','stroke-width':4,'paint-order':'stroke'},tutorialLayer,item.label);
  }
 }
 function setTutorialGuides(guides:readonly CoordinateGuide[]){tutorialGuides=guides;paintTutorialGuides();}
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
   const selected=planningEditable&&popupOpen&&id===selectedCannon,state=statuses.get(id)??'empty';g.setAttribute('data-selected',String(selected));
   g.setAttribute('data-status',state);g.setAttribute('aria-expanded',String(selected));g.setAttribute('aria-controls','cannon-popup');g.setAttribute('aria-haspopup','dialog');
   const item=inspections.get(id);if(item)g.setAttribute('aria-label',item.label+' '+item.detail+' · '+statusLabels[state]+(planningEditable?' · Edit equation':''));
  }
 }
 function setPlanStatuses(plan:FlightPlan){statuses=new Map(plan.map(entry=>[entry.id,planStatus(entry)]));paintSelection();}
 function setPlanningSelection(id:string,editable:boolean,open=false){
  if(id!==selectedCannon&&pinned&&cannonTargets.has(pinned))pinned=undefined;
  if(id!==selectedCannon||!editable){previewPaths=[];paintGraphPreview();}
  selectedCannon=id;planningEditable=editable;popupOpen=open;paintSelection();for(const handle of Array.from(svg.querySelectorAll('[data-lift-handle]'))){handle.setAttribute('aria-disabled',String(!editable));handle.setAttribute('tabindex',editable?'0':'-1');handle.querySelector('[data-lift-hit]')?.setAttribute('pointer-events',editable?'all':'none');}paintAnchorSelection();inspect();
 }
 const reducedMotion=()=>controls.reducedMotion?.()??false;
 const crewTotal=controls.budget??level.creatures;
 let crewWaiting=crewTotal,crew:ReturnType<typeof createWaitingCrew>|undefined,launchParent:Element|undefined,flightTrail:Element|undefined;
 const tracePaths=new Map<string,{path:Element;to:Point;color:string;leg:AttemptResult}>();
 let runReduced=false;
 function setWaitingCrew(waiting:number){crewWaiting=waiting;crew?.update(waiting);}
 let barrels=new Map<string,Element>(),visual:ReturnType<typeof createLaunchVisual>|undefined;
 let active:{result:AttemptResult;started:number;elapsed:number;reduced:boolean;variant:number;boardingFrom?:Point;done:()=>void;gemTimeline:readonly TimedGemHit[];gemIds:readonly string[];onGems?:(ids:readonly string[])=>void}|undefined,animationId=0;
 let gemTargets=new Map<string,Element>();
 let lastResult:AttemptResult|undefined,trace:SVGGElement|undefined,marker:SVGGElement|undefined;
 let rapid:{result:AttemptResult;schedule:RapidSchedule;started:number;elapsed:number;variantOffset:number;progress:(counts:RapidCounts)=>void;done:()=>void}|undefined;
 let rapidVisual:ReturnType<typeof createRapidVisual>|undefined,rapidParent:Element|undefined;
 let attemptAudio:ReturnType<typeof createSoundCursor>|undefined,rapidAudio:ReturnType<typeof createSoundCursor>|undefined;
 const emitSound=(sound:SoundEffect)=>controls.onSound?.(sound);
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
  for(const id of barrels.keys()){const c=level.cannons.find(c=>c.id===id)!;const equation=c.lift?lockedLiftEquation(c):lockedAnchorEquation(level,c);const slope=equation?(isQuadratic(equation)?2*equation.quadratic*c.position.x+equation.linear:equation.gradient):undefined;setBarrel(id,slope===undefined?BARREL_ANGLE:Math.atan(slope*c.direction)*180/Math.PI);}
  const result=active?.result??lastResult,cue=active?sampleRouteAttempt(active.elapsed,active.result,level,active.reduced,active.boardingFrom):undefined;
  marker.replaceChildren();marker.setAttribute('display','none');flightTrail?.setAttribute('display','none');
  const used=new Set<string>();
  const drawLeg=(leg:AttemptResult,to:Point,color:string)=>{
   const id=leg.cannonId,existing=tracePaths.get(id);used.add(id);
   if(existing&&existing.leg===leg&&existing.to.x===to.x&&existing.to.y===to.y&&existing.color===color)return;
   const path=existing?.path??el('path',{fill:'none','stroke-width':2.6,'stroke-dasharray':'6 4','stroke-linecap':'round'},trace);
   path.setAttribute('d',flightPath(leg,leg.start,to,t.toScreen));path.setAttribute('stroke',color);tracePaths.set(id,{path,to,color,leg});
  };
  const removeUnused=()=>{for(const [id,v] of tracePaths)if(!used.has(id)){v.path.remove();tracePaths.delete(id);}};
  const angle=(leg:AttemptResult)=>leg.event.kind==='misfire'?BARREL_ANGLE:leg.angle;
  if(!result){visual.hide();removeUnused();return;}
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
   if(frame.trailStart&&frame.trace&&flightTrail){flightTrail.setAttribute('display','inline');flightTrail.setAttribute('d',flightPath(leg,frame.trailStart,frame.trace,t.toScreen));}
  }else{
   visual.hide();
   const p=t.toScreen(result.end),ok=result.event.kind==='exit',color=ok?'#16874c':'#cf5148';
   marker.setAttribute('display','inline');marker.setAttribute('transform','translate('+p.x+' '+p.y+')');
   el('circle',{r:6,fill:'#fffaf0',stroke:color,'stroke-width':2},marker);
   el('path',{d:ok?'M-3 0 l2 2 4 -5':'M-2 -2 L2 2 M2 -2 L-2 2',stroke:color,'stroke-width':1.6,fill:'none','stroke-linecap':'round'},marker);
  }
  removeUnused();
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
  rapidAudio?.advance(current.elapsed,!document.hidden);
  const frame=sampleRapidFire(current.elapsed,current.result,current.schedule);
  current.progress({dispatched:frame.dispatched,arrived:frame.arrived});
  if(frame.done){
   rapidVisual?.hide();rapid=undefined;animationId=0;paintAttempt();current.done();return;
  }
  paintRapid();animationId=requestAnimationFrame(rapidStep);
 }
 function playRapidFire(result:AttemptResult,count:number,variantOffset:number,progress:(counts:RapidCounts)=>void,done:()=>void):boolean{
  if(active||rapid||!rapidParent||result!==lastResult)return false;
  const schedule=makeRapidSchedule(result,count,runReduced);
  rapidParent.replaceChildren();rapidVisual=createRapidVisual(rapidParent,count,variantOffset,result,controls.look,controls.cannonLook);
  rapidAudio=createSoundCursor(rapidSounds(result,schedule),emitSound);
  rapid={result,schedule,started:performance.now(),elapsed:0,variantOffset,progress,done};
  paintRapid();animationId=requestAnimationFrame(rapidStep);return true;
 }
 function step(now:number){
  if(!active)return;
  active.elapsed=Math.max(0,now-active.started)*(active.reduced?2:1);
  attemptAudio?.advance(active.elapsed,!document.hidden);
  const ids=gemsAt(active.gemTimeline,active.elapsed);
  if(ids.length!==active.gemIds.length){active.gemIds=ids;active.onGems?.(ids);}
  if(active.elapsed>=routeDuration(active.result,active.reduced)){
   const finished=active;lastResult=finished.result;active=undefined;animationId=0;paintAttempt();finished.done();return;
  }
  paintAttempt();animationId=requestAnimationFrame(step);
 }
 function playFlight(result:AttemptResult,done:()=>void,onGems?:(ids:readonly string[])=>void):boolean{
  if(active||rapid)return false;
  lastResult=undefined;const reduced=runReduced=reducedMotion(),variant=departingIndex(crewTotal,crewWaiting),boardingFrom=crew?.positions[variant];
  if(launchParent){launchParent.replaceChildren();visual=createLaunchVisual(launchParent,controls.look,controls.cannonLook,variant);}
  attemptAudio=createSoundCursor(attemptSounds(result,reduced),emitSound);
  active={result,started:performance.now(),elapsed:0,reduced,variant,boardingFrom,done,gemTimeline:gemTimeline(result,reduced),gemIds:[],onGems};
  attemptAudio.advance(0,!document.hidden);
  paintAttempt();animationId=requestAnimationFrame(step);return true;
 }
 function clearFlight(){if(!active&&!rapid){lastResult=undefined;rapidVisual?.hide();rapidParent?.replaceChildren();rapidVisual=undefined;paintAttempt();}}
 const plot=()=>({x:viewport.padding,y:viewport.padding,w:viewport.width-2*viewport.padding,h:viewport.height-2*viewport.padding});
 function inspect(){
  if(!tooltip)return;
  tooltip.replaceChildren();
  const item=inspections.get(hovered??focused??pinned??'');
  const infoText=item?((policy.coordinates?item.label+' · '+item.detail:item.label)+(statuses.has(item.id)?' · '+statusLabels[statuses.get(item.id)!]:'')):guidance();
  if(controls.info.textContent!==infoText)controls.info.textContent=infoText;
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
 function target(g:Element,item:Inspection,isCannon=false,isMount=false){
  inspections.set(item.id,item);
  const visible=t.visible,b=item.bounds,p=item.point;
  const inView=b?b.maxX>=visible.minX&&b.minX<=visible.maxX&&b.maxY>=visible.minY&&b.minY<=visible.maxY:p.x>=visible.minX&&p.x<=visible.maxX&&p.y>=visible.minY&&p.y<=visible.maxY;
  g.setAttribute('tabindex',inView?'0':'-1');g.setAttribute('role','button');g.setAttribute('data-inspect',item.id);g.setAttribute('aria-label',item.label+' '+item.detail);g.classList.add('inspectable');
  g.addEventListener('pointerenter',(event)=>{if((event as PointerEvent).pointerType!=='touch'){hovered=item.id;inspect();}});
  g.addEventListener('pointerleave',()=>{if(hovered===item.id)hovered=undefined;inspect();});
  g.addEventListener('focus',()=>{focused=item.id;inspect();});
  g.addEventListener('blur',()=>{if(focused===item.id)focused=undefined;inspect();});
  const toggle=()=>{
   if(isMount&&planningEditable){controls.onAnchorSelect?.(item.id);return;}
   if(isCannon&&planningEditable){controls.onCannonSelect?.(item.id);pinned=item.id;inspect();return;}
   pinned=pinned===item.id?undefined:item.id;inspect();
  };
  g.addEventListener('click',event=>{event.stopPropagation();toggle();});
  g.addEventListener('keydown',event=>{const e=event as KeyboardEvent;if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}if(e.key==='Escape'){pinned=hovered=focused=undefined;inspect();}});
 }
 function draw(){
  const focusedGrip=svg.contains(document.activeElement)?document.activeElement?.getAttribute('data-anchor-move'):null;
  const focusedLift=svg.contains(document.activeElement)?document.activeElement?.getAttribute('data-lift-handle'):null;
  const focusedId=svg.contains(document.activeElement)?document.activeElement?.getAttribute('data-inspect'):null;
  const {width:W,height:H}=viewport,q=plot();
  t=cameraTransform(level.bounds,viewport,camera);camera={zoom:t.zoom,center:t.center};
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.replaceChildren();inspections=new Map();hovered=focused=undefined;barrels=new Map();cannonTargets=new Map();gemTargets=new Map();visual=undefined;trace=undefined;marker=undefined;rapidVisual=undefined;rapidParent=undefined;crew=undefined;launchParent=undefined;flightTrail=undefined;tracePaths.clear();
  const defs=el('defs',{},svg),sky=el('linearGradient',{id:'sky',x1:'0',x2:'0',y1:'0',y2:'1'},defs);
  const floating=level.world===2,peaks=level.world===3,ruins=level.world===4,factory=level.world===5,cosmic=level.world===6,foundry=level.world===7,salvage=hasAnchors;
  el('stop',{offset:'0%', 'stop-color':salvage?'#b6c7b9':cosmic?'#a8b6df':level.world===7?'#aabbb9':factory?'#b9c7cb':ruins?'#b7c4ae':peaks?'#aebce8':floating?'#89c5ed':'#80cbee'},sky);el('stop',{offset:'100%','stop-color':salvage?'#eadcc0':cosmic?'#efe0f4':level.world===7?'#f4e6be':factory?'#f4e2c4':ruins?'#f3e2bd':peaks?'#f2e6f6':floating?'#e7e7fa':'#e6f5e6'},sky);
  const portal=el('radialGradient',{id:'portal'},defs);el('stop',{offset:'0%','stop-color':'#fffbea'},portal);el('stop',{offset:'100%','stop-color':'#f8ba48'},portal);
  const clip=el('clipPath',{id:'plotClip'},defs);el('rect',{x:q.x,y:q.y,width:q.w,height:q.h,rx:5},clip);
  el('rect',{width:W,height:H,fill:'url(#sky)'},svg);
  // Decorative scenery stays behind the grid and has no collision geometry.
  if(salvage)renderSalvageScenery(svg,W,H,salvageSceneryVariant(level.id));else if(foundry){const index=Number(level.id.split('-').at(-1));renderFoundryScenery(svg,W,H,Number.isFinite(index)?Math.min(3,Math.max(0,Math.floor((index-1)/3))):0);}else if(cosmic)renderCosmicScenery(svg,W,H);else if(factory)renderFactoryScenery(svg,W,H);else if(ruins)renderRuinsScenery(svg,W,H);else if(peaks)renderPeakScenery(svg,W,H);else if(floating)renderFloatingScenery(svg,W,H);else{
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
  el('rect',{x:tl.x,y:tl.y,width:br.x-tl.x,height:br.y-tl.y,fill:foundry||salvage?'#fffdf4':'#fff','fill-opacity':foundry||salvage?.66:.13,stroke:foundry||salvage?'#78918a':'#527d92','stroke-opacity':foundry||salvage?.8:.4,'data-graph-plane':''},content);
  const supportLayer=el('g',{'data-layer':'anchor-supports','pointer-events':'none','aria-hidden':'true'},content);
  for(const support of supports)renderSupportArt(supportLayer,support,level.world,p,scale,controls.cannonLook);
  for(const c of level.cannons)if(c.lift)renderLiftRail(supportLayer,c,level,p,scale);
  const assignments=anchorAssignments(level),occupants=new Map([...assignments].map(([id,anchor])=>[anchor,level.cannons.find(c=>c.id===id)!]));
  for(const anchor of level.anchorPuzzle?.anchors??[])if(!occupants.has(anchor.id))renderSupportArt(supportLayer,emptyAnchorSupport(level,anchor),level.world,p,scale);
  const xGrid=gridTicks(loX,hiX,scale),yGrid=gridTicks(loY,hiY,scale),xs=xGrid.labels,ys=yGrid.labels;
  for(const x of xGrid.units){const a=p({x,y:b.minY}),z=p({x,y:b.maxY});el('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#315b75','stroke-opacity':x%xGrid.step===0?.40:.23,'data-grid-x':x},content);}
  for(const y of yGrid.units){const a=p({x:b.minX,y}),z=p({x:b.maxX,y});el('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#315b75','stroke-opacity':y%yGrid.step===0?.40:.23,'data-grid-y':y},content);}
  if(b.minX<=0&&b.maxX>=0){const a=p({x:0,y:b.minY}),z=p({x:0,y:b.maxY});el('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#315779','stroke-width':2},content);}
  if(b.minY<=0&&b.maxY>=0){const a=p({x:b.minX,y:0}),z=p({x:b.maxX,y:0});el('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#315779','stroke-width':2},content);}
  // Artwork and collision both read the same world bounds.
  for(const o of level.obstacles){
   const g=renderTerrain(content,o,p,scale,floating,peaks,ruins,factory,cosmic,foundry||salvage),info=terrainInspection(o,level.world);
   target(g,{id:o.id,...info,point:{x:(o.bounds.minX+o.bounds.maxX)/2,y:(o.bounds.minY+o.bounds.maxY)/2},bounds:o.bounds});
  }
  for(const anchor of level.anchorPuzzle?.anchors??[]){const occupant=occupants.get(anchor.id),mount=renderAnchorMount(content,anchor,p,scale,occupant);if(!occupant)target(mount,{id:anchor.id,label:'Mount '+anchor.id,detail:coord(anchor.position)+' · empty',point:anchor.position},false,true);}
  tutorialLayer=el('g',{'data-layer':'tutorial-coordinates','pointer-events':'none','aria-hidden':'true'},content);paintTutorialGuides();
  crew=createWaitingCrew(content,level,crewTotal,p,scale,controls.look);crew.update(crewWaiting);
  for(const c of level.cannons){
   const a=p(c.position),g=el('g',{transform:'translate('+a.x+' '+a.y+') scale('+scale+')'},content),style=cannonTypes[c.type];
   g.classList.add('cannon-target');cannonTargets.set(c.id,g);
   const body=el('g',{transform:'scale('+c.direction+' 1)'},g);
   el('rect',{x:-.89,y:-.37,width:1.26,height:1.06,rx:.18,fill:'transparent','pointer-events':'all','data-cannon-hit':''},body);
   el('rect',{x:-.84,y:-.30,width:1.16,height:.93,rx:.18,class:'planning-halo','pointer-events':'none'},body);
   el('rect',{x:-.89,y:-.35,width:1.26,height:1.03,rx:.21,fill:'none',stroke:'#fff','stroke-width':.035,'stroke-dasharray':'.09 .045',class:'selected-halo','pointer-events':'none'},body);
   if(c.lift)renderLiftDeck(body);
   const barrel=renderCannonArt(body,c.type,BARREL_ANGLE,controls.cannonLook,c.direction);barrels.set(c.id,barrel);
   if(c.lift||inventoryCannon(level,c.id)?.lockedShape!==undefined)renderBrokenDetails(body,barrel);
   el('circle',{r:.12,fill:'white','fill-opacity':.2,stroke:'#fff','stroke-width':.028},g);
   el('circle',{r:.044,fill:'#fff',stroke:'#203d54','stroke-width':.022},g);
   el('text',{x:0,y:-.35,'text-anchor':'middle','font-size':.25,'font-weight':800,fill:'#203d54',stroke:'#eaf8f8','stroke-width':.05,'paint-order':'stroke'},g,c.id+(c.direction===-1?' ←':' →'));
   target(g,{id:c.id,label:'Cannon '+c.id+' · '+style.label+(c.lift?' · Locked lift':inventoryCannon(level,c.id)?' · Mounted part':''),detail:coord(c.position)+' · fires '+(c.direction===1?'right':'left'),point:c.position},true);
   if(c.lift){
    const grip=liftGrip(scale,c.direction),gw=grip.glyphWidth,gh=grip.glyphHeight;
    const handle=el('g',{transform:'translate('+(a.x+grip.dx)+' '+(a.y+grip.dy)+')','data-lift-handle':c.id,role:'slider',tabindex:planningEditable?'0':'-1','aria-label':'Move cannon '+c.id+' vertically','aria-orientation':'vertical','aria-valuemin':c.lift.minY,'aria-valuemax':c.lift.maxY,'aria-valuenow':c.position.y,class:'lift-handle','aria-disabled':String(!planningEditable)},content);
    // The transparent target covers the striped deck and the space below.
    el('rect',{x:-grip.width/2,y:0,width:grip.width,height:grip.height,rx:4,fill:'transparent','pointer-events':planningEditable?'all':'none','data-lift-hit':''},handle);
    el('rect',{x:-gw/2,y:Math.max(2,.17*scale),width:gw,height:gh,rx:Math.min(3,gh/3),fill:'#625335',stroke:'#f3d490','stroke-width':.8,'pointer-events':'none','data-lift-grip':''},handle);
    const gy=Math.max(2,.17*scale)+gh/2;
    el('path',{d:'M'+(-gw*.23)+' '+(gy-gh*.12)+' L0 '+(gy-gh*.35)+' '+(gw*.23)+' '+(gy-gh*.12)+' M'+(-gw*.23)+' '+(gy+gh*.12)+' L0 '+(gy+gh*.35)+' '+(gw*.23)+' '+(gy+gh*.12),stroke:'#fff4ce','stroke-width':Math.max(.8,Math.min(1.6,gh*.14)),fill:'none','stroke-linecap':'round','stroke-linejoin':'round','pointer-events':'none'},handle);
    handle.addEventListener('keydown',event=>{const key=(event as KeyboardEvent).key;if(!planningEditable||!['ArrowUp','ArrowDown','Home','End'].includes(key))return;event.preventDefault();event.stopPropagation();controls.onLiftMove?.(c.id,key==='Home'?c.lift!.minY:key==='End'?c.lift!.maxY:c.position.y+(key==='ArrowUp'?1:-1));});
    handle.addEventListener('click',event=>event.stopPropagation());
   }
   if(inventoryCannon(level,c.id)){
    const grip=renderAnchorGrip(content,a,scale,c.id,c.direction,planningEditable);
    grip.addEventListener('click',event=>{event.stopPropagation();if(planningEditable)controls.onAnchorPartSelect?.(c.id);});
    grip.addEventListener('keydown',event=>{const key=(event as KeyboardEvent).key;if(planningEditable&&(key==='Enter'||key===' ')){event.preventDefault();event.stopPropagation();controls.onAnchorPartSelect?.(c.id);}});
   }
  }
  const a=p(level.exit),g=el('g',{transform:'translate('+a.x+' '+a.y+') scale('+scale+')'},content);
  el('path',{d:'M-'+EXIT_FOOTPRINT.halfWidth+' '+EXIT_FOOTPRINT.drop+' V-.06 A'+EXIT_FOOTPRINT.halfWidth+' '+EXIT_FOOTPRINT.halfWidth+' 0 0 1 '+EXIT_FOOTPRINT.halfWidth+' -.06 V'+EXIT_FOOTPRINT.drop+'Z',fill:'#b5a38b',stroke:'#6b665c','stroke-width':.04},g);
  el('path',{d:'M-.29 '+EXIT_FOOTPRINT.drop+' V-.05 A.29 .29 0 0 1 .29 -.05 V'+EXIT_FOOTPRINT.drop+'Z',fill:'url(#portal)',stroke:'#b27b29','stroke-width':.025},g);
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
  flightTrail=el('path',{fill:'none',stroke:'#f1b346','stroke-width':3,'stroke-linecap':'round',opacity:.95,'pointer-events':'none','aria-hidden':'true','data-flight-trail':'',display:'none'},content);
  launchParent=el('g',{'pointer-events':'none','aria-hidden':'true'},content);
  visual=createLaunchVisual(launchParent,controls.look,controls.cannonLook,active?.variant??0);
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
  svg.classList.toggle('zoomed',camera.zoom>MIN_ZOOM);paintSelection();paintAnchorSelection();inspect();
  if(focusedId){const target=Array.from(svg.querySelectorAll<SVGElement>('[data-inspect]')).find(g=>g.getAttribute('data-inspect')===focusedId&&g.getAttribute('tabindex')==='0');(target??svg).focus({preventScroll:true});}
  if(focusedLift){const handle=Array.from(svg.querySelectorAll<SVGElement>('[data-lift-handle]')).find(g=>g.getAttribute('data-lift-handle')===focusedLift);handle?.focus({preventScroll:true});}
  if(focusedGrip){const grip=Array.from(svg.querySelectorAll<SVGElement>('[data-anchor-move]')).find(g=>g.getAttribute('data-anchor-move')===focusedGrip);grip?.focus({preventScroll:true});}
  controls.onViewChange?.();
 }
 function setLevelGeometry(next:Level){if(active||rapid)return;level=next;supports=levelSupports(level);draw();}
 const zoom=(factor:number)=>{camera=zoomCamera(level.bounds,viewport,camera,Number((camera.zoom*factor).toFixed(3)),pinned?inspections.get(pinned)?.point:undefined);draw();};
 controls.in.addEventListener('click',()=>zoom(1.25));controls.out.addEventListener('click',()=>zoom(.8));controls.reset.addEventListener('click',()=>{camera=initialCamera(level.bounds);draw();});
 const pan=(dx:number,dy:number)=>{camera=panCamera(level.bounds,viewport,camera,dx,dy);draw();};
 controls.left.addEventListener('click',()=>pan(viewport.width*.16,0));controls.right.addEventListener('click',()=>pan(-viewport.width*.16,0));
 controls.up.addEventListener('click',()=>pan(0,viewport.height*.16));controls.down.addEventListener('click',()=>pan(0,-viewport.height*.16));
 function pointerWorld(e:PointerEvent){const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const matrix=svg.getScreenCTM();if(!matrix)return undefined;const q=point.matrixTransform(matrix.inverse());return t.toWorld(q);}
 svg.addEventListener('pointerdown',e=>{
  // Chromium's touch adjustment can retarget a transparent deck hit to
   // the nearby painted cannon. Prefer the actual contact coordinate
   // when it lies on the deck's interaction area, not the adjusted node.
   const handle=(e.pointerType==='touch'?document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-lift-handle]'):null)??(e.target as Element).closest('[data-lift-handle]');
  if(handle){if(!planningEditable||e.button!==0||liftDrag||drag)return;const id=handle.getAttribute('data-lift-handle')!,c=level.cannons.find(c=>c.id===id),p=pointerWorld(e);if(!c||!p)return;e.preventDefault();liftDrag={pointer:e.pointerId,id,offset:c.position.y-p.y};svg.setPointerCapture(e.pointerId);return;}
  if((e.target as Element).closest('[data-inspect],[data-anchor-move],[data-mount-id]'))return;pinned=undefined;inspect();if(camera.zoom<=1||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};svg.setPointerCapture(e.pointerId);svg.classList.add('dragging');});
 svg.addEventListener('pointermove',e=>{if(liftDrag?.pointer===e.pointerId){const p=pointerWorld(e);if(p&&planningEditable)controls.onLiftMove?.(liftDrag.id,p.y+liftDrag.offset);return;}if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;pan(dx,dy);});
 const stop=(e:PointerEvent)=>{if(liftDrag?.pointer===e.pointerId)liftDrag=undefined;if(drag?.id===e.pointerId){drag=undefined;svg.classList.remove('dragging');}};
 svg.addEventListener('pointerup',stop);svg.addEventListener('pointercancel',stop);svg.addEventListener('lostpointercapture',stop);
 svg.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=hovered=focused=undefined;inspect();}});
 const observer=new ResizeObserver(()=>{const width=Math.round(stage.clientWidth),height=Math.round(stage.clientHeight);if(width<100||height<100||width===viewport.width&&height===viewport.height)return;viewport={width,height,padding:level.world===7||hasAnchors?foundryPadding(level.bounds,width,height):Math.min(34,Math.max(27,Math.floor(Math.min(width,height)*.09)))};draw();});
 observer.observe(stage);draw();
 function revealCannon(id:string){const target=cannonTargets.get(id);if(target?.getAttribute('tabindex')==='-1'){camera=initialCamera(level.bounds);draw();}}
 function focusCannon(id:string){revealCannon(id);(cannonTargets.get(id) as SVGElement|undefined)?.focus({preventScroll:true});}
 function cannonRect(id:string){return cannonTargets.get(id)?.getBoundingClientRect();}
 function graphRect(){
  const matrix=svg.getScreenCTM();if(!matrix)return undefined;
  const q=plot(),a=t.toScreen({x:level.bounds.minX,y:level.bounds.maxY}),b=t.toScreen({x:level.bounds.maxX,y:level.bounds.minY});
  const left=new DOMPoint(Math.max(q.x,a.x),Math.max(q.y,a.y)).matrixTransform(matrix),right=new DOMPoint(Math.min(q.x+q.w,b.x),Math.min(q.y+q.h,b.y)).matrixTransform(matrix);
  return {left:left.x,top:left.y,right:right.x,bottom:right.y};
 }
 function occupiedRects(){return Array.from(svg.querySelectorAll('[data-inspect].cannon-target,[data-inspect="exit"],[data-lift-grip],[data-mount-id]')).map(g=>g.getBoundingClientRect());}
 return {playFlight,playRapidFire,clearFlight,setLevelGeometry,setPlanningSelection,setPlanStatuses,setAnchorSelection,revealCannon,focusCannon,cannonRect,graphRect,occupiedRects,setTutorialGuides,setGraphPreview,setWaitingCrew,destroy:()=>{observer.disconnect();if(animationId)cancelAnimationFrame(animationId);active=undefined;rapid=undefined;svg.remove();}};
}
