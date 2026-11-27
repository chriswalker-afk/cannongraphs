import {svgNode} from './pip';
const palettes:Readonly<Record<string,readonly [string,string,string]>>={
 smoke:['#fff8e5','#b9b4a9','#ffe78b'],sparks:['#f6b760','#a86c39','#ffe6a2'],
 frost:['#c6f5ff','#4d9dbb','#def8ff'],petals:['#f7b5cc','#b86d89','#fff2bb'],
 starburst:['#ffe47d','#ad782d','#fff2b1'],comet:['#b5a3f0','#6f64b0','#d5f4ff']
};
export function burstPalette(effect:string){return Object.hasOwn(palettes,effect)?palettes[effect]:palettes.smoke;}
const shapes:Readonly<Record<string,string>>={
 sparks:'M-.25 -.85 L.28 -.22 .82 0 .28 .22 -.25 .85 -.16 .22 -.82 0 -.16 -.22Z',
 frost:'M0 -1 L.62 -.44 .62 .44 0 1 -.62 .44 -.62 -.44Z',
 petals:'M0 -.95 Q.9 -.64 .67 .15 Q.45 .83 0 .95 Q-.82 .60 -.65 -.15 Q-.4 -.75 0 -.95Z',
 starburst:'M0 -1 L.26 -.31 .95 -.31 .42 .12 .59 .84 0 .44 -.59 .84 -.42 .12 -.95 -.31 -.26 -.31Z',
 comet:'M-1 0 Q-.35 -.58 .28 -.57 A.58 .58 0 1 1 .28 .57 Q-.35 .58 -1 0Z'
};
// Pool a bounded number of particles per launch. Only the already supplied
// burst phase controls visibility. No timer, audio or physics dependency.
export function createBurstParticles(parent:Element,effect='smoke',count=6){
 const [fill,stroke]=burstPalette(effect),shape=Object.hasOwn(shapes,effect)?shapes[effect]:undefined;
 const group=svgNode('g',{'data-cannon-effect':effect,'pointer-events':'none','aria-hidden':'true',display:'none'},parent);
 const particles=Array.from({length:count},(_,i)=>shape?svgNode('path',{d:shape,fill:i%3===0?burstPalette(effect)[2]:fill,stroke,'stroke-width':.12,'stroke-linejoin':'round'},group):svgNode('circle',{fill,stroke,'stroke-width':.009},group));
 function paint(burst:number|null,vx:number,vy:number,rapid=false){
  if(burst===null){group.setAttribute('display','none');return;}
  group.setAttribute('display','inline');const p=Math.max(0,Math.min(1,burst));
  particles.forEach((particle,i)=>{
   const d=.08+p*(rapid?.19+i*.04:.22+i*.025),side=(i-(count-1)/2)*(rapid?.055:.045*(1+p));
   const x=vx*d-vy*side,y=vy*d+vx*side,r=rapid?.045+p*.08:.045+p*.08+(i%2)*.02;
   if(shape){particle.setAttribute('transform','translate('+x+' '+y+') rotate('+(Math.atan2(vy,vx)*180/Math.PI+i*27+p*35)+') scale('+r+')');}
   else{particle.setAttribute('cx',String(x));particle.setAttribute('cy',String(y));particle.setAttribute('r',String(r));}
   particle.setAttribute('opacity',String((rapid?1:.75)*(1-p)));
  });
 }
 return {paint,group};
}
