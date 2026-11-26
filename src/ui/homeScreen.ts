import {mountHomeScene} from '../rendering/homeScene';
import type {Level} from '../levels/schema';
import {levels,worlds,worldForLevel} from '../levels/catalog';
// Keep navigation in native HTML; the visual demonstration is decorative.
export function mountHomeScreen(root:HTMLElement,level:Level,onPlay:()=>void,focusPlay=false){
 root.innerHTML='<main class="home-screen" aria-label="Cannon Graphs home"><div class="home-intro"><div class="home-eyebrow">A graph-powered adventure</div><h1>Cannon <span>Graphs!</span></h1><p>Plot the path. Launch the Pips.</p></div><div class="home-art" aria-hidden="true"></div><div class="home-bottom"><div class="home-details"><strong>'+worlds.length+' worlds</strong><span aria-hidden="true"> · </span><strong>'+levels.length+' levels</strong></div><div class="home-primary"><button class="home-play" id="home-play" type="button">Play <span aria-hidden="true">▶</span></button><p id="home-destination"></p></div><button type="button" class="home-motion" id="home-motion">Pause animation</button></div></main>';
 const play=root.querySelector<HTMLButtonElement>('#home-play')!,motion=root.querySelector<HTMLButtonElement>('#home-motion')!;
 root.querySelector<HTMLElement>('#home-destination')!.textContent=level===levels[0]?'Start in '+worlds[0].name:'Return to '+worldForLevel(level.id)?.name+' · '+level.title;
 const stop=mountHomeScene(root.querySelector<HTMLElement>('.home-art')!,motion);
 play.addEventListener('click',onPlay);
 if(focusPlay)play.focus();
 return ()=>{stop();play.removeEventListener('click',onPlay);};
}
