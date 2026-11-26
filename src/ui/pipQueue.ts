import {createPip,svgNode} from '../rendering/pip';
import type {LevelState} from '../game/levelState';
export function mountPipQueue(root:HTMLElement,total:number){
 const row=document.createElement('div');row.className='pip-lineup';row.setAttribute('aria-hidden','true');
 const count=document.createElement('span');count.className='pip-count';root.replaceChildren(row,count);
 const visible=Math.min(8,total),icons:SVGSVGElement[]=[],sprites:ReturnType<typeof createPip>[]=[];
 for(let i=0;i<visible;i++){
  const svg=svgNode('svg',{viewBox:'-.30 -.34 .60 .66',class:'queue-pip'},row) as SVGSVGElement;
  const pip=createPip(svg,i);pip.setPose(i%3===0?'excited':'idle');
  pip.root.classList.add('pip-bob');pip.root.style.setProperty('--pip-delay',(-i*.19)+'s');
  icons.push(svg);sprites.push(pip);
 }
 function update(s:LevelState){
  const active=s.active?1:0;
  icons.forEach((icon,i)=>{
   const status=i<s.failed?'lost':i<s.failed+s.saved?'saved':i<s.failed+s.saved+active?'active':'waiting';
   icon.dataset.status=status;
   sprites[i].setPose(status==='lost'?'disappointed':status==='saved'?'excited':i%3===0?'excited':'idle');
  });
  count.textContent=s.waiting+' waiting'+(active?' · 1 on a mission':'')+(s.saved?' · '+s.saved+' arrived':'')+(s.failed?' · '+s.failed+' lost':'');
  root.setAttribute('aria-label',count.textContent);
 }
 return {update};
}
