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
const f=(n:number)=>String(n===0?0:n);
export function terrainInspection(o:Obstacle){
 const b=o.bounds,{width,height}=terrainDimensions(o);
 const lines=['x: ['+f(b.minX)+', '+f(b.maxX)+']','y: ['+f(b.minY)+', '+f(b.maxY)+']'];
 // Bounds use authored coordinates; dimensions are rounded only for display.
 const size='Width '+f(Number(width.toFixed(6)))+' · height '+f(Number(height.toFixed(6)));
 return {label:terrainLabel(o),lines:[...lines,size],detail:lines.join(' · ')+' · '+size};
}
// A nested SVG gives every texture an exact rectangular clip, including strokes.
// Local units are world units. Decorative patterning never expands the hitbox.
export function renderTerrain(parent:Element,o:Obstacle,project:(p:Point)=>Point,scale:number):SVGGElement{
 const a=project({x:o.bounds.minX,y:o.bounds.maxY}),{width:w,height:h}=terrainDimensions(o),p=palette[o.kind];
 const group=svgNode('g',{'data-terrain-kind':o.kind},parent) as SVGGElement;
 const art=svgNode('svg',{x:a.x,y:a.y,width:w*scale,height:h*scale,viewBox:'0 0 '+w+' '+h,overflow:'hidden','aria-hidden':'true'},group);
 svgNode('rect',{width:w,height:h,fill:p.base},art);
 const cap=Math.min(h*.27,.14),isRoof=o.kind==='ceiling',top=isRoof?0:cap,bottom=isRoof?h-cap:h;
 const inner=Math.max(0,bottom-top);
 if(inner>0){
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
 const edgeY=isRoof?capY:cap;
 svgNode('line',{x1:0,x2:w,y1:edgeY,y2:edgeY,stroke:p.edge,'stroke-width':.028},art);
 svgNode('rect',{width:w,height:h,fill:'none',stroke:p.mortar,'stroke-width':.035},art);
 return group;
}
