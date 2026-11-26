import type {Bounds,Point} from '../engine/coordinates';
import {cannonTypes,type CannonType} from '../game/cannons';
export interface Cannon {id:string;type:CannonType;position:Point;direction:1|-1}
export interface Obstacle {id:string;kind:'wall'|'floor'|'platform'|'ceiling';bounds:Bounds}
export interface Level {id:string;world:number;title:string;objective:string;bounds:Bounds;creatures:number;startId:string;cannons:Cannon[];exit:Point;obstacles:Obstacle[]}
export function validateLevel(l:Level):void{
 const validBounds=(b:Bounds)=>[b.minX,b.maxX,b.minY,b.maxY].every(Number.isFinite)&&b.minX<b.maxX&&b.minY<b.maxY;
 if(!validBounds(l.bounds)||!Number.isInteger(l.creatures)||l.creatures<1) throw new Error('Invalid bounds or creature count');
 const inside=(p:Point)=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=l.bounds.minX&&p.x<=l.bounds.maxX&&p.y>=l.bounds.minY&&p.y<=l.bounds.maxY;
 const ids=new Set<string>();
 for(const c of l.cannons){if(!c.id||ids.has(c.id)||!Object.hasOwn(cannonTypes,c.type)||!inside(c.position)||![1,-1].includes(c.direction))throw new Error('Invalid cannon');ids.add(c.id);}
 if(!ids.has(l.startId)||!inside(l.exit))throw new Error('Invalid start or exit');
 for(const o of l.obstacles){if(!o.id||ids.has(o.id)||!validBounds(o.bounds)||!inside({x:o.bounds.minX,y:o.bounds.minY})||!inside({x:o.bounds.maxX,y:o.bounds.maxY}))throw new Error('Invalid obstacle');ids.add(o.id);}
}
