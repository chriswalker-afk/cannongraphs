import type {Level,Obstacle} from './schema';
import type {AnchorPoint,InventoryCannon} from './anchorSpec';
import type {Point} from '../engine/coordinates';
import {createLevelFlightPlan,editPlan} from '../game/flightPlan';
import {parseLinearEquation} from '../engine/equations/linear';

const point=(x:number,y:number):Point=>({x,y});
const mount=(id:string,x:number,y:number):AnchorPoint=>({id,position:point(x,y)});
const part=(id:string,lockedShape?:string):InventoryCannon=>({id,type:'linear',direction:1,...(lockedShape!==undefined?{lockedShape}:{})});
const wall=(id:string,minX:number,maxX:number,top:number):Obstacle=>({id,kind:'wall',bounds:{minX,maxX,minY:-.6,maxY:top}});
const ceiling=(id:string,minX:number,maxX:number,bottom:number,top:number):Obstacle=>({id,kind:'ceiling',bounds:{minX,maxX,minY:bottom,maxY:top}});
function level(n:number,title:string,objective:string,startY:number,exit:Point,maxY:number,anchors:AnchorPoint[],inventory:InventoryCannon[],obstacles:Obstacle[]):Level{
 const bounds={minX:-1,maxX:exit.x+1,minY:-1,maxY};
 return {id:'salvage-linear-'+n,world:8,title,objective,bounds,creatures:5,startId:'A',
 cannons:[{id:'A',type:'linear',direction:1,position:point(0,startY)}],exit,
 obstacles:[{id:'floor',kind:'floor',bounds:{minX:bounds.minX,maxX:bounds.maxX,minY:bounds.minY,maxY:-.6}},...obstacles],
 anchorPuzzle:{anchors,inventory}};
}
// Every mount is legal to occupy. Obstacles make plausible but incorrect
// incoming/outgoing connections fail in the actual simulator.
export const salvageLinear:readonly Level[]=[
 level(1,'First mounting','Use the supplied descending line to mount the broken positive-gradient cannon and connect to the exit.',5,point(8,5),7,
  [mount('P',2,3),mount('Q',4,1),mount('R',6,3)],[part('B','x')],
  [ceiling('overhead-scrap',2.5,3.2,3.7,7)]),
 level(2,'Wrong turn','Find a mount that receives the supplied rising line and sends the Pip downhill to the exit.',1,point(8,1),7,
  [mount('P',2,3),mount('Q',4,5),mount('R',6,3),mount('S',5,2)],[part('B','-x')],
  [wall('scrap-stack',2.6,3.2,2.2)]),
 level(3,'Spare parts','The starting cannon needs programming. Work backwards from the exit using the locked fractional gradient.',2,point(10,2),8,
  [mount('P',2,3.5),mount('Q',4,5),mount('R',8,3),mount('S',5,2),mount('T',7,6)],[part('B','-x/2')],
  [wall('low-crate-stack',2.5,3,3)]),
 level(4,'Double connection','Mount both broken cannons. Connect the rising and falling lines in a complete relay.',2,point(11,5),8,
  [mount('P',2,4),mount('Q',3,5),mount('R',6,2),mount('S',7,1),mount('T',9,3)],[part('B','-x'),part('C','x')],
  [wall('entry-bulkhead',1.5,2,2.3)]),
 level(5,'Reassembled','Place the ordinary and locked cannons. Program both ordinary cannons to connect the relay through the narrow openings.',2,point(12,2),9,
  [mount('P',3,2),mount('Q',3,5),mount('R',5,2),mount('S',8,4),mount('T',6,5),mount('U',4,8)],[part('B'),part('C','-x/2')],
  [wall('intake-stack',1.6,2.2,3.1),ceiling('intake-beam',1.6,2.2,4.5,9),ceiling('sorting-press',4.8,5.3,4.9,9)]),
 level(6,'Scrap maze','Use the locked descent and a programmable part to negotiate all three barriers. More than one mount lies on the descending line.',2,point(12,5),9,
  [mount('P',3,2),mount('Q',3,6),mount('R',6,3),mount('S',8,1),mount('T',9,0),mount('U',4,8),mount('V',7,6)],[part('B','-x'),part('C')],
  [wall('entry-stack',1.6,2.2,3.8),ceiling('entry-beam',1.6,2.2,5.25,9),ceiling('sorting-beam',6.6,7.1,3.1,9),wall('exit-stack',9.5,10,1.6)])
];
// Only the first two puzzles provide the incoming equation. No assignments
// or solution equations for later levels are stored in the shipped catalogue.
const starter:Readonly<Record<string,string>>={'salvage-linear-1':'y = 5 - x','salvage-linear-2':'y = x + 1'};
export function initialSalvageLinearPlan(level:Level){
 const plan=createLevelFlightPlan(level),text=starter[level.id];
 return text?editPlan(plan,level.startId,{text,equation:parseLinearEquation(text)}):plan;
}
export function nextSalvageLinear(id:string):Level|undefined{
 const index=salvageLinear.findIndex(l=>l.id===id);return index<0?undefined:salvageLinear[index+1];
}
