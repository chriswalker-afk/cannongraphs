import './style.css';
import {meadowPreview} from './levels/worlds/meadow';
import {validateLevel} from './levels/schema';
import {mountScene} from './rendering/scene';
import {mountEquationEditor} from './ui/equationEditor';
validateLevel(meadowPreview);
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<main><header><div class="brand"><span class="brand-mark" aria-hidden="true">✦</span><div><h1>Cannon Graphs!</h1><p>Meadow Launchers · First flight</p></div></div><div class="level"><span>Level 1-01</span><small>Equation workshop preview</small></div></header><div class="toolbar"><div id="inspect-info" role="status">Hover, tap or focus a cannon, exit or terrain to inspect its coordinates.</div><div class="camera-tools" role="group" aria-label="View controls"><button id="pan-left" aria-label="Pan left" title="Pan left">←</button><button id="pan-up" aria-label="Pan up" title="Pan up">↑</button><button id="pan-down" aria-label="Pan down" title="Pan down">↓</button><button id="pan-right" aria-label="Pan right" title="Pan right">→</button><button id="zoom-out" aria-label="Zoom out" title="Zoom out">−</button><output id="zoom-readout">100%</output><button id="zoom-in" aria-label="Zoom in" title="Zoom in">+</button><button id="zoom-reset" aria-label="Reset view" title="Reset view">↺</button></div></div><section class="stage" aria-label="Game scene"></section><footer class="planning-footer"><div id="equation-editor" class="equation-editor"></div><div class="launch-panel"><button class="launch" disabled>▶ Launch</button><small>Flight animation coming next</small></div></footer></main>`;
const button=(id:string)=>document.querySelector<HTMLButtonElement>('#'+id)!;
mountScene(app.querySelector<HTMLElement>('.stage')!,meadowPreview,{in:button('zoom-in'),out:button('zoom-out'),reset:button('zoom-reset'),left:button('pan-left'),right:button('pan-right'),up:button('pan-up'),down:button('pan-down'),readout:document.querySelector('#zoom-readout')!,info:document.querySelector('#inspect-info')!});

const start=meadowPreview.cannons.find(c=>c.id===meadowPreview.startId)!;
mountEquationEditor(app.querySelector<HTMLElement>('#equation-editor')!,start,meadowPreview);
