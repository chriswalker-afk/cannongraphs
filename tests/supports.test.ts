import {test} from 'node:test';
import assert from 'node:assert/strict';
import {levels,worlds} from '../src/levels/catalog';
import {levelSupports,type SupportPlan} from '../src/levels/supports';
import {validateLevel,type Level} from '../src/levels/schema';
import {CANNON_FOOTPRINT,EXIT_FOOTPRINT} from '../src/game/anchorArtGeometry';
import {auditSolution} from '../src/levels/qa';
import {referenceSolutions} from './fixtures/referenceSolutions';
import {referenceLayout,referenceOrder} from './fixtures/referenceLayout';
import {cannonCosmetics,defaultCannonLook,chooseCannonCosmetic} from '../src/game/cannonCosmetics';
import {renderSupportArt,supportPalette} from '../src/rendering/supportArt';
import {renderCannonArt} from '../src/rendering/cannonArt';
import {coordinateSystem,type Point} from '../src/engine/coordinates';
const eps=1e-8,near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<=eps,a+' != '+b);
function audit(l:Level,s:SupportPlan){
 const b=l.bounds,d=s.deck,c=l.cannons.find(c=>c.id===s.id);
 const anchor=c?.position??l.exit;
 assert.deepEqual(s.anchor,anchor);assert.equal(s.direction,c?.direction??1);
 near(d.y,anchor.y-(c?CANNON_FOOTPRINT.drop:EXIT_FOOTPRINT.drop));
 const sides=c?[anchor.x-CANNON_FOOTPRINT.back*c.direction,anchor.x-CANNON_FOOTPRINT.front*c.direction]:[anchor.x-EXIT_FOOTPRINT.halfWidth,anchor.x+EXIT_FOOTPRINT.halfWidth];
 assert.ok(d.minX<=Math.min(...sides)+eps&&d.maxX>=Math.max(...sides)-eps,l.id+' '+s.id+' deck covers footprint');
 assert.ok(d.minX>=b.minX-eps&&d.maxX<=b.maxX+eps&&d.y-.07>=b.minY-eps&&d.y<=b.maxY+eps);
 assert.ok(s.segments.length>=2);
 const inside=(p:Point)=>p.x>=b.minX-eps&&p.x<=b.maxX+eps&&p.y>=b.minY-eps&&p.y<=b.maxY+eps;
 for(const segment of s.segments){
  assert.ok(inside(segment.from)&&inside(segment.to),l.id+' '+s.id+' out of bounds');
  near(segment.from.y,d.y);assert.ok(segment.from.x>=d.minX&&segment.from.x<=d.maxX);
  assert.ok(s.attachment.some(a=>a.x===segment.to.x&&a.y===segment.to.y));
 }
 for(const a of s.attachment){
  if(s.backgroundRoof){assert.equal(s.kind,'suspended');assert.equal(s.terrainId,undefined);near(a.y,b.maxY);continue;}
  const o=l.obstacles.find(o=>o.id===s.terrainId)!;assert.ok(o,l.id+' missing terrain '+s.terrainId);
  const r=o.bounds;assert.ok(a.x>=r.minX-eps&&a.x<=r.maxX+eps&&a.y>=r.minY-eps&&a.y<=r.maxY+eps);
  if(s.kind==='platform'){near(a.y,r.maxY);assert.ok(a.y<=d.y+eps);}
  else if(s.kind==='suspended'){near(a.y,r.minY);assert.ok(a.y>=anchor.y+.70-eps);}
  else {assert.ok(Math.abs(a.x-r.minX)<eps||Math.abs(a.x-r.maxX)<eps);assert.ok(a.y<d.y);}
 }
 assert.ok(Math.hypot(s.attachment[0].x-s.attachment[1].x,s.attachment[0].y-s.attachment[1].y)>.015,l.id+' attachment span');
}
test('all 96 levels have static supports or movable rails for every cannon and exit, without changing the level',()=>{
 const counts={platform:0,wall:0,suspended:0};let n=0;
 for(const l of levels){
  const before=JSON.stringify(l),plans=levelSupports(l);assert.deepEqual(plans,levelSupports(l));assert.equal(JSON.stringify(l),before);
  assert.deepEqual(plans.map(s=>s.id),[...l.cannons.filter(c=>!c.lift).map(c=>c.id),'exit']);
  for(const s of plans){audit(l,s);counts[s.kind]++;n++;}
 }
 assert.equal(levels.length,96);assert.equal(n,levels.reduce((sum,l)=>sum+l.cannons.filter(c=>!c.lift).length+1,0));assert.ok(counts.platform>0&&counts.wall>0&&counts.suspended>0);
 console.log('Mounting audit: '+n+' static objects across 96 levels '+JSON.stringify(counts));
});
test('Skyward (the reported example) joins the actual launch and exit ledges and accounts for rearward footprint',()=>{
 const l=levels.find(l=>l.id==='1-03')!,[a,e]=levelSupports(l);
 assert.equal(a.terrainId,'launch-ledge');assert.equal(e.terrainId,'exit-ledge');
 near(a.deck.y,3-.47);near(e.deck.y,9-.44);assert.ok(a.deck.minX<.3&&a.deck.maxX>1);
 assert.ok(a.attachment[1].x-a.attachment[0].x>.5,'wide feet on existing ledge');
 assert.ok(e.deck.minX<3-.43&&e.deck.maxX>3+.43);
});
test('reverse cannons mirror the rearward contact deck and explicit suspension/wall mounts connect to their real terminations',()=>{
 const l=levels.find(l=>l.id==='2-r06')!,c=l.cannons[0],a=levelSupports(l)[0];assert.equal(c.direction,-1);
 assert.ok(a.deck.maxX>c.position.x+.74&&a.deck.minX<c.position.x);assert.equal(a.terrainId,'launch-isle');
 const suspended=levelSupports(levels.find(l=>l.id==='5-01')!).find(s=>s.id==='exit')!;
 assert.equal(suspended.kind,'suspended');assert.ok(suspended.backgroundRoof);assert.ok(suspended.segments.every(s=>s.role==='hanger'));
 const wall=levelSupports(levels.find(l=>l.id==='4-10')!).find(s=>s.id==='C')!;
 assert.equal(wall.kind,'wall');assert.equal(wall.terrainId,'exit-slot-lower');
});
test('a suspension can attach to a real overhead structure instead of the background roof',()=>{
 const l=levels[0],roof={id:'test-overhead',kind:'ceiling' as const,bounds:{minX:l.exit.x-1,maxX:l.exit.x+1,minY:7,maxY:7.3}};
 const testLevel:Level={...l,obstacles:[...l.obstacles,roof],supports:{exit:{kind:'suspended',terrainId:roof.id}}};
 validateLevel(testLevel);const s=levelSupports(testLevel).at(-1)!;assert.ok(!s.backgroundRoof);assert.equal(s.terrainId,roof.id);audit(testLevel,s);
});
test('unknown support ids, missing walls and impossible attachments are rejected',()=>{
 const l=levels[0];
 assert.throws(()=>validateLevel({...l,supports:{unknown:{kind:'platform'}}}),/Invalid support/);
 assert.throws(()=>validateLevel({...l,supports:{A:{kind:'wall'}}}),/Invalid support/);
 assert.throws(()=>validateLevel({...l,supports:{A:{kind:'platform',terrainId:'not-there'}}}),/Invalid support/);
 assert.throws(()=>levelSupports({...l,supports:{A:{kind:'platform',terrainId:'not-there'}}}),/missing support terrain/);
 assert.throws(()=>levelSupports({...l,supports:{A:{kind:'wall',terrainId:l.obstacles[0].id}}}),/no valid visual support/);
});
test('all reference routes retain clearance, capture and the original authored collision rectangles after support resolution',()=>{
 for(const [wi,w] of worlds.entries())for(const [li,l] of w.levels.entries()){
  const layout=referenceLayout(l),original=JSON.stringify(l.obstacles),first=auditSolution(layout,referenceSolutions[wi][li],referenceOrder(layout));
  levelSupports(l);assert.equal(JSON.stringify(l.obstacles),original);
  const second=auditSolution(layout,referenceSolutions[wi][li],referenceOrder(layout));
  near(first.minimumClearance,second.minimumClearance);assert.deepEqual(first.result.end,second.result.end);
 }
});
class SvgElement{
 readonly attrs=new Map<string,string>();readonly children:SvgElement[]=[];textContent='';
 constructor(readonly tag:string){}
 setAttribute(key:string,value:string){this.attrs.set(key,value);}
 append(...nodes:SvgElement[]){this.children.push(...nodes);}
 *walk():Generator<SvgElement>{yield this;for(const c of this.children)yield* c.walk();}
}
function withSvg(fn:()=>void){
 const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElementNS:(_ns:string,tag:string)=>new SvgElement(tag)}});
 try{fn();}finally{if(previous)Object.defineProperty(globalThis,'document',previous);else Reflect.deleteProperty(globalThis,'document');}
}
test('all seven world palettes and all six mount cosmetics render with fixed deck, muzzle and noninteractive geometry',()=>withSvg(()=>{
 assert.equal(new Set(worlds.map(w=>supportPalette(w.number).frame)).size,8);
 for(const w of worlds){
  for(const l of [w.levels[0],w.levels[7],w.levels[11]]){
   const project=coordinateSystem(l.bounds,{width:900,height:500,padding:25});
   for(const s of levelSupports(l))for(const cosmetic of cannonCosmetics.filter(c=>c.slot==='base')){
    const look=chooseCannonCosmetic(defaultCannonLook,'base',cosmetic.id),host=new SvgElement('svg');
    renderSupportArt(host as unknown as Element,s,l.world,project.toScreen,project.scale,look);
    const group=host.children[0],all=[...host.walk()];
    assert.equal(group.attrs.get('data-support-for'),s.id);assert.equal(group.attrs.get('pointer-events'),'none');assert.equal(group.attrs.get('aria-hidden'),'true');
    near(Number(group.attrs.get('data-deck-y')),s.deck.y);
    assert.equal(all.filter(n=>n.attrs.has('data-magnetic-dock')).length,cosmetic.id==='hover'&&s.id!=='exit'?1:0);
    assert.equal(all.filter(n=>n.attrs.has('data-support-deck')).length,1);
    const c=l.cannons.find(c=>c.id===s.id);
    if(c){const cannon=new SvgElement('g');renderCannonArt(cannon as unknown as Element,c.type,35,look,c.direction);const muzzle=[...cannon.walk()].find(n=>n.attrs.has('data-cannon-muzzle'))!;assert.equal(muzzle.attrs.get('cx'),'0');assert.equal(muzzle.attrs.get('cy'),'0');}
    for(const n of all)for(const value of n.attrs.values())assert.ok(!/NaN|Infinity|undefined/.test(value),l.id+' '+s.id);
   }
  }
 }
}));
