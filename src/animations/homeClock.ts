// Scheduler injection makes pause, hidden-tab handling and teardown testable.
// No independent intervals; exactly one RAF can be pending at any time.
export interface FrameScheduler {
 request(callback:(time:number)=>void):number;
 cancel(id:number):void;
}
export function createHomeClock(scheduler:FrameScheduler,paint:(elapsed:number)=>void){
 let id:number|undefined,elapsed=0,last:number|undefined,running=false,disposed=false;
 function tick(now:number){
  id=undefined;if(!running||disposed)return;
  if(last!==undefined)elapsed+=Math.max(0,Math.min(100,now-last));
  last=now;paint(elapsed);
  if(running&&!disposed&&id===undefined)id=scheduler.request(tick);
 }
 function pause(){
  running=false;last=undefined;
  if(id!==undefined){scheduler.cancel(id);id=undefined;}
 }
 return {
  resume(){if(disposed||running)return;running=true;last=undefined;id=scheduler.request(tick);},
  pause,
  reset(){elapsed=0;last=undefined;},
  elapsed:()=>elapsed,
  destroy(){disposed=true;pause();}
 };
}
