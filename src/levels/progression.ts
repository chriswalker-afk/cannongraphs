import type {Level} from './schema';
// Shared curriculum metadata for the menu, catalog validation and authoring
// audits. The cannon count is the difficulty band, not a claim that every
// possible equation or obstacle arrangement has a measured difficulty.
export const difficultyTiers=[
 {count:1,name:'Introduction',accent:'#477c55',ink:'#28583a',tint:'#e6f1df'},
 {count:2,name:'Development',accent:'#467fa8',ink:'#294f73',tint:'#e3edf7'},
 {count:3,name:'Challenge',accent:'#8963ae',ink:'#63427d',tint:'#f0e8f8'},
 {count:4,name:'Mastery',accent:'#ab7937',ink:'#73501e',tint:'#faecd3'}
] as const;
export type DifficultyTier=(typeof difficultyTiers)[number];
export const LEVELS_PER_TIER=3;
export const LEVELS_PER_WORLD=difficultyTiers.length*LEVELS_PER_TIER;
export interface LevelTier {
 readonly label:string;
 readonly tier:DifficultyTier;
 readonly entries:readonly {readonly level:Level;readonly number:number}[];
}
export function tierForCount(count:number):DifficultyTier{
 const tier=difficultyTiers.find(t=>t.count===count);
 if(!tier)throw Error('Unsupported regular-level cannon count: '+count);
 return tier;
}
// Do not sort a broken catalogue silently: displayed numbers and Next Level
// must agree with the authored progression and the stable puzzle identities.
const foundryLabels=['Single lifts','Connected lines','Locked arcs','Mixed relays'] as const;
export function levelTiers(levels:readonly Level[]):readonly LevelTier[]{
 if(levels.length!==LEVELS_PER_WORLD)throw Error('Expected '+LEVELS_PER_WORLD+' regular levels per world');
 const foundry=levels.every(l=>l.world===7);
 return difficultyTiers.map((tier,i)=>{
  const entries=levels.slice(i*LEVELS_PER_TIER,(i+1)*LEVELS_PER_TIER).map((level,j)=>{
   const number=i*LEVELS_PER_TIER+j+1;
   if(foundry){if(!level.cannons.some(c=>c.lift))throw Error(level.id+': Foundry level requires a lift');}
   else if(level.cannons.length!==tier.count)throw Error(level.id+': level '+number+' must have '+tier.count+' cannon(s)');
   return {level,number};
  });
  return {tier,entries,label:foundry?foundryLabels[i]:tier.count+' '+(tier.count===1?'cannon':'cannons')};
 });
}
