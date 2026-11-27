import type {Point} from '../engine/coordinates';
import {anchorFlightEquation,equationCoefficients,parseFlightEquation,type FlightEquation} from '../engine/equations/linear';
import {PIP_RADIUS,pointRectangleDistance} from '../engine/collisions/clearance';
import {GEOMETRY_EPS} from '../engine/collisions/sweep';
import {CANNON_FOOTPRINT} from '../game/anchorArtGeometry';
import type {Cannon,Level} from './schema';

// Mounts are mathematical muzzle coordinates, not collision bodies.
// A cannon in the inventory has no position until it is mounted.
export interface AnchorPoint {readonly id:string;readonly position:Point}
export interface InventoryCannon {
 readonly id:string;
 readonly type:'linear'|'quadratic';
 readonly direction:1|-1;
 readonly lockedShape?:string;
}
export interface AnchorPuzzle {
 readonly anchors:readonly AnchorPoint[];
 readonly inventory:readonly InventoryCannon[];
}
export const MAX_ANCHORS=12,MAX_INVENTORY=4;
const same=(a:Point,b:Point)=>a.x===b.x&&a.y===b.y;
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function inventoryCannon(level:Level,id:string):InventoryCannon|undefined{return level.anchorPuzzle?.inventory.find(c=>c.id===id);}
export function anchorAt(level:Level,position:Point):AnchorPoint|undefined{return level.anchorPuzzle?.anchors.find(a=>same(a.position,position));}
export function lockedInventoryShape(c:InventoryCannon):FlightEquation|undefined{
 if(c.lockedShape===undefined)return;
 if(typeof c.lockedShape!=='string'||!c.lockedShape.trim()||c.lockedShape.length>180)throw Error('Invalid locked anchor shape: '+c.id);
 const shape=parseFlightEquation(c.lockedShape,c.type),coefficients=equationCoefficients(shape);
 if(coefficients.at(-1)!.numerator!=='0')throw Error('Locked anchor shape must have zero constant: '+c.id);
 return shape;
}
export function lockedAnchorEquation(level:Level,cannon:Cannon):FlightEquation|undefined{
 const item=inventoryCannon(level,cannon.id),shape=item&&lockedInventoryShape(item);
 return shape?anchorFlightEquation(shape,cannon.position.x,cannon.position.y):undefined;
}
export function anchorAssignments(level:Level):ReadonlyMap<string,string>{
 const result=new Map<string,string>();
 for(const c of level.cannons)if(inventoryCannon(level,c.id)){
  const anchor=anchorAt(level,c.position);if(!anchor)throw Error('Cannon is not on an anchor: '+c.id);
  result.set(c.id,anchor.id);
 }
 return result;
}
export function unplacedInventory(level:Level):readonly InventoryCannon[]{
 return (level.anchorPuzzle?.inventory??[]).filter(c=>!level.cannons.some(placed=>placed.id===c.id));
}
export function validateAnchorPuzzle(level:Level):void{
 const puzzle=level.anchorPuzzle;if(puzzle===undefined)return;
 if(!puzzle||!Array.isArray(puzzle.anchors)||!Array.isArray(puzzle.inventory)||
  puzzle.inventory.length<1||puzzle.inventory.length>MAX_INVENTORY||puzzle.anchors.length<puzzle.inventory.length||puzzle.anchors.length>MAX_ANCHORS)throw Error('Invalid anchor inventory or mount count');
 if(level.cannons.some(c=>c.lift))throw Error('Anchor placement and vertical rails are separate mechanics');
 const b=level.bounds;
 if(Math.max(Math.abs(b.minX),Math.abs(b.maxX),Math.abs(b.minY),Math.abs(b.maxY))>1000)throw Error('Anchor levels require bounded coordinates');
 const inventoryIds=new Set<string>(),anchorIds=new Set<string>(),items=new Map<string,InventoryCannon>();
 const reserved=new Set(['exit',...level.obstacles.map(o=>o.id),...(level.gems??[]).map(g=>g.id)]);
 for(const item of puzzle.inventory){
  if(!item||typeof item.id!=='string'||!item.id.trim()||inventoryIds.has(item.id)||reserved.has(item.id)||item.id===level.startId||
   !['linear','quadratic'].includes(item.type)||![1,-1].includes(item.direction))throw Error('Invalid inventory cannon');
  inventoryIds.add(item.id);items.set(item.id,item);lockedInventoryShape(item);
 }
 const fixed=level.cannons.filter(c=>!inventoryIds.has(c.id));
 if(!fixed.some(c=>c.id===level.startId))throw Error('Anchor puzzle requires a fixed starting cannon');
 for(const c of fixed)reserved.add(c.id);
 for(const [i,a] of puzzle.anchors.entries()){
  if(!a||typeof a.id!=='string'||!a.id.trim()||anchorIds.has(a.id)||reserved.has(a.id)||inventoryIds.has(a.id))throw Error('Invalid or duplicate anchor ID');
  const p=a.position;
  if(!p||![p.x,p.y].every(Number.isFinite)||p.x<b.minX+.5||p.x>b.maxX-.5||p.y<b.minY+CANNON_FOOTPRINT.drop||p.y>b.maxY-.5)throw Error('Anchor outside usable grid: '+a.id);
  if([...fixed.map(c=>c.position),level.exit,...puzzle.anchors.slice(0,i).map(a=>a.position)].some(q=>distance(p,q)<=2*PIP_RADIUS+GEOMETRY_EPS))throw Error('Anchor overlaps another marked point: '+a.id);
  if(level.obstacles.some(o=>pointRectangleDistance(p,o.bounds)<=PIP_RADIUS+GEOMETRY_EPS))throw Error('Anchor overlaps terrain: '+a.id);
  if((level.gems??[]).some(g=>distance(p,g.position)<=PIP_RADIUS+.14+GEOMETRY_EPS))throw Error('Anchor overlaps gem: '+a.id);
  anchorIds.add(a.id);
  // Ensure every locked part can derive an exact constant at every offered
  // mount. This checks legality, never whether the mount solves the puzzle.
  for(const item of puzzle.inventory){const shape=lockedInventoryShape(item);if(shape)anchorFlightEquation(shape,p.x,p.y);}
 }
 const occupied=new Set<string>();
 for(const c of level.cannons){
  const item=items.get(c.id);if(!item)continue;
  const a=anchorAt(level,c.position);
  if(!a||occupied.has(a.id)||c.type!==item.type||c.direction!==item.direction)throw Error('Invalid mounted cannon: '+c.id);
  occupied.add(a.id);
 }
 // Supports on inventory parts are resolved from their current mount, not
 // fixed author overrides. Fixed cannons and exit may still have overrides.
 for(const id of Object.keys(level.supports??{}))if(inventoryIds.has(id))throw Error('Inventory mounts use automatic supports: '+id);
}

// Canonical geometry: fixed cannons in authored order, then mounted parts in
// inventory order. Unmounted parts are absent from collision targets.
export function materializeAnchorLayout(level:Level,assignments:ReadonlyMap<string,string>):Level{
 const puzzle=level.anchorPuzzle;if(!puzzle)throw Error('Not an anchor puzzle');
 for(const id of assignments.keys())if(!inventoryCannon(level,id))throw Error('Unknown inventory cannon: '+id);
 const occupied=new Set<string>(),mounted:Cannon[]=[];
 for(const item of puzzle.inventory){
  const id=assignments.get(item.id);if(id===undefined)continue;
  const a=puzzle.anchors.find(a=>a.id===id);
  if(!a)throw Error('Unknown anchor: '+id);
  if(occupied.has(id))throw Error('Anchor is occupied: '+id);
  occupied.add(id);mounted.push({id:item.id,type:item.type,direction:item.direction,position:{...a.position}});
 }
 return {...level,cannons:[...level.cannons.filter(c=>!inventoryCannon(level,c.id)),...mounted]};
}
