import {worlds} from '../levels/catalog';
import {cannonTypes} from '../game/cannons';
import {learningModes,modeBudgetLabel,type LearningMode} from '../game/learningModes';
import {recordStars} from '../game/progress';
import {buildCustomLevel,workshopTerrain,CUSTOM_FILE_LIMIT,MAX_CUSTOM_LEVELS,type CustomWorkshopStore,type CustomEntry,type CustomRun} from '../game/customLevels';
import {coordinateSystem} from '../engine/coordinates';
import {svgNode as el} from '../rendering/pip';
import {downloadCustomFile} from './customFile';
interface Options{
 onHome:()=>void;onEdit:(id:string)=>void;onPlay:(run:CustomRun)=>void;
 preferredId?:string;preferredMode?:LearningMode;
}
function node<K extends keyof HTMLElementTagNameMap>(tag:K,parent:Element,cls='',value?:string):HTMLElementTagNameMap[K]{
 const e=document.createElement(tag);e.className=cls;if(value!==undefined)e.textContent=value;parent.append(e);return e;
}
function button(parent:Element,cls:string,label:string,click:()=>void){const b=node('button',parent,cls,label);b.type='button';b.addEventListener('click',click);return b;}
const status=(e:CustomEntry)=>e.confirmed?'Confirmed':e.tested?'Test passed':'Draft';
const palettes=['#e3f1df','#e1ecfa','#e9e5f3','#f2e9d2','#e7e9e7','#e1e7f4','#efe4c5'];
// Small actual geometry previews; never compute or display a solution.
function thumbnail(parent:Element,e:CustomEntry){
 const d=e.design,svg=el('svg',{viewBox:'0 0 180 86','aria-hidden':'true',class:'custom-thumbnail'},parent);
 const t=coordinateSystem(d.bounds,{width:180,height:86,padding:7}),p=t.toScreen,s=t.scale,b=d.bounds,a=p({x:b.minX,y:b.maxY}),z=p({x:b.maxX,y:b.minY});
 el('rect',{x:a.x,y:a.y,width:z.x-a.x,height:z.y-a.y,fill:palettes[d.world-1],stroke:'#8ca4af','stroke-width':.6},svg);
 for(let x=Math.ceil(b.minX);x<=b.maxX;x++){const q=p({x,y:0});el('line',{x1:q.x,y1:a.y,x2:q.x,y2:z.y,stroke:'#90a7af','stroke-width':.35,opacity:.65},svg);}
 for(let y=Math.ceil(b.minY);y<=b.maxY;y++){const q=p({x:0,y});el('line',{x1:a.x,y1:q.y,x2:z.x,y2:q.y,stroke:'#90a7af','stroke-width':.35,opacity:.65},svg);}
 for(const o of workshopTerrain(d)){const q=p({x:o.bounds.minX,y:o.bounds.maxY});el('rect',{x:q.x,y:q.y,width:(o.bounds.maxX-o.bounds.minX)*s,height:(o.bounds.maxY-o.bounds.minY)*s,fill:'#a28e72',stroke:'#776b5d','stroke-width':.5},svg);}
 for(const c of d.cannons){if(!c.lift)continue;const x=c.position.x-c.direction*.5,a=p({x,y:c.lift.maxY}),z=p({x,y:c.lift.minY-.47});el('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#a87826','stroke-width':1.8,'stroke-dasharray':'2 1','data-library-lift-rail':c.id},svg);}
 for(const c of d.cannons){const q=p(c.position),g=el('g',{transform:'translate('+q.x+' '+q.y+')'},svg);
  el('rect',{x:c.direction===1?-9:0,y:-3,width:9,height:6,rx:1.5,fill:cannonTypes[c.type].color,stroke:'#254763','stroke-width':.6},g);
  el('circle',{r:2,fill:'#fff',stroke:'#254763','stroke-width':.7},g);
  const label=el('text',{x:0,y:-5,'text-anchor':'middle','font-size':6,fill:'#234d78','font-weight':800},g);label.textContent=c.id+(c.lift?' ↑↓':'');
 }
 if(d.exit){const q=p(d.exit);el('rect',{x:q.x-4,y:q.y-4,width:8,height:8,rx:2,fill:'#efbd56',stroke:'#8b5a12','stroke-width':.8},svg);el('circle',{cx:q.x,cy:q.y,r:1.2,fill:'white'},svg);}
 for(const gem of d.gems){const q=p(gem.position);el('path',{d:'M'+q.x+' '+(q.y-2.4)+' l2.4 2.4 -2.4 2.4 -2.4 -2.4Z',fill:'#45c6bc',stroke:'#175e64','stroke-width':.45},svg);}
}
export function mountCustomLibrary(root:HTMLElement,store:CustomWorkshopStore,options:Options){
 root.innerHTML='<main class="custom-library" aria-label="Custom Level Library"><header class="custom-top"><div class="brand"><button id="library-home" class="brand-mark home-return" type="button" aria-label="Return home" title="Return home"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 11 12 3l9 8M5.5 10v10h5v-6h3v6h5V10" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div><h1>Custom Levels</h1><p>Build your own challenges or play shared levels.</p></div></div><div class="custom-file-actions"><button id="library-new" type="button">＋ New level</button><button id="library-upload" type="button">Upload levels</button><input id="library-file" type="file" accept=".json,application/json" multiple hidden></div></header><div class="library-toolbar"><label>Find a level <input id="library-search" type="search" placeholder="Search by name or graph family"></label><label>Show <select id="library-filter"><option value="all">All levels</option><option value="confirmed">Confirmed</option><option value="draft">Drafts and tested</option><option value="imported">Imported</option></select></label><output id="library-count"></output></div><div class="library-shell"><section id="library-list" aria-label="Saved levels"></section><aside id="library-detail" aria-label="Selected level"></aside></div><footer class="library-footer"><p id="library-message" role="status"></p><small id="library-storage"></small></footer></main>';
 const get=<T extends HTMLElement=HTMLElement>(id:string)=>root.querySelector<T>('#'+id)!;
 const list=get('library-list'),detail=get('library-detail'),search=get<HTMLInputElement>('library-search'),filter=get<HTMLSelectElement>('library-filter'),file=get<HTMLInputElement>('library-file');
 let snapshot=store.library(),selected=options.preferredId??snapshot.activeId??'',mode=options.preferredMode??'pilot',disposed=false,message=snapshot.notice;
 const refreshSnapshot=()=>{snapshot=store.library();if(!snapshot.entries.some(e=>e.id===selected))selected=snapshot.entries[0]?.id??'';};
 function statusLine(){
  get('library-message').textContent=message;
  get('library-storage').textContent=snapshot.persisted?'Saved on this browser · '+snapshot.entries.length+'/'+MAX_CUSTOM_LEVELS+' levels · Download confirmed levels to share or back up.':'Session only — browser saving is unavailable. Download confirmed levels before closing this page.';
  get<HTMLButtonElement>('library-new').disabled=snapshot.entries.length>=MAX_CUSTOM_LEVELS;
  get<HTMLButtonElement>('library-upload').disabled=snapshot.entries.length>=MAX_CUSTOM_LEVELS;
 }
 function attempt(fn:()=>void){try{fn();refresh();}catch(e){message=e instanceof Error?e.message:'Unable to update the library.';refresh();}}
 function openNew(){attempt(()=>{const id=store.newDraft();options.onEdit(id);});}
 get('library-home').addEventListener('click',options.onHome);get('library-new').addEventListener('click',openNew);get('library-upload').addEventListener('click',()=>file.click());
 file.addEventListener('change',async()=>{
  const chosen=Array.from(file.files??[]);file.value='';if(!chosen.length)return;
  let added=0;const errors:string[]=[];
  for(const f of chosen){
   if(disposed)return;
   try{if(f.size>CUSTOM_FILE_LIMIT)throw Error('File exceeds 64 KB.');const raw=await f.text();if(disposed)return;selected=store.importFile(raw);added++;}
   catch(e){errors.push(f.name+': '+(e instanceof Error?e.message:'Unreadable file.'));}
  }
  if(disposed)return;
  if(added){search.value='';filter.value='all';}
  message=(added?added+' level'+(added===1?'':'s')+' added. Imported levels are playable but not locally confirmed. ':'')+errors.join(' · ');
  refresh();
 });
 function renderList(){
  list.replaceChildren();const q=search.value.trim().toLowerCase(),f=filter.value;
  const visible=snapshot.entries.filter(e=>(f==='all'||f==='confirmed'&&e.confirmed||f==='draft'&&!e.confirmed||f==='imported'&&e.source==='imported')&&(!q||[e.design.title,worlds[e.design.world-1].name,...e.design.cannons.map(c=>cannonTypes[c.type].label+(c.lift?' movable lift broken cannon':''))].join(' ').toLowerCase().includes(q)));
  if(!visible.some(e=>e.id===selected))selected=visible[0]?.id??'';
  get('library-count').textContent=visible.length+' / '+snapshot.entries.length+' levels';
  if(!visible.length){const empty=node('div',list,'library-empty');node('h2',empty,'',snapshot.entries.length?'No matching levels':'Your library is empty');node('p',empty,'',snapshot.entries.length?'Try a different search or filter.':'Create a level in the workshop, or upload a shared .cannon.json file.');return;}
  for(const e of visible){
   const b=button(list,'library-card','',()=>{selected=e.id;for(const card of Array.from(list.querySelectorAll<HTMLButtonElement>('.library-card')))card.setAttribute('aria-pressed',String(card.dataset.levelId===selected));renderDetail();});
   b.dataset.levelId=e.id;b.setAttribute('aria-pressed',String(selected===e.id));b.setAttribute('aria-label',e.design.title+', '+status(e)+', '+e.design.cannons.length+' cannons');
   thumbnail(b,e);const copy=node('span',b,'library-card-copy');node('strong',copy,'',e.design.title);
   const meta=node('span',copy,'library-card-meta');node('span',meta,'library-state',status(e)).dataset.status=e.confirmed?'confirmed':e.tested?'tested':'draft';
   node('span',meta,'',e.design.cannons.length+' cannon'+(e.design.cannons.length===1?'':'s'));node('span',meta,'',e.source==='imported'?'Imported':'Created');const lifts=e.design.cannons.filter(c=>c.lift).length;if(lifts)node('span',meta,'',lifts+' lift'+(lifts===1?'':'s'));
  }
 }
 function renderDetail(){
  detail.replaceChildren();const e=snapshot.entries.find(e=>e.id===selected);
  if(!e){node('p',detail,'library-empty','Select a saved level to play or edit.');return;}
  const d=e.design;node('h2',detail,'',d.title);node('p',detail,'library-subtitle',worlds[d.world-1].name+' · '+d.cannons.length+' cannon'+(d.cannons.length===1?'':'s')+' · '+d.gems.length+' gems');
  node('span',detail,'library-state',status(e)+(e.source==='imported'?' · Imported':'')).dataset.status=e.confirmed?'confirmed':e.tested?'tested':'draft';
  const chips=node('div',detail,'library-families');const liftCount=d.cannons.filter(c=>c.lift).length;if(liftCount){const chip=node('span',chips,'library-family',liftCount+' movable '+(liftCount===1?'platform':'platforms'));chip.style.borderLeftColor='#a87826';}
  for(const type of new Set(d.cannons.map(c=>c.type))){const chip=node('span',chips,'library-family',cannonTypes[type].label);chip.style.borderLeftColor=cannonTypes[type].color;}
  node('p',detail,'library-objective',d.objective);
  let invalid='';try{buildCustomLevel(d);}catch(err){invalid=err instanceof Error?err.message:'Design is incomplete.';}
  node('p',detail,'library-note',invalid||(!e.confirmed?'Playable draft. Complete a designer playtest in the workshop to confirm and download.':'Designer playtest passed; ready to share.'));
  node('h3',detail,'','Choose a learning mode');
  const modes=node('div',detail,'library-modes');modes.setAttribute('role','group');modes.setAttribute('aria-label','Learning modes');
  const buttons=new Map<LearningMode,HTMLButtonElement>();
  const paint=()=>{for(const [id,b] of buttons)b.setAttribute('aria-pressed',String(id===mode));};
  for(const m of learningModes){
   const b=button(modes,'library-mode','',()=>{mode=m.id;paint();});b.dataset.mode=m.id;buttons.set(m.id,b);
   node('strong',b,'',m.name+' · '+modeBudgetLabel(m.id));
   const record=e.records[m.id],rating=recordStars(record,{creatures:5},m.id);
   node('small',b,'',record?(rating===null?'✓ Practice complete':'★'.repeat(rating)+'☆'.repeat(3-rating))+' · '+record.bestAttempts+' attempt'+(record.bestAttempts===1?'':'s')+' · '+record.gems.length+'/'+d.gems.length+' gems':'Not completed');
   b.title=m.description;
  }
  paint();
  const play=button(detail,'library-play','▶ Play level',()=>attempt(()=>options.onPlay(store.beginPlay(e.id,mode))));play.id='library-play';play.disabled=!!invalid;
  const actions=node('div',detail,'library-actions');
  button(actions,'custom-secondary','Edit design',()=>options.onEdit(e.id)).id='library-edit';
  const duplicate=button(actions,'custom-secondary','Duplicate',()=>attempt(()=>{selected=store.duplicate(e.id);search.value='';filter.value='all';message='New editable copy created. Its test and play records start fresh.';}));duplicate.id='library-duplicate';duplicate.disabled=snapshot.entries.length>=MAX_CUSTOM_LEVELS;
  const download=button(actions,'custom-secondary','Download',()=>attempt(()=>downloadCustomFile(d.title,store.download(e.id))));download.id='library-download';download.disabled=!e.confirmed;
  button(actions,'custom-danger','Delete',()=>{if(window.confirm('Delete "'+d.title+'"? This removes its saved design and local play records.'))attempt(()=>{store.remove(e.id);message='Level deleted.';});}).id='library-delete';
 }
 function refresh(){if(disposed)return;refreshSnapshot();renderList();renderDetail();statusLine();}
 search.addEventListener('input',()=>{renderList();renderDetail();});filter.addEventListener('change',()=>{renderList();renderDetail();});
 refresh();return ()=>{disposed=true;};
}
