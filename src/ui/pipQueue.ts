import {createPip,svgNode} from '../rendering/pip';
export function mountPipQueue(root:HTMLElement,total:number){
 const row=document.createElement('div');row.className='pip-lineup';row.setAttribute('aria-hidden','true');
 const count=document.createElement('span');count.className='pip-count';root.replaceChildren(row,count);
 const visible=Math.min(8,total),icons:SVGSVGElement[]=[];
 for(let i=0;i<visible;i++){
  const svg=svgNode('svg',{viewBox:'-.30 -.34 .60 .66',class:'queue-pip'},row) as SVGSVGElement;
  const pip=createPip(svg,i);pip.setPose(i%3===0?'excited':'idle');
  pip.root.classList.add('pip-bob');pip.root.style.setProperty('--pip-delay',(-i*.19)+'s');
  icons.push(svg);
 }
 const setBusy=(busy:boolean)=>{
  icons[0]?.classList.toggle('demo-away',busy);
  count.textContent=busy?(total-1)+' waiting · 1 flying':total+' Pips ready';
  root.setAttribute('aria-label',count.textContent);
 };
 setBusy(false);return {setBusy};
}
