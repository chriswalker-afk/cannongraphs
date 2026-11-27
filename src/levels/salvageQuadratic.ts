import type {Level,Obstacle} from './schema';
import type {AnchorPoint,InventoryCannon} from './anchorSpec';
import type {Point} from '../engine/coordinates';

const point=(x:number,y:number):Point=>({x,y});
const mount=(id:string,x:number,y:number):AnchorPoint=>({id,position:point(x,y)});
const part=(id:string,type:'linear'|'quadratic',lockedShape?:string):InventoryCannon=>({id,type,direction:1,...(lockedShape!==undefined?{lockedShape}:{})});
const wall=(id:string,minX:number,maxX:number,top:number):Obstacle=>({id,kind:'wall',bounds:{minX,maxX,minY:-.6,maxY:top}});
const ceiling=(id:string,minX:number,maxX:number,bottom:number,top:number):Obstacle=>({id,kind:'ceiling',bounds:{minX,maxX,minY:bottom,maxY:top}});
function level(n:number,title:string,objective:string,startY:number,exit:Point,maxY:number,anchors:AnchorPoint[],inventory:InventoryCannon[],obstacles:Obstacle[]):Level{
 const bounds={minX:-1,maxX:exit.x+1,minY:-1,maxY};
 return {id:'salvage-quadratic-'+n,world:8,title,objective,bounds,creatures:5,startId:'A',
 cannons:[{id:'A',type:'linear',direction:1,position:point(0,startY)}],exit,
 obstacles:[{id:'floor',kind:'floor',bounds:{minX:bounds.minX,maxX:bounds.maxX,minY:bounds.minY,maxY:-.6}},...obstacles],
 anchorPuzzle:{anchors,inventory}};
}

// All programmable parts are linear. Quadratics are locked in global x,
// so placement, exact evaluation and curve/terrain clearance determine
// their paths. No solution assignments or starter equations ship here.
export const salvageQuadratic:readonly Level[]=[
 level(7,'Arc recovery','Program the incoming line and mount the locked downward arc. Work backwards from the exit, and clear the sorting furnace.',1,point(8,3),8,
  [mount('P',2,2),mount('Q',6,5),mount('R',4,3),mount('S',7,2),mount('T',5,3)],
  [part('B','quadratic','-x^2/2+6x')],
  [ceiling('intake-beam',2,2.4,2.55,8),wall('furnace',5.6,6.4,4.2)]),
 level(8,'Mixed salvage','Connect an upward-opening locked arc to a rising locked line. Find both mounts and pass below the overhead press.',2,point(12,8),10,
  [mount('P',2,7),mount('Q',8,4),mount('R',4,4),mount('S',9,5),mount('T',5,2),mount('U',7,6)],
  [part('B','quadratic','x^2/4-3x'),part('C','linear','x')],
  [ceiling('intake-beam',1,1.4,4,10),ceiling('sorting-press',5.5,6.5,3.6,10)]),
 level(9,'False connections','Several mounts lie on a plausible arc. Choose a locked quadratic and ordinary line that clear both scrap stacks and connect to the exit.',1,point(11,1),9,
  [mount('P',2,1.5),mount('Q',3,4),mount('R',5,6),mount('S',7,4),mount('T',8,2),mount('U',9,5),mount('V',4,7.5)],
  [part('B','quadratic','-x^2/2+5x'),part('C','linear')],
  [wall('intake-stack',1.4,1.8,2.1),wall('first-scrap-stack',4,4.3,5.15),wall('furnace',5.6,6.15,5.1)]),
 level(10,'Reverse assembly','Deduce three locked placements from the exit. The fractional line and upward-opening arc must meet before the final rising line.',2,point(14,6),9,
  [mount('P',2,5.5),mount('Q',3,5),mount('R',7,3),mount('S',11,3),mount('T',10,2),mount('U',12,4),mount('V',6,4.25),mount('W',5,6)],
  [part('B','linear','-x/2'),part('C','quadratic','x^2/4-9x/2'),part('D','linear','x')],
  [ceiling('entry-beam',1.4,1.8,4.3,9),ceiling('sorting-press',8.5,9.5,2.65,9)]),
 level(11,'Interchangeable parts','Three locked cannons are supplied. Decide which one fires first, which follows it and which connects to the exit. Labels do not specify the order.',1,point(15,1),9,
  [mount('P',3,3),mount('Q',4,4.5),mount('R',7,3),mount('S',8,3.5),mount('T',11,5),mount('U',12,4),mount('V',2,.5),mount('W',6,7),mount('X',10,2)],
  [part('B','linear','x/2'),part('C','quadratic','-x^2/2+5x'),part('D','linear','-x')],
  [wall('intake-stack',1.6,2.1,1.65),ceiling('intake-beam',1.6,2.1,2.7,9),wall('furnace',4.6,5.4,4.15)]),
 level(12,'Salvage master','Place two different locked arcs and an ordinary cannon. Program the two lines, clear the furnace, fit through the sorting gate and pass below the final press.',2,point(15,2),9,
  [mount('P',3,4),mount('Q',7,4),mount('R',11,2),mount('S',10,3.25),mount('T',5,6),mount('U',2,1.5),mount('V',6,5.5),mount('W',8,6),mount('X',12,4),mount('Y',4,7)],
  [part('B','quadratic','-x^2/2+5x'),part('C','linear'),part('D','quadratic','x^2/4-13x/2')],
  [wall('intake-stack',1.5,2,2.65),ceiling('intake-beam',1.5,2,3.65,9),wall('furnace',5.6,6,5.15),wall('boiler',8.5,9.2,2.5),ceiling('sorting-gate',8.5,9,3.65,9),ceiling('final-press',12.5,13.5,1.7,9)])
];
