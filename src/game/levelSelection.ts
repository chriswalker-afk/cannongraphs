import {levels,worlds,worldForLevel,levelPosition,type World} from '../levels/catalog';
import type {Level} from '../levels/schema';
import {levelTiers,type DifficultyTier} from '../levels/progression';
import type {CannonType} from './cannons';
import {isLearningMode,type LearningMode} from './learningModes';
export type WorldCategory='normal'|'broken';
// Classify by authored mechanics so future lift worlds use the same selector.
export function categoryForWorld(world:World):WorldCategory{return world.levels.some(l=>!!l.anchorPuzzle||l.cannons.some(c=>c.lift))?'broken':'normal';}
export function worldsInCategory(category:WorldCategory):readonly World[]{return worlds.filter(w=>categoryForWorld(w)===category);}
export type SelectionState=
 |{readonly step:'worlds';readonly preferredId:string|null;readonly category:WorldCategory}
 |{readonly step:'modes';readonly worldNumber:number;readonly levelId:string|null;readonly preferredId:string|null;readonly previousMode:LearningMode|null}
 |{readonly step:'levels';readonly worldNumber:number;readonly levelId:string|null;readonly preferredId:string|null;readonly mode:LearningMode};
// preferredId is the most recently played level, not a completion record.
export function beginSelection(preferredId?:string,openCurrentWorld=false,preferredMode:LearningMode='pilot',preferredCategory?:WorldCategory):SelectionState{
 const level=levels.find(l=>l.id===preferredId),id=level?.id??null;
 if(openCurrentWorld&&level)return {step:'levels',worldNumber:level.world,levelId:level.id,preferredId:id,mode:preferredMode};
 return {step:'worlds',preferredId:id,category:preferredCategory??(level?categoryForWorld(worldForLevel(level.id)!):'normal')};
}
export function selectCategory(state:SelectionState,category:WorldCategory):SelectionState{
 if(state.step!=='worlds'||state.category===category||category!=='normal'&&category!=='broken')return state;
 return {...state,category};
}
export function selectWorld(state:SelectionState,number:number):SelectionState{
 if(state.step!=='worlds')return state;
 const world=worldsInCategory(state.category).find(w=>w.number===number);if(!world)return state;
 return {step:'modes',worldNumber:number,levelId:world.levels.some(l=>l.id===state.preferredId)?state.preferredId:null,preferredId:state.preferredId,previousMode:null};
}
export function selectMode(state:SelectionState,mode:LearningMode):SelectionState{
 if(state.step!=='modes'||!isLearningMode(mode))return state;
 return {step:'levels',worldNumber:state.worldNumber,levelId:state.levelId,preferredId:state.preferredId,mode};
}
export function backToModes(state:SelectionState):SelectionState{
 return state.step==='levels'?{step:'modes',worldNumber:state.worldNumber,levelId:state.levelId,preferredId:state.preferredId,previousMode:state.mode}:state;
}
export function selectLevel(state:SelectionState,id:string):SelectionState{
 if(state.step!=='levels'||state.levelId===id||!worlds.find(w=>w.number===state.worldNumber)?.levels.some(l=>l.id===id))return state;
 return {...state,levelId:id};
}
export function backToWorlds(state:SelectionState):SelectionState{
 return state.step==='worlds'?state:{step:'worlds',preferredId:state.preferredId,category:categoryForWorld(selectedWorld(state)!)};
}
export function selectedWorld(state:SelectionState):World|undefined{
 return state.step!=='worlds'?worlds.find(w=>w.number===state.worldNumber):undefined;
}
export function selectedLevel(state:SelectionState):Level|undefined{
 return state.step==='levels'?selectedWorld(state)?.levels.find(l=>l.id===state.levelId):undefined;
}
export interface LevelSummary{
 readonly index:number;readonly title:string;readonly objective:string;
 readonly families:readonly {type:CannonType;count:number}[];
 readonly cannonCount:number;readonly liftCount:number;readonly mountCount:number;readonly movableCount:number;readonly lockedCount:number;readonly pipCount:number;readonly gemCount:number;readonly tier:DifficultyTier;
}
export function summarizeLevel(level:Level):LevelSummary{
 const index=levelPosition(level.id)?.index;if(index===undefined||worldForLevel(level.id)?.number!==level.world)throw new Error('Not a catalog level');
 const counts=new Map<CannonType,number>();
 const all=[...level.cannons,...(level.anchorPuzzle?.inventory??[])];
 for(const c of all)counts.set(c.type,(counts.get(c.type)??0)+1);
 return {index,title:level.title,objective:level.objective,families:[...counts].map(([type,count])=>({type,count})),cannonCount:all.length,mountCount:level.anchorPuzzle?.anchors.length??0,movableCount:level.anchorPuzzle?.inventory.length??0,lockedCount:level.anchorPuzzle?.inventory.filter(c=>c.lockedShape!==undefined).length??0,liftCount:level.cannons.filter(c=>c.lift).length,tier:levelTiers(worldForLevel(level.id)!.levels).find(g=>g.entries.some(e=>e.level.id===level.id))!.tier,pipCount:level.creatures,gemCount:level.gems?.length??0};
}
