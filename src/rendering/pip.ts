import type {PipPose} from '../animations/launch';
const ns='http://www.w3.org/2000/svg';
export function svgNode(tag:string,attrs:Record<string,string|number>={},parent?:Element){
 const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent?.append(e);return e;
}
export interface PipSprite {root:SVGGElement;setPose:(pose:PipPose)=>void;setStretch:(stretch:number)=>void;setWalkCycle:(cycle?:number)=>void}
const colours=[['#ffd78c','#fff0ba'],['#ffc6b9','#fff0df'],['#d8c5f4','#f6eaff'],['#bfe7bb','#ecf8d5'],['#f8d49d','#fff4c7']];
// Original, reusable vector character. Local origin is the centre of the body,
// matching the world position supplied by the flight renderer.
export function createPip(parent:Element,variant=0):PipSprite{
 const [fur,light]=colours[((variant%colours.length)+colours.length)%colours.length],ink='#6c4835';
 const g=svgNode('g',{'aria-hidden':'true','pointer-events':'none'},parent) as SVGGElement;
 const body=svgNode('g',{class:'pip-body'},g);
 const shape=(tag:string,attrs:Record<string,string|number>,p:Element=body)=>svgNode(tag,attrs,p);
 // Small fluffy ears, feet and a soft rounded body.
 shape('path',{d:'M-.145 -.10 Q-.245 -.20 -.235 -.055 Q-.224 .015 -.15 -.01 M.145 -.10 Q.245 -.20 .235 -.055 Q.224 .015 .15 -.01',fill:fur,stroke:ink,'stroke-width':.016,'stroke-linejoin':'round'});
 const footL=shape('ellipse',{cx:-.095,cy:.172,rx:.067,ry:.038,fill:fur,stroke:ink,'stroke-width':.014});
 const footR=shape('ellipse',{cx:.095,cy:.172,rx:.067,ry:.038,fill:fur,stroke:ink,'stroke-width':.014});
 shape('path',{d:'M-.188 .015 C-.194 -.112 -.136 -.184 -.04 -.184 Q-.07 -.235 .015 -.197 Q.065 -.235 .085 -.17 C.177 -.14 .202 -.043 .184 .065 C.168 .158 .103 .188 0 .186 C-.105 .188 -.176 .148 -.188 .015Z',fill:fur,stroke:ink,'stroke-width':.017,'stroke-linejoin':'round'});
 shape('ellipse',{cx:0,cy:.085,rx:.134,ry:.087,fill:light,opacity:.76});
 // Arms are re-posed on launch so the Pip appears to relish the flight.
 const left=shape('path',{d:'M-.165 .045 Q-.245 .017 -.221 -.068',fill:'none',stroke:ink,'stroke-width':.035,'stroke-linecap':'round'});
 const right=shape('path',{d:'M.165 .045 Q.245 .017 .221 -.068',fill:'none',stroke:ink,'stroke-width':.035,'stroke-linecap':'round'});
 // Aviator cap and shiny goggles.
 shape('path',{d:'M-.172 -.09 Q-.137 -.198 0 -.196 Q.137 -.198 .172 -.09 L.14 -.052 H-.14Z',fill:'#936342',stroke:ink,'stroke-width':.014});
 shape('path',{d:'M-.16 -.102 Q0 -.145 .16 -.102',stroke:'#d4a56e','stroke-width':.018,fill:'none'});
 for(const x of [-.083,.083]){
  shape('rect',{x:x-.069,y:-.127,width:.138,height:.091,rx:.035,fill:'#513d35',stroke:'#3a302c','stroke-width':.011});
  shape('rect',{x:x-.052,y:-.114,width:.104,height:.063,rx:.025,fill:'#a6e1ee',stroke:'#e7c797','stroke-width':.009});
  shape('path',{d:'M'+(x-.035)+' -.099 l.025 -.007',stroke:'white','stroke-width':.012,'stroke-linecap':'round'});
 }
 shape('path',{d:'M-.015 -.082 H.015',stroke:'#513d35','stroke-width':.018});
 const eyes=shape('g',{fill:'#49332b'});
 for(const x of [-.066,.066]){
  shape('ellipse',{cx:x,cy:.007,rx:.019,ry:.027},eyes);
  shape('circle',{cx:x+.005,cy:-.001,r:.006,fill:'white'},eyes);
 }
 const happyEyes=shape('g',{fill:'none',stroke:'#49332b','stroke-width':.013,'stroke-linecap':'round',display:'none'});
 for(const x of [-.066,.066])shape('path',{d:'M'+(x-.022)+' .012 Q'+x+' -.022 '+(x+.022)+' .012'},happyEyes);
 for(const x of [-.117,.117])shape('ellipse',{cx:x,cy:.055,rx:.030,ry:.017,fill:'#f19b84',opacity:.85});
 const mouth=shape('path',{d:'M-.048 .066 Q0 .109 .048 .066',fill:'none',stroke:'#5b392f','stroke-width':.017,'stroke-linecap':'round'});
 const tongue=shape('ellipse',{cx:0,cy:.112,rx:.034,ry:.012,fill:'#f29289',display:'none'});
 const dizzy=shape('g',{display:'none',fill:'#f8cf65',stroke:'#b47d34','stroke-width':.009});
 for(const x of [-.17,.13])shape('path',{d:'M'+x+' -.27 l.025 .045 .05 .005 -.037 .032 .010 .05 -.048 -.023 -.044 .025 .008 -.05 -.038 -.032 .05 -.005Z'},dizzy);
 const dazed=shape('g',{display:'none',stroke:'#49332b','stroke-width':.014,'stroke-linecap':'round',fill:'none'});
 for(const x of [-.066,.066])shape('path',{d:'M'+(x-.022)+' -.012 l.044 .044 M'+(x+.022)+' -.012 l-.044 .044'},dazed);
 const sadEyes=shape('g',{display:'none',fill:'none',stroke:'#49332b','stroke-width':.014,'stroke-linecap':'round'});
 for(const x of [-.066,.066]){
  shape('path',{d:'M'+(x-.022)+' .006 Q'+x+' .023 '+(x+.022)+' .006'},sadEyes);
  shape('path',{d:'M'+(x-.025)+' -.019 l.041 .010'},sadEyes);
 }
 const setPose=(pose:PipPose)=>{
  const flying=pose==='flying',splat=pose==='splat',excited=pose==='excited'||flying,sad=pose==='rolling'||pose==='disappointed'||pose==='walking';
  mouth.setAttribute('d',excited?'M-.062 .058 Q0 .079 .062 .058 Q.057 .135 0 .137 Q-.057 .135 -.062 .058Z':'M-.048 .066 Q0 .109 .048 .066');
  mouth.setAttribute('fill',excited?'#6d3b36':'none');tongue.setAttribute('display',excited?'inline':'none');
  eyes.setAttribute('display',flying||splat||sad?'none':'inline');happyEyes.setAttribute('display',flying?'inline':'none');dazed.setAttribute('display',splat?'inline':'none');dizzy.setAttribute('display',splat?'inline':'none');sadEyes.setAttribute('display',sad?'inline':'none');if(splat||sad)mouth.setAttribute('d','M-.035 .093 Q0 .057 .035 .093');
  left.setAttribute('d',flying?'M-.165 .045 Q-.255 .010 -.267 -.052':sad?'M-.165 .045 Q-.192 .088 -.183 .139':'M-.165 .045 Q-.245 .017 -.221 -.068');
  right.setAttribute('d',flying?'M.165 .045 Q.255 .010 .267 -.052':sad?'M.165 .045 Q.192 .088 .183 .139':'M.165 .045 Q.245 .017 .221 -.068');
 };
 setPose('idle');
 return {root:g,setPose,setStretch:(s)=>body.setAttribute('transform','scale('+s+' '+(1/s)+')'),setWalkCycle:(cycle)=>{const dy=cycle===undefined?0:.035*Math.sin(cycle*2*Math.PI);footL.setAttribute('transform','translate(0 '+dy+')');footR.setAttribute('transform','translate(0 '+(-dy)+')');}};
}
