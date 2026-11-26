import type {AttemptResult} from '../engine/simulation/linearAttempt';
import {isRouteResult} from '../engine/simulation/linearRoute';
import {feedbackNumber as fmt} from './feedbackNumbers';
export function attemptFeedback(result:AttemptResult):string{
 if(isRouteResult(result)){
  if(result.event.kind==='loop')return 'Loop! Your Pip returned to cannon '+result.event.cannonId+'. Adjust the route to reach the exit.';
  const last=result.legs[result.legs.length-1];
  return result.event.kind==='exit'?attemptFeedback(last):'Cannon '+last.cannonId+' — '+attemptFeedback(last);
 }
 const {event,end}=result,at='('+fmt(end.x)+', '+fmt(end.y)+')';
 switch(event.kind){
  case 'cannon':return 'Captured by cannon '+event.cannonId+'!';
  case 'loop':return 'Loop! Your Pip returned to cannon '+event.cannonId+'.';
  case 'exit':return 'Success! Your Pip reached the exit at '+at+'.';
  case 'domain':return event.reason==='asymptote'?'The flight cannot continue across an asymptote.':'The curve could not be resolved safely. Try simpler parameters.';
  case 'misfire':if(event.undefinedAtSource)return 'Misfire — one Pip used. Your equation is undefined or non-finite at the cannon’s x-coordinate.';return 'Misfire — one Pip used. At x = '+fmt(result.source.x)+', your equation gives y = '+fmt(result.source.y+event.startError)+', not '+fmt(result.source.y)+'.';
  case 'obstacle':return 'Splat! Your Pip hit '+(event.obstacleKind==='floor'?'the floor':event.obstacleKind==='wall'?'a wall':event.obstacleKind==='ceiling'?'a ceiling':'a platform')+' near '+at+'.';
  case 'boundary':return 'Missed the exit! Your graph reached the '+event.edge+' edge at '+at+'.';
 }
}
