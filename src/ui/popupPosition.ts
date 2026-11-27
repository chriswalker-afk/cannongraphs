export interface Rect {left:number;top:number;right:number;bottom:number}
export function popupPosition(anchor:Rect,area:Rect,width:number,height:number){
 const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(Math.max(lo,hi),v)),gap=10;
 const x=anchor.right+gap+width<=area.right?anchor.right+gap:anchor.left-gap-width>=area.left?anchor.left-gap-width:clamp((anchor.left+anchor.right-width)/2,area.left,area.right-width);
 const beside=x>=anchor.right||x+width<=anchor.left;
 const y=beside?anchor.top:anchor.bottom+gap+height<=area.bottom?anchor.bottom+gap:anchor.top-gap-height;
 return {left:clamp(x,area.left,area.right-width),top:clamp(y,area.top,area.bottom-height)};
}
