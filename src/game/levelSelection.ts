import {levels,worlds,worldForLevel,levelPosition,type World} from '../levels/catalog';
import type {Level} from '../levels/schema';
import type {CannonType} from './cannons';
import {isLearningMode,type LearningMode} from './learningModes';
export type SelectionState=
 |{readonly step:'worlds';readonly preferredId:string|null}
 |{readonly step:'modes';readonly worldNumber:number;readonly levelId:string|null;readonly preferredId:string|null;readonly previousMode:LearningMode|null}
 |{readonly step:'levels';readonly worldNumber:number;readonly levelId:string|null;readonly preferredId:string|null;readonly mode:LearningMode};
// preferredId is the most recently played level, not a completion record.
export function beginSelection(preferredId?:string,openCurrentWorld=false,preferredMode:LearningMode='pilot'):SelectionState{
 const level=levels.find(l=>l.id===preferredId),id=level?.id??null;
 if(openCurrentWorld&&level)return {step:'levels',worldNumber:level.world,levelId:level.id,preferredId:id,mode:preferredMode};
 return {step:'worlds',preferredId:id};
}
export function selectWorld(state:SelectionState,number:number):SelectionState{
 if(state.step!=='worlds')return state;
 const world=worlds.find(w=>w.number===number);if(!world)return state;
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
 return state.step==='worlds'?state:{step:'worlds',preferredId:state.preferredId};
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
 readonly cannonCount:number;readonly pipCount:number;readonly gemCount:number;
}
export function summarizeLevel(level:Level):LevelSummary{
 const index=levelPosition(level.id)?.index;if(index===undefined||worldForLevel(level.id)?.number!==level.world)throw new Error('Not a catalog level');
 const counts=new Map<CannonType,number>();
 for(const c of level.cannons)counts.set(c.type,(counts.get(c.type)??0)+1);
 return {index,title:level.title,objective:level.objective,families:[...counts].map(([type,count])=>({type,count})),cannonCount:level.cannons.length,pipCount:level.creatures,gemCount:level.gems?.length??0};
}
