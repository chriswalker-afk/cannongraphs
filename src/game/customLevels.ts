import {cannonTypes,type CannonType} from './cannons';
import type {Bounds,Point} from '../engine/coordinates';
import {PIP_RADIUS,pointRectangleDistance} from '../engine/collisions/clearance';
import {validateLevel,type Level,type Cannon,type Obstacle,type Gem} from '../levels/schema';
import {floor} from '../levels/terrain';
import {playedLayout,routeMatchesLayout} from './playedLayout';
import {validateLiftSpec,type LiftSpec} from '../levels/liftSpec';
import {levelSupports} from '../levels/supports';
import {waitingCrewSlots} from '../animations/waitingCrew';
import type {LevelState} from './levelState';
import {routeLegs} from '../engine/simulation/linearRoute';
import {modeBudget,isLearningMode,learningModes,type LearningMode} from './learningModes';
import {bankedGems} from '../animations/gemTimeline';
import type {LevelRecord,ModeRecords} from './progress';
export const CUSTOM_KEY='cannon-graphs:custom-workshop:v1';
export const CUSTOM_FILE_LIMIT=65536,MAX_CANNONS=8,MAX_TERRAIN=40,MAX_GEMS=24;
export interface CustomDesign{
 readonly title:string;readonly objective:string;readonly world:number;readonly bounds:Bounds;
 readonly cannons:readonly Cannon[];readonly startId:string|null;readonly exit:Point|null;
 readonly obstacles:readonly Obstacle[];readonly gems:readonly Gem[];
}
export const emptyDesign=():CustomDesign=>({title:'Untitled level',objective:'Programme the cannons and guide the Pips to the exit.',world:1,bounds:{minX:0,maxX:12,minY:0,maxY:9},cannons:[],startId:null,exit:null,obstacles:[],gems:[]});
function fail(message:string):never{throw Error(message);}
function object(v:unknown):Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v))fail('Expected a level object.');return v as Record<string,unknown>;}
function number(v:unknown):number{if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>100)fail('Coordinates must be finite numbers between −100 and 100.');return v===0?0:v;}
function string(v:unknown,max:number,label:string){if(typeof v!=='string'||v.length>max||!v.trim()||/[\u0000-\u001f\u007f]/.test(v))fail('Invalid '+label+'.');return v.trim();}
function bounds(v:unknown):Bounds{const o=object(v),b={minX:number(o.minX),maxX:number(o.maxX),minY:number(o.minY),maxY:number(o.maxY)};if(b.minX>=b.maxX||b.minY>=b.maxY)fail('Grid or terrain has reversed or zero dimensions.');return b;}
function point(v:unknown,b:Bounds):Point{const o=object(v),p={x:number(o.x),y:number(o.y)};if(p.x<b.minX||p.x>b.maxX||p.y<b.minY||p.y>b.maxY)fail('An object is outside the grid.');return p;}
function list(v:unknown,max:number,label:string):unknown[]{if(!Array.isArray(v)||v.length>max)fail('Too many or invalid '+label+' (maximum '+max+').');return v;}
function id(v:unknown,rx:RegExp,ids:Set<string>){if(typeof v!=='string'||!rx.test(v)||ids.has(v))fail('Invalid or duplicate object ID.');ids.add(v);return v;}
// Normalise only whitelisted fields. Neither uploaded files nor local
// drafts can supply programmed equations, certificates, support overrides or HTML.
// Only the authored locked shape of a lift is retained, parsed as bounded math.
export function decodeDesign(value:unknown):CustomDesign{
 const o=object(value),b=bounds(o.bounds),w=o.world;
 if(!Object.values(b).every(Number.isInteger)||b.maxX-b.minX<6||b.maxX-b.minX>40||b.maxY-b.minY<5||b.maxY-b.minY>24)fail('Use integer grid limits: width 6–40, height 5–24 units.');
 if(typeof w!=='number'||!Number.isInteger(w)||w<1||w>7)fail('Choose one of the seven world themes.');
 const ids=new Set<string>(['exit','base-floor']);
 const cannons=list(o.cannons,MAX_CANNONS,'cannons').map(v=>{
  const c=object(v),type=c.type,direction=c.direction;
  if(typeof type!=='string'||!Object.hasOwn(cannonTypes,type)||direction!==1&&direction!==-1)fail('Unknown cannon type or direction.');
  const cannon:Cannon={id:id(c.id,/^[A-H]$/,ids),type:type as CannonType,direction:direction as 1|-1,position:point(c.position,b)};
  if(c.lift!==undefined){
   const lift=object(c.lift);
   cannon.lift={minY:number(lift.minY),maxY:number(lift.maxY),lockedShape:string(lift.lockedShape,180,'locked shape')};
   if(cannon.lift.minY<b.minY+1||cannon.lift.maxY>b.maxY-.5)fail('Lift stops must leave room at the grid edges.');
   validateLiftSpec(cannon,b);
  }
  return cannon;
 });
 const startId=o.startId;
 if(cannons.length?typeof startId!=='string'||!cannons.some(c=>c.id===startId):startId!==null)fail('Choose a valid starting cannon.');
 const obstacles=list(o.obstacles,MAX_TERRAIN,'terrain pieces').map(v=>{
  const t=object(v),r=bounds(t.bounds),kind=t.kind;
  if(kind!=='platform'&&kind!=='wall'&&kind!=='ceiling')fail('Unknown terrain type.');
  point({x:r.minX,y:r.minY},b);point({x:r.maxX,y:r.maxY},b);
  if(r.maxX-r.minX<.25||r.maxY-r.minY<.25)fail('Terrain must be at least 0.25 units wide and high.');
  return {id:id(t.id,/^t(?:[1-9]|[1-3][0-9]|40)$/,ids),kind:kind as Obstacle['kind'],bounds:r};
 });
 const gems=list(o.gems,MAX_GEMS,'gems').map(v=>{const g=object(v);return {id:id(g.id,/^g(?:[1-9]|1[0-9]|2[0-4])$/,ids),position:point(g.position,b)};});
 return {title:string(o.title,80,'title'),objective:string(o.objective,240,'objective'),world:w,bounds:b,cannons,startId:startId as string|null,exit:o.exit===null?null:point(o.exit,b),obstacles,gems};
}
export function designKey(d:CustomDesign):string{return JSON.stringify(decodeDesign(d));}
export function workshopTerrain(d:CustomDesign):Obstacle[]{return [floor(d.bounds,.4,'base-floor'),...d.obstacles];}
export function buildCustomLevel(input:CustomDesign):Level{
 const d=decodeDesign(input);if(!d.cannons.length||!d.startId)fail('Place at least one cannon.');if(!d.exit)fail('Place the exit.');
 const l:Level={id:'custom-workshop-level',world:d.world,title:d.title,objective:d.objective,bounds:d.bounds,creatures:5,startId:d.startId,cannons:[...d.cannons],exit:d.exit,obstacles:workshopTerrain(d),gems:d.gems};
 const anchors=[...l.cannons.map(c=>({id:c.id,p:c.position})),{id:'Exit',p:l.exit}];
 for(const [i,{id,p}] of anchors.entries()){
  const b=l.bounds;if(p.x<b.minX+.5||p.x>b.maxX-.5||p.y<b.minY+1||p.y>b.maxY-.5)fail(id+': leave room between the marked point and the grid edges.');
  if(l.obstacles.some(o=>pointRectangleDistance(p,o.bounds)<=PIP_RADIUS+1e-8))fail(id+': move the marked point away from solid terrain.');
  if(anchors.slice(0,i).some(a=>Math.hypot(a.p.x-p.x,a.p.y-p.y)<.75))fail(id+': separate the cannon and exit points by at least 0.75 units.');
 }
 validateLevel(l);levelSupports(l);
 if(waitingCrewSlots(l,5).length<5)fail('Leave space on the floor or platforms for five waiting Pips.');
 return l;
}
export function encodeCustomFile(d:CustomDesign):string{
 const design=decodeDesign(d);
 return JSON.stringify({format:'cannon-graphs-level',version:design.world===7||design.cannons.some(c=>c.lift)?2:1,design},null,2)+'\n';
}
export function decodeCustomFile(raw:string):CustomDesign{
 if(raw.length>CUSTOM_FILE_LIMIT)fail('Level file is too large (maximum 64 KB).');
 let v:unknown;try{v=JSON.parse(raw);}catch{fail('This is not a valid JSON level file.');}
 const o=object(v);if(o.format!=='cannon-graphs-level'||o.version!==1&&o.version!==2)fail('This is not a supported Cannon Graphs level file.');
 // Only complete, structurally playable levels can be shared. Importing
 // never imports an authorisation, solved equation, or confirmation flag.
 const d=decodeDesign(o.design);if(o.version===1&&(d.world===7||d.cannons.some(c=>c.lift)))fail('Movable cannons and the Foundry theme require a version 2 level file.');buildCustomLevel(d);return d;
}
export type PlacementTool=CannonType|'exit'|'platform'|'wall'|'ceiling'|'gem';
export const placementTools:readonly PlacementTool[]=[...Object.keys(cannonTypes) as CannonType[],'exit','platform','wall','ceiling','gem'];
export function snapPoint(p:Point,step:number,b:Bounds):Point{
 const snap=(n:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,Math.round(n/step)*step));
 return {x:snap(p.x,b.minX,b.maxX),y:snap(p.y,b.minY,b.maxY)};
}
const clamp=(n:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,n));
function nextId(ids:readonly string[],prefix:string,max:number){for(let i=1;i<=max;i++){const id=prefix?prefix+i:String.fromCharCode(64+i);if(!ids.includes(id))return id;}return fail('Object limit reached.');}
export function placeObject(d:CustomDesign,tool:PlacementTool,p:Point,end?:Point):{design:CustomDesign;selected:string}{
 if(!placementTools.includes(tool))fail('Unknown tool.');
 if(tool==='exit')return {design:decodeDesign({...d,exit:p}),selected:'exit'};
 if(tool==='gem'){const id=nextId(d.gems.map(g=>g.id),'g',MAX_GEMS);return {design:decodeDesign({...d,gems:[...d.gems,{id,position:p}]}),selected:id};}
 if(tool==='platform'||tool==='wall'||tool==='ceiling'){
  const id=nextId(d.obstacles.map(o=>o.id),'t',MAX_TERRAIN),b=d.bounds;
  const draw=end&&Math.abs(end.x-p.x)>=.25&&Math.abs(end.y-p.y)>=.25;
  const width=draw?Math.abs(end!.x-p.x):tool==='wall'?.5:2,height=draw?Math.abs(end!.y-p.y):tool==='wall'?2:.5;
  const x=clamp(draw?Math.min(p.x,end!.x):p.x,b.minX,b.maxX-width),y=clamp(draw?Math.min(p.y,end!.y):p.y,b.minY,b.maxY-height);
  return {design:decodeDesign({...d,obstacles:[...d.obstacles,{id,kind:tool,bounds:{minX:x,maxX:x+width,minY:y,maxY:y+height}}]}),selected:id};
 }
 const id=nextId(d.cannons.map(c=>c.id),'',MAX_CANNONS);
 return {design:decodeDesign({...d,cannons:[...d.cannons,{id,type:tool,direction:1,position:p}],startId:d.startId??id}),selected:id};
}
export function objectPoint(d:CustomDesign,id:string):Point|undefined{
 const terrain=d.obstacles.find(o=>o.id===id);
 return id==='exit'?d.exit??undefined:d.cannons.find(c=>c.id===id)?.position??d.gems.find(g=>g.id===id)?.position??(terrain?{x:terrain.bounds.minX,y:terrain.bounds.minY}:undefined);
}
export function moveObject(d:CustomDesign,id:string,p:Point):CustomDesign{
 const terrain=d.obstacles.find(o=>o.id===id),b=d.bounds;
 if(terrain){const w=terrain.bounds.maxX-terrain.bounds.minX,h=terrain.bounds.maxY-terrain.bounds.minY,x=clamp(p.x,b.minX,b.maxX-w),y=clamp(p.y,b.minY,b.maxY-h);return decodeDesign({...d,obstacles:d.obstacles.map(o=>o.id===id?{...o,bounds:{minX:x,maxX:x+w,minY:y,maxY:y+h}}:o)});}
 if(!objectPoint(d,id))return d;
 return decodeDesign({...d,exit:id==='exit'?p:d.exit,cannons:d.cannons.map(c=>c.id===id?{...c,position:c.lift?{x:p.x,y:clamp(Math.round(p.y),c.lift.minY,c.lift.maxY)}:p}:c),gems:d.gems.map(g=>g.id===id?{...g,position:p}:g)});
}
// Workshop-only design edit. The authored position is snapped into the
// configured rail; the player cannot subsequently change x or the shape.
export function setCustomLift(d:CustomDesign,id:string,lift:LiftSpec|null):CustomDesign{
 if(!d.cannons.some(c=>c.id===id))fail('Choose a cannon first.');
 return decodeDesign({...d,cannons:d.cannons.map(c=>{
  if(c.id!==id)return c;
  const {lift:previous,...ordinary}=c;
  if(!lift)return ordinary;
  return {...ordinary,lift,position:{x:c.position.x,y:clamp(Math.round(c.position.y),lift.minY,lift.maxY)}};
 })});
}
export function deleteObject(d:CustomDesign,id:string):CustomDesign{
 const cannons=d.cannons.filter(c=>c.id!==id);
 return decodeDesign({...d,cannons,startId:d.startId===id?cannons[0]?.id??null:d.startId,exit:id==='exit'?null:d.exit,obstacles:d.obstacles.filter(o=>o.id!==id),gems:d.gems.filter(g=>g.id!==id)});
}
export interface CustomStorage{getItem(k:string):string|null;setItem(k:string,v:string):void}
export const CUSTOM_LIBRARY_KEY='cannon-graphs:custom-library:v1';
export const MAX_CUSTOM_LEVELS=100;
export interface CustomEntry{
 readonly id:string;readonly revision:number;readonly design:CustomDesign;
 readonly source:'created'|'imported';readonly tested:boolean;readonly confirmed:boolean;
 readonly records:ModeRecords;readonly notice:string;
}
export interface CustomRun {
 readonly id:string;readonly revision:number;readonly key:string;readonly level:Level;
 readonly kind:'test'|'play';readonly mode:LearningMode;
}
function playable(d:CustomDesign){try{buildCustomLevel(d);return true;}catch{return false;}}
function decodeRecords(value:unknown,d:CustomDesign):ModeRecords{
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 const row=value as Record<string,unknown>,out:Partial<Record<LearningMode,LevelRecord>>={};
 for(const {id:mode} of learningModes){
  const r=row[mode];if(!r||typeof r!=='object'||Array.isArray(r))continue;
  const {bestAttempts,gems}=r as Record<string,unknown>;
  if(typeof bestAttempts!=='number'||!Number.isSafeInteger(bestAttempts)||bestAttempts<1||mode!=='cadet'&&bestAttempts>(mode==='ace'?3:5))continue;
  const ids=new Set(Array.isArray(gems)?gems:[]);
  out[mode]={bestAttempts,gems:d.gems.filter(g=>ids.has(g.id)).map(g=>g.id)};
 }
 return out;
}
function copyEntry(e:CustomEntry):CustomEntry{
 return {...e,design:decodeDesign(e.design),records:decodeRecords(e.records,e.design)};
}
function decodeEntry(raw:unknown):CustomEntry{
 const e=object(raw),d=decodeDesign(e.design);
 if(typeof e.id!=='string'||!/^level-[1-9][0-9]{0,11}$/.test(e.id)||typeof e.revision!=='number'||!Number.isSafeInteger(e.revision)||e.revision<1)fail('Invalid saved level identity.');
 const valid=playable(d),key=designKey(d),tested=valid&&e.testedKey===key,confirmed=tested&&e.confirmedKey===key;
 return {id:e.id,revision:e.revision,design:d,source:e.source==='imported'?'imported':'created',tested,confirmed,
  records:valid&&e.recordKey===key?decodeRecords(e.records,d):{},notice:''};
}
// A successful run must match the selected design, revision, mode and
// completed arrival state. The library never changes official progress.
function completedRun(run:CustomRun,state:LevelState,played:Level){
 const l=playedLayout(run.level,played),r=state.lastResult;
 if(!l||!r)return false;
 const start=l.cannons.find(c=>c.id===l.startId)!;
 // Every reached leg must originate at the actual, legal runtime anchor.
 // Transfers must join the following leg at its marked point.
 if(!routeMatchesLayout(l,r))return false;
 return state.phase==='success'&&!!r&&r.event.kind==='exit'&&!state.active&&!state.celebration&&state.waiting===0&&
  state.total===total&&state.unlimited===unlimited&&Number.isSafeInteger(state.failed)&&state.failed>=0&&
  Number.isSafeInteger(state.failed+1)&&state.saved===(unlimited?total:total-state.failed)&&state.saved>0&&r.cannonId===start.id&&
  Math.hypot(r.start.x-start.position.x,r.start.y-start.position.y)<=1e-7&&
  Math.hypot(r.end.x-l.exit.x,r.end.y-l.exit.y)<=1e-7;
}
export function createCustomWorkshopStore(storage?:CustomStorage){
 let entries:CustomEntry[]=[],activeId:string|null=null,nextId=1,persisted=false,notice='';
 function save(){
  try{
   if(!storage){persisted=false;return;}
   storage.setItem(CUSTOM_LIBRARY_KEY,JSON.stringify({version:1,activeId,nextId,entries:entries.map(e=>{
    const key=designKey(e.design);
    return {id:e.id,revision:e.revision,design:e.design,source:e.source,testedKey:e.tested?key:null,confirmedKey:e.confirmed?key:null,recordKey:key,records:e.records};
   })}));persisted=true;
  }catch{persisted=false;}
 }
 function add(d:CustomDesign,source:CustomEntry['source']='created',proof?:{tested:boolean;confirmed:boolean}){
  if(entries.length>=MAX_CUSTOM_LEVELS)fail('Library is full (100 levels). Download or delete a level before adding another.');
  if(nextId>999999999999)fail('No more level IDs available.');
  const e:CustomEntry={id:'level-'+nextId++,revision:1,design:decodeDesign(d),source,tested:proof?.tested??false,confirmed:proof?.confirmed??false,records:{},notice:''};
  entries=[e,...entries];activeId=e.id;save();return e.id;
 }
 try{
  const raw=storage?.getItem(CUSTOM_LIBRARY_KEY);
  if(raw){
   const saved=object(JSON.parse(raw));if(saved.version!==1||!Array.isArray(saved.entries)||saved.entries.length>MAX_CUSTOM_LEVELS)fail('Unsupported saved library.');
   const ids=new Set<string>();
   for(const item of saved.entries){
    try{const e=decodeEntry(item);if(ids.has(e.id))fail('Duplicate level ID.');ids.add(e.id);entries.push(e);}catch{notice='Some invalid saved entries could not be restored.';}
   }
   const minimum=Math.max(0,...entries.map(e=>Number(e.id.slice(6))))+1;
   nextId=typeof saved.nextId==='number'&&Number.isSafeInteger(saved.nextId)&&saved.nextId>=minimum&&saved.nextId<=1000000000000?saved.nextId:minimum;
   activeId=entries.some(e=>e.id===saved.activeId)?saved.activeId as string:entries[0]?.id??null;
   persisted=!!storage;
  }else{
   persisted=!!storage;
   const legacy=storage?.getItem(CUSTOM_KEY);
   if(legacy){
    const old=object(JSON.parse(legacy));if(old.version!==1)fail('Unsupported saved workshop draft.');
    const d=decodeDesign(old.design),key=designKey(d),tested=old.tested===key&&playable(d);
    add(d,'created',{tested,confirmed:tested&&old.confirmed===key});
    notice='Your previous workshop draft has been added to the library.';
   }
  }
 }catch{entries=[];activeId=null;nextId=1;persisted=false;notice='Saved library could not be read. You can start a new design or import a file.';}
 const find=(id:string|null)=>entries.find(e=>e.id===id);
 const active=()=>find(activeId);
 function requireEntry(id:string|null=activeId){return find(id)??fail('Choose a saved level.');}
 function ensureActive(){return active()?.id??add(emptyDesign());}
 function update(id:string,e:CustomEntry){entries=entries.map(old=>old.id===id?e:old);save();}
 function matching(run:CustomRun,kind:CustomRun['kind']){
  const e=find(run.id);
  if(!e||run.kind!==kind||run.revision!==e.revision||run.key!==designKey(e.design)||!isLearningMode(run.mode)||kind==='test'&&run.mode!=='cadet')return;
  // Rebuild the canonical level rather than trusting a supplied snapshot.
  return {entry:e,run:{...run,level:buildCustomLevel(e.design)}};
 }
 function begin(id:string,kind:CustomRun['kind'],mode:LearningMode):CustomRun{
  const e=requireEntry(id);if(!isLearningMode(mode))fail('Choose a learning mode.');
  return {id:e.id,revision:e.revision,key:designKey(e.design),level:buildCustomLevel(e.design),kind,mode};
 }
 return {
  read:()=>{const e=active();return {id:e?.id??null,design:decodeDesign(e?.design??emptyDesign()),tested:e?.tested??false,confirmed:e?.confirmed??false,persisted,notice:e?.notice||notice};},
  library:()=>({entries:entries.map(copyEntry),activeId,persisted,notice}),
  ensureActive,
  select:(id:string)=>{requireEntry(id);if(id!==activeId){activeId=id;save();}return id;},
  edit:(value:CustomDesign)=>{
   const d=decodeDesign(value),e=active();
   if(!e){add(d);return true;}
   if(designKey(d)===designKey(e.design))return false;
   update(e.id,{...e,design:d,revision:e.revision+1,tested:false,confirmed:false,records:{},notice:''});return true;
  },
  newDraft:()=>add(emptyDesign()),
  importFile:(raw:string)=>add(decodeCustomFile(raw),'imported'),
  duplicate:(id:string)=>{const e=requireEntry(id);return add({...e.design,title:e.design.title.slice(0,73)+' (copy)'});},
  remove:(id:string)=>{requireEntry(id);entries=entries.filter(e=>e.id!==id);if(activeId===id)activeId=entries[0]?.id??null;save();},
  beginTest:()=>begin(requireEntry().id,'test','cadet'),
  beginPlay:(id:string,mode:LearningMode)=>begin(id,'play',mode),
  completeTest:(run:CustomRun,state:LevelState,played:Level=run.level)=>{
   const match=matching(run,'test');if(!match||!completedRun(match.run,state,played))return false;
   const e=match.entry;
   update(e.id,{...e,tested:true,notice:routeLegs(state.lastResult!).length<e.design.cannons.length?'Test passed, but some cannons were bypassed. Check whether that is intentional.':'Test passed! Confirm this design to enable download.'});return true;
  },
  completePlay:(run:CustomRun,state:LevelState,played:Level=run.level):{record:LevelRecord;improved:boolean}|undefined=>{
   const match=matching(run,'play');if(!match||!completedRun(match.run,state,played))return;
   const e=match.entry,previous=e.records[run.mode],ids=new Set([...(previous?.gems??[]),...bankedGems(state.lastResult)]);
   const record:LevelRecord={bestAttempts:Math.min(previous?.bestAttempts??Infinity,state.failed+1),gems:e.design.gems.filter(g=>ids.has(g.id)).map(g=>g.id)};
   const improved=!previous||record.bestAttempts!==previous.bestAttempts||record.gems.length!==previous.gems.length;
   if(improved)update(e.id,{...e,records:{...e.records,[run.mode]:record}});
   return {record,improved};
  },
  confirm:()=>{const e=active();if(!e?.tested)return false;buildCustomLevel(e.design);update(e.id,{...e,confirmed:true});return true;},
  download:(id:string|null=activeId)=>{const e=requireEntry(id);if(!e.confirmed)fail('Complete a test flight and confirm before downloading.');buildCustomLevel(e.design);return encodeCustomFile(e.design);}
 };
}
export type CustomWorkshopStore=ReturnType<typeof createCustomWorkshopStore>;
export function browserCustomWorkshopStore(){try{return createCustomWorkshopStore(window.localStorage);}catch{return createCustomWorkshopStore();}}
