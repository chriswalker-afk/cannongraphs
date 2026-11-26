import type {AttemptResult} from '../engine/simulation/linearAttempt';
import {routeLegs} from '../engine/simulation/linearRoute';
import {attemptFeedback} from './attemptFeedback';
import type {LearningMode} from './learningModes';
export function modeAttemptFeedback(mode:LearningMode,result:AttemptResult):string{
 if(mode!=='ace')return attemptFeedback(result);
 const event=result.event,last=routeLegs(result).at(-1)!;
 if(event.kind==='exit')return 'Success! Your Pip reached the exit.';
 const outcome=event.kind==='misfire'?'Misfire — one Pip used.':event.kind==='obstacle'?'Splat! Your Pip hit an obstacle.':event.kind==='boundary'?'Your Pip left the level.':event.kind==='loop'?'Your Pip returned to a cannon.':event.kind==='domain'?'Flight stopped.':'Your Pip reached a cannon.';
 return 'Cannon '+last.cannonId+' — '+outcome;
}
