import type {Point} from '../engine/coordinates';
import {isQuadratic} from '../engine/equations/linear';
import {isAdvanced,evaluateCannonEquation,type CannonEquation} from '../engine/equations/advanced';
import {CAPTURE_EPSILON,type AttemptResult} from '../engine/simulation/linearAttempt';
import {PIP_RADIUS} from '../engine/collisions/clearance';
import {routeLegs} from '../engine/simulation/linearRoute';
import type {Level} from '../levels/schema';
import {terrainLabel} from '../levels/terrain';
import {feedbackNumber as n,feedbackPoint as point} from './feedbackNumbers';
export type FailureKind='source'|'collision'|'missed-target'|'boundary'|'direction'|'loop'|'domain';
export type SupportLevel=1|2|3;
export interface FlightDiagnosis {
 readonly cannonId:string;readonly kind:FailureKind;readonly key:string;
 readonly title:string;readonly evidence:string;
 readonly prompts:readonly [string,string,string];
}
export interface AttemptHint extends FlightDiagnosis {
 readonly attemptId:number;readonly occurrence:number;readonly support:SupportLevel;readonly prompt:string;
}
export interface FeedbackHistory {
 readonly lastAttemptId:number;readonly counts:ReadonlyMap<string,number>;readonly latest:AttemptHint|null;
}
export function createFeedbackHistory():FeedbackHistory{return {lastAttemptId:0,counts:new Map(),latest:null};}
const linearMethod='Choose two points, find m = change in y ÷ change in x, then substitute one point into y = mx + c to find c.';
const directionName=(direction:1|-1)=>direction===1?'right':'left';
type Destination={id:string;label:string;position:Point};
function forwardDestinations(level:Level,leg:AttemptResult):Destination[]{
 return [{id:'exit',label:'the exit',position:level.exit},...level.cannons.filter(c=>c.id!==leg.cannonId).map(c=>({id:c.id,label:'cannon '+c.id,position:c.position}))]
  .filter(t=>(t.position.x-leg.source.x)*leg.direction>1e-9);
}
// Only examine a completed failed journey and its actual submitted equation.
// No reference answers, intended route or speculative "correct" equation are used.
export function diagnoseFlight(level:Level,result:AttemptResult,equations:ReadonlyMap<string,CannonEquation>):FlightDiagnosis|null{
 if(result.event.kind==='exit'||result.event.kind==='cannon')return null;
 const legs=routeLegs(result),leg=legs[legs.length-1],cannonId=leg.cannonId,event=result.event;
 const e=equations.get(cannonId);if(!e)return null;
 const advanced=isAdvanced(e),quadratic=!advanced&&isQuadratic(e),curved=advanced||quadratic,graph=curved?'curve':'line';
 const movable=level.cannons.some(c=>c.id===cannonId&&c.lift);
 const liftMethod=quadratic?'The arc shape is locked. Move the platform to change the constant in y = ax² + bx + c.':'The gradient is locked. Move the platform to change the constant in y = mx + c.';
 const method=movable?liftMethod:advanced?'Use the marked coordinates to constrain the function parameters. Check its domain and all turning points or extrema between the anchors.':quadratic?'Use the cannon and destination coordinates in y = ax² + bx + c. Choose a third point, or use a suitable turning point to control the shape.':linearMethod;
 const make=(kind:FailureKind,category:string,title:string,evidence:string,prompts:FlightDiagnosis['prompts']):FlightDiagnosis=>({
  cannonId,kind,key:JSON.stringify([cannonId,category]),title,evidence,prompts
 });
 if(event.kind==='loop'){
  const sequence=[...legs.map(l=>l.cannonId),event.cannonId].join(' → ');
  return make('loop','loop','Break the loop','The attempted route was '+sequence+'. It returned to a cannon already visited.',[
   'Check where the last cannon sends the Pip.',
   'Follow the cannon sequence and choose a destination that does not repeat a visited cannon.',
   'Choose a reachable, unvisited point or revise an earlier leg. '+method
  ]);
 }
 if(event.kind==='domain')return make('domain',event.reason,'Check the continuous branch',event.reason==='asymptote'?'A continuous flight cannot cross an asymptote.':'The curve approached a numerical limit near '+point(leg.end)+'.',[
  'Check where the submitted function is defined.', 'Keep both marked points on the same continuous branch.', 'Choose simpler parameters and check the entire interval between the anchors for discontinuities and extreme values.'
 ]);
 if(leg.event.kind==='misfire'){
  if(leg.event.undefinedAtSource)return make('domain','undefined-source','Check the domain','Your equation is undefined or non-finite at x = '+n(leg.source.x)+'.',[
   'Is the launch x-coordinate in the function’s domain?', 'Check denominators, logarithm arguments or trigonometric asymptotes.', 'Choose parameters so the function is defined at the launch and throughout the intended flight, then substitute the cannon coordinates.'
  ]);
  const x=leg.source.x,y=leg.source.y,value=evaluateCannonEquation(e,x),error=leg.event.startError;
  return make('source','source','Check the launch point','Your previous equation gives y ≈ '+n(value)+' at x = '+n(x)+'. Cannon '+cannonId+' is at '+point(leg.source)+'; the vertical difference has magnitude '+n(Math.abs(error))+'.',[
   'Does the '+graph+' pass through the cannon’s marked coordinates?',
   'Substitute x = '+n(x)+' into your equation. Does the result equal '+n(y)+'?',
   advanced?'Substitute the cannon coordinates into the submitted family and solve for a suitable parameter. Check its domain.':quadratic?'In y = ax² + bx + c, substitute the cannon’s x and y. Once a and b are chosen, use c = y − ax² − bx and check the launch point.':'In y = mx + c, substitute the cannon’s x and y. Once you have chosen m, rearrange using c = y − mx, then check the launch point again.'
  ]);
 }
 if(leg.event.kind==='obstacle'){
  const hit=leg.event,o=level.obstacles.find(o=>o.id===hit.obstacleId);
  if(!o)return null;
  const b=o.bounds,face=hit.normal.y>.8?'upper surface':hit.normal.y<-.8?'underside':'side or corner';
  const above=hit.normal.y>.8,below=hit.normal.y<-.8;
  const check=above?'Check the height of your graph above the obstacle.':below?'Check the height of your graph below the obstacle.':'Check the height of your graph across the obstacle’s width.';
  const comparison=above?'For a route above it, y must stay sufficiently above its top.':below?'For a route below it, y must stay sufficiently below its bottom.':'Decide whether the route should pass above or below it.';
  const name=terrainLabel(o,level.world);
  return make('collision','collision:'+o.id,'Clear the '+name.toLowerCase(),'The Pip hit the '+face+' with its centre near '+point(leg.end)+'. '+name+' spans x = '+n(b.minX)+' to '+n(b.maxX)+' and y = '+n(b.minY)+' to '+n(b.maxY)+'.',[
   movable?'Check the platform height: the trajectory shape cannot change.':check,
   'Use the obstacle’s bounds to compare the '+graph+'’s y-values with its top and bottom. '+comparison,
   (advanced?'Check the function across the obstacle’s x-interval, including any extrema within it. ':quadratic?'Check y = ax² + bx + c at the ends of the obstacle’s x-interval and at the turning point if it lies inside. ':'Calculate y = mx + c at both ends of the obstacle’s x-interval for a route across its full width. ')+comparison+' Allow '+n(PIP_RADIUS)+' units for the Pip’s body; touching is a collision.'
  ]);
 }
 if(leg.event.kind==='boundary'){
  const edge=leg.event.edge,forward=forwardDestinations(level,leg);
  if(!forward.length){
   return make('direction','direction','Check the firing direction','Cannon '+cannonId+' fires '+directionName(leg.direction)+'. No other marked destination lies strictly in that direction.',[
    'Look for another way through the earlier cannons.',
    'A graph travels only in the direction of its cannon. Reconsider how the Pip arrived here.',
    'Trace the earlier transfers and choose a route whose next marked point is ahead of each firing cannon.'
   ]);
  }
  // A concrete example only if its x-coordinate was actually reached.
  // When several candidates were passed, pick the smallest vertical miss, not an assumed intended target.
  const passed=forward.filter(t=>(t.position.x-leg.end.x)*leg.direction<=1e-9)
   .map(t=>({...t,value:evaluateCannonEquation(e,t.position.x)}))
   .map(t=>({...t,error:t.value-t.position.y}))
   .filter(t=>Number.isFinite(t.error)&&Math.abs(t.error)>CAPTURE_EPSILON)
   .sort((a,b)=>Math.abs(a.error)-Math.abs(b.error)||Math.abs(a.position.x-leg.source.x)-Math.abs(b.position.x-leg.source.x)||a.id.localeCompare(b.id));
  const target=passed[0];
  if(target){
   const targetLift=level.cannons.some(c=>c.id===target.id&&c.lift);
   const relation=target.error>0?'above':'below';
   const which=forward.length>1?'For example, at ':'At ';
   return make('missed-target','missed-target',movable||targetLift?'Check the lift height':curved?'Check the curve':'Check the gradient',which+target.label+' ('+n(target.position.x)+', '+n(target.position.y)+'), the attempted '+graph+' gives y ≈ '+n(target.value)+', about '+n(Math.abs(target.error))+' units '+relation+' the marked point.',[
    targetLift?'The flight missed a movable cannon. Compare the flight height with its platform.':movable?liftMethod:curved?'The curve missed the destination. Check the shape and parameters.':'The line left the level without reaching a destination. Check the gradient between your chosen points.',
    'Substitute the x-coordinate of your chosen destination into the equation and compare the y-values.',
    (targetLift?'Evaluate the incoming equation at the lift’s x-coordinate, then position its platform at that height. Check where the locked outgoing trajectory leads.':method+' Check both marked points in your equation before trying again.')
   ]);
  }
  const vertical=edge==='top'||edge==='bottom';
  return make('boundary','boundary:'+edge,'Keep the graph in the level','The attempted '+graph+' reached the '+edge+' edge near '+point(leg.end)+'.'+(vertical?' It did not reach a marked destination before leaving the level.':''),[
   movable?liftMethod:advanced?'Check the function’s extrema, domain and values before it leaves the level.':quadratic?'Check the curve’s turning point and opening direction before it leaves the level.':vertical?'Is the line rising or falling too quickly for the route you chose?':'Check that your line meets the next marked point before leaving the level.',
   advanced?'Check the function values and any extrema between the marked points.':quadratic?'Check the y-values at the cannon, destination and turning point.':'Compare the changes in x and y between the firing cannon and your chosen destination.',
   method+' Check that the graph remains inside the level until it reaches that destination.'
  ]);
 }
 return null;
}
export function recordAttemptFeedback(history:FeedbackHistory,attemptId:number,level:Level,result:AttemptResult,equations:ReadonlyMap<string,CannonEquation>,minimumSupport:SupportLevel=1):FeedbackHistory{
 if(!Number.isSafeInteger(attemptId)||attemptId<=history.lastAttemptId)return history;
 const diagnosis=diagnoseFlight(level,result,equations);
 if(!diagnosis)return {...history,lastAttemptId:attemptId,latest:null};
 const occurrence=(history.counts.get(diagnosis.key)??0)+1,support=Math.min(3,Math.max(minimumSupport,occurrence+(minimumSupport-1))) as SupportLevel;
 const counts=new Map(history.counts);counts.set(diagnosis.key,occurrence);
 return {lastAttemptId:attemptId,counts,latest:{...diagnosis,attemptId,occurrence,support,prompt:diagnosis.prompts[support-1]}};
}
