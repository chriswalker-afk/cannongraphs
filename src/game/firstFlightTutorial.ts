import {firstFlightTutorial as lesson} from '../levels/firstFlightTutorial';
import type {FlightPlan} from './flightPlan';
import {getPlanEntry} from './flightPlan';
import type {LevelState} from './levelState';
import type {Point} from '../engine/coordinates';
import {evaluateCannonEquation,type CannonEquation} from '../engine/equations/advanced';
import {SOURCE_EPSILON} from '../engine/trajectories/linear';
export const TUTORIAL_KEY='cannon-graphs:tutorial:first-flight:v1';
export function createTutorialStore(storage?:{getItem(key:string):string|null;setItem(key:string,value:string):void}){
 let seen=false;
 return {seen:()=>{try{seen||=storage?.getItem(TUTORIAL_KEY)==='seen';}catch{}return seen;},remember:()=>{seen=true;try{storage?.setItem(TUTORIAL_KEY,'seen');}catch{}}};
}
export function browserTutorialStore(){try{return createTutorialStore(window.localStorage);}catch{return createTutorialStore();}}
export type TutorialIntro='aim'|'coordinates'|'practice';
export type TutorialStep='aim'|'coordinates'|'first'|'next'|'splat'|'launch'|'flying'|'recover'|'retry'|'celebrate'|'finish';
export interface CoordinateGuide {readonly id:string;readonly point:Point;readonly label:string}
const a=lesson.cannons[0].position,b=lesson.cannons[1].position,exit=lesson.exit;
const guide=(id:string,point:Point):CoordinateGuide=>({id,point,label:id+' ('+point.x+', '+point.y+')'});
export function lineBetween(from:Point,to:Point){
 const dx=to.x-from.x,dy=to.y-from.y,m=dy/dx,c=from.y-m*from.x;
 if(!Number.isFinite(m)||!Number.isFinite(c))throw new Error('Expected nonvertical tutorial line');
 return {dx,dy,m,c};
}
export const firstLine=lineBetween(a,b),exitLine=lineBetween(b,exit);
function joins(e:CannonEquation|null|undefined,from:Point,to:Point){
 if(!e)return false;
 try{return Math.abs(evaluateCannonEquation(e,from.x)-from.y)<=SOURCE_EPSILON&&Math.abs(evaluateCannonEquation(e,to.x)-to.y)<=SOURCE_EPSILON;}catch{return false;}
}
export interface TutorialContext{intro:TutorialIntro;state:LevelState;plan:FlightPlan;selected:string;popupOpen:boolean}
export function tutorialStep(ctx:TutorialContext):TutorialStep{
 const {intro,state,plan,selected,popupOpen}=ctx;
 if(state.phase==='success')return 'finish';
 if(state.phase==='celebrating')return 'celebrate';
 if(state.phase==='launching')return 'flying';
 if(intro!=='practice')return intro;
 const first=getPlanEntry(plan,'A')?.equation,second=getPlanEntry(plan,'B')?.equation;
 if(!joins(first,a,b))return 'first';
 if(joins(second,b,exit))return state.failed?'retry':'launch';
 if(state.failed)return 'recover';
 if(!popupOpen||selected!=='B')return second?'launch':'next';
 return second?'launch':'splat';
}
export interface TutorialMessage {
 readonly number:number;readonly title:string;readonly text:string;
 readonly maths?:readonly string[];readonly guides:readonly CoordinateGuide[];
 readonly target?:string;readonly popupTip?:string;readonly next?:string;
}
// Worked calculations are derived from the actual practice anchors. No
// scored-level solution or pre-launch prediction is introduced into gameplay.
const calc=(from:Point,to:Point)=>{
 const l=lineBetween(from,to);
 return ['m = (y₂ − y₁)/(x₂ − x₁) = ('+to.y+' − '+from.y+')/('+to.x+' − '+from.x+') = '+l.m,
 from.y+' = '+l.m+' × '+from.x+' + c   ⇒   c = '+l.c,
 'y = '+(l.m===1?'x':l.m===-1?'−x':l.m+'x')+(l.c>=0?' + '+l.c:' − '+Math.abs(l.c))];
};
export function tutorialMessage(step:TutorialStep,ctx:TutorialContext):TutorialMessage{
 const open=ctx.popupOpen,selected=ctx.selected;
 const first=[guide('A',a),guide('B',b)],second=[guide('B',b),guide('Exit',exit)];
 switch(step){
 case 'aim':return {number:1,title:'Your mission: rescue the Pips!',text:'Pips fly along the graphs you programme. Guide them from cannon to cannon, then into the golden exit. One Pip tests the route; the others follow if it works. This is free practice, not a scored level.',guides:[],next:'Read coordinates →'};
 case 'coordinates':return {number:2,title:'Start with the coordinates',text:'Use the small marked dots, not the edge of the artwork. Read x across first, then y up. Hover, tap or focus the cannon or exit to inspect it. Here A is (1, 3), B is (4, 6) and the exit is (8, 2). Every flight equation must pass through its start and its destination.',guides:[...first,guide('Exit',exit)],next:'Work out a line →'};
 case 'first':return {number:3,title:'Find the equation from A to B',text:'Read the two points A (1, 3) and B (4, 6). Find the gradient (change in y ÷ change in x), then substitute the start into y = mx + c. Click cannon A and enter m = '+firstLine.m+', c = '+firstLine.c+'. Use the boxes or ↑/↓. Light green means a valid equation, not a proven flight.',maths:calc(a,b),guides:first,target:open&&selected==='A'?'#popup-editor':'.cannon-target[data-inspect="A"]',popupTip:'Choose y = mx + c. Enter 1 in m and 2 in c; or use an equivalent line.'};
 case 'next':return {number:4,title:'Programme the next cannon',text:'A is programmed. Use Next cannon in its pop-up to move to B (or click B on the graph). The first equation stays saved. Every cannon needs its own equation before Launch becomes available.',guides:second,target:open&&selected==='A'?'#next-cannon':'.cannon-target[data-inspect="B"]',popupTip:'Click Next cannon to edit B. Previous cannon returns to A.'};
 case 'splat':return {number:5,title:'Try a practice splat',text:'B starts at (4, 6). For this demonstration, deliberately enter m = −2 and c = 14. The line passes through B but is too steep to reach the exit. We will fix it after the test. You can also calculate the correct line now if you prefer.',guides:second,target:'#popup-editor',popupTip:'Practice mistake: m = −2, c = 14. This is intentionally NOT the exit equation.'};
 case 'launch':return {number:5,title:'Test your flight',text:'Both cannons have valid equations. Select Done, then Launch. One Pip will test the complete route. If it hits solid terrain, it splats; if the equation misses its start, it misfires. Practice retries are unlimited.',guides:[],target:open?'#popup-done':'#launch',popupTip:'Choose Done, then Launch to test the route.'};
 case 'flying':return {number:5,title:'Watch your equations in action',text:'Follow the Pip along the actual graphs. An equation that passes through its cannon can still miss the next target or hit terrain.',guides:[]};
 case 'recover':return {number:6,title:ctx.state.lastResult?.event.kind==='obstacle'?'Splat! Revise the failed cannon':'Check the exit equation',text:'A dark green halo means the tested leg worked; red means the flight failed there. Read B (4, 6) and the exit (8, 2). Calculate the gradient, substitute B, and check the exit: −8 + 10 = 2. Edit B, then try again. No scored Pips have been lost.',maths:calc(b,exit),guides:second,target:open&&selected==='B'?'#popup-editor':'.cannon-target[data-inspect="B"]',popupTip:'Now enter m = −1 and c = 10. Check the exit coordinate (8, 2).'};
 case 'retry':return {number:6,title:'Ready to try again',text:'Your revised equation connects B to the exit. A keeps its tested status; B is light green until the flight succeeds. Select Done and Try again.',guides:second,target:open?'#popup-done':'#launch',popupTip:'Choose Done, then Try again.'};
 case 'celebrate':return {number:7,title:'Route verified!',text:'The test Pip reached the exit. Both cannons are dark green. The remaining Pips automatically follow the same graphs. In scored levels, the more Pips you save, the more stars you earn.',guides:[]};
 case 'finish':return {number:7,title:'Flight school complete!',text:'Read the marked coordinates, find the equation for each leg, programme every cannon, and test the route. You are ready for the real first level. All scored Pips are ready, and no practice result counts towards progress.',guides:[]};
 }
}
