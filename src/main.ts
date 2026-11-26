import './style.css';
import {meadowPreview} from './levels/worlds/meadow';
import {validateLevel} from './levels/schema';
import {mountScene} from './rendering/scene';
import {mountEquationEditor} from './ui/equationEditor';
import {mountPipQueue} from './ui/pipQueue';
import {simulateLinearAttempt} from './engine/simulation/linearAttempt';
import {attemptFeedback} from './game/attemptFeedback';
validateLevel(meadowPreview);
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<main><header><div class="brand"><span class="brand-mark" aria-hidden="true">✦</span><div><h1>Cannon Graphs!</h1><p>Meadow Launchers · First flight</p></div></div><div id="pip-queue" class="pip-queue" role="group" aria-label="Pips ready"></div><div class="level"><span>Level 1-01</span><small>Flight practice</small></div></header><div class="toolbar"><div id="inspect-info" role="status">Hover, tap or focus a cannon, exit or terrain to inspect its coordinates.</div><div class="camera-tools" role="group" aria-label="View controls"><button id="pan-left" aria-label="Pan left" title="Pan left">←</button><button id="pan-up" aria-label="Pan up" title="Pan up">↑</button><button id="pan-down" aria-label="Pan down" title="Pan down">↓</button><button id="pan-right" aria-label="Pan right" title="Pan right">→</button><button id="zoom-out" aria-label="Zoom out" title="Zoom out">−</button><output id="zoom-readout">100%</output><button id="zoom-in" aria-label="Zoom in" title="Zoom in">+</button><button id="zoom-reset" aria-label="Reset view" title="Reset view">↺</button></div></div><section class="stage" aria-label="Game scene"></section><footer class="planning-footer"><div class="planning-editor"><div id="equation-editor" class="equation-editor"></div><p id="flight-result" role="status" class="flight-result" hidden></p></div><div class="launch-panel"><button id="launch" class="launch" disabled>▶ Launch</button><small>Practice · unlimited launches</small></div></footer></main>`;
const button=(id:string)=>document.querySelector<HTMLButtonElement>('#'+id)!;
const scene=mountScene(app.querySelector<HTMLElement>('.stage')!,meadowPreview,{in:button('zoom-in'),out:button('zoom-out'),reset:button('zoom-reset'),left:button('pan-left'),right:button('pan-right'),up:button('pan-up'),down:button('pan-down'),readout:document.querySelector('#zoom-readout')!,info:document.querySelector('#inspect-info')!});

const start=meadowPreview.cannons.find(c=>c.id===meadowPreview.startId)!;
const editorRoot=app.querySelector<HTMLElement>('#equation-editor')!,editor=mountEquationEditor(editorRoot,start,meadowPreview);
const queue=mountPipQueue(app.querySelector<HTMLElement>('#pip-queue')!,meadowPreview.creatures);
const launchButton=button('launch'),status=app.querySelector<HTMLElement>('#flight-result')!;
let busy=false;
function sync(){launchButton.disabled=busy||!editor.getDraft().equation;editorRoot.querySelectorAll<HTMLInputElement|HTMLButtonElement>('input,button').forEach(e=>{e.disabled=busy;});}
editorRoot.addEventListener('equationchange',()=>{if(!busy){scene.clearFlight();status.hidden=true;status.textContent='';delete status.dataset.outcome;}sync();});
launchButton.addEventListener('click',()=>{
 const e=editor.getDraft().equation;if(busy||!e)return;
 const result=simulateLinearAttempt(e,start,meadowPreview);
 busy=true;queue.setBusy(true);status.hidden=false;status.dataset.outcome='flying';status.textContent='Here we go!';sync();
 if(!scene.playFlight(result,()=>{
  busy=false;queue.setBusy(false);status.dataset.outcome=result.event.kind==='exit'?'success':'failure';status.textContent=attemptFeedback(result);sync();
 })){busy=false;queue.setBusy(false);sync();}
});
sync();
