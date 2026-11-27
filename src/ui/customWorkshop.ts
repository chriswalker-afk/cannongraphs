import {cannonTypes,type CannonType} from '../game/cannons';
import {worlds} from '../levels/catalog';
import {coordinateSystem,type Point,type Bounds} from '../engine/coordinates';
import {gridTicks} from '../rendering/grid';
import {svgNode as el} from '../rendering/pip';
import {renderCannonArt} from '../rendering/cannonArt';
import {BARREL_ANGLE} from '../animations/launch';
import {renderGem} from '../rendering/gem';
import {buildCustomLevel,workshopTerrain,placeObject,moveObject,deleteObject,objectPoint,snapPoint,CUSTOM_FILE_LIMIT,MAX_CANNONS,MAX_TERRAIN,MAX_GEMS,type CustomDesign,type CustomWorkshopStore,type PlacementTool} from '../game/customLevels';
import {downloadCustomFile} from './customFile';
type Tool='select'|PlacementTool;
const fmt=(v:number)=>String(Number(v.toFixed(4)));
const coord=(p:Point)=>'('+fmt(p.x)+', '+fmt(p.y)+')';
const labels:Record<PlacementTool,string>={linear:'Linear',quadratic:'Quadratic',cubic:'Cubic',reciprocal:'Reciprocal',exponential:'Exponential',logarithmic:'Logarithmic',wave:'Wave',exit:'Exit',platform:'Platform',wall:'Wall',ceiling:'Ceiling',gem:'Gem'};
const symbols:Record<PlacementTool,string>={linear:'↗',quadratic:'∩',cubic:'S',reciprocal:'1/x',exponential:'↑',logarithmic:'log',wave:'~',exit:'▣',platform:'▬',wall:'▮',ceiling:'▀',gem:'◆'};
function element<K extends keyof HTMLElementTagNameMap>(tag:K,parent:Element,cls='',text?:string):HTMLElementTagNameMap[K]{
 const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;parent.append(e);return e;
}
function action(parent:Element,text:string,cls:string,click:()=>void){
 const b=element('button',parent,cls,text);b.type='button';b.addEventListener('click',click);return b;
}
function text(parent:Element,attrs:Record<string,number|string>,value:string){const t=el('text',attrs,parent);t.textContent=value;return t;}
export function mountCustomWorkshop(root:HTMLElement,store:CustomWorkshopStore,onHome:()=>void,onTest:(test:ReturnType<CustomWorkshopStore['beginTest']>)=>void,onLibrary:()=>void){
 store.ensureActive();
 root.innerHTML='<main class="custom-workshop" aria-label="Level Workshop"><header class="custom-top"><div class="brand"><button id="custom-home" type="button" class="brand-mark home-return" aria-label="Return home" title="Return home"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 11 12 3l9 8M5.5 10v10h5v-6h3v6h5V10" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div><h1>Level Workshop</h1><p>Design · Test · Confirm · Share</p></div></div><div class="custom-file-actions"><button id="custom-library" type="button">Custom levels</button><button id="custom-new" type="button">New level</button><button id="custom-upload" type="button">Upload level</button><input id="custom-file" type="file" accept=".json,application/json" hidden><button id="custom-download" type="button" disabled>Download level</button></div></header><div class="custom-meta"><label>Level name <input id="custom-title" maxlength="80"></label><label>World theme <select id="custom-world"></select></label><label>Snap <select id="custom-snap"><option value="1">1 unit</option><option value="0.5">½ unit</option><option value="0.25">¼ unit</option></select></label><details class="custom-grid-settings"><summary>Grid limits</summary><div class="custom-grid-inputs"></div><button id="custom-apply-bounds" type="button">Apply</button></details><details class="custom-grid-settings custom-objective"><summary>Instructions</summary><label>Level instructions <input id="custom-objective" maxlength="240"></label></details></div><div class="custom-shell"><aside class="custom-palette" aria-label="Object palette"><h2>Build</h2><div id="custom-tools"></div><p class="custom-help">Drag a tool onto the grid, or select it and tap a point. Drag existing objects to move them. Draw terrain by dragging across the grid.</p></aside><section class="custom-board" aria-label="Level design grid"><div class="custom-board-heading"><strong id="custom-active-tool">Select / move</strong><output id="custom-coordinate" aria-live="off"></output></div><svg id="custom-grid" tabindex="0" role="application" aria-label="Design grid. Arrow keys move the cursor, Enter places the selected tool. Use the object inspector for exact coordinates."></svg><div class="custom-counts" id="custom-counts"></div></section><aside class="custom-inspector" aria-label="Object inspector"><h2>Selected object</h2><div id="custom-properties"></div><h3>Objects</h3><div id="custom-objects"></div></aside></div><footer class="custom-footer"><div class="custom-status"><strong id="custom-state"></strong><p id="custom-message" role="status"></p><small id="custom-storage"></small></div><div class="custom-confirm-actions"><button id="custom-test" type="button" disabled>▶ Playtest</button><button id="custom-confirm" type="button" disabled>✓ Confirm level</button></div></footer></main>';
 const get=<T extends HTMLElement=HTMLElement>(id:string)=>root.querySelector<T>('#'+id)!;
 const svg=root.querySelector<SVGSVGElement>('#custom-grid')!,tools=get('custom-tools'),properties=get('custom-properties'),objects=get('custom-objects');
 const title=get<HTMLInputElement>('custom-title'),objective=get<HTMLInputElement>('custom-objective'),world=get<HTMLSelectElement>('custom-world'),snap=get<HTMLSelectElement>('custom-snap'),file=get<HTMLInputElement>('custom-file');
 const test=get<HTMLButtonElement>('custom-test'),confirm=get<HTMLButtonElement>('custom-confirm'),download=get<HTMLButtonElement>('custom-download');
 let d=store.read().design,tool:Tool='select',selected='',cursor:Point={x:1,y:2},disposed=false,message='';
 let transform=coordinateSystem(d.bounds,{width:800,height:500,padding:32}),view={width:800,height:500,padding:32};
 let preview:CustomDesign|undefined,ghost:HTMLElement|undefined;
 const toolButtons=new Map<Tool,HTMLButtonElement>();
 for(const w of worlds){const o=element('option',world,'',w.name);o.value=String(w.number);}
 const limitFields=new Map<keyof Bounds,HTMLInputElement>();
 for(const [key,label] of [['minX','x min'],['maxX','x max'],['minY','y min'],['maxY','y max']] as const){
  const l=element('label',root.querySelector('.custom-grid-inputs')!,'',label),i=element('input',l);i.type='number';i.min='-100';i.max='100';i.step='1';limitFields.set(key,i);
 }
 function selectTool(t:Tool){tool=t;if(t!=='select')selected='';refresh();}
 function notify(s:string){message=s;refreshStatus();}
 function tryEdit(fn:()=>CustomDesign){try{const next=fn();store.edit(next);d=store.read().design;message='';refresh();}catch(e){notify(e instanceof Error?e.message:'Unable to change this design.');}}
 function place(t:PlacementTool,p:Point,end?:Point){try{const result=placeObject(d,t,p,end);store.edit(result.design);d=store.read().design;selected=result.selected;tool='select';message='';refresh();}catch(e){notify(e instanceof Error?e.message:'Unable to place this object.');}}
 function pointerWorld(e:{clientX:number;clientY:number},clamped=false):Point|undefined{
  const matrix=svg.getScreenCTM();if(!matrix)return;
  const screen=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse()),p=transform.toWorld(screen),b=d.bounds;
  if(!clamped&&(p.x<b.minX-.02||p.x>b.maxX+.02||p.y<b.minY-.02||p.y>b.maxY+.02))return;
  return p;
 }
 function snapped(p:Point){return snapPoint(p,Number(snap.value),d.bounds);}
 function clearGhost(){ghost?.remove();ghost=undefined;}
 function addTool(t:Tool,label:string,symbol:string,colour:string){
  const b=element('button',tools,'custom-tool');b.type='button';b.dataset.tool=t;b.setAttribute('aria-pressed','false');
  const icon=element('span',b,'custom-tool-icon',symbol);icon.style.background=colour;icon.setAttribute('aria-hidden','true');element('span',b,'',label);toolButtons.set(t,b);
  let drag:{id:number;x:number;y:number;moved:boolean}|undefined,suppress=false;
  b.addEventListener('click',()=>{if(suppress){suppress=false;return;}selectTool(t);});
  if(t==='select')return;
  b.addEventListener('pointerdown',e=>{if(e.button!==0)return;suppress=false;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId);});
  b.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;
   if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5){drag.moved=true;ghost=element('div',document.body,'custom-drag-ghost',symbol+' '+label);ghost.style.setProperty('--ghost-color',colour);}
   if(drag.moved&&ghost){ghost.style.left=e.clientX+12+'px';ghost.style.top=e.clientY+10+'px';const p=pointerWorld(e);if(p)get('custom-coordinate').textContent=coord(snapped(p));}
  });
  b.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;drag=undefined;clearGhost();if(moved){suppress=true;const p=pointerWorld(e);if(p)place(t,snapped(p));else selectTool(t);}});
  b.addEventListener('pointercancel',()=>{drag=undefined;clearGhost();});
 }
 addTool('select','Select / move','✥','#536d77');
 for(const t of Object.keys(cannonTypes) as CannonType[])addTool(t,labels[t],symbols[t],cannonTypes[t].color);
 for(const t of ['exit','platform','wall','ceiling','gem'] as const)addTool(t,labels[t],symbols[t],t==='exit'?'#b88737':t==='gem'?'#188e82':'#8d8170');
 function refreshStatus(){
  const status=store.read();let invalid='';try{buildCustomLevel(d);}catch(e){invalid=e instanceof Error?e.message:'Invalid design.';}
  const state=get('custom-state');state.textContent=status.confirmed?'Confirmed · ready to share':status.tested?'Playtest passed · ready to confirm':'Draft · needs a successful playtest';
  state.dataset.status=status.confirmed?'confirmed':status.tested?'tested':'draft';
  get('custom-message').textContent=message||invalid||status.notice||(status.confirmed?'Download this level to share its geometry, without your equations.':'Complete the current design in the real game before confirming it.');
  get('custom-storage').textContent=status.persisted?'Design saved in Custom Levels on this browser.':'Session only — local saving unavailable.';
  test.disabled=!!invalid;confirm.disabled=!!invalid||!status.tested||status.confirmed;download.disabled=!!invalid||!status.confirmed;
 }
 function showProperties(){
  properties.replaceChildren();const p=objectPoint(d,selected);if(!p){element('p',properties,'custom-help','Select an object to edit its exact position, direction or dimensions.');return;}
  const cannon=d.cannons.find(c=>c.id===selected),terrain=d.obstacles.find(o=>o.id===selected),label=cannon?'Cannon '+cannon.id:terrain?labels[terrain.kind as PlacementTool]+' '+terrain.id:selected==='exit'?'Exit':'Gem '+selected;
  element('strong',properties,'custom-object-title',label+(cannon?.id===d.startId?' · START':''));
  const field=(name:string,value:number,change:(value:number)=>void)=>{
   const l=element('label',properties,'custom-property',name),i=element('input',l);i.type='number';i.step='any';i.value=String(value);i.setAttribute('aria-label',name);
   i.addEventListener('change',()=>{if(i.value.trim()&&Number.isFinite(i.valueAsNumber))change(i.valueAsNumber);else{notify('Enter a finite coordinate.');i.value=String(value);}});
  };
  field('x',p.x,x=>tryEdit(()=>moveObject(d,selected,{x,y:p.y})));field('y',p.y,y=>tryEdit(()=>moveObject(d,selected,{x:p.x,y})));
  if(cannon){
   const l=element('label',properties,'custom-property','Graph family'),select=element('select',l);
   for(const type of Object.keys(cannonTypes) as CannonType[]){const o=element('option',select,'',cannonTypes[type].label);o.value=type;}
   select.value=cannon.type;select.addEventListener('change',()=>tryEdit(()=>({...d,cannons:d.cannons.map(c=>c.id===selected?{...c,type:select.value as CannonType}:c)})));
   const l2=element('label',properties,'custom-property','Firing direction'),direction=element('select',l2);
   for(const [v,n] of [[1,'Right →'],[-1,'← Left']] as const){const o=element('option',direction,'',n);o.value=String(v);}direction.value=String(cannon.direction);
   direction.addEventListener('change',()=>tryEdit(()=>({...d,cannons:d.cannons.map(c=>c.id===selected?{...c,direction:Number(direction.value) as 1|-1}:c)})));
   const start=action(properties,cannon.id===d.startId?'Starting cannon':'Set as start','custom-secondary',()=>tryEdit(()=>({...d,startId:cannon.id})));start.disabled=cannon.id===d.startId;
  }
  if(terrain){
   field('Width',terrain.bounds.maxX-terrain.bounds.minX,w=>tryEdit(()=>({...d,obstacles:d.obstacles.map(o=>o.id===selected?{...o,bounds:{...o.bounds,maxX:o.bounds.minX+w}}:o)})));
   field('Height',terrain.bounds.maxY-terrain.bounds.minY,h=>tryEdit(()=>({...d,obstacles:d.obstacles.map(o=>o.id===selected?{...o,bounds:{...o.bounds,maxY:o.bounds.minY+h}}:o)})));
  }
  action(properties,'Delete object','custom-danger',()=>{const id=selected;selected='';tryEdit(()=>deleteObject(d,id));});
 }
 function listObjects(){
  objects.replaceChildren();const add=(id:string,label:string)=>{const b=action(objects,label,'custom-object-button',()=>{selected=id;tool='select';refresh();});b.dataset.objectId=id;b.setAttribute('aria-pressed',String(id===selected));};
  for(const c of d.cannons)add(c.id,c.id+' · '+cannonTypes[c.type].label+(c.id===d.startId?' · START':'')+' '+coord(c.position));
  if(d.exit)add('exit','Exit '+coord(d.exit));
  for(const o of d.obstacles)add(o.id,labels[o.kind as PlacementTool]+' '+o.id);
  for(const g of d.gems)add(g.id,'Gem '+coord(g.position));
  if(!objects.childElementCount)element('p',objects,'custom-help','No objects yet.');
 }
 function draw(){
  if(disposed)return;const level=preview??d,b=level.bounds;
  view={width:Math.max(180,svg.clientWidth||800),height:Math.max(200,svg.clientHeight||500),padding:30};
  transform=coordinateSystem(b,view);svg.setAttribute('viewBox','0 0 '+view.width+' '+view.height);svg.replaceChildren();
  const p=transform.toScreen,s=transform.scale,a=p({x:b.minX,y:b.maxY}),z=p({x:b.maxX,y:b.minY});
  const palettes=['#e3f1df','#e1ecfa','#e9e5f3','#f2e9d2','#e7e9e7','#e1e7f4'];
  el('rect',{x:a.x,y:a.y,width:z.x-a.x,height:z.y-a.y,fill:palettes[level.world-1],stroke:'#7b929c','stroke-width':1},svg);
  const xt=gridTicks(b.minX,b.maxX,s),yt=gridTicks(b.minY,b.maxY,s);
  for(const x of xt.units){const q=p({x,y:0});el('line',{x1:q.x,y1:a.y,x2:q.x,y2:z.y,stroke:x===0?'#34556c':'#a6b8bf','stroke-width':x===0?1.8:.6},svg);}
  for(const y of yt.units){const q=p({x:0,y});el('line',{x1:a.x,y1:q.y,x2:z.x,y2:q.y,stroke:y===0?'#34556c':'#a6b8bf','stroke-width':y===0?1.8:.6},svg);}
  for(const x of xt.labels)text(svg,{x:p({x,y:0}).x,y:z.y+17,'text-anchor':'middle','font-size':11,fill:'#34556c'},String(x));
  for(const y of yt.labels)text(svg,{x:a.x-7,y:p({x:0,y}).y+4,'text-anchor':'end','font-size':11,fill:'#34556c'},String(y));
  text(svg,{x:z.x+10,y:z.y+17,'font-size':12,'font-weight':800,fill:'#34556c'},'x');text(svg,{x:a.x-7,y:a.y-10,'font-size':12,'font-weight':800,fill:'#34556c'},'y');
  for(const o of workshopTerrain(level)){
   const r=o.bounds,t=p({x:r.minX,y:r.maxY}),end=p({x:r.maxX,y:r.minY}),w=end.x-t.x,h=end.y-t.y;
   const g=el('g',o.id==='base-floor'?{}:{'data-custom-object':o.id},svg);
   el('rect',{x:t.x,y:t.y,width:w,height:h,fill:o.kind==='ceiling'?'#84909b':'#a18c70',stroke:selected===o.id?'#d58a32':'#635b50','stroke-width':selected===o.id?3:1},g);
   el('rect',{x:t.x,y:t.y,width:w,height:Math.min(4,h*.3),fill:o.kind==='ceiling'?'#b5c2cb':'#73935b','pointer-events':'none'},g);
  }
  for(const c of level.cannons){
   const q=p(c.position),g=el('g',{'data-custom-object':c.id,transform:'translate('+q.x+' '+q.y+')'},svg),art=el('g',{transform:'scale('+s*c.direction+' '+s+')'},g);
   el('circle',{r:Math.max(13,s*.52),fill:selected===c.id?'#ffe0a1':'#ffffff',opacity:.63,stroke:selected===c.id?'#d58a32':'#97aeb9','stroke-width':selected===c.id?2.5:1},g);
   renderCannonArt(art,c.type,BARREL_ANGLE,undefined,c.direction);g.append(art);
   el('circle',{r:3.1,fill:'white',stroke:'#203d54','stroke-width':1.5},g);
   text(g,{x:0,y:-Math.max(15,s*.48),'text-anchor':'middle','font-size':12,'font-weight':850,fill:'#203d54',stroke:'#fffaf0','stroke-width':3,'paint-order':'stroke'},c.id+(c.id===level.startId?' ★':'')+(c.direction===1?' →':' ←'));
   text(g,{x:0,y:Math.max(20,s*.68),'text-anchor':'middle','font-size':10,fill:'#203d54',stroke:'#fff','stroke-width':3,'paint-order':'stroke'},coord(c.position));
  }
  if(level.exit){const q=p(level.exit),g=el('g',{'data-custom-object':'exit',transform:'translate('+q.x+' '+q.y+')'},svg),r=Math.max(11,s*.34);
   el('path',{d:'M-'+r+' '+r+' V0 A'+r+' '+r+' 0 0 1 '+r+' 0 V'+r+'Z',fill:'#f3c05b',stroke:selected==='exit'?'#d58a32':'#886428','stroke-width':selected==='exit'?3:1.5},g);
   el('circle',{r:3,fill:'white',stroke:'#886428'},g);text(g,{x:0,y:-r-5,'text-anchor':'middle','font-size':11,'font-weight':850,fill:'#78521c',stroke:'#fffaf0','stroke-width':3,'paint-order':'stroke'},'Exit '+coord(level.exit));
  }
  for(const gem of level.gems){const g=renderGem(svg,gem,p,s);g.setAttribute('data-custom-object',gem.id);if(selected===gem.id)el('circle',{r:Math.max(.32,12/s),fill:'none',stroke:'#d58a32','stroke-width':2/s},g);}
  if(tool!=='select'){const q=p(cursor);el('path',{d:'M'+(q.x-9)+' '+q.y+'h18 M'+q.x+' '+(q.y-9)+'v18',stroke:'#c47f29','stroke-width':2,'pointer-events':'none'},svg);}
 }
 function refresh(){
  title.value=d.title;objective.value=d.objective;world.value=String(d.world);
  for(const [key,i] of limitFields)i.value=String(d.bounds[key]);
  for(const [t,b] of toolButtons)b.setAttribute('aria-pressed',String(t===tool));
  get('custom-active-tool').textContent=tool==='select'?'Select / move':'Place '+labels[tool];
  get('custom-coordinate').textContent=coord(cursor);
  get('custom-counts').textContent=d.cannons.length+'/'+MAX_CANNONS+' cannons · '+d.obstacles.length+'/'+MAX_TERRAIN+' terrain · '+d.gems.length+'/'+MAX_GEMS+' gems · floor included';
  showProperties();listObjects();refreshStatus();draw();
 }
 title.addEventListener('change',()=>tryEdit(()=>({...d,title:title.value})));
 objective.addEventListener('change',()=>tryEdit(()=>({...d,objective:objective.value})));
 world.addEventListener('change',()=>tryEdit(()=>({...d,world:Number(world.value)})));
 get('custom-apply-bounds').addEventListener('click',()=>tryEdit(()=>({...d,bounds:Object.fromEntries([...limitFields].map(([k,i])=>[k,i.valueAsNumber])) as unknown as Bounds})));
 snap.addEventListener('change',()=>{cursor=snapped(cursor);draw();});
 let drag:{pointer:number;id:string;start:Point;origin:Point;client:Point;tool:Tool;moved:boolean}|undefined;
 svg.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;const p=pointerWorld(e);if(!p)return;
  e.preventDefault();svg.focus({preventScroll:true});cursor=snapped(p);
  const id=(e.target as Element).closest('[data-custom-object]')?.getAttribute('data-custom-object')??'';
  const hit=objectPoint(d,id),dragId=tool==='select'&&hit?id:'';
  if(dragId)selected=dragId;else if(tool==='select')selected='';
  drag={pointer:e.pointerId,id:dragId,start:cursor,origin:hit??cursor,client:{x:e.clientX,y:e.clientY},tool,moved:false};
  svg.setPointerCapture(e.pointerId);refresh();
 });
 svg.addEventListener('pointermove',e=>{
  const p=pointerWorld(e,!!drag);if(!p)return;cursor=snapped(p);get('custom-coordinate').textContent=coord(cursor);
  if(!drag||drag.pointer!==e.pointerId){if(tool!=='select')draw();return;}
  if(Math.hypot(e.clientX-drag.client.x,e.clientY-drag.client.y)>4)drag.moved=true;
  if(!drag.moved)return;
  try{
   if(drag.id){const startRaw=drag.start;preview=moveObject(d,drag.id,snapped({x:drag.origin.x+cursor.x-startRaw.x,y:drag.origin.y+cursor.y-startRaw.y}));}
   else if(drag.tool==='platform'||drag.tool==='wall'||drag.tool==='ceiling')preview=placeObject(d,drag.tool,drag.start,cursor).design;
   else preview=undefined;
  }catch{preview=undefined;}
  draw();
 });
 svg.addEventListener('pointerup',e=>{
  if(!drag||drag.pointer!==e.pointerId)return;const current=drag;drag=undefined;const next=preview;preview=undefined;
  const p=pointerWorld(e);if(!p){draw();return;}
  if(current.id){if(current.moved&&next)tryEdit(()=>next);else refresh();return;}
  if(current.tool!=='select'){place(current.tool,current.start,current.moved?snapped(p):undefined);return;}
  refresh();
 });
 svg.addEventListener('pointercancel',()=>{drag=undefined;preview=undefined;draw();});
 svg.addEventListener('keydown',e=>{
  const directions:Record<string,Point>={ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:1},ArrowDown:{x:0,y:-1}};
  const delta=directions[e.key];
  if(delta){e.preventDefault();const step=Number(snap.value);cursor=snapped({x:cursor.x+delta.x*step,y:cursor.y+delta.y*step});get('custom-coordinate').textContent=coord(cursor);draw();}
  else if(e.key==='Enter'&&tool!=='select'){e.preventDefault();place(tool,cursor);}
  else if(e.key==='Delete'&&selected){e.preventDefault();const id=selected;selected='';tryEdit(()=>deleteObject(d,id));}
  else if(e.key==='Escape'){e.preventDefault();selectTool('select');}
 });
 get('custom-home').addEventListener('click',onHome);get('custom-library').addEventListener('click',onLibrary);
 get('custom-new').addEventListener('click',()=>{try{store.newDraft();d=store.read().design;selected='';tool='select';message='New draft created. Your previous design remains in Custom Levels.';refresh();}catch(e){notify(e instanceof Error?e.message:'Cannot create a level.');}});
 get('custom-upload').addEventListener('click',()=>file.click());
 file.addEventListener('change',async()=>{
  const f=file.files?.[0];file.value='';if(!f)return;
  if(f.size>CUSTOM_FILE_LIMIT){notify('Level file is too large (maximum 64 KB).');return;}
  try{const raw=await f.text();if(disposed)return;store.importFile(raw);d=store.read().design;selected='';tool='select';message='Imported as a new level. Previous designs are saved in Custom Levels. Playtest before confirming locally.';refresh();}catch(e){if(!disposed)notify(e instanceof Error?e.message:'Could not read this level.');}
 });
 test.addEventListener('click',()=>{try{onTest(store.beginTest());}catch(e){notify(e instanceof Error?e.message:'Design cannot be tested.');}});
 confirm.addEventListener('click',()=>{try{if(store.confirm()){message='';refresh();}}catch(e){notify(e instanceof Error?e.message:'Cannot confirm this level.');}});
 download.addEventListener('click',()=>{try{downloadCustomFile(d.title,store.download());}catch(e){notify(e instanceof Error?e.message:'Cannot download this level.');}});
 const observer=new ResizeObserver(draw);observer.observe(svg);refresh();
 return ()=>{disposed=true;observer.disconnect();clearGhost();};
}
