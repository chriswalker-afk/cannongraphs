import './style.css';
import {meadowPreview} from './levels/worlds/meadow';
import {validateLevel} from './levels/schema';
import {renderScene} from './rendering/scene';
import {cannonTypes} from './game/cannons';
validateLevel(meadowPreview);
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML='<main><header><div><h1>Cannon Graphs!</h1><p>Meadow Launchers · First flight</p></div><span class="tag">Development preview</span></header><section class="stage" aria-label="Game scene"></section><footer><div class="equation"><strong>A · '+cannonTypes.linear.label+'</strong><span>'+cannonTypes.linear.form+'</span></div><p>Coordinate playground preview — flight controls arrive in later updates.</p><button disabled>Launch</button></footer></main>';
app.querySelector('.stage')!.append(renderScene(meadowPreview));
