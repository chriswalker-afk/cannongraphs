import type {ProgressStorage} from './progressStore';
import {canEquipCannonLook,defaultCannonLook,sanitizeCannonLook,type CannonLook} from './cannonCosmetics';
export const CANNON_LOOK_KEY='cannon-graphs:cannon-look:v1';
export function parseCannonLook(raw:string|null,earned:ReadonlySet<string>):CannonLook{
 try{const v=raw?JSON.parse(raw):null;return v?.version===1?sanitizeCannonLook(v.look,earned):{...defaultCannonLook};}catch{return {...defaultCannonLook};}
}
export function createCannonLookStore(storage?:ProgressStorage){
 let raw:string|null=null,dirty=false,available=!!storage;
 function read(earned:ReadonlySet<string>){
  if(storage&&!dirty)try{raw=storage.getItem(CANNON_LOOK_KEY);available=true;}catch{available=false;}
  return parseCannonLook(raw,earned);
 }
 function equip(look:unknown,earned:ReadonlySet<string>){
  if(!canEquipCannonLook(look,earned))return {equipped:false,look:read(earned),persisted:available&&!dirty};
  const safe=sanitizeCannonLook(look,earned);raw=JSON.stringify({version:1,look:safe});dirty=true;
  if(storage)try{storage.setItem(CANNON_LOOK_KEY,raw);dirty=false;available=true;}catch{available=false;}
  return {equipped:true,look:safe,persisted:available&&!dirty};
 }
 return {read,equip,persisted:()=>available&&!dirty};
}
export function browserCannonLookStore(){
 let storage:ProgressStorage|undefined;try{storage=window.localStorage;}catch{/* blocked */}
 return createCannonLookStore(storage);
}
