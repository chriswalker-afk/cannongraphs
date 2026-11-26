import type {AttemptResult} from '../engine/simulation/linearAttempt';
export type LevelPhase='planning'|'launching'|'retry'|'success'|'gameOver';
export interface ActiveAttempt {readonly id:number;readonly result:AttemptResult}
export interface LevelState {
 readonly phase:LevelPhase;readonly total:number;readonly waiting:number;
 readonly failed:number;readonly saved:number;readonly nextAttemptId:number;
 readonly active:ActiveAttempt|null;readonly lastResult:AttemptResult|null;
}
export function createLevelState(total:number,nextAttemptId=1):LevelState{
 if(!Number.isSafeInteger(total)||total<1||!Number.isSafeInteger(nextAttemptId)||nextAttemptId<1)throw new RangeError('Invalid creature budget or attempt id');
 return {phase:'planning',total,waiting:total,failed:0,saved:0,nextAttemptId,active:null,lastResult:null};
}
export function canPlan(s:LevelState):boolean{return s.phase==='planning'||s.phase==='retry';}
export function canLaunch(s:LevelState):boolean{return canPlan(s)&&s.waiting>0&&s.active===null;}
// Only call with a parsed, valid equation's deterministic simulation result.
// Every launched Pip is reserved once, including a local misfire.
export function beginAttempt(s:LevelState,result:AttemptResult):LevelState{
 if(!canLaunch(s))return s;
 return {...s,phase:'launching',waiting:s.waiting-1,active:{id:s.nextAttemptId,result},nextAttemptId:s.nextAttemptId+1,lastResult:null};
}
export function finishAttempt(s:LevelState,id:number):LevelState{
 if(s.phase!=='launching'||s.active?.id!==id)return s;
 const result=s.active.result,success=result.event.kind==='exit';
 return {...s,phase:success?'success':s.waiting>0?'retry':'gameOver',
  failed:s.failed+(success?0:1),saved:s.saved+(success?1:0),active:null,lastResult:result};
}
// Do not discard an in-flight attempt. IDs survive restart so delayed callbacks cannot resolve a new attempt.
export function restartLevel(s:LevelState):LevelState{
 return s.phase==='launching'?s:createLevelState(s.total,s.nextAttemptId);
}
export function isTerminal(s:LevelState):boolean{return s.phase==='success'||s.phase==='gameOver';}
