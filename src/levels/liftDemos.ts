import type {Level} from './schema';
import {parseLinearEquation} from '../engine/equations/linear';
import {createLevelFlightPlan,editPlan} from '../game/flightPlan';

export const liftDemos:readonly Level[]=[
 {id:'lift-demo-linear',world:5,title:'Broken barrel',objective:'Slide the broken cannon so the Pip can reach it and continue to the exit.',bounds:{minX:-1,maxX:10,minY:-1,maxY:9},creatures:5,startId:'A',
 cannons:[{id:'A',type:'linear',position:{x:0,y:1},direction:1},{id:'B',type:'linear',position:{x:4,y:2},direction:1,lift:{minY:1,maxY:7,lockedShape:'-x'}}],
 exit:{x:8,y:1},obstacles:[{id:'floor',kind:'floor',bounds:{minX:-1,maxX:10,minY:-1,maxY:-.5}},{id:'wall',kind:'wall',bounds:{minX:5.6,maxX:6.4,minY:-.5,maxY:1.65}}]},
 {id:'lift-demo-arc',world:5,title:'Broken arch',objective:'Slide the locked arc into the incoming flight and clear the furnace.',bounds:{minX:-1,maxX:10,minY:-1,maxY:9},creatures:5,startId:'A',
 cannons:[{id:'A',type:'linear',position:{x:0,y:1},direction:1},{id:'B',type:'quadratic',position:{x:4,y:6},direction:1,lift:{minY:1,maxY:7,lockedShape:'-x^2/2+6x'}}],
 exit:{x:8,y:3},obstacles:[{id:'floor',kind:'floor',bounds:{minX:-1,maxX:10,minY:-1,maxY:-.5}},{id:'wall',kind:'wall',bounds:{minX:5.6,maxX:6.4,minY:-.5,maxY:4.2}}]}
];
export function initialDemoPlan(level:Level){
 const text=level.id==='lift-demo-arc'?'y = x/2 + 1':'y = x + 1';
 return editPlan(createLevelFlightPlan(level),'A',{text,equation:parseLinearEquation(text)});
}
