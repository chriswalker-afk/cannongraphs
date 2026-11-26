import type {Bounds,Point} from '../engine/coordinates';
import {cannonTypes,type CannonType} from '../game/cannons';
import {PIP_RADIUS,pointRectangleDistance} from '../engine/collisions/clearance';
import {GEOMETRY_EPS} from '../engine/collisions/sweep';
export const GEM_RADIUS=.14;
export interface Gem {readonly id:string;readonly position:Point}
export interface Cannon {id:string;type:CannonType;position:Point;direction:1|-1}
export interface Obstacle {id:string;kind:'wall'|'floor'|'platform'|'ceiling';bounds:Bounds}
export interface Level {id:string;world:number;title:string;objective:string;bounds:Bounds;creatures:number;startId:string;cannons:Cannon[];exit:Point;obstacles:Obstacle[];gems?:readonly Gem[]}
export function validateLevel(l:Level):void{
 const validBounds=(b:Bounds)=>[b.minX,b.maxX,b.minY,b.maxY].every(Number.isFinite)&&b.minX<b.maxX&&b.minY<b.maxY;
 if(!validBounds(l.bounds)||!Number.isInteger(l.creatures)||l.creatures<1) throw new Error('Invalid bounds or creature count');
 const inside=(p:Point)=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=l.bounds.minX&&p.x<=l.bounds.maxX&&p.y>=l.bounds.minY&&p.y<=l.bounds.maxY;
 const ids=new Set<string>(),anchors=new Set<string>([l.exit.x+','+l.exit.y]);
 for(const c of l.cannons){if(!c.id||c.id==='exit'||ids.has(c.id)||anchors.has(c.position.x+','+c.position.y)||!Object.hasOwn(cannonTypes,c.type)||!inside(c.position)||![1,-1].includes(c.direction))throw new Error('Invalid cannon');ids.add(c.id);anchors.add(c.position.x+','+c.position.y);}
 if(!ids.has(l.startId)||!inside(l.exit))throw new Error('Invalid start or exit');
 for(const o of l.obstacles){if(!o.id||o.id==='exit'||ids.has(o.id)||!['floor','wall','platform','ceiling'].includes(o.kind)||!validBounds(o.bounds)||!inside({x:o.bounds.minX,y:o.bounds.minY})||!inside({x:o.bounds.maxX,y:o.bounds.maxY}))throw new Error('Invalid obstacle');ids.add(o.id);}
 const gems=l.gems??[];
 if(gems.length>24)throw new Error('Too many gems');
 for(const [i,g] of gems.entries()){
  const p=g.position,b=l.bounds,distance=(q:Point)=>Math.hypot(p.x-q.x,p.y-q.y);
  if(!g.id||g.id==='exit'||ids.has(g.id)||!inside(p)||p.x-GEM_RADIUS<b.minX||p.x+GEM_RADIUS>b.maxX||p.y-GEM_RADIUS<b.minY||p.y+GEM_RADIUS>b.maxY||
   l.obstacles.some(o=>pointRectangleDistance(p,o.bounds)<=GEM_RADIUS+GEOMETRY_EPS)||
   [...l.cannons.map(c=>c.position),l.exit].some(q=>distance(q)<=PIP_RADIUS+GEM_RADIUS+GEOMETRY_EPS)||
   gems.slice(0,i).some(other=>distance(other.position)<=2*GEM_RADIUS+GEOMETRY_EPS))throw new Error('Invalid gem: '+g.id);
  ids.add(g.id);
 }
}
