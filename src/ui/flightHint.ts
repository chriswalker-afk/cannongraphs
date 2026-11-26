import type {AttemptHint} from '../game/flightDiagnosis';
export function mountFlightHint(root:HTMLElement){
 root.innerHTML='<div class="hint-line"><div class="hint-copy"><strong id="hint-heading"></strong><p id="hint-prompt"></p></div><button id="hint-toggle" type="button" aria-expanded="false" aria-controls="hint-evidence">Details</button></div><p id="hint-evidence" hidden></p>';
 const heading=root.querySelector<HTMLElement>('#hint-heading')!,prompt=root.querySelector<HTMLElement>('#hint-prompt')!,
  toggle=root.querySelector<HTMLButtonElement>('#hint-toggle')!,evidence=root.querySelector<HTMLElement>('#hint-evidence')!;
 const close=()=>{evidence.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Details';};
 toggle.addEventListener('click',()=>{
  evidence.hidden=!evidence.hidden;toggle.setAttribute('aria-expanded',String(!evidence.hidden));toggle.textContent=evidence.hidden?'Details':'Hide';
 });
 function update(hint:AttemptHint|null){
  close();root.hidden=!hint;
  if(!hint){heading.textContent=prompt.textContent=evidence.textContent='';return;}
  heading.textContent='Last attempt · Cannon '+hint.cannonId+' · '+hint.title;
  prompt.textContent=hint.prompt;
  evidence.textContent=hint.evidence;
 }
 update(null);return {update};
}
