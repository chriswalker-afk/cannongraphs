import type {Bounds} from '../engine/coordinates';
import {PIP_RADIUS} from '../engine/collisions/clearance';
import {GEOMETRY_EPS} from '../engine/collisions/sweep';
import type {Obstacle} from './schema';
export const terrainKinds=['floor','wall','platform','ceiling'] as const;
export type TerrainKind=typeof terrainKinds[number];
export function terrainRect(id:string,kind:TerrainKind,bounds:Bounds):Obstacle{
 if(!id.trim()||id==='exit'||!terrainKinds.includes(kind)||![bounds.minX,bounds.maxX,bounds.minY,bounds.maxY].every(Number.isFinite)||bounds.minX>=bounds.maxX||bounds.minY>=bounds.maxY)throw new RangeError('Invalid terrain rectangle: '+id);
 return {id,kind,bounds:{...bounds}};
}
export function floor(world:Bounds,thickness=.4,id='floor'):Obstacle{
 if(!Number.isFinite(thickness)||thickness<=0||world.minY+thickness>world.maxY)throw new RangeError('Invalid floor thickness');
 return terrainRect(id,'floor',{minX:world.minX,maxX:world.maxX,minY:world.minY,maxY:world.minY+thickness});
}
export function wall(id:string,minX:number,maxX:number,base:number,top:number):Obstacle{
 return terrainRect(id,'wall',{minX,maxX,minY:base,maxY:top});
}
export function platform(id:string,minX:number,maxX:number,base:number,top:number):Obstacle{
 return terrainRect(id,'platform',{minX,maxX,minY:base,maxY:top});
}
export function ceiling(id:string,minX:number,maxX:number,bottom:number,top:number):Obstacle{
 return terrainRect(id,'ceiling',{minX,maxX,minY:bottom,maxY:top});
}
export interface PassageSpec {minX:number;maxX:number;minY:number;maxY:number;gapBottom:number;gapTop:number}
// The gap is empty space, not a new collision shape. Both solid sides use the
// same continuous collision primitive as other terrain.
export function narrowPassage(id:string,s:PassageSpec):readonly [Obstacle,Obstacle]{
 if(!id.trim()||!Object.values(s).every(Number.isFinite)||!(s.minY<s.gapBottom&&s.gapBottom<s.gapTop&&s.gapTop<s.maxY)||s.gapTop-s.gapBottom<=2*PIP_RADIUS+GEOMETRY_EPS)throw new RangeError('Passage must have strictly more clearance than the Pip diameter');
 return [wall(id+'-lower',s.minX,s.maxX,s.minY,s.gapBottom),ceiling(id+'-upper',s.minX,s.maxX,s.gapTop,s.maxY)];
}
export function terrainLabel(o:Obstacle,world?:number):string{
 if(world===5)return ({floor:'Factory floor',wall:'Metal wall',platform:'Steel platform',ceiling:'Ceiling panel'})[o.kind];
 return ({floor:'Floor',wall:'Stone wall',platform:'Floating platform',ceiling:'Ceiling'})[o.kind];
}
export function terrainDimensions(o:Obstacle){
 const b=o.bounds;return {width:b.maxX-b.minX,height:b.maxY-b.minY};
}
