import {emptyProgress,parseProgress,mergeProgress,recordCompletion,type Progress} from './progress';
import {newlyEarned,type Achievement} from './achievements';
import type {Level} from '../levels/schema';
import type {LevelState} from './levelState';
import type {LearningMode} from './learningModes';
export const PROGRESS_KEY='cannon-graphs:progress:v1';
export interface ProgressStorage{getItem(key:string):string|null;setItem(key:string,value:string):void}
export interface ProgressUpdate{readonly before:Progress;readonly after:Progress;readonly unlocked:readonly Achievement[];readonly improved:boolean;readonly persisted:boolean}
export function createProgressStore(storage?:ProgressStorage){
 let current=emptyProgress(),available=!!storage,dirty=false;
 // Merge existing disk records when a screen opens or a run finishes.
 // This preserves monotone records when two tabs are used sequentially.
 function read(){
  if(storage)try{
   current=mergeProgress(current,parseProgress(storage.getItem(PROGRESS_KEY)));
   if(!dirty)available=true;
  }catch{available=false;}
  return current;
 }
 read();
 function complete(level:Level,mode:LearningMode,state:LevelState):ProgressUpdate{
  const before=read(),after=recordCompletion(before,level,mode,state),improved=before!==after;
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
