import './style.css';
import {firstFlightTutorial} from './levels/firstFlightTutorial';
import {browserTutorialStore,type TutorialIntro} from './game/firstFlightTutorial';
import {mountFirstFlightTutorial} from './ui/firstFlightTutorial';
import {worldForLevel,levelPosition,nextLevel,worlds} from './levels/catalog';
import {browserCustomWorkshopStore,type CustomRun} from './game/customLevels';
import {mountCustomWorkshop} from './ui/customWorkshop';
import {mountCustomLibrary} from './ui/customLibrary';
import {mountScene} from './rendering/scene';
import {mountCannonParameterEditor,type EditorMemory} from './ui/cannonParameterEditor';
import {popupPosition} from './ui/popupPosition';
import {cannonTypes} from './game/cannons';
import {mountPipQueue} from './ui/pipQueue';
import {simulateRoute} from './engine/simulation/linearRoute';
import {createLevelFlightPlan,getPlanEntry,editPlan,countReady,snapshotPlan,recordFlightEvidence,clearEvidence} from './game/flightPlan';
import type {Level} from './levels/schema';
import {liftDemos} from './levels/liftDemos';
import {foundryLinear} from './levels/foundryLinear';
import {foundryLevels,initialFoundryPlan,nextFoundryLevel} from './levels/foundry';
import {moveLiftInPlanning} from './game/movableCannons';
import {modeAttemptFeedback} from './game/modeFeedback';
import {modePolicy,modeBudget,modeObjective,type LearningMode} from './game/learningModes';
import {graphPreview} from './engine/trajectories/graphPreview';
import {createFeedbackHistory,recordAttemptFeedback} from './game/flightDiagnosis';
import {mountFlightHint} from './ui/flightHint';
import {createLevelState,canPlan,canLaunch,beginAttempt,finishAttempt,restartLevel,isTerminal,advanceCelebration,finishCelebration} from './game/levelState';
import {levelStars} from './game/scoring';
import {bankedGems} from './animations/gemTimeline';
import {mountHomeScreen} from './ui/homeScreen';
import {mountLevelSelection} from './ui/levelSelection';
import {browserProgressStore,type ProgressUpdate} from './game/progressStore';
import {mountFlightLog} from './ui/flightLog';
import {getRecord,recordStars} from './game/progress';
import {earnedAchievementIds} from './game/achievements';
import {browserPipLookStore} from './game/pipLookStore';
import {cosmeticsForAchievement} from './game/pipCosmetics';
import {mountCreatureWorkshop} from './ui/creatureWorkshop';
import {browserCannonLookStore} from './game/cannonLookStore';
import {cannonRewardsForAchievement} from './game/cannonCosmetics';
import {mountCannonWorkshop} from './ui/cannonWorkshop';
import {browserAudioPlayback} from './audio/webAudio';
import {createAudioSettingsDialog} from './ui/audioSettings';
import type {MusicTheme} from './audio/music';
const app=document.querySelector<HTMLDivElement>('#app')!,progressStore=browserProgressStore(),lookStore=browserPipLookStore(),cannonStore=browserCannonLookStore();
const audio=browserAudioPlayback(),audioDialog=createAudioSettingsDialog(audio),tutorialStore=browserTutorialStore(),customStore=browserCustomWorkshopStore();
let cleanup:()=>void=()=>{};
function bindAudioButton(){const b=app.querySelector<HTMLButtonElement>('#sound-settings');return b?audioDialog.bind(b):()=>{};}
function addMenuAudio(){const top=app.querySelector<HTMLElement>('.selection-top'),end=top?.querySelector('.selection-top-end');if(!top||!end)return;const b=document.createElement('button');b.type='button';b.id='sound-settings';b.className='sound-settings workshop-sound-settings';b.textContent='♪ Off';end.replaceWith(b);top.classList.add('has-audio');addAudioCleanup();}
function addAudioCleanup(){const prior=cleanup,unbind=bindAudioButton();cleanup=()=>{unbind();prior();};}
let lastLevel:Level|undefined,lastMode:LearningMode='pilot';
// Full animation is the default on every device. A deliberate reduced-motion
// choice is retained during this page session, independently of OS settings.
let reducedOverride=false;
function showHome(focusPlay=false){
 cleanup();audio.setTheme('menu');const progress=progressStore.read();cleanup=mountHomeScreen(app,()=>showSelection(),focusPlay,{progress,persisted:progressStore.persisted(),onOpen:showFlightLog,look:lookStore.read(earnedAchievementIds(progress)),onWorkshop:showWorkshop,cannonLook:cannonStore.read(earnedAchievementIds(progress)),onCannonWorkshop:showCannonWorkshop,onLevelWorkshop:showCustomWorkshop,onCustomLibrary:()=>showCustomLibrary(),onLiftDemos:showLiftDemos,reducedMotion:reducedOverride});addAudioCleanup();
}
function showLiftDemos(){
 cleanup();audio.setTheme('menu');
 app.innerHTML='<main class="lift-demo-menu"><header><button type="button" id="lift-demo-back">← Home</button><h1>Broken Foundry</h1></header><p>Vertical translations · separate practice, no curriculum records.</p><h2>Flight tests</h2><div class="lift-demo-choices"></div><h2>Linear puzzles · 1–6</h2><div class="foundry-linear-choices lift-demo-choices"></div><h2>Quadratic and mixed puzzles · 7–12</h2><div class="foundry-quadratic-choices lift-demo-choices"></div></main>';
 const choices=app.querySelector<HTMLElement>('.lift-demo-choices')!;
 for(const demo of [...liftDemos,...foundryLevels]){
  const card=document.createElement('section');const title=document.createElement('h2');const index=foundryLevels.findIndex(l=>l.id===demo.id);title.textContent=index<0?demo.title:(index+1)+'. '+demo.title;card.dataset.foundryLevel=demo.id;card.append(title);
  const description=document.createElement('p');description.textContent=demo.objective;card.append(description);
  for(const mode of ['cadet','pilot','ace'] as const){const button=document.createElement('button');button.type='button';button.textContent=modePolicy(mode).name;button.addEventListener('click',()=>mountLevel(demo,mode,undefined,undefined,true));card.append(button);}
  (index<0?choices:app.querySelector<HTMLElement>(index<foundryLinear.length?'.foundry-linear-choices':'.foundry-quadratic-choices')!).append(card);
 }
 app.querySelector<HTMLButtonElement>('#lift-demo-back')!.onclick=()=>showHome(true);
 cleanup=()=>{};
}
function showWorkshop(){cleanup();audio.setTheme('menu');cleanup=mountCreatureWorkshop(app,earnedAchievementIds(progressStore.read()),lookStore,()=>{showHome();app.querySelector<HTMLButtonElement>('#home-workshop')?.focus();});addMenuAudio();}
function showCannonWorkshop(){cleanup();audio.setTheme('menu');cleanup=mountCannonWorkshop(app,earnedAchievementIds(progressStore.read()),cannonStore,()=>{showHome();app.querySelector<HTMLButtonElement>('#home-cannon-workshop')?.focus();},()=>audio.play('fire'),()=>reducedOverride);addAudioCleanup();}
function showCustomWorkshop(){customStore.ensureActive();cleanup();audio.setTheme('menu');cleanup=mountCustomWorkshop(app,customStore,()=>showHome(true),test=>{mountLevel(test.level,'cadet',undefined,test);app.querySelector<HTMLButtonElement>('#level-menu')?.focus();},()=>showCustomLibrary(customStore.read().id??undefined));}
function showCustomLibrary(preferredId?:string,preferredMode?:LearningMode){
 cleanup();audio.setTheme('menu');cleanup=mountCustomLibrary(app,customStore,{preferredId,preferredMode,onHome:()=>showHome(true),onEdit:id=>{customStore.select(id);showCustomWorkshop();},onPlay:run=>{mountLevel(run.level,run.mode,undefined,run);app.querySelector<HTMLButtonElement>('#level-menu')?.focus();}});
}
function showFlightLog(){cleanup();audio.setTheme('menu');const progress=progressStore.read();cleanup=mountFlightLog(app,progress,progressStore.persisted(),()=>showHome(true));addMenuAudio();}
function showSelection(openCurrentWorld=false){
 cleanup();audio.setTheme('menu');cleanup=mountLevelSelection(app,{bindAudio:audioDialog.bind,progress:progressStore.read(),preferredId:lastLevel?.id,preferredMode:lastMode,openCurrentWorld,onHome:()=>showHome(true),onPlay:(level,mode)=>startLevel(level,mode)});
}
type TutorialReturn={level:Level;mode:LearningMode};
function startLevel(level:Level,mode:LearningMode,forceTutorial=false){
 const intro=level.id==='1-01',progress=intro?progressStore.read():undefined;
 const played=progress&&(['cadet','pilot','ace'] as const).some(m=>getRecord(progress,level.id,m));
 if(intro&&(forceTutorial||(!tutorialStore.seen()&&!played))){
  mountLevel(firstFlightTutorial,'cadet',{level,mode});app.querySelector<HTMLButtonElement>('#tutorial-continue')?.focus();
 }else{mountLevel(level,mode);app.querySelector<HTMLButtonElement>('#level-menu')?.focus();}
}
function mountLevel(level:Level,mode:LearningMode,tutorialReturn?:TutorialReturn,customRun?:CustomRun,liftDemo=false){
 const authoredLevel=level;
 cleanup();audio.setTheme(level.world as MusicTheme);if(!customRun&&!liftDemo){lastLevel=tutorialReturn?.level??level;lastMode=tutorialReturn?.mode??mode;}
 const policy=modePolicy(mode),budget=modeBudget(mode,level),look=lookStore.read(earnedAchievementIds(progressStore.read())),cannonLook=cannonStore.read(earnedAchievementIds(progressStore.read()));
app.innerHTML=`<main class="game-screen"><header><div class="brand"><button class="brand-mark home-return" id="home-return" type="button" aria-label="Return to home" title="Return to home (leaves this run)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 11 12 3l9 8M5.5 10v10h5v-6h3v6h5V10" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div><h1>Cannon Graphs!</h1><p id="world-label"></p><p id="level-objective" class="level-objective"></p></div></div><div id="pip-queue" class="pip-queue" role="group" aria-label="Pips ready"></div><button class="game-level-menu" id="level-menu" type="button" title="Choose levels (leaves this run)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="7" height="7" rx="1.4" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1.4" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="1.4" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="1.4" fill="currentColor"/></svg><span>Levels</span></button><button class="sound-settings game-sound-settings" id="sound-settings" type="button" aria-label="Sound settings">♪ Off</button></header><div class="toolbar"><div id="inspect-info" role="status">Click a cannon to program it. Hover or focus an object to inspect it.</div><button type="button" id="graph-preview" class="graph-preview-toggle" aria-pressed="false" hidden>Show graph</button><span id="gem-readout" class="gem-readout" role="status" hidden></span><button id="tutorial-help" class="motion-mode" type="button" hidden>Flight school</button><button id="motion-mode" class="motion-mode" type="button">Motion</button><div class="camera-tools" role="group" aria-label="View controls"><button id="pan-left" aria-label="Pan left" title="Pan left">←</button><button id="pan-up" aria-label="Pan up" title="Pan up">↑</button><button id="pan-down" aria-label="Pan down" title="Pan down">↓</button><button id="pan-right" aria-label="Pan right" title="Pan right">→</button><button id="zoom-out" aria-label="Zoom out" title="Zoom out">−</button><output id="zoom-readout">100%</output><button id="zoom-in" aria-label="Zoom in" title="Zoom in">+</button><button id="zoom-reset" aria-label="Reset view" title="Reset view">↺</button></div></div><section class="stage" aria-label="Game scene"><div id="level-resolution" class="level-resolution" role="region" aria-labelledby="resolution-heading" hidden><div class="resolution-icon" aria-hidden="true" id="resolution-icon"></div><h2 id="resolution-heading" tabindex="-1"></h2><div id="resolution-stars" class="resolution-stars" role="img" aria-label=""></div><p id="resolution-detail"></p><p id="resolution-gems" class="resolution-gems" hidden></p><p id="resolution-record" class="resolution-record" hidden></p><p id="resolution-achievements" class="resolution-achievements" hidden></p><div class="resolution-actions"><button id="replay-level" type="button"></button><button id="next-level" type="button" hidden>Next level →</button></div></div></section><section id="cannon-popup" class="cannon-popup" role="dialog" aria-modal="false" aria-labelledby="popup-title" hidden><div class="popup-heading"><h2 id="popup-title"></h2><button type="button" id="popup-close" aria-label="Close cannon editor">×</button></div><div id="popup-editor"></div><div class="popup-nav"><button type="button" id="previous-cannon">← Previous cannon</button><button type="button" id="next-cannon">Next cannon →</button><button type="button" id="popup-done">Done ✓</button></div></section><footer class="planning-footer"><div class="planning-editor"><div class="program-summary"><button type="button" id="edit-cannons">Edit cannons</button><span id="plan-ready" role="status"></span><div class="halo-legend" aria-label="Cannon programming status"><span data-status="empty">Unprogrammed</span><span data-status="ready">Programmed</span><span data-status="revise">Failed</span><span data-status="tested">Successful</span></div></div><p id="flight-result" role="status" class="flight-result" hidden></p><aside id="flight-hint" class="flight-hint" aria-label="Mathematical feedback" aria-live="polite" hidden></aside></div><div class="launch-panel"><button id="launch" class="launch" disabled>▶ Launch</button><button id="restart-level" class="restart-level" type="button">↺ Restart</button><small id="phase-label" aria-live="off">Planning</small></div></footer></main>`;
const world=customRun||liftDemo?worlds[level.world-1]:worldForLevel(lastLevel!.id)!,position=customRun||liftDemo?{index:0,total:0}:levelPosition(lastLevel!.id)!,following=liftDemo?nextFoundryLevel(level.id):customRun?undefined:tutorialReturn?.level??nextLevel(level.id);
app.querySelector('main')!.dataset.world=String(world.number);app.querySelector('main')!.dataset.mode=mode;
app.querySelector<HTMLElement>('#world-label')!.textContent=liftDemo?'Broken Foundry · '+level.title+' · '+policy.name:customRun?(customRun.kind==='test'?'Playtest · '+level.title+' · Free practice':'Custom level · '+level.title+' · '+policy.name):tutorialReturn?'Flight school · Free practice':world.name+' · '+position.index+' / '+position.total+' · '+policy.name;
if(tutorialReturn)app.querySelector('main')!.dataset.tutorial='true';
if(customRun)app.querySelector('main')!.dataset.customTest=customRun.kind;
app.querySelector<HTMLElement>('#level-objective')!.textContent=modeObjective(mode,level);
const button=(id:string)=>document.querySelector<HTMLButtonElement>('#'+id)!;
const reducedMotion=()=>reducedOverride,motionButton=button('motion-mode');
function paintMotion(){const reduced=reducedMotion();app.querySelector('main')!.dataset.motion=reduced?'reduced':'full';motionButton.textContent=reduced?'Motion: reduced':'Motion: full';motionButton.title=reduced?'Enable full flight animations':'Use reduced motion';motionButton.setAttribute('aria-label',motionButton.title);}
paintMotion();
let repositionPopup=()=>{},refreshCoach=()=>{};
const scene=mountScene(app.querySelector<HTMLElement>('.stage')!,level,{in:button('zoom-in'),out:button('zoom-out'),reset:button('zoom-reset'),left:button('pan-left'),right:button('pan-right'),up:button('pan-up'),down:button('pan-down'),readout:document.querySelector('#zoom-readout')!,info:document.querySelector('#inspect-info')!,onCannonSelect:chooseCannon,onLiftMove:movePlatform,mode,look,cannonLook,onSound:audio.play,budget,reducedMotion,onViewChange:()=>{repositionPopup();refreshCoach();}});

const levelMenu=button('level-menu');levelMenu.setAttribute('aria-label',customRun?(customRun.kind==='test'?'Return to Level Workshop':'Return to Custom Levels'):'Choose levels; current level '+position.index+' of '+world.name+'. Leaves this run.');if(liftDemo){levelMenu.querySelector('span')!.textContent='Foundry';levelMenu.setAttribute('aria-label','Return to Broken Foundry');levelMenu.title='Return to Broken Foundry';}if(customRun){levelMenu.querySelector('span')!.textContent=customRun.kind==='test'?'Workshop':'Custom levels';levelMenu.title=levelMenu.getAttribute('aria-label')!;}
const editorRoot=app.querySelector<HTMLElement>('#popup-editor')!,popup=app.querySelector<HTMLElement>('#cannon-popup')!,popupTitle=app.querySelector<HTMLElement>('#popup-title')!;
const previousCannon=button('previous-cannon'),nextCannon=button('next-cannon'),editCannons=button('edit-cannons'),planReady=app.querySelector<HTMLElement>('#plan-ready')!;
const ids=level.cannons.map(c=>c.id),memory=new Map<string,EditorMemory>();
 const freshPlan=()=>liftDemo?initialFoundryPlan(level):createLevelFlightPlan(level);
let plan=freshPlan(),selected=level.startId,switching=false,previewOn=false;
const previewButton=button('graph-preview');previewButton.hidden=!!tutorialReturn||!policy.preview;
function clearPreview(){previewOn=false;scene.setGraphPreview([]);previewButton.textContent='Show graph';previewButton.setAttribute('aria-pressed','false');}
let editor=mountCannonParameterEditor(editorRoot,level.cannons.find(c=>c.id===selected)!,level,mode,getPlanEntry(plan,selected)?.text??'',undefined,movePlatform);
function selectCannon(id:string,force=false){
 const c=level.cannons.find(c=>c.id===id);if(!c||(!force&&id===selected))return;
 clearPreview();switching=true;selected=id;
 editor=mountCannonParameterEditor(editorRoot,c,level,mode,getPlanEntry(plan,id)?.text??'',memory.get(id),movePlatform);
 switching=false;
}
function movePlatform(id:string,y:number){
 if(!canPlan(state))return;
 try{
  const next=moveLiftInPlanning(level,plan,state,id,y);
  if(next.level===level)return;
  level=next.level;plan=next.plan;
  feedbackHistory=createFeedbackHistory();hideStatus();scene.clearFlight();
  // Keep the chosen preview active; update its curve after moving the anchor.
  scene.setLevelGeometry(level);
  if(selected===id){editor.updateLift?.(level.cannons.find(c=>c.id===id)!);}
  if(previewOn){const equation=getPlanEntry(plan,selected)?.equation;if(equation)scene.setGraphPreview(graphPreview(equation,level.bounds));}
  sync();positionPopup();
 }catch(error){
  const info=app.querySelector<HTMLElement>('#inspect-info')!;
  info.textContent=error instanceof Error?error.message:'This platform position is unavailable.';
 }
}
function positionPopup(){
 if(popup.hidden)return;
 const stage=app.querySelector<HTMLElement>('.stage')!,area=stage.getBoundingClientRect(),viewport=window.visualViewport;
 const vx=viewport?.offsetLeft??0,vy=viewport?.offsetTop??0,vw=viewport?.width??innerWidth,vh=viewport?.height??innerHeight;
 const margin=8,left=Math.max(vx+margin,area.left+margin),right=Math.min(vx+vw-margin,area.right-margin);
 const top=Math.max(vy+margin,area.top+margin),bottom=Math.min(vy+vh-margin,area.bottom-margin);
 const usable=bottom-top,box=usable>=180&&right-left>=220?{left,right,top,bottom}:{left:vx+margin,right:vx+vw-margin,top:vy+margin,bottom:vy+vh-margin};
 popup.style.width=Math.min(435,Math.max(180,box.right-box.left))+'px';
 popup.style.maxHeight=Math.max(120,box.bottom-box.top)+'px';
 const target=scene.cannonRect(selected)??{left:box.left,top:box.top,right:box.left,bottom:box.top},size=popup.getBoundingClientRect();
 const pos=popupPosition(target,box,size.width,size.height);popup.style.left=pos.left+'px';popup.style.top=pos.top+'px';
}
repositionPopup=positionPopup;
function updatePopupHeading(){
 const c=level.cannons.find(c=>c.id===selected)!,index=ids.indexOf(selected);
 popupTitle.textContent='Cannon '+c.id+' · '+cannonTypes[c.type].label+' ('+(index+1)+'/'+ids.length+')';
 popup.style.setProperty('--popup-family',cannonTypes[c.type].color);previousCannon.disabled=index<=0;nextCannon.disabled=index>=ids.length-1;
}
function chooseCannon(id:string){
 if(!canPlan(state)||!ids.includes(id))return;if(tutorialReturn)tutorialIntro='practice';selectCannon(id);scene.revealCannon(id);popup.hidden=false;updatePopupHeading();sync();positionPopup();editor.focus();
}
function closePopup(returnFocus=false){
 if(popup.hidden)return;popup.hidden=true;scene.setPlanningSelection(selected,canPlan(state),false);
 if(returnFocus)scene.focusCannon(selected);refreshCoach();
}
previousCannon.addEventListener('click',()=>{const id=ids[ids.indexOf(selected)-1];if(id)chooseCannon(id);});
nextCannon.addEventListener('click',()=>{const id=ids[ids.indexOf(selected)+1];if(id)chooseCannon(id);});
button('popup-close').addEventListener('click',()=>closePopup(true));button('popup-done').addEventListener('click',()=>closePopup(true));
editCannons.addEventListener('click',()=>chooseCannon(plan.find(e=>!e.equation)?.id??selected));
popup.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closePopup(true);}});
app.querySelector('.stage')!.addEventListener('pointerdown',e=>{if(!(e.target as Element).closest('[data-inspect]'))closePopup();});
const popupObserver=new ResizeObserver(positionPopup);popupObserver.observe(popup);
window.addEventListener('resize',positionPopup);window.addEventListener('scroll',positionPopup,true);window.visualViewport?.addEventListener('resize',positionPopup);window.visualViewport?.addEventListener('scroll',positionPopup);
const queue=mountPipQueue(app.querySelector<HTMLElement>('#pip-queue')!,budget,look);
const homeButton=button('home-return'),launchButton=button('launch'),restartButton=button('restart-level'),replay=button('replay-level'),advance=button('next-level');
const status=app.querySelector<HTMLElement>('#flight-result')!,phaseLabel=app.querySelector<HTMLElement>('#phase-label')!;
const resolution=app.querySelector<HTMLElement>('#level-resolution')!,heading=app.querySelector<HTMLElement>('#resolution-heading')!,detail=app.querySelector<HTMLElement>('#resolution-detail')!,icon=app.querySelector<HTMLElement>('#resolution-icon')!;
const stars=app.querySelector<HTMLElement>('#resolution-stars')!;
let state=createLevelState(budget,1,policy.unlimited),feedbackHistory=createFeedbackHistory(),liveGemCount=0;
let completion:ProgressUpdate|undefined,customSubmitted=false,customPassed=false,customResult:ReturnType<typeof customStore.completePlay>;
let tutorialIntro:TutorialIntro='aim';
function leaveTutorial(){if(!tutorialReturn||state.phase==='launching'||state.phase==='celebrating')return;tutorialStore.remember();mountLevel(tutorialReturn.level,tutorialReturn.mode);app.querySelector<HTMLButtonElement>('#level-menu')?.focus();}
const coach=tutorialReturn?mountFirstFlightTutorial(app.querySelector('main')!,()=>{tutorialIntro=tutorialIntro==='aim'?'coordinates':'practice';sync();if(tutorialIntro==='practice')scene.focusCannon('A');},leaveTutorial,scene.setTutorialGuides):undefined;
refreshCoach=()=>coach?.update({intro:tutorialIntro,state,plan,selected,popupOpen:!popup.hidden});
const tutorialHelp=button('tutorial-help');tutorialHelp.hidden=!!tutorialReturn||level.id!=='1-01';tutorialHelp.addEventListener('click',()=>{if(canPlan(state)||isTerminal(state))startLevel(level,mode,true);});
const recordText=app.querySelector<HTMLElement>('#resolution-record')!,achievementText=app.querySelector<HTMLElement>('#resolution-achievements')!;
function updateCompletion(){
 if(customRun){
  achievementText.hidden=true;
  if(state.phase==='success'&&!customSubmitted){
   customSubmitted=true;
   if(customRun.kind==='test')customPassed=customStore.completeTest(customRun,state,level);
   else customResult=customStore.completePlay(customRun,state,level);
  }
  recordText.hidden=state.phase!=='success'||!customResult;
  if(customResult&&state.phase==='success'){
   const rating=recordStars(customResult.record,level,mode);
   recordText.textContent=(customResult.improved?'New custom record! ':'Custom best retained. ')+(rating===null?'Practice complete':rating+'/3 best stars')+(customStore.library().persisted?' · Saved locally':' · Session only');
  }
  return;
 }
 if(tutorialReturn||liftDemo){recordText.hidden=true;achievementText.hidden=true;return;}
 if(state.phase==='success'&&!completion){completion=progressStore.complete(level,mode,state);audio.play(completion.unlocked.length?'achievement':'complete');}
 const update=state.phase==='success'?completion:undefined;
 recordText.hidden=!update;achievementText.hidden=!update?.unlocked.length;
 if(!update)return;
 const best=getRecord(update.after,level.id,mode),rating=recordStars(best,level,mode);
 recordText.textContent=(update.improved?'New record! ':'Best record retained. ')+(rating===null?'Practice complete':rating+'/3 best stars')+(update.persisted?' · Saved':' · Session only (not saved)');
 const newParts=update.unlocked.flatMap(a=>[...cosmeticsForAchievement(a.id),...cannonRewardsForAchievement(a.id)]).length;
 achievementText.textContent=update.unlocked.length?'✦ '+update.unlocked.map(a=>a.title).join(' · ')+(newParts?' · '+newParts+' workshop '+(newParts===1?'part':'parts')+' unlocked':''):'';
}
const gemTotal=level.gems?.length??0,gemReadout=app.querySelector<HTMLElement>('#gem-readout')!,gemResult=app.querySelector<HTMLElement>('#resolution-gems')!;
function updateGemReadout(){
 gemReadout.hidden=gemTotal===0;if(!gemTotal)return;
 const n=state.active?liveGemCount:bankedGems(state.lastResult).length;
 const text='◆ '+n+' / '+gemTotal+' gems';if(gemReadout.textContent!==text)gemReadout.textContent=text;
 gemReadout.title=state.active?'Provisional gems — reach the exit to keep them':'Optional gems; independent of stars';
}
const hintView=mountFlightHint(app.querySelector<HTMLElement>('#flight-hint')!);
function sync(){
 const editable=canPlan(state),terminal=isTerminal(state),success=state.phase==='success';
 updateCompletion();
 const ready=countReady(plan);
 if(!editable)closePopup();
 const readyText=ready+' / '+level.cannons.length+' programmed';if(planReady.textContent!==readyText)planReady.textContent=readyText;
 editCannons.disabled=!editable;scene.setPlanStatuses(plan);scene.setPlanningSelection(selected,editable,!popup.hidden);
 tutorialHelp.disabled=!editable&&!terminal;
 previewButton.disabled=!!tutorialReturn||!policy.preview||!editable||!editor.getDraft().equation;if(!editable&&previewOn)clearPreview();
 launchButton.disabled=!canLaunch(state)||ready!==level.cannons.length;
levelMenu.disabled=state.phase==='launching'||state.phase==='celebrating';homeButton.disabled=levelMenu.disabled;
 launchButton.textContent=state.phase==='retry'?'▶ Try again':'▶ Launch';
 editorRoot.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement>('input,button,select').forEach(e=>{e.disabled=!editable;});
 if(!editable&&document.activeElement===launchButton){app.querySelector<SVGSVGElement>('.stage>svg')?.focus({preventScroll:true});}
 restartButton.disabled=state.phase==='launching'||state.phase==='celebrating';
 queue.update(state);scene.setWaitingCrew(state.waiting);motionButton.disabled=state.phase==='launching'||state.phase==='celebrating';updateGemReadout();
 phaseLabel.textContent=({planning:'Planning',launching:'Launching…',retry:'Adjust and retry',celebrating:'Rapid fire!',success:'Level complete',gameOver:'No Pips left'} as const)[state.phase];
 resolution.hidden=!terminal;
 advance.hidden=!success||(!following&&!customRun&&!liftDemo);
 advance.textContent=liftDemo?(following?'Next puzzle →':'More puzzles →'):customRun?(customRun.kind==='test'?'Return to workshop →':'Return to custom levels →'):tutorialReturn?'Start level 1 →':following&&following.world!==level.world?'Next world →':'Next level →';
 if(terminal){
  resolution.dataset.outcome=success?'success':'failure';
  icon.textContent=success?'✦':'↻';
  const rating=levelStars(state)??0;stars.hidden=policy.unlimited;
  stars.replaceChildren(...Array.from({length:3},(_,i)=>{const star=document.createElement('span');star.textContent='★';star.className=i<rating?'earned':'unearned';star.setAttribute('aria-hidden','true');return star;}));
  stars.setAttribute('aria-label',rating+' out of 3 stars');
  heading.textContent=success?(customRun?.kind==='test'?'Playtest complete!':tutorialReturn?'Tutorial complete!':'Level complete!'):'Out of Pips!';
  detail.textContent=success&&policy.unlimited?'Practice complete! '+state.saved+' Pips reached the exit after '+(state.failed+1)+' test '+(state.failed===0?'flight.':'flights.') :success
   ?state.saved+' of '+state.total+' Pips reached the exit!'+(state.failed?' '+state.failed+' unsuccessful '+(state.failed===1?'attempt.':'attempts.'):' Perfect first flight!')
   :'All '+state.total+' Pips have used their attempts. Try the level again with a revised equation.';
  gemResult.hidden=!success||!gemTotal;
  gemResult.textContent=success&&gemTotal?'◆ '+bankedGems(state.lastResult).length+' / '+gemTotal+' optional gems collected':'';
  if(tutorialReturn&&success){detail.textContent='All '+state.saved+' practice Pips arrived. Start the real level with a fresh crew.';tutorialStore.remember();}
  if(customRun?.kind==='test'&&success)detail.textContent=customPassed?'The current design has passed its playtest. Return to the workshop to confirm it.':'The flight finished, but the current design could not be verified. Return to the workshop and test again.';
  replay.textContent=tutorialReturn?'Practice again':success?'Play again':'Retry level';
 }
 refreshCoach();
}
function celebrate(){
 const batch=state.celebration;if(!batch)return;
 const id=batch.id;
 status.dataset.outcome='success';status.textContent='Route verified! Here come the remaining Pips…';sync();
 const started=scene.playRapidFire(batch.result,batch.count,state.unlimited?state.saved:state.failed+state.saved,counts=>{
  const next=advanceCelebration(state,id,counts.dispatched,counts.arrived);if(next===state)return;
  state=next;status.textContent=state.saved+' of '+state.total+' Pips have reached the exit!';sync();
 },()=>{
  const next=finishCelebration(state,id);if(next===state)return;
  state=next;status.textContent=state.saved+' of '+state.total+' Pips reached the exit!';sync();heading.focus();
 });
 // This can only fail if the scene is unexpectedly out of sync. Never award unplayed arrivals.
 if(!started){
  state=createLevelState(state.total,state.nextAttemptId,state.unlimited);plan=clearEvidence(plan);feedbackHistory=createFeedbackHistory();hintView.update(null);scene.clearFlight();
  status.dataset.outcome='failure';status.textContent='The celebration could not start. The level has been reset; launch again.';sync();chooseCannon(selected);
 }
}
function hideStatus(){status.hidden=true;status.textContent='';delete status.dataset.outcome;hintView.update(null);}
function reset(keepEquation:boolean){
 const next=restartLevel(state);if(next===state)return;
 state=next;if(tutorialReturn)tutorialIntro='aim';audio.setTheme(level.world as MusicTheme);completion=undefined;customSubmitted=false;customPassed=false;customResult=undefined;clearPreview();feedbackHistory=createFeedbackHistory();scene.clearFlight();hideStatus();
 closePopup();if(!keepEquation){memory.clear();level=authoredLevel;scene.setLevelGeometry(level);}
 plan=keepEquation?clearEvidence(plan):freshPlan();selectCannon(level.startId,true);
 sync();editCannons.focus();
}
editorRoot.addEventListener('equationchange',()=>{
 if(switching||!canPlan(state)||getPlanEntry(plan,selected)?.locked)return;
 memory.set(selected,editor.getMemory());
 const next=editPlan(plan,selected,editor.getDraft());if(next!==plan){plan=next;clearPreview();scene.clearFlight();if(state.phase!=='retry'||!feedbackHistory.latest)hideStatus();}sync();
});
previewButton.addEventListener('click',()=>{
 if(tutorialReturn||!policy.preview||!canPlan(state)||previewButton.disabled)return;
 if(previewOn){clearPreview();return;}
 const equation=getPlanEntry(plan,selected)?.equation;if(!equation)return;
 try{const paths=graphPreview(equation,level.bounds);scene.setGraphPreview(paths);if(!paths.length){previewButton.textContent='Graph outside view';return;}previewOn=true;previewButton.textContent='Hide graph';previewButton.setAttribute('aria-pressed','true');}catch{clearPreview();}
});
motionButton.addEventListener('click',()=>{if(motionButton.disabled)return;reducedOverride=!reducedMotion();paintMotion();});
levelMenu.addEventListener('click',()=>{if(!levelMenu.disabled){if(liftDemo){showLiftDemos();return;}if(customRun){if(customRun.kind==='test'){customStore.select(customRun.id);showCustomWorkshop();}else showCustomLibrary(customRun.id,mode);}else showSelection(true);}});
homeButton.addEventListener('click',()=>{if(!homeButton.disabled)showHome(true);});
restartButton.addEventListener('click',()=>reset(false));
replay.addEventListener('click',()=>reset(!tutorialReturn));
advance.addEventListener('click',()=>{if(state.phase!=='success')return;if(liftDemo){if(following)mountLevel(following,mode,undefined,undefined,true);else showLiftDemos();return;}if(customRun){if(customRun.kind==='test'){customStore.select(customRun.id);showCustomWorkshop();}else showCustomLibrary(customRun.id,mode);return;}if(following){if(tutorialReturn)leaveTutorial();else startLevel(following,mode);}});
launchButton.addEventListener('click',()=>{
 if(!canLaunch(state))return;
 const equations=snapshotPlan(plan);if(!equations)return;
 const launched=plan,result=simulateRoute(level,equations),previous=state,next=beginAttempt(state,result);
 if(!next.active||next===state)return;
 const id=next.active.id;
 state=next;liveGemCount=0;hintView.update(null);status.hidden=false;status.dataset.outcome='flying';status.textContent='Here we go!';sync();
 // If the Launch action is below the graph on a short screen, bring the
 // graph into view before animating. Focus and the editor remain intact.
 const stage=app.querySelector<HTMLElement>('.stage')!,rect=stage.getBoundingClientRect();
 if(rect.top<0||rect.bottom>window.innerHeight)stage.scrollIntoView({block:'nearest',behavior:'auto'});
 if(!scene.playFlight(result,()=>{
  const resolved=finishAttempt(state,id);if(resolved===state)return;
  state=resolved;if(state.phase==='gameOver')audio.play('gameover');plan=recordFlightEvidence(plan,launched,result);
  if(policy.hints&&!tutorialReturn)feedbackHistory=recordAttemptFeedback(feedbackHistory,id,level,result,equations,mode==='cadet'?2:1);hintView.update(policy.hints&&!tutorialReturn?feedbackHistory.latest:null);status.dataset.outcome=result.event.kind==='exit'?'success':'failure';
  status.textContent=modeAttemptFeedback(mode,result)+(state.phase==='retry'?(policy.unlimited?' Unlimited retries — adjust and try again.':' '+state.waiting+' left — try again.'):'')+(result.event.kind!=='exit'&&result.gemHits.length?' Gems reset.':'');
  sync();if(state.phase==='celebrating')celebrate();else if(isTerminal(state))heading.focus();else {selectCannon(result.terminalCannonId);sync();scene.focusCannon(selected);}
 },ids=>{if(state.active?.id===id){liveGemCount=ids.length;updateGemReadout();}})){state=previous;hideStatus();if(feedbackHistory.latest&&state.lastResult){status.hidden=false;status.dataset.outcome='failure';status.textContent=modeAttemptFeedback(mode,state.lastResult);hintView.update(feedbackHistory.latest);}sync();}
});
sync();

cleanup=()=>{popupObserver.disconnect();window.removeEventListener('resize',positionPopup);window.removeEventListener('scroll',positionPopup,true);window.visualViewport?.removeEventListener('resize',positionPopup);window.visualViewport?.removeEventListener('scroll',positionPopup);scene.destroy();};addAudioCleanup();
}
showHome();
