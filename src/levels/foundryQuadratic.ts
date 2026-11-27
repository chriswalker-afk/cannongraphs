import type {Level,Cannon,Obstacle} from './schema';
import {parseLinearEquation} from '../engine/equations/linear';
import {createLevelFlightPlan,editPlan} from '../game/flightPlan';

const normal=(id:string,x:number,y:number):Cannon=>({id,type:'linear',position:{x,y},direction:1});
const lift=(id:string,x:number,y:number,type:'linear'|'quadratic',lockedShape:string,minY=1,maxY=7):Cannon=>({id,type,position:{x,y},direction:1,lift:{minY,maxY,lockedShape}});
const wall=(id:string,x1:number,x2:number,top:number):Obstacle=>({id,kind:'wall',bounds:{minX:x1,maxX:x2,minY:-1,maxY:top}});
const ceiling=(id:string,x1:number,x2:number,bottom:number):Obstacle=>({id,kind:'ceiling',bounds:{minX:x1,maxX:x2,minY:bottom,maxY:11}});
const make=(number:number,title:string,objective:string,cannons:Cannon[],exit:Level['exit'],obstacles:Obstacle[]):Level=>({
 id:'foundry-quadratic-'+number,world:7,title,objective,bounds:{minX:-1,maxX:Math.max(12,exit.x+1),minY:-2,maxY:11},creatures:5,startId:'A',cannons,exit,
 obstacles:[{id:'floor',kind:'floor',bounds:{minX:-1,maxX:Math.max(12,exit.x+1),minY:-2,maxY:-1}},...obstacles]
});
// Only authored starting positions, locked shapes and scaffolding are
// shipped. Reference placements and solutions live in the regression suite.
export const foundryQuadratic:readonly Level[]=[
 make(7,'Broken arch','Translate the locked downward-opening arc so it receives the Pip and clears the furnace.',
 [normal('A',0,2),lift('B',4,6,'quadratic','-x^2/4+3x')],{x:8,y:3},[wall('furnace',5.6,6.4,3.45)]),
 make(8,'Under the press','Lower or raise the upward-opening arc to pass beneath the overhead press.',
 [normal('A',0,6),lift('B',4,1,'quadratic','x^2/4-3x')],{x:8,y:4},[ceiling('press',5.6,6.4,3.55)]),
 make(9,'Mixed machinery','Join the locked arc to a second lift with a fixed negative gradient.',
 [normal('A',0,1),lift('B',3,2,'quadratic','-x^2/2+5x'),lift('C',7,6,'linear','-x')],{x:11,y:0},[wall('intake',1.5,2.1,2),wall('furnace',4.6,5.4,4.8)]),
 make(10,'Reverse engineering','Work backwards from the exit to find the arc height, then program the incoming line.',
 [normal('A',0,1),lift('B',4,2,'quadratic','-x^2/4+3x')],{x:10,y:2},[wall('furnace',5.5,6.5,5.25)]),
 make(11,'Assembly line','Find three dependent lift heights and program the first cannon. Pass under the press and climb to the exit.',
 [normal('A',0,2),lift('B',3,2,'linear','-x/2'),lift('C',7,6,'quadratic','x^2/4-9x/2'),lift('D',11,5,'linear','x')],{x:14,y:6},[wall('intake',1.5,2.1,3.1),ceiling('press',8.6,9.4,3.5)]),
 make(12,'Foundry gauntlet','Program two linear cannons and position both locked arcs to pass above and below the machinery.',
 [normal('A',0,2),lift('B',3,2,'quadratic','-x^2/2+5x'),normal('C',7,4),lift('D',11,5,'quadratic','x^2/4-13x/2')],{x:15,y:2},
 [wall('intake',1.5,2,2.65),wall('furnace',4.5,5.5,5.2),wall('boiler',8.5,9.2,2.5),ceiling('press',12.5,13.5,1.7)])
];
const starterEquations:Readonly<Record<string,string>>={
 'foundry-quadratic-7':'y = x/4 + 2',
 'foundry-quadratic-8':'y = 6 - x/2',
 'foundry-quadratic-9':'y = x + 1'
};
export function foundryQuadraticStartPlan(level:Level){
 const plan=createLevelFlightPlan(level),text=starterEquations[level.id];
 return text?editPlan(plan,level.startId,{text,equation:parseLinearEquation(text)}):plan;
}
