import {validateLevel,type Level} from './schema';
import {meadowLaunchers} from './worlds/meadowLaunchers';
import {floatingIsles} from './worlds/floatingIsles';
import {quadraticPreview} from './worlds/quadraticPreview';
export interface World {readonly number:number;readonly name:string;readonly levels:readonly Level[]}
export const worlds:readonly World[]=[{number:1,name:'Meadow Launchers',levels:meadowLaunchers},{number:2,name:'The Floating Isles',levels:floatingIsles},{number:3,name:'Parabola Peaks (preview)',levels:[quadraticPreview]}];
export const levels:readonly Level[]=worlds.flatMap(w=>w.levels);
const ids=new Set<string>();
for(const world of worlds){
 for(const level of world.levels){
  validateLevel(level);
  if(level.world!==world.number||ids.has(level.id))throw new Error('Invalid catalog level '+level.id);
  ids.add(level.id);
 }
}
export function worldForLevel(id:string):World|undefined{return worlds.find(w=>w.levels.some(l=>l.id===id));}
export function nextLevel(id:string):Level|undefined{
 const index=levels.findIndex(l=>l.id===id);
 return index<0?undefined:levels[index+1];
}
export function levelPosition(id:string):{index:number;total:number}|undefined{
 const world=worldForLevel(id);if(!world)return undefined;
 return {index:world.levels.findIndex(l=>l.id===id)+1,total:world.levels.length};
}
