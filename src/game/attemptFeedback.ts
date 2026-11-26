import type {AttemptResult} from '../engine/simulation/linearAttempt';
const fmt=(x:number)=>String(Number(x.toFixed(3)));
export function attemptFeedback(result:AttemptResult):string{
 const {event,end}=result,at='('+fmt(end.x)+', '+fmt(end.y)+')';
 switch(event.kind){
  case 'exit':return 'Success! Your Pip reached the exit at '+at+'.';
  case 'misfire':return 'Misfire — one Pip used. At x = '+fmt(result.source.x)+', your equation gives y = '+fmt(result.source.y+event.startError)+', not '+fmt(result.source.y)+'.';
  case 'obstacle':return 'Splat! Your Pip hit '+(event.obstacleKind==='floor'?'the floor':event.obstacleKind==='wall'?'a wall':event.obstacleKind==='ceiling'?'a ceiling':'a platform')+' near '+at+'.';
  case 'boundary':return 'Missed the exit! Your graph reached the '+event.edge+' edge at '+at+'.';
 }
}
