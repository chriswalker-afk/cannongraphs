import type {Level,Cannon} from '../levels/schema';
import type {CannonType} from './cannons';
import {evaluateCannonEquation,type CannonEquation} from '../engine/equations/advanced';
import {SOURCE_EPSILON} from '../engine/trajectories/linear';
import {feedbackNumber as fmt} from './feedbackNumbers';
export type LearningMode='cadet'|'pilot'|'ace';
export interface ModePolicy{
 readonly id:LearningMode;readonly name:string;readonly tagline:string;readonly description:string;
 readonly unlimited:boolean;readonly preview:boolean;readonly templates:boolean;readonly coordinates:boolean;readonly hints:boolean;
 readonly accent:string;readonly tint:string;
}
export const learningModes:readonly ModePolicy[]=[
 {id:'cadet',name:'Cadet',tagline:'Explore with support',description:'Unlimited attempts, equation templates, guided checks and an optional graph preview.',unlimited:true,preview:true,templates:true,coordinates:true,hints:true,accent:'#357d68',tint:'#e3f2e9'},
 {id:'pilot',name:'Pilot',tagline:'The standard challenge',description:'Five Pips, coordinate inspection and progressive feedback after attempts. No preview.',unlimited:false,preview:false,templates:false,coordinates:true,hints:true,accent:'#3977ac',tint:'#e4eef9'},
 {id:'ace',name:'Ace',tagline:'Fly independently',description:'Three Pips. Read the axes yourself, with no mathematical hints or graph preview. Use the same equation controls.',unlimited:false,preview:false,templates:false,coordinates:false,hints:false,accent:'#8c6335',tint:'#f9edd6'}
];
export function isLearningMode(value:unknown):value is LearningMode{return learningModes.some(m=>m.id===value);}
export function modePolicy(mode:LearningMode):ModePolicy{
 const p=learningModes.find(m=>m.id===mode);if(!p)throw new Error('Unknown learning mode');return p;
}
export function modeBudget(mode:LearningMode,level:Pick<Level,'creatures'>):number{return mode==='ace'?3:level.creatures;}
export function modeBudgetLabel(mode:LearningMode,level?:Level):string{return mode==='cadet'?'Unlimited attempts':(mode==='ace'?3:level?.creatures??5)+' Pips';}
export function modeObjective(mode:LearningMode,level:Level):string{
 if(mode!=='ace')return level.objective;
 // These non-rational anchor values cannot be recovered exactly from tick
 // labels, so keep essential puzzle data available in every mode.
 if(level.id==='6-03')return 'Exact x: gem 1+ln(2), exit 1+ln(4).';
 if(level.id==='6-05')return 'Exact x: gem 1+e, exit 1+e².';
 const anchors=[...level.cannons.map(c=>({label:'Cannon '+c.id,point:c.position})),{label:'exit',point:level.exit}];
 const fractional=anchors.filter(a=>!Number.isInteger(a.point.x)||!Number.isInteger(a.point.y));
 return 'Plan a route to the exit.'+(fractional.length?' Exact non-integer anchors: '+fractional.map(a=>a.label+' ('+fmt(a.point.x)+', '+fmt(a.point.y)+')').join('; ')+'.':'');
}
export const templates:Readonly<Record<CannonType,string>>={
 linear:'?x+?',quadratic:'?x²+?x+?',cubic:'?x³+?x²+?x+?',reciprocal:'?/(x-?)+?',
 exponential:'?*(?)^(x-?)+?',logarithmic:'?*log(x-?)+?',wave:'?*sin(?(x-?))+?'
};
const prompts:Readonly<Record<CannonType,string>>={
 linear:'Find the gradient using two marked points, then substitute to find the intercept.',
 quadratic:'Use roots or a turning point to choose a form, then substitute the marked coordinates.',
 cubic:'Use roots or transformations to choose a form. Check any turning points.',
 reciprocal:'Choose an asymptote so both points are on one branch, then substitute coordinates.',
 exponential:'Choose a base for growth or decay, then use the marked points to find the remaining parameters.',
 logarithmic:'Choose a shift that keeps the argument positive, then substitute the marked points.',
 wave:'Choose amplitude, period and phase in radians; check the marked points.'
};
export function cadetGuidance(cannon:Cannon,equation:CannonEquation|null):string{
 if(!equation)return prompts[cannon.type];
 const {x,y}=cannon.position;
 let v=NaN;try{v=evaluateCannonEquation(equation,x);}catch{/* numerical domain */}
 if(!Number.isFinite(v))return 'Launch check: your function is undefined or non-finite at x = '+fmt(x)+'.';
 return 'Launch check: x = '+fmt(x)+' gives y = '+fmt(v)+'. '+(Math.abs(v-y)<=SOURCE_EPSILON?'That matches the cannon. Check the rest of the route.':'The cannon needs y = '+fmt(y)+'. Adjust your parameters.');
}
