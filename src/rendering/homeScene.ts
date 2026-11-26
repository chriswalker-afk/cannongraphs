import {coordinateSystem,type Point} from '../engine/coordinates';
import {cannonTypes} from '../game/cannons';
import {createHomeDemo,homeLayout,homeElapsed,sampleHomeDemo,stillHomeDemo,type HomeDemo} from '../animations/homeDemo';
import {createHomeClock} from '../animations/homeClock';
import type {RapidFrame} from '../animations/rapidFire';
import {createPip,svgNode as el,type PipSprite} from './pip';
import type {PipLook} from '../game/pipCosmetics';
import {renderCannonArt} from './cannonArt';
import {renderTerrain} from './terrain';
import {flightPath} from './flightPath';
import {createRapidVisual} from './rapidVisual';

function scenery(svg:SVGSVGElement,w:number,h:number){
 const defs=el('defs',{},svg),sky=el('linearGradient',{id:'home-sky',x1:0,y1:0,x2:0,y2:1},defs);
 el('stop',{offset:'0%','stop-color':'#8dcae9'},sky);el('stop',{offset:'100%','stop-color':'#e8f4d9'},sky);
 const portal=el('radialGradient',{id:'home-portal'},defs);
 el('stop',{offset:'0%','stop-color':'#fffce1'},portal);el('stop',{offset:'100%','stop-color':'#efb84a'},portal);
 el('rect',{width:w,height:h,fill:'url(#home-sky)'},svg);
 const u=Math.min(w,h)/420;
 el('circle',{cx:w*.83,cy:h*.14,r:Math.min(w,h)*.10,fill:'#fff3b0',opacity:.8},svg);
 for(const [x,y,s] of [[.12,.13,1],[.39,.21,.72],[.71,.10,.86],[.93,.35,.65]]){
  const c=el('g',{transform:'translate('+w*x+' '+h*y+') scale('+u*s+')',fill:'#fffdf4',opacity:.71},svg);
  el('ellipse',{rx:55,ry:12},c);el('circle',{cx:-24,cy:-6,r:19},c);el('circle',{cx:7,cy:-10,r:24},c);el('circle',{cx:32,cy:-4,r:14},c);
 }
 el('path',{d:'M0 '+h*.58+' Q'+w*.14+' '+h*.27+' '+w*.28+' '+h*.59+' T'+w*.56+' '+h*.57+' T'+w*.8+' '+h*.39+' L'+w+' '+h*.56+' V'+h+' H0Z',fill:'#83b6ba',opacity:.56},svg);
 el('path',{d:'M0 '+h*.82+' Q'+w*.13+' '+h*.54+' '+w*.29+' '+h*.79+' T'+w*.58+' '+h*.69+' T'+w*.82+' '+h*.81+' T'+w+' '+h*.65+' V'+h+' H0Z',fill:'#8cb99b',opacity:.78},svg);
 // Distant floating island and waterfall, separate from all actual terrain.
 const island=el('g',{transform:'translate('+w*.72+' '+h*.46+') scale('+u*.85+')',opacity:.42},svg);
 el('path',{d:'M-65 0 Q0 -16 65 0 L38 31 3 72 -28 43Z',fill:'#839e96'},island);
 el('path',{d:'M-65 0 Q0 -19 65 0 L36 7 -35 8Z',fill:'#76a775'},island);
 el('path',{d:'M24 4 Q31 30 23 57 T27 111',fill:'none',stroke:'#e1faff','stroke-width':10,'stroke-linecap':'round'},island);
 el('path',{d:'M24 4 Q31 30 23 57 T27 111',fill:'none',stroke:'#7bc6df','stroke-width':4,'stroke-linecap':'round'},island);
 // Distant turret silhouette; it never changes the collision model.
 const castle=el('g',{transform:'translate('+w*.19+' '+h*.68+') scale('+u*.92+')',opacity:.46},svg);
 el('rect',{x:-30,y:-31,width:60,height:34,fill:'#94a7aa'},castle);
 for(const [x,y] of [[-34,-44],[29,-44],[0,-67]]){
  el('rect',{x:x-10,y,width:20,height:-y+4,fill:'#a9b5b0',stroke:'#79949b','stroke-width':1.5},castle);
  el('path',{d:'M'+(x-13)+' '+y+' L'+x+' '+(y-18)+' L'+(x+13)+' '+y+'Z',fill:'#7792a1'},castle);
  el('rect',{x:x-3,y:y+10,width:6,height:12,rx:3,fill:'#78929b'},castle);
 }
 for(const x of [.04,.12,.34,.9,.97]){
  const tree=el('g',{transform:'translate('+w*x+' '+h*.89+') scale('+u+')',opacity:.56},svg);
  el('rect',{x:-2,y:-3,width:4,height:17,fill:'#8a785f'},tree);
  el('path',{d:'M0 -39 L-14 -16 H-8 L-18 -3 H18 L8 -16 H14Z',fill:'#5f9c7d'},tree);
 }
}
interface PaintedHome {
 demo:HomeDemo;project:(p:Point)=>Point;scale:number;barrels:Map<string,Element>;
 visual:ReturnType<typeof createRapidVisual>;queue:readonly PipSprite[];
}
function drawScene(svg:SVGSVGElement,demo:HomeDemo,width:number,height:number,look?:PipLook):PaintedHome{
 svg.replaceChildren();svg.setAttribute('viewBox','0 0 '+width+' '+height);
 scenery(svg,width,height);
 const {level,result}=demo,{bounds:b}=level;
 const {scale,toScreen:project}=coordinateSystem(b,{width,height,padding:Math.min(22,width*.045,height*.045)});
 const plot=el('g',{'pointer-events':'none'},svg);
 const top=project({x:b.minX,y:b.maxY}),bottom=project({x:b.maxX,y:b.minY});
 // Faint equal-unit graph grid helps communicate the concept without
 // making the landing screen look like another worksheet.
 for(let x=Math.ceil(b.minX);x<=b.maxX;x++){
  const p=project({x,y:0});el('line',{x1:p.x,x2:p.x,y1:top.y,y2:bottom.y,stroke:'#35637a','stroke-width':x===0?1.2:.7,opacity:x===0?.30:.13},plot);
 }
 for(let y=Math.ceil(b.minY);y<=b.maxY;y++){
  const p=project({x:0,y});el('line',{x1:top.x,x2:bottom.x,y1:p.y,y2:p.y,stroke:'#35637a','stroke-width':y===0?1.2:.7,opacity:y===0?.30:.13},plot);
 }
 for(const o of level.obstacles)renderTerrain(plot,o,project,scale);
 const trace=el('g',{},plot);
 for(const leg of result.legs){
  const c=level.cannons.find(c=>c.id===leg.cannonId)!;
  el('path',{d:flightPath(leg,leg.start,leg.end,project),stroke:'#fffdf0','stroke-width':3.8,fill:'none',opacity:.67,'stroke-linecap':'round'},trace);
  el('path',{d:flightPath(leg,leg.start,leg.end,project),stroke:cannonTypes[c.type].color,'stroke-width':2,fill:'none','stroke-dasharray':'5 5',opacity:.74,'stroke-linecap':'round'},trace);
 }
 const barrels=new Map<string,Element>();
 for(const leg of result.legs){
  const c=level.cannons.find(c=>c.id===leg.cannonId)!,a=project(c.position);
  const group=el('g',{transform:'translate('+a.x+' '+a.y+') scale('+scale+')'},plot);
  const mirrored=el('g',{transform:'scale('+c.direction+' 1)'},group);
  barrels.set(c.id,renderCannonArt(mirrored,c.type,leg.angle));
  el('circle',{r:.045,fill:'#fff',stroke:'#203d54','stroke-width':.022},group);
 }
 const exit=project(level.exit),gate=el('g',{transform:'translate('+exit.x+' '+exit.y+') scale('+scale+')'},plot);
 el('path',{d:'M-.45 .44 V-.06 A.45 .45 0 0 1 .45 -.06 V.44Z',fill:'#b5a38b',stroke:'#6b665c','stroke-width':.04},gate);
 el('path',{d:'M-.3 .44 V-.05 A.3 .3 0 0 1 .3 -.05 V.44Z',fill:'url(#home-portal)',stroke:'#b27b29','stroke-width':.025},gate);
 el('path',{d:'M-.16 .20 Q-.25 -.09 0 -.15 Q.25 -.13 .14 .10 Q.03 .22 -.05 .08',stroke:'#fff7b8','stroke-width':.04,fill:'none','stroke-linecap':'round'},gate);
 const queue=Array.from({length:demo.schedule.count},(_,i)=>createPip(plot,i,look));
 const visual=createRapidVisual(plot,demo.schedule.count,0,result,look);
 return {demo,project,scale,barrels,visual,queue};
}
function paintScene(p:PaintedHome,frame:RapidFrame,ms:number,still:boolean){
 const {demo,project,scale,barrels,visual,queue}=p;
 for(const [i,leg] of demo.result.legs.entries()){
  barrels.get(leg.cannonId)?.setAttribute('transform','rotate('+(-leg.angle)+') translate('+(-frame.cannonCues[i].recoil)+' 0)');
 }
 const first=demo.level.cannons[0],elapsed=homeElapsed(ms,demo);
 for(const [i,pip] of queue.entries()){
  const waiting=i>=frame.dispatched;
  pip.root.setAttribute('display',waiting?'inline':'none');
  if(!waiting)continue;
  const lift=still?0:.10*Math.max(0,Math.sin(elapsed/170+i*.9)),a=project({x:first.position.x-.5-i*.35,y:1.06+lift});
  pip.root.setAttribute('transform','translate('+a.x+' '+a.y+') scale('+scale+')');
  pip.setPose('excited');pip.setStretch(still?1:1-.06*Math.max(0,Math.sin(elapsed/170+i*.9)));
 }
 visual.paint(frame,demo.result,project,scale,still);
}
export function mountHomeScene(host:HTMLElement,pauseButton:HTMLButtonElement,look?:PipLook){
 const svg=el('svg',{'aria-hidden':'true',focusable:'false'},host) as SVGSVGElement;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let paused=motion.matches,forceStill=paused,painted:PaintedHome|undefined,disposed=false;
 const clock=createHomeClock({request:fn=>window.requestAnimationFrame(fn),cancel:id=>window.cancelAnimationFrame(id)},render);
 function render(ms:number){
  if(!painted||disposed)return;
  paintScene(painted,forceStill?stillHomeDemo(painted.demo):sampleHomeDemo(ms,painted.demo),ms,forceStill);
 }
 function sync(){
  pauseButton.textContent=paused?'Play animation':'Pause animation';
  if(paused||document.hidden)clock.pause();else clock.resume();
 }
 function redraw(){
  if(disposed)return;
  const w=Math.max(100,host.clientWidth),h=Math.max(100,host.clientHeight),layout=homeLayout(w,h);
  let demo=painted?.demo;
  if(!demo||demo.layout!==layout){demo=createHomeDemo(layout);clock.reset();}
  painted=drawScene(svg,demo,w,h,look);
  render(clock.elapsed());
 }
 function toggle(){
  paused=!paused;
  if(!paused){forceStill=false;render(clock.elapsed());}
  else if(clock.elapsed()===0){forceStill=true;render(0);}
  sync();
 }
 function preference(){
  paused=motion.matches;forceStill=paused;render(clock.elapsed());sync();
 }
 pauseButton.addEventListener('click',toggle);
 motion.addEventListener('change',preference);
 document.addEventListener('visibilitychange',sync);
 const resize=new ResizeObserver(redraw);resize.observe(host);redraw();sync();
 return ()=>{disposed=true;clock.destroy();resize.disconnect();motion.removeEventListener('change',preference);document.removeEventListener('visibilitychange',sync);pauseButton.removeEventListener('click',toggle);};
}
