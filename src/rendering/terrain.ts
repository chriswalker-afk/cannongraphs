import type {Obstacle} from '../levels/schema';
import type {Point} from '../engine/coordinates';
import {terrainDimensions,terrainLabel} from '../levels/terrain';
import {svgNode} from './pip';
const palette={
 floor:{base:'#9b7957',mortar:'#735a44',light:'#be9872',edge:'#4e803e',cap:'#79a94f'},
 wall:{base:'#9d9a8e',mortar:'#6d7069',light:'#c4c0b0',edge:'#566c43',cap:'#8cad61'},
 platform:{base:'#a99074',mortar:'#746959',light:'#c4aa8d',edge:'#4e803e',cap:'#79a94f'},
 ceiling:{base:'#777f89',mortar:'#515b66',light:'#a0a9b1',edge:'#485563',cap:'#a3aeb6'}
} as const;
const skyPalette:typeof palette|{[K in keyof typeof palette]:{base:string;mortar:string;light:string;edge:string;cap:string}}={
 floor:{base:'#a2a0b8',mortar:'#77768e',light:'#c6c7df',edge:'#8092a9',cap:'#c4e0ed'},
 wall:{base:'#979db7',mortar:'#656e8a',light:'#bfc5df',edge:'#4a867d',cap:'#80b9a2'},
 platform:{base:'#a0a5c2',mortar:'#697390',light:'#c6c8e1',edge:'#4a867d',cap:'#85c3a8'},
 ceiling:{base:'#747c9f',mortar:'#505b7e',light:'#a4adce',edge:'#4c5979',cap:'#b0bbd6'}
};
const peakPalette={
 floor:{base:'#938b9f',mortar:'#686174',light:'#c0b5c8',edge:'#678a87',cap:'#a0c4b4'},
 wall:{base:'#9d94af',mortar:'#676177',light:'#c5bed3',edge:'#719b94',cap:'#d9e5e5'},
 platform:{base:'#a59ab7',mortar:'#70677d',light:'#cbbfd7',edge:'#78918e',cap:'#deebeb'},
 ceiling:{base:'#756d8d',mortar:'#534b69',light:'#aaa0bf',edge:'#605776',cap:'#b8aecb'}
};
const ruinsPalette={
 floor:{base:'#a88b65',mortar:'#76634c',light:'#d3b889',edge:'#607d53',cap:'#8ea671'},
 wall:{base:'#c0a477',mortar:'#877253',light:'#e0c69a',edge:'#677d50',cap:'#98ad77'},
 platform:{base:'#b39a72',mortar:'#7e6b52',light:'#d6bc90',edge:'#738a5c',cap:'#9fb780'},
 ceiling:{base:'#82785e',mortar:'#5e584a',light:'#b1a17f',edge:'#72664e',cap:'#b7a684'}
};
const factoryPalette={
 floor:{base:'#6d7c80',mortar:'#49595f',light:'#aebdc0',edge:'#80572c',cap:'#d6aa5e'},
 wall:{base:'#89999b',mortar:'#56676c',light:'#b9c6c5',edge:'#806033',cap:'#d8b273'},
 platform:{base:'#83979d',mortar:'#526a72',light:'#bdcdcc',edge:'#7c623e',cap:'#d9b882'},
 ceiling:{base:'#6d7f8a',mortar:'#4d5e6a',light:'#adbbc4',edge:'#795c38',cap:'#c9aa76'}
};
const foundryPalette={
 floor:{base:'#777f73',mortar:'#485750',light:'#aab4a1',edge:'#79603a',cap:'#dcb45e'},
 wall:{base:'#93968a',mortar:'#5f6d63',light:'#d2cbb5',edge:'#8c6337',cap:'#e2b563'},
 platform:{base:'#828e80',mortar:'#4c6256',light:'#c6ccad',edge:'#8a6a3b',cap:'#dcb35c'},
 ceiling:{base:'#75837a',mortar:'#495d54',light:'#bdc6b7',edge:'#8c6337',cap:'#e1b965'}
};
const cosmicPalette={
 floor:{base:'#737e9f',mortar:'#46536f',light:'#abb7d5',edge:'#508e9d',cap:'#91d1dc'},
 wall:{base:'#8f9abb',mortar:'#586480',light:'#c4cce3',edge:'#537f9a',cap:'#a1d2de'},
 platform:{base:'#929cbb',mortar:'#596680',light:'#c3cde8',edge:'#578899',cap:'#a9d7de'},
 ceiling:{base:'#707b9b',mortar:'#465371',light:'#abb5d0',edge:'#605b94',cap:'#b9ade3'}
};
const f=(n:number)=>String(n===0?0:n);
export function terrainInspection(o:Obstacle,world?:number){
 const b=o.bounds,{width,height}=terrainDimensions(o);
 const lines=['x: ['+f(b.minX)+', '+f(b.maxX)+']','y: ['+f(b.minY)+', '+f(b.maxY)+']'];
 // Bounds use authored coordinates; dimensions are rounded only for display.
 const size='Width '+f(Number(width.toFixed(6)))+' · height '+f(Number(height.toFixed(6)));
 return {label:terrainLabel(o,world),lines:[...lines,size],detail:lines.join(' · ')+' · '+size};
}
// A nested SVG gives every texture an exact rectangular clip, including strokes.
// Local units are world units. Decorative patterning never expands the hitbox.
export function renderTerrain(parent:Element,o:Obstacle,project:(p:Point)=>Point,scale:number,floating=false,peaks=false,ruins=false,factory=false,cosmic=false,foundry=false):SVGGElement{
 const a=project({x:o.bounds.minX,y:o.bounds.maxY}),{width:w,height:h}=terrainDimensions(o),p=(foundry?foundryPalette:cosmic?cosmicPalette:factory?factoryPalette:ruins?ruinsPalette:peaks?peakPalette:floating?skyPalette:palette)[o.kind];
 const group=svgNode('g',{'data-terrain-kind':o.kind},parent) as SVGGElement;
 const art=svgNode('svg',{x:a.x,y:a.y,width:w*scale,height:h*scale,viewBox:'0 0 '+w+' '+h,overflow:'hidden','aria-hidden':'true'},group);
 svgNode('rect',{width:w,height:h,fill:p.base},art);
 const cap=Math.min(h*.27,.14),isRoof=o.kind==='ceiling',top=isRoof?0:cap,bottom=isRoof?h-cap:h;
 const inner=Math.max(0,bottom-top);
 if(cosmic&&inner>0){
  // Panel seams and small cyan status lights remain within the exact clip.
  const rows=Math.min(24,Math.max(1,Math.ceil(inner/.72))),rowH=inner/rows,cols=Math.min(28,Math.max(1,Math.ceil(w/.9))),colW=w/cols;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const x=col*colW,y=top+row*rowH;
   svgNode('rect',{x,y,width:colW,height:rowH,fill:row%2===col%2?p.light:p.base,'fill-opacity':.14,stroke:p.mortar,'stroke-width':.025},art);
   if(colW>.16&&rowH>.2){const inset=Math.min(colW*.15,.065);
    svgNode('path',{d:'M'+(x+inset)+' '+(y+rowH*.6)+' l'+(colW*.18)+' '+(-rowH*.25)+' H'+(x+colW-inset),fill:'none',stroke:p.light,'stroke-width':.022,opacity:.8},art);
    if((row+col)%3===0)svgNode('rect',{x:x+colW*.38,y:y+rowH*.72,width:colW*.24,height:Math.min(.045,rowH*.1),rx:.012,fill:p.cap,opacity:.9},art);
   }
  }
 }else if(foundry&&inner>0){
  const rows=Math.min(22,Math.max(1,Math.ceil(inner/.85))),cols=Math.min(20,Math.max(1,Math.ceil(w/1.1))),rh=inner/rows,cw=w/cols;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const x=col*cw,y=top+row*rh;svgNode('rect',{x,y,width:cw,height:rh,fill:p.light,'fill-opacity':(row+col)%2?.10:.22,stroke:p.mortar,'stroke-width':.026},art);
   if(cw>.25&&rh>.25){for(const bx of [x+cw*.18,x+cw*.82])svgNode('circle',{cx:bx,cy:y+rh*.2,r:Math.min(.035,cw*.09,rh*.09),fill:p.mortar},art);}
   // Warm inspection grilles on furnace/boiler walls, pressure plates on roofs.
   if(o.kind==='wall'&&rh>.36&&cw>.4&&(row+col)%2===0){svgNode('rect',{x:x+cw*.19,y:y+rh*.40,width:cw*.62,height:rh*.36,rx:.04,fill:'#685a48',stroke:'#525a50','stroke-width':.025},art);for(let i=0;i<3;i++)svgNode('rect',{x:x+cw*(.26+i*.17),y:y+rh*.46,width:cw*.08,height:rh*.24,rx:.015,fill:'#e6a356'},art);}
  }
 }else if(factory&&inner>0){
  // Broad steel panels, inset bolt heads and a brass rim, all inside the clip.
  const rows=Math.min(24,Math.max(1,Math.ceil(inner/.85))),rowH=inner/rows,cols=Math.min(24,Math.max(1,Math.ceil(w/1.25))),colW=w/cols;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const x=col*colW,y=top+row*rowH;
   svgNode('rect',{x,y,width:colW,height:rowH,fill:row%2===col%2?p.light:p.base,'fill-opacity':.16,stroke:p.mortar,'stroke-width':.024},art);
   if(colW>.26&&rowH>.22){const r=Math.min(.048,colW*.13,rowH*.13);
    for(const bx of [x+colW*.18,x+colW*.82])for(const by of [y+rowH*.22,y+rowH*.78]){
     svgNode('circle',{cx:bx,cy:by,r,fill:p.mortar},art);
     svgNode('circle',{cx:bx-r*.2,cy:by-r*.22,r:r*.4,fill:p.light},art);
    }
   }
  }
 }else if(inner>0){
  const rows=Math.min(28,Math.max(1,Math.ceil(inner/.32))),rowH=inner/rows,brick=Math.max(.64,w/36);
  for(let row=0;row<rows;row++){
   const y=top+row*rowH;
   if(row%2===0)svgNode('rect',{x:0,y,width:w,height:rowH,fill:p.light,opacity:.17},art);
   if(row>0)svgNode('line',{x1:0,x2:w,y1:y,y2:y,stroke:p.mortar,'stroke-width':.024},art);
   for(let x=row%2?brick*.5:brick;x<w;x+=brick)svgNode('line',{x1:x,x2:x,y1:y,y2:y+rowH,stroke:p.mortar,'stroke-width':.022},art);
  }
 }
 const capY=isRoof?h-cap:0;
 svgNode('rect',{x:0,y:capY,width:w,height:cap,fill:p.cap},art);
 if(foundry)for(let x=-cap;x<w;x+=.32)svgNode('path',{d:'M'+x+' '+capY+' h.11 l'+cap+' '+cap+' h-.11Z',fill:'#5b5745',opacity:.9},art);
 const edgeY=isRoof?capY:cap;
 svgNode('line',{x1:0,x2:w,y1:edgeY,y2:edgeY,stroke:p.edge,'stroke-width':.028},art);
 svgNode('rect',{width:w,height:h,fill:'none',stroke:p.mortar,'stroke-width':.035},art);
 return group;
}
