import type {PipPose} from '../animations/launch';
import {defaultPipLook,pipArtColours,type PipLook} from '../game/pipCosmetics';
const ns='http://www.w3.org/2000/svg';
export function svgNode(tag:string,attrs:Record<string,string|number>={},parent?:Element){
 const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent?.append(e);return e;
}
export interface PipSprite {root:SVGGElement;setPose:(pose:PipPose)=>void;setStretch:(stretch:number)=>void;setWalkCycle:(cycle?:number)=>void}
// Original, reusable vector character. Local origin is the centre of the body,
// matching the world position supplied by the flight renderer.
export function createPip(parent:Element,variant=0,look:PipLook=defaultPipLook):PipSprite{
 const {fur,light,frame,lens,rim}=pipArtColours(look,variant),ink='#6c4835';
 const g=svgNode('g',{'aria-hidden':'true','pointer-events':'none','data-pip-fur':look.fur,'data-pip-goggles':look.goggles,'data-pip-headgear':look.headgear,'data-pip-accessory':look.accessory},parent) as SVGGElement;
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
 // Accessories are drawn on the belly, behind the expressive face.
 const accessories=shape('g',{'data-cosmetic-slot':'accessory'});
 if(look.accessory==='bow'){
  shape('path',{d:'M-.025 .137 L-.092 .105 V.177 L-.025 .151 M.025 .137 L.092 .105 V.177 L.025 .151Z',fill:'#a64c53',stroke:ink,'stroke-width':.012,'stroke-linejoin':'round'},accessories);
  shape('rect',{x:-.025,y:.127,width:.05,height:.037,rx:.012,fill:'#df7f78',stroke:ink,'stroke-width':.009},accessories);
 }else if(look.accessory==='scarf'){
  shape('path',{d:'M-.128 .118 Q0 .16 .128 .118 L.125 .161 Q0 .198 -.124 .156Z M.095 .139 Q.161 .147 .185 .206 L.142 .223 .095 .173Z',fill:'#d48c3f',stroke:ink,'stroke-width':.011,'stroke-linejoin':'round'},accessories);
  shape('path',{d:'M-.076 .146 l.008 .03 M.075 .145 l-.01 .03 M.145 .198 l.025 -.008',fill:'none',stroke:'#ffe9ab','stroke-width':.012},accessories);
 }else if(look.accessory==='gem'){
  shape('path',{d:'M.09 .105 L.136 .145 .09 .182 .044 .145Z',fill:'#52cbb9',stroke:'#215d5e','stroke-width':.011,'stroke-linejoin':'round'},accessories);
  shape('path',{d:'M.09 .105 L.09 .182 M.044 .145 H.136',stroke:'#ddfff4','stroke-width':.009,fill:'none'},accessories);
 }else if(look.accessory==='wing'){
  shape('path',{d:'M0 .133 Q-.062 .094 -.137 .121 Q-.101 .165 -.025 .174 L0 .157 .025 .174 Q.101 .165 .137 .121 Q.062 .094 0 .133Z',fill:'#f2ce79',stroke:'#8c5b2e','stroke-width':.012},accessories);
  shape('circle',{cx:0,cy:.145,r:.024,fill:'#fff1b6',stroke:'#8c5b2e','stroke-width':.009},accessories);
 }else if(look.accessory==='star'){
  shape('path',{d:'M.09 .099 l.015 .03 .034 .005 -.024 .024 .006 .034 -.031 -.016 -.03 .016 .006 -.034 -.025 -.024 .034 -.005Z',fill:'#ffd969',stroke:'#93612f','stroke-width':.011,'stroke-linejoin':'round'},accessories);
 }
 // Headgear changes art only; all hats retain the same body origin.
 const hat=shape('g',{'data-cosmetic-slot':'headgear'});
 const cap=(fill:string,trim:string)=>{
  shape('path',{d:'M-.172 -.09 Q-.137 -.198 0 -.196 Q.137 -.198 .172 -.09 L.14 -.052 H-.14Z',fill,stroke:ink,'stroke-width':.014},hat);
  shape('path',{d:'M-.16 -.102 Q0 -.145 .16 -.102',stroke:trim,'stroke-width':.018,fill:'none'},hat);
 };
 switch(look.headgear){
  case 'beanie':
   shape('path',{d:'M-.177 -.103 Q-.176 -.254 0 -.251 Q.176 -.254 .177 -.103Z',fill:'#428a78',stroke:ink,'stroke-width':.014},hat);
   shape('circle',{cy:-.27,r:.038,fill:'#f3d18c',stroke:ink,'stroke-width':.01},hat);
   shape('path',{d:'M-.158 -.128 Q0 -.163 .158 -.128 L.161 -.092 H-.161Z',fill:'#80baa2',stroke:ink,'stroke-width':.011},hat);
   break;
  case 'helmet':
   shape('path',{d:'M-.181 -.091 Q-.20 -.218 -.071 -.25 H.071 Q.20 -.218 .181 -.091 L.138 -.059 H-.138Z',fill:'#d79755',stroke:ink,'stroke-width':.015},hat);
   shape('path',{d:'M-.027 -.245 H.027 V-.116 H-.027Z',fill:'#ffe9ba',stroke:ink,'stroke-width':.008},hat);
   for(const x of [-.157,.157])shape('circle',{cx:x,cy:-.132,r:.024,fill:'#765441',stroke:ink,'stroke-width':.01},hat);
   break;
  case 'captain':
   shape('path',{d:'M-.174 -.117 L-.197 -.194 Q0 -.292 .197 -.194 L.174 -.117Z',fill:'#365979',stroke:ink,'stroke-width':.015},hat);
   shape('path',{d:'M-.177 -.133 Q0 -.17 .177 -.133 L.176 -.101 H-.176Z',fill:'#e6bc64',stroke:ink,'stroke-width':.01},hat);
   shape('path',{d:'M-.177 -.101 Q0 -.123 .177 -.101 Q.13 -.062 0 -.068 Q-.13 -.062 -.177 -.101Z',fill:'#24384f',stroke:ink,'stroke-width':.009},hat);
   shape('circle',{cy:-.19,r:.023,fill:'#ffeab0'},hat);
   break;
  case 'crown':
   cap('#86634e','#e3bb6e');
   shape('path',{d:'M-.142 -.145 L-.167 -.274 -.081 -.223 0 -.313 .081 -.223 .167 -.274 .142 -.145Z',fill:'#ffd575',stroke:'#885c2b','stroke-width':.014,'stroke-linejoin':'round'},hat);
   shape('path',{d:'M-.136 -.163 H.136',stroke:'#fff5be','stroke-width':.018,'stroke-linecap':'round'},hat);
   shape('circle',{cy:-.22,r:.026,fill:'#9edbe6',stroke:'#885c2b','stroke-width':.009},hat);
   break;
  case 'astral':
   shape('path',{d:'M-.187 -.09 Q-.206 -.275 0 -.286 Q.206 -.275 .187 -.09 L.141 -.06 H-.141Z',fill:'#7d8fc1',stroke:'#4b4c75','stroke-width':.016},hat);
   shape('path',{d:'M-.144 -.136 Q-.147 -.243 0 -.248 Q.147 -.243 .144 -.136',fill:'#dae5fb',stroke:'#5c729e','stroke-width':.01},hat);
   shape('path',{d:'M0 -.234 L.012 -.203 .043 -.191 .012 -.179 0 -.148 -.012 -.179 -.043 -.191 -.012 -.203Z',fill:'#e6bd69',stroke:'#82719a','stroke-width':.008},hat);
   for(const x of [-.17,.17])shape('rect',{x:x-.018,y:-.147,width:.036,height:.06,rx:.01,fill:'#b8f1e8',stroke:'#4b4c75','stroke-width':.009},hat);
   break;
  default:cap('#936342','#d4a56e');
 }
 // Shiny goggles remain anchored to the same positions for every pose.
 for(const x of [-.083,.083]){
  shape('rect',{x:x-.069,y:-.127,width:.138,height:.091,rx:.035,fill:frame,stroke:'#3a302c','stroke-width':.011});
  shape('rect',{x:x-.052,y:-.114,width:.104,height:.063,rx:.025,fill:lens,stroke:rim,'stroke-width':.009});
  shape('path',{d:'M'+(x-.035)+' -.099 l.025 -.007',stroke:'white','stroke-width':.012,'stroke-linecap':'round'});
 }
 shape('path',{d:'M-.015 -.082 H.015',stroke:frame,'stroke-width':.018});
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
