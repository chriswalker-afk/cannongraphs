import type {AttemptResult} from '../engine/simulation/linearAttempt';
export type LevelPhase='planning'|'launching'|'retry'|'celebrating'|'success'|'gameOver';
export interface ActiveAttempt {readonly id:number;readonly result:AttemptResult}
export interface Celebration {readonly id:number;readonly result:AttemptResult;readonly count:number;readonly dispatched:number;readonly arrived:number}
export interface LevelState {
 readonly phase:LevelPhase;readonly total:number;readonly waiting:number;readonly unlimited:boolean;
 readonly failed:number;readonly saved:number;readonly nextAttemptId:number;
 readonly active:ActiveAttempt|null;readonly celebration:Celebration|null;readonly lastResult:AttemptResult|null;
}
export function createLevelState(total:number,nextAttemptId=1,unlimited=false):LevelState{
 if(!Number.isSafeInteger(total)||total<1||!Number.isSafeInteger(nextAttemptId)||nextAttemptId<1)throw new RangeError('Invalid creature budget or attempt id');
 return {phase:'planning',total,waiting:total,unlimited,failed:0,saved:0,nextAttemptId,active:null,celebration:null,lastResult:null};
}
export function canPlan(s:LevelState):boolean{return s.phase==='planning'||s.phase==='retry';}
export function canLaunch(s:LevelState):boolean{return canPlan(s)&&s.waiting>0&&s.active===null;}
export function activeCount(s:LevelState):number{return (s.active?1:0)+(s.celebration?s.celebration.dispatched-s.celebration.arrived:0);}
export function beginAttempt(s:LevelState,result:AttemptResult):LevelState{
 if(!canLaunch(s))return s;
 return {...s,phase:'launching',waiting:s.waiting-1,active:{id:s.nextAttemptId,result},nextAttemptId:s.nextAttemptId+1,lastResult:null};
}
export function finishAttempt(s:LevelState,id:number):LevelState{
 if(s.phase!=='launching'||s.active?.id!==id)return s;
 const result=s.active.result,success=result.event.kind==='exit';
 const celebration:Celebration|null=success&&s.waiting>0?{id:s.nextAttemptId,result,count:s.waiting,dispatched:0,arrived:0}:null;
 return {...s,phase:celebration?'celebrating':success?'success':s.unlimited||s.waiting>0?'retry':'gameOver',
  waiting:!success&&s.unlimited?s.total:s.waiting,
  failed:s.failed+(success?0:1),saved:s.saved+(success?1:0),active:null,lastResult:result,celebration,nextAttemptId:s.nextAttemptId+(celebration?1:0)};
}
// Monotone snapshots of the renderer's deterministic event timeline. Repeated,
// stale, impossible or out-of-order snapshots cannot give extra credit.
export function advanceCelebration(s:LevelState,id:number,dispatched:number,arrived:number):LevelState{
 const c=s.celebration;
 if(s.phase!=='celebrating'||!c||c.id!==id||!Number.isSafeInteger(dispatched)||!Number.isSafeInteger(arrived)||
 dispatched<c.dispatched||arrived<c.arrived||dispatched>c.count||arrived>dispatched||
 (dispatched===c.dispatched&&arrived===c.arrived))return s;
 return {...s,waiting:s.waiting-(dispatched-c.dispatched),saved:s.saved+(arrived-c.arrived),
 celebration:{...c,dispatched,arrived}};
}
export function finishCelebration(s:LevelState,id:number):LevelState{
 const c=s.celebration;
 if(s.phase!=='celebrating'||!c||c.id!==id||c.arrived!==c.count||c.dispatched!==c.count)return s;
 return {...s,phase:'success',celebration:null};
}
export function restartLevel(s:LevelState):LevelState{
 return s.phase==='launching'||s.phase==='celebrating'?s:createLevelState(s.total,s.nextAttemptId,s.unlimited);
}
export function isTerminal(s:LevelState):boolean{return s.phase==='success'||s.phase==='gameOver';}
