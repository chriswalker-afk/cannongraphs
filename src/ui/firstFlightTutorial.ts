import {tutorialMessage,tutorialStep,type TutorialContext} from '../game/firstFlightTutorial';
export function mountFirstFlightTutorial(main:HTMLElement,advanceIntro:()=>void,skip:()=>void,guide:(ids:ReturnType<typeof tutorialMessage>['guides'])=>void){
 const panel=document.createElement('section');panel.className='tutorial-coach';panel.id='tutorial-coach';panel.setAttribute('aria-label','Flight school tutorial');
 panel.innerHTML='<div class="tutorial-coach-copy" aria-live="polite" aria-atomic="true"><div class="tutorial-kicker" id="tutorial-step"></div><h2 id="tutorial-title"></h2><p id="tutorial-text"></p><div id="tutorial-maths" class="tutorial-maths" hidden></div></div><div class="tutorial-actions"><button id="tutorial-continue" type="button" hidden></button><button id="tutorial-skip" type="button">Skip tutorial →</button></div>';
 main.querySelector('.stage')!.before(panel);
 const tip=document.createElement('p');tip.className='tutorial-popup-tip';tip.id='tutorial-popup-tip';tip.hidden=true;main.querySelector('#popup-editor')!.before(tip);
 const get=<T extends HTMLElement=HTMLElement>(id:string)=>panel.querySelector<T>('#'+id)!;
 const next=get<HTMLButtonElement>('tutorial-continue'),skipButton=get<HTMLButtonElement>('tutorial-skip'),maths=get('tutorial-maths');
 next.addEventListener('click',advanceIntro);skipButton.addEventListener('click',skip);
 let previous='',previousTarget:Element|undefined;
 function update(ctx:TutorialContext){
  const step=tutorialStep(ctx),msg=tutorialMessage(step,ctx),key=step+'|'+msg.title;
  panel.dataset.step=step;main.dataset.tutorialStep=step;
  if(previous!==key){
   previous=key;get('tutorial-step').textContent='FLIGHT SCHOOL · '+msg.number+' / 7';get('tutorial-title').textContent=msg.title;get('tutorial-text').textContent=msg.text;
   maths.replaceChildren(...(msg.maths??[]).map(line=>{const p=document.createElement('div');p.textContent=line;return p;}));maths.hidden=!msg.maths;
   guide(msg.guides);
  }
  next.hidden=!msg.next;next.textContent=msg.next??'';
  skipButton.disabled=ctx.state.phase==='launching'||ctx.state.phase==='celebrating';skipButton.hidden=step==='finish';
  tip.hidden=!msg.popupTip||!ctx.popupOpen;tip.textContent=msg.popupTip??'';
  const target=msg.target?main.querySelector(msg.target):null;
  if(previousTarget!==target){previousTarget?.removeAttribute('data-tutorial-target');target?.setAttribute('data-tutorial-target','true');previousTarget=target??undefined;}
 }
 return {update};
}
