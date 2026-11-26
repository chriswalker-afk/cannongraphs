import './style.css';
import {meadowPreview} from './levels/worlds/meadow';
import {validateLevel} from './levels/schema';
import {mountScene} from './rendering/scene';
import {mountEquationEditor} from './ui/equationEditor';
import {mountPipQueue} from './ui/pipQueue';
import {simulateLinearAttempt} from './engine/simulation/linearAttempt';
import {attemptFeedback} from './game/attemptFeedback';
import {createLevelState,canPlan,canLaunch,beginAttempt,finishAttempt,restartLevel,isTerminal} from './game/levelState';
validateLevel(meadowPreview);
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<main><header><div class="brand"><span class="brand-mark" aria-hidden="true">✦</span><div><h1>Cannon Graphs!</h1><p>Meadow Launchers · First flight</p></div></div><div id="pip-queue" class="pip-queue" role="group" aria-label="Pips ready"></div><div class="level"><span>Level 1-01</span><small>First flight</small></div></header><div class="toolbar"><div id="inspect-info" role="status">Hover, tap or focus a cannon, exit or terrain to inspect its coordinates.</div><div class="camera-tools" role="group" aria-label="View controls"><button id="pan-left" aria-label="Pan left" title="Pan left">←</button><button id="pan-up" aria-label="Pan up" title="Pan up">↑</button><button id="pan-down" aria-label="Pan down" title="Pan down">↓</button><button id="pan-right" aria-label="Pan right" title="Pan right">→</button><button id="zoom-out" aria-label="Zoom out" title="Zoom out">−</button><output id="zoom-readout">100%</output><button id="zoom-in" aria-label="Zoom in" title="Zoom in">+</button><button id="zoom-reset" aria-label="Reset view" title="Reset view">↺</button></div></div><section class="stage" aria-label="Game scene"><div id="level-resolution" class="level-resolution" hidden><div class="resolution-icon" aria-hidden="true" id="resolution-icon"></div><h2 id="resolution-heading" tabindex="-1"></h2><p id="resolution-detail"></p><button id="replay-level" type="button"></button></div></section><footer class="planning-footer"><div class="planning-editor"><div id="equation-editor" class="equation-editor"></div><p id="flight-result" role="status" class="flight-result" hidden></p></div><div class="launch-panel"><button id="launch" class="launch" disabled>▶ Launch</button><button id="restart-level" class="restart-level" type="button">↺ Restart</button><small id="phase-label">Planning</small></div></footer></main>`;
const button=(id:string)=>document.querySelector<HTMLButtonElement>('#'+id)!;
const scene=mountScene(app.querySelector<HTMLElement>('.stage')!,meadowPreview,{in:button('zoom-in'),out:button('zoom-out'),reset:button('zoom-reset'),left:button('pan-left'),right:button('pan-right'),up:button('pan-up'),down:button('pan-down'),readout:document.querySelector('#zoom-readout')!,info:document.querySelector('#inspect-info')!});

const start=meadowPreview.cannons.find(c=>c.id===meadowPreview.startId)!;
const editorRoot=app.querySelector<HTMLElement>('#equation-editor')!,editor=mountEquationEditor(editorRoot,start,meadowPreview);
const queue=mountPipQueue(app.querySelector<HTMLElement>('#pip-queue')!,meadowPreview.creatures);
const launchButton=button('launch'),restartButton=button('restart-level'),replay=button('replay-level');
const status=app.querySelector<HTMLElement>('#flight-result')!,phaseLabel=app.querySelector<HTMLElement>('#phase-label')!;
const resolution=app.querySelector<HTMLElement>('#level-resolution')!,heading=app.querySelector<HTMLElement>('#resolution-heading')!,detail=app.querySelector<HTMLElement>('#resolution-detail')!,icon=app.querySelector<HTMLElement>('#resolution-icon')!;
let state=createLevelState(meadowPreview.creatures);
function sync(){
 const editable=canPlan(state),terminal=isTerminal(state),success=state.phase==='success';
 launchButton.disabled=!canLaunch(state)||!editor.getDraft().equation;
 launchButton.textContent=state.phase==='retry'?'▶ Try again':'▶ Launch';
 editorRoot.querySelectorAll<HTMLInputElement|HTMLButtonElement>('input,button').forEach(e=>{e.disabled=!editable;});
 restartButton.disabled=state.phase==='launching';
 queue.update(state);
 phaseLabel.textContent=({planning:'Planning',launching:'Launching…',retry:'Adjust and retry',success:'Level complete',gameOver:'No Pips left'} as const)[state.phase];
 resolution.hidden=!terminal;
 if(terminal){
  resolution.dataset.outcome=success?'success':'failure';
  icon.textContent=success?'✦':'↻';
  heading.textContent=success?'First flight complete!':'Out of Pips!';
  detail.textContent=success
   ?state.saved+' Pip reached the exit'+(state.waiting?'. '+state.waiting+' still waiting for the celebration.':'.')
   :'All '+state.total+' Pips have used their attempts. Try the level again with a revised equation.';
  replay.textContent=success?'Play again':'Retry level';
 }
}
function hideStatus(){status.hidden=true;status.textContent='';delete status.dataset.outcome;}
function reset(keepEquation:boolean){
 const next=restartLevel(state);if(next===state)return;
 state=next;scene.clearFlight();hideStatus();
 if(!keepEquation)editor.setText('');
 sync();editor.focus();
}
editorRoot.addEventListener('equationchange',()=>{if(canPlan(state)){scene.clearFlight();hideStatus();}sync();});
restartButton.addEventListener('click',()=>reset(false));
replay.addEventListener('click',()=>reset(true));
launchButton.addEventListener('click',()=>{
 const equation=editor.getDraft().equation;if(!canLaunch(state)||!equation)return;
 const result=simulateLinearAttempt(equation,start,meadowPreview),previous=state,next=beginAttempt(state,result);
 if(!next.active||next===state)return;
 const id=next.active.id;
 state=next;status.hidden=false;status.dataset.outcome='flying';status.textContent='Here we go!';sync();
 if(!scene.playFlight(result,()=>{
  const resolved=finishAttempt(state,id);if(resolved===state)return;
  state=resolved;status.dataset.outcome=result.event.kind==='exit'?'success':'failure';
  status.textContent=attemptFeedback(result)+(state.phase==='retry'?' '+state.waiting+' left — adjust your equation and try again.':'');
  sync();if(isTerminal(state))heading.focus();else editor.focus();
 })){state=previous;hideStatus();sync();}
});
sync();
