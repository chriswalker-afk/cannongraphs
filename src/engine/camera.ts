import type {Bounds,Point,Viewport} from './coordinates';
export interface Camera {zoom:number;center:Point}
export const MIN_ZOOM=1,MAX_ZOOM=2.5;
export function initialCamera(b:Bounds):Camera{return {zoom:1,center:{x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2}};}
export function cameraTransform(b:Bounds,v:Viewport,camera:Camera){
 const w=v.width-2*v.padding,h=v.height-2*v.padding;
 if(w<=0||h<=0||b.maxX<=b.minX||b.maxY<=b.minY||!Number.isFinite(camera.zoom)||!Number.isFinite(camera.center.x)||!Number.isFinite(camera.center.y))throw new RangeError('Invalid camera');
 const zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,camera.zoom)),scale=Math.min(w/(b.maxX-b.minX),h/(b.maxY-b.minY))*zoom;
 const clamp=(c:number,min:number,max:number,half:number)=>half*2>=max-min?(min+max)/2:Math.max(min+half,Math.min(max-half,c));
 const center={x:clamp(camera.center.x,b.minX,b.maxX,w/(2*scale)),y:clamp(camera.center.y,b.minY,b.maxY,h/(2*scale))};
 const toScreen=(p:Point):Point=>({x:v.width/2+(p.x-center.x)*scale,y:v.height/2-(p.y-center.y)*scale});
 const toWorld=(p:Point):Point=>({x:center.x+(p.x-v.width/2)/scale,y:center.y-(p.y-v.height/2)/scale});
 return {scale,center,zoom,toScreen,toWorld,visible:{minX:center.x-w/(2*scale),maxX:center.x+w/(2*scale),minY:center.y-h/(2*scale),maxY:center.y+h/(2*scale)}};
}
export function zoomCamera(b:Bounds,v:Viewport,camera:Camera,next:number,anchor?:Point):Camera{
 const current=cameraTransform(b,v,camera),zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,next));
 const ratio=current.zoom/zoom;
 const center=anchor?{x:anchor.x+(current.center.x-anchor.x)*ratio,y:anchor.y+(current.center.y-anchor.y)*ratio}:current.center;
 const fitted=cameraTransform(b,v,{zoom,center});return {zoom:fitted.zoom,center:fitted.center};
}
export function panCamera(b:Bounds,v:Viewport,camera:Camera,dx:number,dy:number):Camera{
 const t=cameraTransform(b,v,camera),fitted=cameraTransform(b,v,{zoom:t.zoom,center:{x:t.center.x-dx/t.scale,y:t.center.y+dy/t.scale}});
 return {zoom:fitted.zoom,center:fitted.center};
}
