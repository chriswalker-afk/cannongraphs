export interface Rect {left:number;top:number;right:number;bottom:number}
export function popupPosition(anchor:Rect,area:Rect,width:number,height:number){
 const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(Math.max(lo,hi),v)),gap=10;
 const x=anchor.right+gap+width<=area.right?anchor.right+gap:anchor.left-gap-width>=area.left?anchor.left-gap-width:clamp((anchor.left+anchor.right-width)/2,area.left,area.right-width);
 const beside=x>=anchor.right||x+width<=anchor.left;
 const y=beside?anchor.top:anchor.bottom+gap+height<=area.bottom?anchor.bottom+gap:anchor.top-gap-height;
 return {left:clamp(x,area.left,area.right-width),top:clamp(y,area.top,area.bottom-height)};
}

const overlap=(a:Rect,b:Rect)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
// A compact lift editor or full equation editor can fit into the unused
// stage wing. Do not reserve space when there is no adequate wing.
export function foundryPopupWidth(area:Rect,graph:Rect,locked:boolean):number{
 const available=Math.max(0,area.right-area.left),ideal=locked?302:390,minimum=locked?250:320;
 const wing=Math.max(graph.left-area.left,area.right-graph.right)-12;
 return Math.min(available,wing>=minimum?Math.min(ideal,wing):ideal);
}
export function foundryPopupPosition(anchor:Rect,area:Rect,graph:Rect,occupied:readonly Rect[],width:number,height:number){
 const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(Math.max(lo,hi),v)),gap=10;
 const base=popupPosition(anchor,area,width,height);
 const xs=[area.left,area.right-width,graph.left-gap-width,graph.right+gap,anchor.left-gap-width,anchor.right+gap,(anchor.left+anchor.right-width)/2,base.left];
 const ys=[area.top,area.bottom-height,anchor.top,anchor.bottom+gap,anchor.top-gap-height,(area.top+area.bottom-height)/2,base.top];
 let best=base,score=Infinity;
 const expanded={left:anchor.left-4,right:anchor.right+4,top:anchor.top-4,bottom:anchor.bottom+4};
 for(const x of xs)for(const y of ys){
  const left=clamp(x,area.left,area.right-width),top=clamp(y,area.top,area.bottom-height),r={left,top,right:left+width,bottom:top+height};
  const graphCover=overlap(r,graph),anchorCover=overlap(r,expanded),objectCover=occupied.reduce((n,b)=>n+overlap(r,b),0);
  const distance=Math.hypot((left+width/2)-(anchor.left+anchor.right)/2,(top+height/2)-(anchor.top+anchor.bottom)/2);
  const cost=graphCover+anchorCover*120+objectCover*24+distance*.15;
  if(cost<score){score=cost;best={left,top};}
 }
 return best;
}
