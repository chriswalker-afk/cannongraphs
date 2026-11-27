import {mountHomeScene} from '../rendering/homeScene';
import {levels,worlds} from '../levels/catalog';
import {summarizeProgress,type Progress} from '../game/progress';
import type {PipLook} from '../game/pipCosmetics';
import type {CannonLook} from '../game/cannonCosmetics';
// Keep navigation in native HTML; the visual demonstration is decorative.
export function mountHomeScreen(root:HTMLElement,onPlay:()=>void,focusPlay=false,log?:{progress:Progress;onOpen:()=>void;persisted:boolean;look?:PipLook;onWorkshop?:()=>void;cannonLook?:CannonLook;onCannonWorkshop?:()=>void;onLevelWorkshop?:()=>void;onCustomLibrary?:()=>void;onLiftDemos?:()=>void;reducedMotion?:boolean}){
 root.innerHTML='<main class="home-screen" aria-label="Cannon Graphs home"><div class="home-intro"><div class="home-eyebrow">A graph-powered adventure</div><h1>Cannon <span>Graphs!</span></h1><p>Plot the path. Launch the Pips.</p></div><div class="home-art" aria-hidden="true"></div><div class="home-bottom"><div class="home-details"><strong>'+worlds.length+' worlds</strong><span aria-hidden="true"> · </span><strong>'+levels.length+' levels</strong></div><div class="home-primary"><button class="home-play" id="home-play" type="button">Play <span aria-hidden="true">▶</span></button><p id="home-destination"></p></div><div class="home-utilities"><button type="button" class="home-motion" id="home-motion">Pause animation</button><button type="button" class="sound-settings" id="sound-settings" aria-label="Sound settings">♪ Off</button></div></div></main>';
 const play=root.querySelector<HTMLButtonElement>('#home-play')!,motion=root.querySelector<HTMLButtonElement>('#home-motion')!;
 root.querySelector<HTMLElement>('#home-destination')!.textContent='Choose your world';
 const details=root.querySelector<HTMLElement>('.home-details')!;
 let logButton:HTMLButtonElement|undefined,workshopButton:HTMLButtonElement|undefined,cannonButton:HTMLButtonElement|undefined;
 if(log){
  const summary=summarizeProgress(log.progress);logButton=document.createElement('button');logButton.type='button';logButton.className='home-log';logButton.textContent='Flight log · '+summary.completed+'/'+summary.total;logButton.setAttribute('aria-label','Flight log: '+summary.completed+' of '+summary.total+' levels completed'+(log.persisted?'':'. Local saving unavailable'));logButton.addEventListener('click',log.onOpen);details.replaceChildren(logButton);
 }
 if(log?.onWorkshop){workshopButton=document.createElement('button');workshopButton.type='button';workshopButton.id='home-workshop';workshopButton.className='home-log home-workshop';workshopButton.textContent='Creature Workshop';workshopButton.addEventListener('click',log.onWorkshop);details.append(workshopButton);}
 if(log?.onCannonWorkshop){cannonButton=document.createElement('button');cannonButton.type='button';cannonButton.id='home-cannon-workshop';cannonButton.className='home-log home-cannon-workshop';cannonButton.textContent='Cannon Workshop';cannonButton.addEventListener('click',log.onCannonWorkshop);details.append(cannonButton);}
 if(log?.onLevelWorkshop){const b=document.createElement('button');b.type='button';b.id='home-level-workshop';b.className='home-log home-level-workshop';b.textContent='Level Workshop';b.addEventListener('click',log.onLevelWorkshop);details.append(b);}
 if(log?.onCustomLibrary){const b=document.createElement('button');b.type='button';b.id='home-custom-library';b.className='home-log home-custom-library';b.textContent='Custom Levels';b.addEventListener('click',log.onCustomLibrary);details.append(b);}
 if(log?.onLiftDemos){const b=document.createElement('button');b.type='button';b.id='home-lift-demos';b.className='home-log home-lift-demos';b.textContent='Broken Foundry · Demo';b.addEventListener('click',log.onLiftDemos);details.append(b);}
 const stop=mountHomeScene(root.querySelector<HTMLElement>('.home-art')!,motion,log?.look,log?.cannonLook,log?.reducedMotion??false);
 play.addEventListener('click',onPlay);
 if(focusPlay)play.focus();
 return ()=>{stop();play.removeEventListener('click',onPlay);if(logButton&&log)logButton.removeEventListener('click',log.onOpen);if(workshopButton&&log?.onWorkshop)workshopButton.removeEventListener('click',log.onWorkshop);if(cannonButton&&log?.onCannonWorkshop)cannonButton.removeEventListener('click',log.onCannonWorkshop);};
}
