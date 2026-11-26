export interface Point {x:number;y:number}
export interface Bounds {minX:number;maxX:number;minY:number;maxY:number}
export interface Viewport {width:number;height:number;padding:number}
export function coordinateSystem(b:Bounds,v:Viewport){
 if (![b.minX,b.maxX,b.minY,b.maxY,v.width,v.height,v.padding].every(Number.isFinite) || b.maxX<=b.minX || b.maxY<=b.minY || v.padding<0 || v.width<=2*v.padding || v.height<=2*v.padding) throw new RangeError('Invalid coordinate viewport');
 const scale=Math.min((v.width-2*v.padding)/(b.maxX-b.minX),(v.height-2*v.padding)/(b.maxY-b.minY));
 const left=(v.width-(b.maxX-b.minX)*scale)/2, top=(v.height-(b.maxY-b.minY)*scale)/2;
 return {scale,toScreen:(p:Point):Point=>({x:left+(p.x-b.minX)*scale,y:top+(b.maxY-p.y)*scale}),toWorld:(p:Point):Point=>({x:b.minX+(p.x-left)/scale,y:b.maxY-(p.y-top)/scale})};
}
