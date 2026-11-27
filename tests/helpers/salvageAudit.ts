import type {Level} from '../../src/levels/schema';
import type {CannonEquation} from '../../src/engine/equations/advanced';
import {parseLinearEquation} from '../../src/engine/equations/linear';
import {lockedAnchorEquation,materializeAnchorLayout} from '../../src/levels/anchorSpec';
import {simulateRoute} from '../../src/engine/simulation/linearRoute';
import {validateLevel} from '../../src/levels/schema';
import {levelSupports,emptyAnchorSupport} from '../../src/levels/supports';

export interface PlacementWin {readonly assignments:ReadonlyMap<string,string>;readonly equations:ReadonlyMap<string,CannonEquation>;readonly order:readonly string[]}
export function* allAssignments(level:Level):Generator<ReadonlyMap<string,string>>{
 const p=level.anchorPuzzle!,map=new Map<string,string>(),used=new Set<string>();
 function* recurse(i:number):Generator<ReadonlyMap<string,string>>{
  if(i===p.inventory.length){yield new Map(map);return;}
  const id=p.inventory[i].id;
  for(const a of p.anchors){
   if(used.has(a.id))continue;map.set(id,a.id);used.add(a.id);
   yield* recurse(i+1);used.delete(a.id);map.delete(id);
  }
 }
 yield* recurse(0);
}
// Exact point capture means any successful programmable straight-line leg
// must join its muzzle to a forward occupied muzzle or the exit. Enumerate
// all these lines; no gradient range or numerical sampling is assumed.
export function* linearPrograms(level:Level):Generator<ReadonlyMap<string,CannonEquation>>{
 const editable=level.cannons.filter(c=>!lockedAnchorEquation(level,c)),map=new Map<string,CannonEquation>();
 function* recurse(i:number):Generator<ReadonlyMap<string,CannonEquation>>{
  if(i===editable.length){yield new Map(map);return;}
  const c=editable[i];
  if(c.type!=='linear')throw Error('Linear audit requires every programmable cannon to be linear.');
  const targets=[...level.cannons.filter(t=>t.id!==c.id).map(t=>t.position),level.exit];
  for(const p of targets){
   const dx=p.x-c.position.x,dy=p.y-c.position.y;
   if(dx*c.direction<=0)continue;
   const e=parseLinearEquation('('+dy+'/'+dx+')*(x-('+c.position.x+'))+('+c.position.y+')');
   map.set(c.id,e);yield* recurse(i+1);map.delete(c.id);
  }
 }
 yield* recurse(0);
}
export function auditLinearPlacement(level:Level){
 validateLevel(level);
 for(const a of level.anchorPuzzle!.anchors)emptyAnchorSupport(level,a);
 let layouts=0,routes=0,shortcuts=0;
 const winners=new Map<string,PlacementWin>();
 for(const assignments of allAssignments(level)){
  const placed=materializeAnchorLayout(level,assignments);validateLevel(placed);levelSupports(placed);layouts++;
  for(const equations of linearPrograms(placed)){
   const r=simulateRoute(placed,equations);routes++;
   if(r.event.kind==='incomplete-relay')shortcuts++;
   if(r.event.kind!=='exit')continue;
   if(r.legs.length!==placed.cannons.length)throw Error('Shortcut accepted in '+level.id);
   const key=[...assignments].map(([id,a])=>id+':'+a).join(',');
   winners.set(key,{assignments,equations,order:r.legs.map(l=>l.cannonId)});
  }
 }
 return {layouts,routes,shortcuts,winners};
}
