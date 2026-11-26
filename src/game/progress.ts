import {levels} from '../levels/catalog';
import type {Level} from '../levels/schema';
import {learningModes,modeBudget,type LearningMode} from './learningModes';
import type {LevelState} from './levelState';
import {scoreStars,type Stars} from './scoring';
import {bankedGems} from '../animations/gemTimeline';
export interface LevelRecord {readonly bestAttempts:number;readonly gems:readonly string[]}
export type ModeRecords=Readonly<Partial<Record<LearningMode,LevelRecord>>>;
export interface Progress {readonly version:1;readonly records:Readonly<Partial<Record<string,ModeRecords>>>}
export const emptyProgress=():Progress=>({version:1,records:{}});
export function getRecord(p:Progress,id:string,mode:LearningMode):LevelRecord|undefined{return p.records[id]?.[mode];}
export function recordStars(record:LevelRecord|undefined,level:Level,mode:LearningMode):Stars|null{
 if(!record||mode==='cadet')return null;
 const budget=modeBudget(mode,level);return scoreStars(budget-record.bestAttempts+1,budget);
}
function validGems(level:Level,ids:readonly unknown[]):string[]{
 const seen=new Set(ids);return (level.gems??[]).filter(g=>seen.has(g.id)).map(g=>g.id);
}
function sameRecord(a:LevelRecord|undefined,b:LevelRecord){
 return !!a&&a.bestAttempts===b.bestAttempts&&a.gems.length===b.gems.length&&a.gems.every((id,i)=>id===b.gems[i]);
}
function addRecord(p:Progress,l:Level,mode:LearningMode,next:LevelRecord):Progress{
 const previous=getRecord(p,l.id,mode);
 const r:LevelRecord={bestAttempts:Math.min(previous?.bestAttempts??next.bestAttempts,next.bestAttempts),gems:validGems(l,[...(previous?.gems??[]),...next.gems])};
 if(sameRecord(previous,r))return p;
 return {version:1,records:{...p.records,[l.id]:{...p.records[l.id],[mode]:r}}};
}
// A record is earned only at the end of a completed, successfully animated run.
// There is no reward for a preview, provisional gem pickup or pending celebration.
export function recordCompletion(p:Progress,level:Level,mode:LearningMode,s:LevelState):Progress{
 if(!levels.includes(level)||!learningModes.some(m=>m.id===mode))return p;
 const total=modeBudget(mode,level),unlimited=mode==='cadet';
 if(s.phase!=='success'||s.lastResult?.event.kind!=='exit'||s.active||s.celebration||s.waiting!==0||
  s.total!==total||s.unlimited!==unlimited||!Number.isSafeInteger(s.failed)||s.failed<0||
  s.saved!==(unlimited?total:total-s.failed)||s.saved<1||!Number.isSafeInteger(s.failed+1))return p;
 return addRecord(p,level,mode,{bestAttempts:s.failed+1,gems:bankedGems(s.lastResult)});
}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function decodeProgress(value:unknown):Progress{
 if(!object(value)||value.version!==1||!object(value.records))return emptyProgress();
 let p=emptyProgress();
 // Iterate only catalog keys and known mode IDs, never arbitrary object keys.
 for(const l of levels){
  const row=value.records[l.id];if(!object(row))continue;
  for(const {id:mode} of learningModes){
   const r=row[mode];if(!object(r))continue;
   const attempts=r.bestAttempts;
   if(typeof attempts!=='number'||!Number.isSafeInteger(attempts)||attempts<1||mode!=='cadet'&&attempts>modeBudget(mode,l))continue;
   p=addRecord(p,l,mode,{bestAttempts:attempts,gems:validGems(l,Array.isArray(r.gems)?r.gems:[])});
  }
 }
 return p;
}
export function parseProgress(raw:string|null):Progress{
 if(!raw)return emptyProgress();try{return decodeProgress(JSON.parse(raw));}catch{return emptyProgress();}
}
export function mergeProgress(a:Progress,b:Progress):Progress{
 let p=a;for(const l of levels)for(const {id:mode} of learningModes){
  const r=getRecord(b,l.id,mode);if(r)p=addRecord(p,l,mode,r);
 }return p;
}
export interface ModeSummary{completed:number;stars:number;gems:number}
export interface ProgressSummary{
 total:number;completed:number;gems:number;gemTotal:number;
 modes:Record<LearningMode,ModeSummary>;
}
export function summarizeProgress(p:Progress,scope:readonly Level[]=levels):ProgressSummary{
 const summary:ProgressSummary={total:scope.length,completed:0,gems:0,gemTotal:0,modes:{cadet:{completed:0,stars:0,gems:0},pilot:{completed:0,stars:0,gems:0},ace:{completed:0,stars:0,gems:0}}};
 for(const l of scope){
  const collected=new Set<string>();let completed=false;
  summary.gemTotal+=l.gems?.length??0;
  for(const {id:mode} of learningModes){
   const r=getRecord(p,l.id,mode);if(!r)continue;
   completed=true;const s=summary.modes[mode];s.completed++;s.stars+=recordStars(r,l,mode)??0;s.gems+=r.gems.length;
   r.gems.forEach(id=>collected.add(id));
  }
  if(completed)summary.completed++;
  summary.gems+=collected.size;
 }
 return summary;
}
