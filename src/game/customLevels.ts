import {cannonTypes,type CannonType} from './cannons';
import type {Bounds,Point} from '../engine/coordinates';
import {PIP_RADIUS,pointRectangleDistance} from '../engine/collisions/clearance';
import {validateLevel,type Level,type Cannon,type Obstacle,type Gem} from '../levels/schema';
import {floor} from '../levels/terrain';
import {levelSupports} from '../levels/supports';
import {waitingCrewSlots} from '../animations/waitingCrew';
import type {LevelState} from './levelState';
import {routeLegs} from '../engine/simulation/linearRoute';
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
// drafts can supply equations, certificates, support overrides or HTML.
export function decodeDesign(value:unknown):CustomDesign{
 const o=object(value),b=bounds(o.bounds),w=o.world;
 if(!Object.values(b).every(Number.isInteger)||b.maxX-b.minX<6||b.maxX-b.minX>40||b.maxY-b.minY<5||b.maxY-b.minY>24)fail('Use integer grid limits: width 6–40, height 5–24 units.');
 if(typeof w!=='number'||!Number.isInteger(w)||w<1||w>6)fail('Choose one of the six world themes.');
 const ids=new Set<string>(['exit','base-floor']);
 const cannons=list(o.cannons,MAX_CANNONS,'cannons').map(v=>{
  const c=object(v),type=c.type,direction=c.direction;
  if(typeof type!=='string'||!Object.hasOwn(cannonTypes,type)||direction!==1&&direction!==-1)fail('Unknown cannon type or direction.');
  return {id:id(c.id,/^[A-H]$/,ids),type:type as CannonType,direction:direction as 1|-1,position:point(c.position,b)};
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
 return JSON.stringify({format:'cannon-graphs-level',version:1,design:decodeDesign(d)},null,2)+'\n';
}
export function decodeCustomFile(raw:string):CustomDesign{
 if(raw.length>CUSTOM_FILE_LIMIT)fail('Level file is too large (maximum 64 KB).');
 let v:unknown;try{v=JSON.parse(raw);}catch{fail('This is not a valid JSON level file.');}
 const o=object(v);if(o.format!=='cannon-graphs-level'||o.version!==1)fail('This is not a supported Cannon Graphs level file.');
 // Only complete, structurally playable levels can be shared. Importing
 // never imports an authorisation, solved equation, or confirmation flag.
 const d=decodeDesign(o.design);buildCustomLevel(d);return d;
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
 return decodeDesign({...d,exit:id==='exit'?p:d.exit,cannons:d.cannons.map(c=>c.id===id?{...c,position:p}:c),gems:d.gems.map(g=>g.id===id?{...g,position:p}:g)});
}
export function deleteObject(d:CustomDesign,id:string):CustomDesign{
 const cannons=d.cannons.filter(c=>c.id!==id);
 return decodeDesign({...d,cannons,startId:d.startId===id?cannons[0]?.id??null:d.startId,exit:id==='exit'?null:d.exit,obstacles:d.obstacles.filter(o=>o.id!==id),gems:d.gems.filter(g=>g.id!==id)});
}
export interface CustomStorage{getItem(k:string):string|null;setItem(k:string,v:string):void}
export function createCustomWorkshopStore(storage?:CustomStorage){
 let draft=emptyDesign(),tested=false,confirmed=false,persisted=false,notice='';
 try{const raw=storage?.getItem(CUSTOM_KEY);if(raw){const saved=object(JSON.parse(raw));if(saved.version!==1)fail('Unsupported saved draft.');draft=decodeDesign(saved.design);const key=designKey(draft);if(saved.tested===key){buildCustomLevel(draft);tested=true;confirmed=saved.confirmed===key;}}persisted=!!storage;}catch{draft=emptyDesign();tested=false;confirmed=false;notice='Saved draft could not be read. A new draft is ready.';}
 function save(){try{if(!storage){persisted=false;return;}const key=designKey(draft);storage.setItem(CUSTOM_KEY,JSON.stringify({version:1,design:draft,tested:tested?key:null,confirmed:confirmed?key:null}));persisted=true;}catch{persisted=false;}}
 function replace(value:CustomDesign,force=false){const next=decodeDesign(value);if(!force&&designKey(next)===designKey(draft))return false;draft=next;tested=false;confirmed=false;notice='';save();return true;}
 return {
  read:()=>({design:decodeDesign(draft),tested,confirmed,persisted,notice}),
  edit:(value:CustomDesign)=>replace(value),
  newDraft:()=>replace(emptyDesign(),true),
  importFile:(raw:string)=>replace(decodeCustomFile(raw),true),
  beginTest:()=>({level:buildCustomLevel(draft),key:designKey(draft)}),
  completeTest:(key:string,state:LevelState)=>{
   if(key!==designKey(draft)||state.phase!=='success'||state.lastResult?.event.kind!=='exit'||state.saved!==state.total||state.waiting!==0||state.total!==5||state.celebration||state.active)return false;
   const level=buildCustomLevel(draft),r=state.lastResult,start=level.cannons.find(c=>c.id===level.startId)!;
   if(r.cannonId!==start.id||Math.hypot(r.start.x-start.position.x,r.start.y-start.position.y)>1e-7||Math.hypot(r.end.x-level.exit.x,r.end.y-level.exit.y)>1e-7)return false;
   tested=true;notice=routeLegs(r).length<level.cannons.length?'Test passed, but some cannons were bypassed. Check whether that is intentional.':'Test passed! Confirm this design to enable download.';save();return true;
  },
  confirm:()=>{if(!tested)return false;buildCustomLevel(draft);confirmed=true;save();return true;},
  download:()=>{if(!confirmed)fail('Complete a test flight and confirm before downloading.');buildCustomLevel(draft);return encodeCustomFile(draft);}
 };
}
export type CustomWorkshopStore=ReturnType<typeof createCustomWorkshopStore>;
export function browserCustomWorkshopStore(){try{return createCustomWorkshopStore(window.localStorage);}catch{return createCustomWorkshopStore();}}
