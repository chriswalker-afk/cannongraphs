import type {Level,Cannon,Obstacle} from './schema';
import {parseLinearEquation} from '../engine/equations/linear';
import {createLevelFlightPlan,editPlan} from '../game/flightPlan';
import {initialDemoPlan} from './liftDemos';

const normal=(x:number,y:number):Cannon=>({id:'A',type:'linear',position:{x,y},direction:1});
const lift=(id:string,x:number,y:number,lockedShape:string,minY=1,maxY=7):Cannon=>({id,type:'linear',position:{x,y},direction:1,lift:{minY,maxY,lockedShape}});
const wall=(id:string,x1:number,x2:number,top:number):Obstacle=>({id,kind:'wall',bounds:{minX:x1,maxX:x2,minY:-1,maxY:top}});
const ceiling=(id:string,x1:number,x2:number,bottom:number):Obstacle=>({id,kind:'ceiling',bounds:{minX:x1,maxX:x2,minY:bottom,maxY:9}});
const make=(number:number,title:string,objective:string,cannons:Cannon[],exit:Level['exit'],obstacles:Obstacle[]):Level=>({
 id:'foundry-linear-'+number,world:7,title,objective,bounds:{minX:-1,maxX:12,minY:-2,maxY:9},creatures:5,startId:'A',cannons,exit,
 obstacles:[{id:'floor',kind:'floor',bounds:{minX:-1,maxX:12,minY:-2,maxY:-1}},...obstacles]
});
// Only starting layouts and intentionally supplied incoming equations are
// shipped. Target heights and solved equations are in the tests, not here.
export const foundryLinear:readonly Level[]=[
 make(1,'First lift','Lower the broken cannon onto the incoming horizontal line. Its gradient is fixed.',[normal(0,2),lift('B',3,5,'x')],{x:8,y:7},[ceiling('press',1.5,2.4,3)]),
 make(2,'Downhill lift','Raise the locked negative-gradient cannon into the incoming flight.',[normal(0,2),lift('B',4,3,'-x')],{x:9,y:1},[wall('furnace',5.6,6.4,2.6)]),
 make(3,'Fractional gears','Use a fractional gradient to connect the flight to the low exit.',[normal(0,1),lift('B',4,5,'-x/2')],{x:10,y:0},[wall('boiler',2.5,3.1,1)]),
 make(4,'Double lift','Two lifts must line up in order. Moving the first affects the second connection.',[normal(0,2),lift('B',3,2,'-x'),lift('C',6,6,'x')],{x:10,y:6},[wall('first-press',1.8,2.4,3.4),wall('second-press',4.5,5.2,2.1)]),
 make(5,'Working backwards','Start with the exit and fixed gradient. Choose the lift height, then program the first cannon.',[normal(0,2),lift('B',4,3,'-x')],{x:9,y:1},[wall('furnace',2.4,3,2)]),
 make(6,'Narrow passage','Work backwards through two lifts, then program A to pass the first gap.',[normal(0,3),lift('B',3,3,'-x'),lift('C',7,5,'x/2')],{x:11,y:4},[wall('first-low',1.4,2,4),ceiling('first-high',1.4,2,5.5),wall('second-low',4.6,5.4,3.2),ceiling('second-high',4.6,5.4,4.8)])
];
const starterEquations:Readonly<Record<string,string>>={
 'foundry-linear-1':'y = 2','foundry-linear-2':'y = x + 2','foundry-linear-3':'y = x/2 + 1','foundry-linear-4':'y = x + 2'
};
export function foundryStartPlan(level:Level){
 if(level.id.startsWith('lift-demo-'))return initialDemoPlan(level);
 const plan=createLevelFlightPlan(level),text=starterEquations[level.id];
 return text?editPlan(plan,level.startId,{text,equation:parseLinearEquation(text)}):plan;
}
export function nextFoundryLinear(id:string):Level|undefined{
 const index=foundryLinear.findIndex(l=>l.id===id);return index<0?undefined:foundryLinear[index+1];
}
