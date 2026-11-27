import './style.css';
import {worldForLevel,levelPosition,nextLevel} from './levels/catalog';
import {mountScene} from './rendering/scene';
import {mountEquationEditor} from './ui/equationEditor';
import {mountPipQueue} from './ui/pipQueue';
import {simulateRoute} from './engine/simulation/linearRoute';
import {createFlightPlan,getPlanEntry,editPlan,countReady,snapshotPlan,recordFlightEvidence,clearEvidence} from './game/flightPlan';
import {mountFlightPlanDock} from './ui/flightPlanDock';
import type {Level} from './levels/schema';
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
const audio=browserAudioPlayback(),audioDialog=createAudioSettingsDialog(audio);
let cleanup:()=>void=()=>{};
function bindAudioButton(){const b=app.querySelector<HTMLButtonElement>('#sound-settings');return b?audioDialog.bind(b):()=>{};}
function addMenuAudio(){const top=app.querySelector<HTMLElement>('.selection-top'),end=top?.querySelector('.selection-top-end');if(!top||!end)return;const b=document.createElement('button');b.type='button';b.id='sound-settings';b.className='sound-settings workshop-sound-settings';b.textContent='♪ Off';end.replaceWith(b);top.classList.add('has-audio');addAudioCleanup();}
function addAudioCleanup(){const prior=cleanup,unbind=bindAudioButton();cleanup=()=>{unbind();prior();};}
let lastLevel:Level|undefined,lastMode:LearningMode='pilot';
// Full animation is the default on every device. A deliberate reduced-motion
// choice is retained during this page session, independently of OS settings.
let reducedOverride=false;
function showHome(focusPlay=false){
 cleanup();audio.setTheme('menu');const progress=progressStore.read();cleanup=mountHomeScreen(app,()=>showSelection(),focusPlay,{progress,persisted:progressStore.persisted(),onOpen:showFlightLog,look:lookStore.read(earnedAchievementIds(progress)),onWorkshop:showWorkshop,cannonLook:cannonStore.read(earnedAchievementIds(progress)),onCannonWorkshop:showCannonWorkshop,reducedMotion:reducedOverride});addAudioCleanup();
}
function showWorkshop(){cleanup();audio.setTheme('menu');cleanup=mountCreatureWorkshop(app,earnedAchievementIds(progressStore.read()),lookStore,()=>{showHome();app.querySelector<HTMLButtonElement>('#home-workshop')?.focus();});addMenuAudio();}
function showCannonWorkshop(){cleanup();audio.setTheme('menu');cleanup=mountCannonWorkshop(app,earnedAchievementIds(progressStore.read()),cannonStore,()=>{showHome();app.querySelector<HTMLButtonElement>('#home-cannon-workshop')?.focus();},()=>audio.play('fire'),()=>reducedOverride);addAudioCleanup();}
function showFlightLog(){cleanup();audio.setTheme('menu');const progress=progressStore.read();cleanup=mountFlightLog(app,progress,progressStore.persisted(),()=>showHome(true));addMenuAudio();}
function showSelection(openCurrentWorld=false){
 cleanup();audio.setTheme('menu');cleanup=mountLevelSelection(app,{bindAudio:audioDialog.bind,progress:progressStore.read(),preferredId:lastLevel?.id,preferredMode:lastMode,openCurrentWorld,onHome:()=>showHome(true),onPlay:(level,mode)=>{mountLevel(level,mode);app.querySelector<HTMLButtonElement>('#level-menu')?.focus();}});
}
function mountLevel(level:Level,mode:LearningMode){
 cleanup();audio.setTheme(level.world as MusicTheme);lastLevel=level;lastMode=mode;
 const policy=modePolicy(mode),budget=modeBudget(mode,level),look=lookStore.read(earnedAchievementIds(progressStore.read())),cannonLook=cannonStore.read(earnedAchievementIds(progressStore.read()));
app.innerHTML=`<main class="game-screen"><header><div class="brand"><button class="brand-mark home-return" id="home-return" type="button" aria-label="Return to home" title="Return to home (leaves this run)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 11 12 3l9 8M5.5 10v10h5v-6h3v6h5V10" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div><h1>Cannon Graphs!</h1><p id="world-label"></p><p id="level-objective" class="level-objective"></p></div></div><div id="pip-queue" class="pip-queue" role="group" aria-label="Pips ready"></div><button class="game-level-menu" id="level-menu" type="button" title="Choose levels (leaves this run)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="7" height="7" rx="1.4" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1.4" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="1.4" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="1.4" fill="currentColor"/></svg><span>Levels</span></button><button class="sound-settings game-sound-settings" id="sound-settings" type="button" aria-label="Sound settings">♪ Off</button></header><div class="toolbar"><div id="inspect-info" role="status">Hover, tap or focus a cannon, exit or terrain to inspect its coordinates.</div><button type="button" id="graph-preview" class="graph-preview-toggle" aria-pressed="false" hidden>Show graph</button><span id="gem-readout" class="gem-readout" role="status" hidden></span><button id="motion-mode" class="motion-mode" type="button">Motion</button><div class="camera-tools" role="group" aria-label="View controls"><button id="pan-left" aria-label="Pan left" title="Pan left">←</button><button id="pan-up" aria-label="Pan up" title="Pan up">↑</button><button id="pan-down" aria-label="Pan down" title="Pan down">↓</button><button id="pan-right" aria-label="Pan right" title="Pan right">→</button><button id="zoom-out" aria-label="Zoom out" title="Zoom out">−</button><output id="zoom-readout">100%</output><button id="zoom-in" aria-label="Zoom in" title="Zoom in">+</button><button id="zoom-reset" aria-label="Reset view" title="Reset view">↺</button></div></div><section class="stage" aria-label="Game scene"><div id="level-resolution" class="level-resolution" role="region" aria-labelledby="resolution-heading" hidden><div class="resolution-icon" aria-hidden="true" id="resolution-icon"></div><h2 id="resolution-heading" tabindex="-1"></h2><div id="resolution-stars" class="resolution-stars" role="img" aria-label=""></div><p id="resolution-detail"></p><p id="resolution-gems" class="resolution-gems" hidden></p><p id="resolution-record" class="resolution-record" hidden></p><p id="resolution-achievements" class="resolution-achievements" hidden></p><div class="resolution-actions"><button id="replay-level" type="button"></button><button id="next-level" type="button" hidden>Next level →</button></div></div></section><footer class="planning-footer"><div class="planning-editor"><div id="flight-plan"></div><div id="equation-editor" class="equation-editor"></div><p id="flight-result" role="status" class="flight-result" hidden></p><aside id="flight-hint" class="flight-hint" aria-label="Mathematical feedback" aria-live="polite" hidden></aside></div><div class="launch-panel"><button id="launch" class="launch" disabled>▶ Launch</button><button id="restart-level" class="restart-level" type="button">↺ Restart</button><small id="phase-label" aria-live="off">Planning</small></div></footer></main>`;
const world=worldForLevel(level.id)!,position=levelPosition(level.id)!,following=nextLevel(level.id);
app.querySelector('main')!.dataset.world=String(world.number);app.querySelector('main')!.dataset.mode=mode;
app.querySelector<HTMLElement>('#world-label')!.textContent=world.name+' · '+position.index+' / '+position.total+' · '+policy.name;
app.querySelector<HTMLElement>('#level-objective')!.textContent=modeObjective(mode,level);
const button=(id:string)=>document.querySelector<HTMLButtonElement>('#'+id)!;
const reducedMotion=()=>reducedOverride,motionButton=button('motion-mode');
function paintMotion(){const reduced=reducedMotion();app.querySelector('main')!.dataset.motion=reduced?'reduced':'full';motionButton.textContent=reduced?'Motion: reduced':'Motion: full';motionButton.title=reduced?'Enable full flight animations':'Use reduced motion';motionButton.setAttribute('aria-label',motionButton.title);}
paintMotion();
const scene=mountScene(app.querySelector<HTMLElement>('.stage')!,level,{in:button('zoom-in'),out:button('zoom-out'),reset:button('zoom-reset'),left:button('pan-left'),right:button('pan-right'),up:button('pan-up'),down:button('pan-down'),readout:document.querySelector('#zoom-readout')!,info:document.querySelector('#inspect-info')!,onCannonSelect:chooseCannon,mode,look,cannonLook,onSound:audio.play,budget,reducedMotion});

const levelMenu=button('level-menu');levelMenu.setAttribute('aria-label','Choose levels; current level '+position.index+' of '+world.name+'. Leaves this run.');
const editorRoot=app.querySelector<HTMLElement>('#equation-editor')!;
const ids=level.cannons.map(c=>c.id);
let plan=createFlightPlan(ids),selected=level.startId,switching=false,previewOn=false;
const previewButton=button('graph-preview');previewButton.hidden=!policy.preview;
function clearPreview(){previewOn=false;scene.setGraphPreview([]);previewButton.textContent='Show graph';previewButton.setAttribute('aria-pressed','false');}
let editor=mountEquationEditor(editorRoot,level.cannons.find(c=>c.id===selected)!,level,mode);
const dock=mountFlightPlanDock(app.querySelector<HTMLElement>('#flight-plan')!,level.cannons,chooseCannon);
function selectCannon(id:string,force=false){
 const c=level.cannons.find(c=>c.id===id);if(!c||(!force&&id===selected))return;
 clearPreview();switching=true;selected=id;
 editor=mountEquationEditor(editorRoot,c,level,mode);editor.setText(getPlanEntry(plan,id)?.text??'');
 switching=false;
}
function chooseCannon(id:string){
 if(!canPlan(state))return;selectCannon(id);sync();editor.focus();
}
const queue=mountPipQueue(app.querySelector<HTMLElement>('#pip-queue')!,budget,look);
const homeButton=button('home-return'),launchButton=button('launch'),restartButton=button('restart-level'),replay=button('replay-level'),advance=button('next-level');
const status=app.querySelector<HTMLElement>('#flight-result')!,phaseLabel=app.querySelector<HTMLElement>('#phase-label')!;
const resolution=app.querySelector<HTMLElement>('#level-resolution')!,heading=app.querySelector<HTMLElement>('#resolution-heading')!,detail=app.querySelector<HTMLElement>('#resolution-detail')!,icon=app.querySelector<HTMLElement>('#resolution-icon')!;
const stars=app.querySelector<HTMLElement>('#resolution-stars')!;
let state=createLevelState(budget,1,policy.unlimited),feedbackHistory=createFeedbackHistory(),liveGemCount=0;
let completion:ProgressUpdate|undefined;
const recordText=app.querySelector<HTMLElement>('#resolution-record')!,achievementText=app.querySelector<HTMLElement>('#resolution-achievements')!;
function updateCompletion(){
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
 dock.update(plan,selected,editable);scene.setPlanningSelection(selected,editable);
 previewButton.disabled=!policy.preview||!editable||!editor.getDraft().equation;if(!editable&&previewOn)clearPreview();
 launchButton.disabled=!canLaunch(state)||ready!==level.cannons.length;
levelMenu.disabled=state.phase==='launching'||state.phase==='celebrating';homeButton.disabled=levelMenu.disabled;
 launchButton.textContent=state.phase==='retry'?'▶ Try again':'▶ Launch';
 editorRoot.querySelectorAll<HTMLInputElement|HTMLButtonElement>('input,button').forEach(e=>{e.disabled=!editable;});
 if(!editable&&document.activeElement===launchButton){app.querySelector<SVGSVGElement>('.stage>svg')?.focus({preventScroll:true});}
 restartButton.disabled=state.phase==='launching'||state.phase==='celebrating';
 queue.update(state);scene.setWaitingCrew(state.waiting);motionButton.disabled=state.phase==='launching'||state.phase==='celebrating';updateGemReadout();
 phaseLabel.textContent=({planning:'Planning',launching:'Launching…',retry:'Adjust and retry',celebrating:'Rapid fire!',success:'Level complete',gameOver:'No Pips left'} as const)[state.phase];
 resolution.hidden=!terminal;
 advance.hidden=!success||!following;
 advance.textContent=following&&following.world!==level.world?'Next world →':'Next level →';
 if(terminal){
  resolution.dataset.outcome=success?'success':'failure';
  icon.textContent=success?'✦':'↻';
  const rating=levelStars(state)??0;stars.hidden=policy.unlimited;
  stars.replaceChildren(...Array.from({length:3},(_,i)=>{const star=document.createElement('span');star.textContent='★';star.className=i<rating?'earned':'unearned';star.setAttribute('aria-hidden','true');return star;}));
  stars.setAttribute('aria-label',rating+' out of 3 stars');
  heading.textContent=success?'Level complete!':'Out of Pips!';
  detail.textContent=success&&policy.unlimited?'Practice complete! '+state.saved+' Pips reached the exit after '+(state.failed+1)+' test '+(state.failed===0?'flight.':'flights.') :success
   ?state.saved+' of '+state.total+' Pips reached the exit!'+(state.failed?' '+state.failed+' unsuccessful '+(state.failed===1?'attempt.':'attempts.'):' Perfect first flight!')
   :'All '+state.total+' Pips have used their attempts. Try the level again with a revised equation.';
  gemResult.hidden=!success||!gemTotal;
  gemResult.textContent=success&&gemTotal?'◆ '+bankedGems(state.lastResult).length+' / '+gemTotal+' optional gems collected':'';
  replay.textContent=success?'Play again':'Retry level';
 }
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
  status.dataset.outcome='failure';status.textContent='The celebration could not start. The level has been reset; launch again.';sync();editor.focus();
 }
}
function hideStatus(){status.hidden=true;status.textContent='';delete status.dataset.outcome;hintView.update(null);}
function reset(keepEquation:boolean){
 const next=restartLevel(state);if(next===state)return;
 state=next;audio.setTheme(level.world as MusicTheme);completion=undefined;clearPreview();feedbackHistory=createFeedbackHistory();scene.clearFlight();hideStatus();
 plan=keepEquation?clearEvidence(plan):createFlightPlan(ids);selectCannon(level.startId,true);
 sync();editor.focus();
}
editorRoot.addEventListener('equationchange',()=>{
 if(switching||!canPlan(state))return;
 const next=editPlan(plan,selected,editor.getDraft());if(next!==plan){plan=next;clearPreview();scene.clearFlight();if(state.phase!=='retry'||!feedbackHistory.latest)hideStatus();}sync();
});
previewButton.addEventListener('click',()=>{
 if(!policy.preview||!canPlan(state)||previewButton.disabled)return;
 if(previewOn){clearPreview();return;}
 const equation=editor.getDraft().equation;if(!equation)return;
 try{const paths=graphPreview(equation,level.bounds);scene.setGraphPreview(paths);if(!paths.length){previewButton.textContent='Graph outside view';return;}previewOn=true;previewButton.textContent='Hide graph';previewButton.setAttribute('aria-pressed','true');}catch{clearPreview();}
});
motionButton.addEventListener('click',()=>{if(motionButton.disabled)return;reducedOverride=!reducedMotion();paintMotion();});
levelMenu.addEventListener('click',()=>{if(!levelMenu.disabled)showSelection(true);});
homeButton.addEventListener('click',()=>{if(!homeButton.disabled)showHome(true);});
restartButton.addEventListener('click',()=>reset(false));
replay.addEventListener('click',()=>reset(true));
advance.addEventListener('click',()=>{if(state.phase==='success'&&following){mountLevel(following,mode);app.querySelector<HTMLButtonElement>('#level-menu')?.focus();}});
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
  if(policy.hints)feedbackHistory=recordAttemptFeedback(feedbackHistory,id,level,result,equations,mode==='cadet'?2:1);hintView.update(policy.hints?feedbackHistory.latest:null);status.dataset.outcome=result.event.kind==='exit'?'success':'failure';
  status.textContent=modeAttemptFeedback(mode,result)+(state.phase==='retry'?(policy.unlimited?' Unlimited retries — adjust and try again.':' '+state.waiting+' left — try again.'):'')+(result.event.kind!=='exit'&&result.gemHits.length?' Gems reset.':'');
  sync();if(state.phase==='celebrating')celebrate();else if(isTerminal(state))heading.focus();else {selectCannon(result.terminalCannonId);sync();editor.focus();}
 },ids=>{if(state.active?.id===id){liveGemCount=ids.length;updateGemReadout();}})){state=previous;hideStatus();if(feedbackHistory.latest&&state.lastResult){status.hidden=false;status.dataset.outcome='failure';status.textContent=modeAttemptFeedback(mode,state.lastResult);hintView.update(feedbackHistory.latest);}sync();}
});
sync();

cleanup=scene.destroy;addAudioCleanup();
}
showHome();
