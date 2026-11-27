import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foundryPadding,liftGrip} from '../src/rendering/foundryLayout';
import {cameraTransform,initialCamera} from '../src/engine/camera';
import {foundryLevels} from '../src/levels/foundry';
import {foundryPopupPosition,foundryPopupWidth,type Rect} from '../src/ui/popupPosition';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7);
test('all twelve Foundry graphs fit fully with equal unit scales on compact and desktop stages',()=>{
 for(const l of foundryLevels)for(const [width,height] of [[1360,600],[1440,450],[844,210],[390,520],[320,250]]){
  const padding=foundryPadding(l.bounds,width,height),t=cameraTransform(l.bounds,{width,height,padding},initialCamera(l.bounds));
  assert.ok(padding>=18&&padding<=30);
  const a=t.toScreen({x:l.bounds.minX,y:l.bounds.maxY}),b=t.toScreen({x:l.bounds.maxX,y:l.bounds.minY});
  assert.ok(a.x>=padding-1e-7&&a.y>=padding-1e-7&&b.x<=width-padding+1e-7&&b.y<=height-padding+1e-7);
  const p=t.toScreen({x:0,y:0}),q=t.toScreen({x:1,y:1});near(q.x-p.x,p.y-q.y);
  for(const c of l.cannons.filter(c=>c.lift)){
   const grip=liftGrip(t.scale,c.direction);
   assert.ok(grip.width>=44&&grip.height>=44);assert.ok(grip.glyphWidth<=20&&grip.glyphHeight<=13);
   assert.ok(grip.dy>0);near(grip.dx,-c.direction*.36*t.scale);
  }
  const oldPadding=Math.min(34,Math.max(27,Math.floor(Math.min(width,height)*.09)));
  assert.ok(t.scale>=cameraTransform(l.bounds,{width,height,padding:oldPadding},initialCamera(l.bounds)).scale-1e-7);
 }
});
test('popup uses spare side space and never needs to cover the graph on a wide stage',()=>{
 const area={left:8,top:100,right:1352,bottom:640},graph={left:420,top:120,right:920,bottom:620},anchor={left:450,top:350,right:500,bottom:400};
 for(const locked of [true,false]){
  const w=foundryPopupWidth(area,graph,locked),h=220,pos=foundryPopupPosition(anchor,area,graph,[anchor],w,h);
  assert.ok(pos.left+w<=graph.left||pos.left>=graph.right);
  assert.ok(pos.left>=area.left&&pos.top>=area.top&&pos.left+w<=area.right&&pos.top+h<=area.bottom);
 }
});
test('portrait popup clamps to visible area and prioritises the selected cannon',()=>{
 const area={left:8,top:120,right:382,bottom:650},graph={left:18,top:180,right:372,bottom:600},anchor={left:180,top:370,right:220,bottom:410};
 const w=foundryPopupWidth(area,graph,true),h=180,pos=foundryPopupPosition(anchor,area,graph,[anchor],w,h);
 assert.ok(pos.left>=area.left&&pos.left+w<=area.right&&pos.top>=area.top&&pos.top+h<=area.bottom);
 assert.ok(pos.top+h<=anchor.top||pos.top>=anchor.bottom||pos.left+w<=anchor.left||pos.left>=anchor.right);
});
test('grip mirrors horizontally and preserves the platform anchor',()=>{
 for(const scale of [10,20,45,80]){const a=liftGrip(scale,1),b=liftGrip(scale,-1);near(a.dx,-b.dx);near(a.dy,b.dy);assert.equal(a.width,b.width);}
});
