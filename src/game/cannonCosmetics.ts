export const cannonSlots=['barrel','base','trim','effect'] as const;
export type CannonSlot=typeof cannonSlots[number];
export interface CannonLook {readonly barrel:string;readonly base:string;readonly trim:string;readonly effect:string}
export interface CannonCosmetic {readonly slot:CannonSlot;readonly id:string;readonly name:string;readonly achievement?:string}
export const cannonSlotLabels:Readonly<Record<CannonSlot,string>>={barrel:'Barrel',base:'Mount',trim:'Trim',effect:'Firing effect'};
export const cannonCosmetics:readonly CannonCosmetic[]=[
 {slot:'barrel',id:'classic',name:'Original barrel'},
 {slot:'barrel',id:'riveted',name:'Riveted barrel'},
 {slot:'barrel',id:'fluted',name:'Fluted barrel',achievement:'first-flight'},
 {slot:'barrel',id:'reinforced',name:'Reinforced barrel',achievement:'relay-runner'},
 {slot:'barrel',id:'precision',name:'Precision barrel',achievement:'perfect-pilot'},
 {slot:'barrel',id:'orbital',name:'Orbital barrel',achievement:'graphiverse-explorer'},
 {slot:'base',id:'timber',name:'Timber mount'},
 {slot:'base',id:'stone',name:'Stone plinth'},
 {slot:'base',id:'spring',name:'Spring mount',achievement:'cadet-wings'},
 {slot:'base',id:'steel',name:'Steel carriage',achievement:'pilot-wings'},
 {slot:'base',id:'royal',name:'Royal pedestal',achievement:'ace-wings'},
 {slot:'base',id:'hover',name:'Hover mount',achievement:'ace-world'},
 {slot:'trim',id:'classic',name:'Matching trim'},
 {slot:'trim',id:'silver',name:'Silver fittings'},
 {slot:'trim',id:'brass',name:'Brass fittings',achievement:'first-gem'},
 {slot:'trim',id:'emerald',name:'Emerald fittings',achievement:'gem-collector'},
 {slot:'trim',id:'gold',name:'Gold fittings',achievement:'star-collector'},
 {slot:'trim',id:'crystal',name:'Crystal fittings',achievement:'treasure-map'},
 {slot:'effect',id:'smoke',name:'Original smoke'},
 {slot:'effect',id:'sparks',name:'Copper sparks'},
 {slot:'effect',id:'frost',name:'Frost crystals',achievement:'gem-explorer'},
 {slot:'effect',id:'petals',name:'Meadow petals',achievement:'world-explorer'},
 {slot:'effect',id:'starburst',name:'Starburst',achievement:'perfect-ace'},
 {slot:'effect',id:'comet',name:'Comet dust',achievement:'graphiverse-explorer'}
];
export const defaultCannonLook:Readonly<CannonLook>=Object.freeze({barrel:'classic',base:'timber',trim:'classic',effect:'smoke'});
export function cannonCosmeticFor(slot:CannonSlot,id:string){return cannonCosmetics.find(c=>c.slot===slot&&c.id===id);}
export function cannonRewardsForAchievement(id:string){return cannonCosmetics.filter(c=>c.achievement===id);}
export function cannonCosmeticUnlocked(c:CannonCosmetic,earned:ReadonlySet<string>){return !c.achievement||earned.has(c.achievement);}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function sanitizeCannonLook(value:unknown,earned:ReadonlySet<string>):CannonLook{
 const v=object(value)?value:{},look={...defaultCannonLook};
 for(const slot of cannonSlots){
  const id=v[slot],c=typeof id==='string'?cannonCosmeticFor(slot,id):undefined;
  if(c&&cannonCosmeticUnlocked(c,earned))look[slot]=c.id;
 }
 return look;
}
export function canEquipCannonLook(value:unknown,earned:ReadonlySet<string>):value is CannonLook{
 return object(value)&&cannonSlots.every(slot=>{const id=value[slot],c=typeof id==='string'?cannonCosmeticFor(slot,id):undefined;return !!c&&cannonCosmeticUnlocked(c,earned);});
}
export function sameCannonLook(a:CannonLook,b:CannonLook){return cannonSlots.every(slot=>a[slot]===b[slot]);}
export function chooseCannonCosmetic(look:CannonLook,slot:CannonSlot,id:string):CannonLook{
 return cannonCosmeticFor(slot,id)&&look[slot]!==id?{...look,[slot]:id}:look;
}
// Trim is restricted to the fittings. The family colour and symbol are not
// customisable, even with a locked look in the workshop preview.
const trims:Readonly<Record<string,readonly [string,string]>>={
 silver:['#c1cbd4','#eef3f6'],brass:['#c18a4e','#ffe4b0'],emerald:['#4eaf85','#d8f8cd'],
 gold:['#e6b94f','#fff0af'],crystal:['#b8a6e5','#e6f6ff']
};
export function cannonTrim(look:CannonLook,familyColour:string){
 const t=Object.hasOwn(trims,look.trim)?trims[look.trim]:undefined;
 return {metal:t?.[0]??familyColour,highlight:t?.[1]??'#d9f4ff'};
}
