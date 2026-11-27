import type {CannonType} from '../game/cannons';
import {cannonTypes} from '../game/cannons';
import {defaultCannonLook,cannonTrim,type CannonLook} from '../game/cannonCosmetics';
import {svgNode as el} from './pip';
// The muzzle is local (0,0) in every design; decoration never affects the
// collision geometry, mathematical launch anchor or recoil transform.
export function renderCannonArt(body:Element,type:CannonType,angle:number,look:CannonLook=defaultCannonLook,direction:1|-1=1){
 const style=cannonTypes[type],{metal,highlight}=cannonTrim(look,style.color);
 const base=el('g',{'data-cannon-base':look.base},body);
 el('ellipse',{cx:-.37,cy:.47,rx:.37,ry:.09,fill:'#584d42','fill-opacity':.35},base);
 switch(look.base){
  case 'stone':
   el('path',{d:'M-.74 .47 V.37 H-.67 V.21 H-.09 V.37 H-.01 V.47Z',fill:'#a9aba6',stroke:'#666e70','stroke-width':.025,'stroke-linejoin':'round'},base);
   el('path',{d:'M-.65 .30 H-.10 M-.47 .22 V.30 M-.27 .30 V.37',stroke:'#747b78','stroke-width':.018},base);
   break;
  case 'spring':
   el('rect',{x:-.74,y:.37,width:.73,height:.10,rx:.035,fill:'#627d7a',stroke:'#405c5b','stroke-width':.025},base);
   el('path',{d:'M-.53 .36 l.26 -.04 -.23 -.035 .23 -.035 -.26 -.04',fill:'none',stroke:'#9caeb1','stroke-width':.045,'stroke-linejoin':'round'},base);
   el('rect',{x:-.58,y:.18,width:.40,height:.06,rx:.02,fill:'#85a5a2',stroke:'#405c5b','stroke-width':.018},base);
   break;
  case 'steel':
   el('path',{d:'M-.72 .36 H-.05 L-.13 .21 H-.60Z',fill:'#83969f',stroke:'#4e6571','stroke-width':.025},base);
   for(const x of [-.58,-.18]){el('circle',{cx:x,cy:.37,r:.115,fill:'#62717a',stroke:'#46535d','stroke-width':.022},base);el('circle',{cx:x,cy:.37,r:.049,fill:metal,stroke:'#46535d','stroke-width':.015},base);}
   break;
  case 'royal':
   el('path',{d:'M-.74 .47 H-.01 L-.08 .36 H-.22 L-.27 .22 H-.49 L-.54 .36 H-.67Z',fill:'#8772a1',stroke:'#574867','stroke-width':.025,'stroke-linejoin':'round'},base);
   el('path',{d:'M-.67 .40 H-.08 M-.54 .34 H-.22',stroke:metal,'stroke-width':.026,'stroke-linecap':'round'},base);
   break;
  case 'hover':
   el('path',{d:'M-.73 .27 Q-.37 .20 -.02 .27 L-.12 .37 H-.62Z',fill:'#8194b8',stroke:'#485e82','stroke-width':.025},base);
   el('path',{d:'M-.61 .41 Q-.37 .47 -.13 .41 M-.52 .45 H-.22',stroke:'#81e3df','stroke-width':.025,fill:'none','stroke-linecap':'round'},base);
   break;
  default:
   el('rect',{x:-.74,y:.35,width:.73,height:.12,rx:.05,fill:'#a77347',stroke:'#694c38','stroke-width':.025},base);
 }
 el('circle',{cx:-.38,cy:.29,r:.18,fill:look.base==='timber'?'#b38856':look.base==='royal'?'#a495bf':'#9badb3',stroke:look.base==='timber'?'#715039':'#52636d','stroke-width':.035},base);
 if(look.base!=='timber')el('circle',{cx:-.38,cy:.29,r:.068,fill:metal,stroke:'#52636d','stroke-width':.018},base);
 const barrel=el('g',{transform:'rotate('+(-angle)+')','data-cannon-barrel':look.barrel,'data-cannon-trim':look.trim,'data-cannon-family':type},body);
 const hull=look.barrel==='precision'?'M-.70 -.12 Q-.68 -.17 -.58 -.17 H-.15 V.17 H-.58 Q-.68 .17 -.70 .12Z':look.barrel==='reinforced'?'M-.70 -.10 L-.61 -.19 H-.15 V.19 H-.61 L-.70 .10Z':look.barrel==='orbital'?'M-.70 -.10 Q-.64 -.20 -.50 -.18 H-.15 V.18 H-.50 Q-.64 .20 -.70 .10Z':undefined;
 const attributes={fill:style.color,stroke:'#254763','stroke-width':.035,'data-family-colour':type};
 if(hull)el('path',{d:hull,...attributes,'stroke-linejoin':'round'},barrel);
 else el('rect',{x:-.70,y:-.17,width:.65,height:.34,rx:look.barrel==='fluted'?.055:.1,...attributes},barrel);
 el('path',{d:'M-.60 -.105 H-.23',stroke:highlight,'stroke-width':.045,'stroke-linecap':'round',opacity:.75},barrel);
 const band=(x:number,w=.06,h=.34)=>el('rect',{x,y:-h/2,width:w,height:h,rx:.016,fill:metal,stroke:'#254763','stroke-width':.018},barrel);
 if(look.barrel==='riveted'){
  band(-.65,.065);for(const y of [-.105,.105])el('circle',{cx:-.20,cy:y,r:.025,fill:highlight,stroke:'#254763','stroke-width':.008},barrel);
 }else if(look.barrel==='fluted'){
  for(const y of [-.136,.134])el('path',{d:'M-.59 '+y+' H-.17',stroke:metal,'stroke-width':.024,'stroke-linecap':'round'},barrel);
  band(-.66,.055);
 }else if(look.barrel==='reinforced'){
  band(-.67,.08,.37);band(-.22,.06,.38);
 }else if(look.barrel==='precision'){
  band(-.67,.045,.29);el('path',{d:'M-.58 .13 H-.19',stroke:metal,'stroke-width':.024,'stroke-linecap':'round'},barrel);
 }else if(look.barrel==='orbital'){
  band(-.63,.075,.35);el('path',{d:'M-.52 .13 H-.18',stroke:'#a8f0ec','stroke-width':.028,'stroke-linecap':'round'},barrel);
 }
 el('rect',{x:-.15,y:-.21,width:.15,height:.42,rx:.035,fill:metal,stroke:'#254763','stroke-width':.035},barrel);
 el('ellipse',{cx:0,cy:0,rx:.045,ry:.16,fill:'#153147','data-cannon-muzzle':''},barrel);
 // Counter-mirror just the lettering when the body fires left. The symbol
 // retains its original centre and never changes with the equipped trim.
 const symbol=el('text',{x:0,y:0,transform:'translate(-.37 .06) scale('+direction+' 1)','text-anchor':'middle','font-size':.21,fill:'white','font-weight':800,'data-family-symbol':type},barrel);symbol.textContent=style.symbol;
 return barrel;
}
