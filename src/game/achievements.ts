import {levels,worlds} from '../levels/catalog';
import {getRecord,recordStars,summarizeProgress,type Progress} from './progress';
import {learningModes,type LearningMode} from './learningModes';
export interface AchievementDefinition{
 readonly id:string;readonly title:string;readonly description:string;readonly symbol:string;readonly target:number;
 readonly count:(p:Progress)=>number;
}
export interface Achievement{readonly id:string;readonly title:string;readonly description:string;readonly symbol:string;readonly current:number;readonly target:number;readonly earned:boolean}
const rankedPerfect=(p:Progress,mode:'pilot'|'ace')=>levels.filter(l=>recordStars(getRecord(p,l.id,mode),l,mode)===3).length;
const completeWorlds=(p:Progress,mode:LearningMode)=>worlds.filter(w=>summarizeProgress(p,w.levels).modes[mode].completed===w.levels.length).length;
export const achievementDefinitions:readonly AchievementDefinition[]=[
 {id:'first-flight',title:'First flight',description:'Complete your first level in any mode.',symbol:'✦',target:1,count:p=>summarizeProgress(p).completed},
 {id:'cadet-wings',title:'Cadet wings',description:'Complete five different levels in Cadet.',symbol:'∞',target:5,count:p=>summarizeProgress(p).modes.cadet.completed},
 {id:'pilot-wings',title:'Pilot wings',description:'Complete five different levels in Pilot.',symbol:'↗',target:5,count:p=>summarizeProgress(p).modes.pilot.completed},
 {id:'ace-wings',title:'Ace wings',description:'Complete five different levels in Ace.',symbol:'⚑',target:5,count:p=>summarizeProgress(p).modes.ace.completed},
 {id:'perfect-pilot',title:'Perfect pilot',description:'Earn three stars on a Pilot level.',symbol:'★',target:1,count:p=>rankedPerfect(p,'pilot')},
 {id:'perfect-ace',title:'Perfect ace',description:'Earn three stars on an Ace level.',symbol:'✧',target:1,count:p=>rankedPerfect(p,'ace')},
 {id:'star-collector',title:'Star collector',description:'Earn 30 best-result stars across Pilot and Ace.',symbol:'★',target:30,count:p=>{const s=summarizeProgress(p);return s.modes.pilot.stars+s.modes.ace.stars;}},
 {id:'first-gem',title:'Hidden treasure',description:'Bank a gem on a successful flight.',symbol:'◆',target:1,count:p=>summarizeProgress(p).gems},
 {id:'gem-collector',title:'Gem collector',description:'Collect ten different gems across successful flights.',symbol:'◆',target:10,count:p=>summarizeProgress(p).gems},
 {id:'gem-explorer',title:'Gem explorer',description:'Collect thirty different gems across successful flights.',symbol:'◇',target:30,count:p=>summarizeProgress(p).gems},
 {id:'treasure-map',title:'Treasure map',description:'Collect every gem in one gem-bearing level, across successful flights.',symbol:'▧',target:1,count:p=>levels.filter(l=>{const s=summarizeProgress(p,[l]);return s.gemTotal>0&&s.gems===s.gemTotal;}).length},
 {id:'relay-runner',title:'Relay runner',description:'Complete a level featuring at least three cannons.',symbol:'⇢',target:1,count:p=>levels.filter(l=>l.cannons.length>=3&&learningModes.some(m=>getRecord(p,l.id,m.id))).length},
 {id:'world-explorer',title:'World explorer',description:'Complete all twelve levels of a world in one mode.',symbol:'◎',target:1,count:p=>learningModes.reduce((n,m)=>n+completeWorlds(p,m.id),0)},
 {id:'ace-world',title:'Ace of a world',description:'Complete all twelve levels of a world in Ace.',symbol:'♜',target:1,count:p=>completeWorlds(p,'ace')},
 {id:'graphiverse-explorer',title:'Graphiverse explorer',description:'Complete all 72 different levels in any combination of modes.',symbol:'✺',target:levels.length,count:p=>summarizeProgress(p).completed}
];
export function achievements(p:Progress):readonly Achievement[]{
 return achievementDefinitions.map(a=>{const current=Math.min(a.target,a.count(p));return {id:a.id,title:a.title,description:a.description,symbol:a.symbol,current,target:a.target,earned:current>=a.target};});
}
export function earnedAchievementIds(p:Progress):ReadonlySet<string>{return new Set(achievements(p).filter(a=>a.earned).map(a=>a.id));}
export function newlyEarned(before:Progress,after:Progress):readonly Achievement[]{
 const previous=earnedAchievementIds(before);return achievements(after).filter(a=>a.earned&&!previous.has(a.id));
}
