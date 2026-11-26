import {createPip,svgNode} from '../rendering/pip';
import type {PipLook} from '../game/pipCosmetics';
import {activeCount,type LevelState} from '../game/levelState';
export function mountPipQueue(root:HTMLElement,total:number,look?:PipLook){
 const row=document.createElement('div');row.className='pip-lineup';row.setAttribute('aria-hidden','true');
 const count=document.createElement('span');count.className='pip-count';root.replaceChildren(row,count);
 const visible=Math.min(8,total),icons:SVGSVGElement[]=[],sprites:ReturnType<typeof createPip>[]=[];
 for(let i=0;i<visible;i++){
  const svg=svgNode('svg',{viewBox:'-.30 -.34 .60 .66',class:'queue-pip'},row) as SVGSVGElement;
  const pip=createPip(svg,i,look);pip.setPose(i%3===0?'excited':'idle');
  pip.root.classList.add('pip-bob');pip.root.style.setProperty('--pip-delay',(-i*.19)+'s');
  icons.push(svg);sprites.push(pip);
 }
 function update(s:LevelState){
  const active=activeCount(s);
  root.classList.toggle('celebrating',s.phase==='celebrating');
  const lost=s.unlimited?0:s.failed;
  icons.forEach((icon,i)=>{
   const status=i<lost?'lost':i<lost+s.saved?'saved':i<lost+s.saved+active?'active':'waiting';
   icon.dataset.status=status;
   sprites[i].setPose(status==='lost'?'disappointed':status==='saved'||(status==='waiting'&&s.phase==='celebrating')?'excited':i%3===0?'excited':'idle');
  });
  count.textContent=s.waiting+' waiting'+(active?' · '+active+' on a mission':'')+(s.saved?' · '+s.saved+' arrived':'')+(s.failed?' · '+s.failed+' lost':'');
  if(s.unlimited)count.textContent=(s.phase==='celebrating'||s.phase==='success'?s.saved+' arrived · Practice':'∞ attempts'+(active?' · '+active+' flying':'')+(s.failed?' · '+s.failed+' tried':''));
  root.setAttribute('aria-label',count.textContent.replace('∞','Unlimited'));
 }
 return {update};
}
