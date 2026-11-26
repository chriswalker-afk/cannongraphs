// Stable IDs, independent of the physics and the progress storage schema.
export const pipSlots=['fur','goggles','headgear','accessory'] as const;
export type PipSlot=typeof pipSlots[number];
export interface PipLook{readonly fur:string;readonly goggles:string;readonly headgear:string;readonly accessory:string}
export interface Cosmetic{readonly slot:PipSlot;readonly id:string;readonly name:string;readonly achievement?:string}
export const slotLabels:Readonly<Record<PipSlot,string>>={fur:'Fur',goggles:'Goggles',headgear:'Headgear',accessory:'Accessories'};
export const pipCosmetics:readonly Cosmetic[]=[
 {slot:'fur',id:'classic',name:'Original crew'},
 {slot:'fur',id:'mint',name:'Meadow mint'},
 {slot:'fur',id:'rose',name:'Peach rose'},
 {slot:'fur',id:'lavender',name:'Lavender',achievement:'first-flight'},
 {slot:'fur',id:'ocean',name:'Ocean blue',achievement:'pilot-wings'},
 {slot:'fur',id:'gold',name:'Golden fur',achievement:'star-collector'},
 {slot:'fur',id:'nebula',name:'Nebula violet',achievement:'graphiverse-explorer'},
 {slot:'goggles',id:'classic',name:'Sky goggles'},
 {slot:'goggles',id:'amber',name:'Amber goggles'},
 {slot:'goggles',id:'brass',name:'Brass goggles',achievement:'perfect-pilot'},
 {slot:'goggles',id:'emerald',name:'Emerald goggles',achievement:'gem-collector'},
 {slot:'goggles',id:'aurora',name:'Aurora goggles',achievement:'gem-explorer'},
 {slot:'headgear',id:'aviator',name:'Aviator cap'},
 {slot:'headgear',id:'beanie',name:'Cadet beanie',achievement:'cadet-wings'},
 {slot:'headgear',id:'helmet',name:'Relay helmet',achievement:'relay-runner'},
 {slot:'headgear',id:'captain',name:'Captain cap',achievement:'ace-wings'},
 {slot:'headgear',id:'crown',name:'Ace crown',achievement:'perfect-ace'},
 {slot:'headgear',id:'astral',name:'Astral helmet',achievement:'ace-world'},
 {slot:'accessory',id:'none',name:'None'},
 {slot:'accessory',id:'bow',name:'Bow tie'},
 {slot:'accessory',id:'gem',name:'Gem pin',achievement:'first-gem'},
 {slot:'accessory',id:'scarf',name:'Explorer scarf',achievement:'treasure-map'},
 {slot:'accessory',id:'wing',name:'World wings',achievement:'world-explorer'},
 {slot:'accessory',id:'star',name:'Ace star',achievement:'perfect-ace'}
];
export const defaultPipLook:Readonly<PipLook>=Object.freeze({fur:'classic',goggles:'classic',headgear:'aviator',accessory:'none'});
export function cosmeticFor(slot:PipSlot,id:string):Cosmetic|undefined{return pipCosmetics.find(c=>c.slot===slot&&c.id===id);}
export function cosmeticsForAchievement(id:string):readonly Cosmetic[]{return pipCosmetics.filter(c=>c.achievement===id);}
export function cosmeticUnlocked(c:Cosmetic,earned:ReadonlySet<string>):boolean{return !c.achievement||earned.has(c.achievement);}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function sanitizePipLook(input:unknown,earned:ReadonlySet<string>):PipLook{
 const v=object(input)?input:{};
 const look={...defaultPipLook};
 for(const slot of pipSlots){
  const id=v[slot],c=typeof id==='string'?cosmeticFor(slot,id):undefined;
  if(c&&cosmeticUnlocked(c,earned))look[slot]=c.id;
 }
 return look;
}
export function canEquipPipLook(input:unknown,earned:ReadonlySet<string>):input is PipLook{
 return object(input)&&pipSlots.every(slot=>{
  const id=input[slot],c=typeof id==='string'?cosmeticFor(slot,id):undefined;
  return !!c&&cosmeticUnlocked(c,earned);
 });
}
export function samePipLook(a:PipLook,b:PipLook):boolean{return pipSlots.every(slot=>a[slot]===b[slot]);}
export function choosePipCosmetic(look:PipLook,slot:PipSlot,id:string):PipLook{
 return cosmeticFor(slot,id)&&look[slot]!==id?{...look,[slot]:id}:look;
}
// Original crew colours remain the default and still vary by sprite index.
const originalColours=[['#ffd78c','#fff0ba'],['#ffc6b9','#fff0df'],['#d8c5f4','#f6eaff'],['#bfe7bb','#ecf8d5'],['#f8d49d','#fff4c7']] as const;
const furColours:Readonly<Record<string,readonly [string,string]>>={
 mint:['#a9ddbd','#e0f5d9'],rose:['#f5b4ab','#ffe4d7'],lavender:['#c9b4e9','#f4e8ff'],
 ocean:['#88c9e3','#d6f3ff'],gold:['#f5bf59','#fff0b0'],nebula:['#9d91db','#e1d9ff']
};
const gogglesColours:Readonly<Record<string,readonly [string,string,string]>>={
 classic:['#513d35','#a6e1ee','#e7c797'],amber:['#795132','#ffd583','#fff0b0'],
 brass:['#ae7b30','#96e0e6','#ffe4a3'],emerald:['#356b53','#9de8bf','#d9ffe1'],aurora:['#51437e','#e1b7f5','#b2ecf1']
};
export function pipArtColours(look: PipLook=defaultPipLook,variant=0){
 const [fur,light]=(Object.hasOwn(furColours,look.fur)?furColours[look.fur]:undefined)??originalColours[((variant%originalColours.length)+originalColours.length)%originalColours.length];
 const [frame,lens,rim]=(Object.hasOwn(gogglesColours,look.goggles)?gogglesColours[look.goggles]:undefined)??gogglesColours.classic;
 return {fur,light,frame,lens,rim};
}
