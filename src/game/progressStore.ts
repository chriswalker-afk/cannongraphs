import {emptyProgress,parseProgress,mergeProgress,recordCompletion,retainAchievements,type Progress} from './progress';
import {newlyEarned,earnedAchievementIds,type Achievement} from './achievements';
import type {Level} from '../levels/schema';
import type {LevelState} from './levelState';
import type {LearningMode} from './learningModes';
import {originalCurriculum} from './originalCurriculum';
export const LEGACY_PROGRESS_KEY='cannon-graphs:progress:v1';
export const PROGRESS_KEY='cannon-graphs:progress:v2';
export interface ProgressStorage{getItem(key:string):string|null;setItem(key:string,value:string):void}
export interface ProgressUpdate{readonly before:Progress;readonly after:Progress;readonly unlocked:readonly Achievement[];readonly improved:boolean;readonly persisted:boolean}
export function createProgressStore(storage?:ProgressStorage){
 let current=emptyProgress(),available=!!storage,dirty=false;
 // Merge existing disk records when a screen opens or a run finishes.
 // This preserves monotone records when two tabs are used sequentially.
 function read(){
  if(storage)try{
   const raw=storage.getItem(PROGRESS_KEY);
   if(raw===null){
    const legacy=storage.getItem(LEGACY_PROGRESS_KEY);
    if(legacy!==null){
     const historical=parseProgress(legacy,originalCurriculum);
     current=mergeProgress(current,retainAchievements(parseProgress(legacy),earnedAchievementIds(historical,originalCurriculum)));
     // Keep the original v1 key untouched as a local historical backup.
     dirty=true;
    }
   }else current=mergeProgress(current,parseProgress(raw));
   const remembered=retainAchievements(current,earnedAchievementIds(current));
   if(remembered!==current){current=remembered;dirty=true;}
   if(dirty){storage.setItem(PROGRESS_KEY,JSON.stringify(current));dirty=false;}
   available=true;
  }catch{available=false;}
  return current;
 }
 read();
 function complete(level:Level,mode:LearningMode,state:LevelState,played:Level=level):ProgressUpdate{
  const before=read(),recorded=recordCompletion(before,level,mode,state,played),after=retainAchievements(recorded,earnedAchievementIds(recorded)),improved=before!==after;
  current=after;
  if(improved)dirty=true;
  if(dirty&&storage){
   try{storage.setItem(PROGRESS_KEY,JSON.stringify(current));dirty=false;available=true;}
   catch{available=false;}
  }
  return {before,after,unlocked:newlyEarned(before,after),improved,persisted:available&&!dirty};
 }
 return {read,complete,persisted:()=>available&&!dirty};
}
export function browserProgressStore(){
 let storage:ProgressStorage|undefined;try{storage=window.localStorage;}catch{/* blocked or unavailable */}
 return createProgressStore(storage);
}
