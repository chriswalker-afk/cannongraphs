import type {ProgressStorage} from './progressStore';
import {canEquipPipLook,defaultPipLook,sanitizePipLook,type PipLook} from './pipCosmetics';
export const PIP_LOOK_KEY='cannon-graphs:pip-look:v1';
export function parsePipLook(raw:string|null,earned:ReadonlySet<string>):PipLook{
 try{const v=raw?JSON.parse(raw):null;return v?.version===1?sanitizePipLook(v.look,earned):{...defaultPipLook};}
 catch{return {...defaultPipLook};}
}
export interface EquipResult{readonly equipped:boolean;readonly persisted:boolean;readonly look:PipLook}
export function createPipLookStore(storage?:ProgressStorage){
 let raw:string|null=null,dirty=false,available=!!storage;
 function read(earned:ReadonlySet<string>):PipLook{
  if(storage&&!dirty)try{raw=storage.getItem(PIP_LOOK_KEY);available=true;}catch{available=false;}
  return parsePipLook(raw,earned);
 }
 function equip(look:unknown,earned:ReadonlySet<string>):EquipResult{
  if(!canEquipPipLook(look,earned))return {equipped:false,look:read(earned),persisted:available&&!dirty};
  const safe=sanitizePipLook(look,earned);
  raw=JSON.stringify({version:1,look:safe});dirty=true;
  if(storage)try{storage.setItem(PIP_LOOK_KEY,raw);dirty=false;available=true;}catch{available=false;}
  return {equipped:true,look:safe,persisted:available&&!dirty};
 }
 return {read,equip,persisted:()=>available&&!dirty};
}
export function browserPipLookStore(){
 let storage:ProgressStorage|undefined;try{storage=window.localStorage;}catch{/* blocked */}
 return createPipLookStore(storage);
}
