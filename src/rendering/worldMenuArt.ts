import {svgNode as el,createPip} from './pip';
import {renderCannonArt} from './cannonArt';
import {renderFloatingScenery} from './floatingScenery';
import {renderPeakScenery} from './peakScenery';
import {renderRuinsScenery} from './ruinsScenery';
import {renderFactoryScenery} from './factoryScenery';
import {renderCosmicScenery} from './cosmicScenery';
import {identityForWorld} from '../game/worldIdentity';
import {cannonTypes,type CannonType} from '../game/cannons';
// Decorative destination postcards, not miniature solutions to real levels.
// Fixed viewBox makes the same artwork work on cards and the level banner.
export function renderWorldMenuArt(host:HTMLElement,number:number){
 const w=360,h=150,identity=identityForWorld(number);
 const svg=el('svg',{viewBox:'0 0 360 150','aria-hidden':'true',focusable:'false',preserveAspectRatio:'xMidYMid slice'},host);
 el('rect',{width:w,height:h,fill:identity.sky},svg);
 if(number===1){
  el('circle',{cx:285,cy:32,r:25,fill:'#fff0b7'},svg);
  for(const [x,y] of [[55,26],[155,17],[320,64]]){const cloud=el('g',{transform:'translate('+x+' '+y+')',fill:'#fffdf3',opacity:.74},svg);el('ellipse',{rx:29,ry:8},cloud);el('circle',{cx:-11,cy:-4,r:11},cloud);el('circle',{cx:8,cy:-6,r:15},cloud);}
  el('path',{d:'M0 101 Q58 36 122 103 T244 94 T360 75 V150 H0Z',fill:'#a5c9ae'},svg);
  el('path',{d:'M0 125 Q65 83 136 123 T270 117 T360 111 V150 H0Z',fill:'#83b68c'},svg);
 }else if(number===2)renderFloatingScenery(svg,w,h);
 else if(number===3)renderPeakScenery(svg,w,h);
 else if(number===4)renderRuinsScenery(svg,w,h);
 else if(number===5||number===7)renderFactoryScenery(svg,w,h);
 else renderCosmicScenery(svg,w,h);
 // Strong foreground landmark for each destination.
 const fg=el('g',{},svg);
 if(number===1){
  el('path',{d:'M0 117 Q80 105 143 117 T280 111 T360 116 V150 H0Z',fill:'#8b775e'},fg);
  el('path',{d:'M0 117 Q80 105 143 117 T280 111 T360 116 V124 Q280 118 215 126 T80 121 T0 125Z',fill:'#83ad55'},fg);
  for(const x of [28,62,318,343]){
   el('rect',{x:x-2,y:88,width:4,height:29,fill:'#8f6d49'},fg);
   el('path',{d:'M'+x+' 70 l-13 23 h7 l-11 17 h34 l-11 -17 h7Z',fill:'#488763'},fg);
  }
 }else if(number===2){
  for(const [x,y,s] of [[30,119,.85],[151,104,1],[286,63,.82]]){
   const g=el('g',{transform:'translate('+x+' '+y+') scale('+s+')'},fg);
   el('path',{d:'M-52 0 L-40 18 -7 46 10 37 47 18 53 0Z',fill:'#838eae',stroke:'#64718e','stroke-width':1.2},g);
   el('path',{d:'M-52 0 Q0 -14 53 0 L43 6 -43 6Z',fill:'#78a99b'},g);
   el('path',{d:'M27 4 Q20 21 28 36 T24 65',fill:'none',stroke:'#d8f8ff','stroke-width':8,'stroke-linecap':'round'},g);
   el('path',{d:'M27 4 Q20 21 28 36 T24 65',fill:'none',stroke:'#75c3df','stroke-width':3},g);
  }
 }else if(number===3){
  el('path',{d:'M0 126 L62 32 120 126 185 76 232 126 297 22 360 116 V150 H0Z',fill:'#a09abf',stroke:'#817ca6','stroke-width':1},fg);
  el('path',{d:'M40 66 62 32 84 66 63 58Z M270 63 297 22 324 63 300 53Z',fill:'#faf5fa'},fg);
 }else if(number===4){
  el('path',{d:'M238 132 V62 Q238 15 281 15 Q324 15 324 62 V132 H305 V62 Q305 36 281 36 Q257 36 257 62 V132Z',fill:'#b59a6d',stroke:'#847052','stroke-width':1.6},fg);
  for(const y of [62,80,98,116])el('path',{d:'M238 '+y+' h19 M305 '+y+' h19',stroke:'#887556','stroke-width':1.4},fg);
  el('path',{d:'M245 40 Q229 64 247 78 T241 120 M319 39 Q336 70 319 91',fill:'none',stroke:'#5c8a58','stroke-width':5,'stroke-linecap':'round'},fg);
  el('path',{d:'M220 132 H342',stroke:'#987e55','stroke-width':8,'stroke-linecap':'round'},fg);
 }else if(number===5){
  const g=el('g',{transform:'translate(290 74)'},fg),pts:string[]=[];
  for(let i=0;i<48;i++){const a=i*Math.PI/24,r=i%4===1||i%4===2?49:40;pts.push(r*Math.cos(a)+','+r*Math.sin(a));}
  el('polygon',{points:pts.join(' '),fill:'#bca175',stroke:'#7d725e','stroke-width':2},g);
  el('circle',{r:28,fill:'#d9c5a5',stroke:'#7d725e','stroke-width':2},g);
  el('circle',{r:10,fill:'#899b9e',stroke:'#7d725e','stroke-width':2},g);
  for(let i=0;i<5;i++){const a=i*2*Math.PI/5;el('line',{x1:0,y1:0,x2:24*Math.cos(a),y2:24*Math.sin(a),stroke:'#8d8778','stroke-width':5,'stroke-linecap':'round'},g);}
  el('path',{d:'M25 15 V74 Q25 92 45 92 H76',fill:'none',stroke:'#71898f','stroke-width':16,'stroke-linecap':'round'},fg);
  el('path',{d:'M25 15 V74 Q25 92 45 92 H76',fill:'none',stroke:'#b79e72','stroke-width':8,'stroke-linecap':'round'},fg);
 }else if(number===7){
  for(const [x,y] of [[145,96],[270,56]]){el('rect',{x:x-7,y:14,width:14,height:125,rx:4,fill:'#596a6b'},fg);el('path',{d:'M'+x+' 18 V136',stroke:'#c3ccca','stroke-width':4},fg);el('rect',{x:x-36,y:y+21,width:72,height:12,rx:2,fill:'#e7b34b',stroke:'#504b39','stroke-width':2},fg);for(let i=0;i<5;i++)el('path',{d:'M'+(x-32+i*13)+' '+(y+21)+' l6 0 -5 12 -6 0Z',fill:'#504b39'},fg);}
 }else{
  const g=el('g',{transform:'translate(281 62) rotate(-16)'},fg);
  el('ellipse',{rx:64,ry:17,fill:'none',stroke:'#8c95c4','stroke-width':7},g);
  el('circle',{r:36,fill:'#b597c7',stroke:'#8d78b2','stroke-width':1.5},g);
  el('path',{d:'M-32 -10 Q0 7 32 -10 M-32 11 Q0 25 32 11',fill:'none',stroke:'#edc4dc','stroke-width':6,opacity:.75},g);
  el('path',{d:'M-64 0 A64 17 0 0 0 64 0',fill:'none',stroke:'#e0e4f7','stroke-width':7},g);
  for(const [x,y] of [[40,35],[110,22],[209,25],[332,112]])el('path',{d:'M'+(x-4)+' '+y+' h8 M'+x+' '+(y-4)+' v8',stroke:'#fff9dc','stroke-width':2,'stroke-linecap':'round'},fg);
 }
 // Stylised graph-family glyph, independent of the real level geometry.
 const motifs:Record<number,{d:string;type:CannonType;angle:number}>={
  1:{d:'M104 96 L216 29',type:'linear',angle:31},
  2:{d:'M104 96 L232 52',type:'linear',angle:19},
  3:{d:'M104 96 Q171 -32 238 96',type:'quadratic',angle:63},
  4:{d:'M104 49 Q161 144 218 49',type:'quadratic',angle:-59},
  5:{d:'M104 96 C141 -18 184 144 230 40',type:'cubic',angle:72},
  6:{d:'M104 86 C122 35 150 35 168 86 S214 137 232 86',type:'wave',angle:70},
  7:{d:'M104 96 Q170 -13 238 56',type:'quadratic',angle:58}
 };
 const motif=motifs[number];
 el('path',{d:motif.d,stroke:'#fffef1','stroke-width':5,opacity:.8,fill:'none','stroke-linecap':'round'},fg);
 el('path',{d:motif.d,stroke:cannonTypes[motif.type].color,'stroke-width':2.8,'stroke-dasharray':'5 4',fill:'none','stroke-linecap':'round'},fg);
 const y=number===4?49:number===6?86:96;
 const pl=el('g',{transform:'translate(104 '+y+') scale(43)'},fg);
 el('rect',{x:-.92,y:.48,width:1.25,height:.16,rx:.05,fill:identity.ground,stroke:identity.ink,'stroke-width':.02},pl);
 renderCannonArt(pl,motif.type,motif.angle);
 const pip=createPip(fg,number);pip.root.setAttribute('transform','translate(70 '+(y-12)+') scale(39)');pip.setPose('excited');
}
