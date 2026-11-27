import {withAuthoredGems} from '../gems';
import type {Bounds,Point} from '../../engine/coordinates';
import type {Cannon,Level,Obstacle} from '../schema';
import {floor,platform,wall,ceiling,narrowPassage} from '../terrain';
const bounds=(maxX:number,maxY=10):Bounds=>({minX:0,maxX,minY:0,maxY});
const p=(x:number,y:number):Point=>({x,y});
const cannon=(id:string,x:number,y:number):Cannon=>({id,type:'linear',position:p(x,y),direction:1});
// Platforms are authored terrain, not an invisible hitbox or a computed answer.
const perch=(id:string,x:number,y:number,left=.12,right=.55,drop=.9)=>platform(id,x-left,x+right,y-drop-.28,y-drop);
function level(number:number,title:string,objective:string,area:Bounds,cannons:Cannon[],exit:Point,terrain:Obstacle[]):Level{
 return {id:'1-'+String(number).padStart(2,'0'),world:1,title,objective,bounds:area,creatures:5,startId:'A',cannons,exit,obstacles:[floor(area),...terrain]};
}
// Reference equations are deliberately not stored with the runtime level data.
// All coordinates are integral; fractional slopes are introduced in World 2.
// New puzzles get distinct stable IDs. The displayed number is catalog order,
// not the ID; unchanged puzzles keep their previous completion records.
const relayBox=(maxX:number,minY=0,maxY=11):Bounds=>({minX:0,maxX,minY,maxY});
const relayGate=(id:string,x:number,bottom:number,top:number,b:Bounds,half=.15)=>narrowPassage(id,{minX:x-half,maxX:x+half,minY:b.minY+.4,maxY:b.maxY,gapBottom:bottom,gapTop:top});
function relay(n:number,title:string,objective:string,b:Bounds,anchors:readonly (readonly [number,number])[],terrain:Obstacle[]):Level{
 const cannons=anchors.slice(0,-1).map(([x,y],i)=>cannon(String.fromCharCode(65+i),x,y));
 const [x,y]=anchors[anchors.length-1];
 const stands=anchors.map(([x,y],i)=>perch(i===anchors.length-1?'exit-ledge':i===0?'launch-ledge':'relay-'+i,x,y,.18,.18,1.1));
 return {...level(n,title,objective,b,cannons,p(x,y),[...stands,...terrain]),id:'1-r'+String(n).padStart(2,'0')};
}
const r5=relayBox(11),r6=relayBox(9),r8=relayBox(12,-4,8),r9=relayBox(13,-2,12),r10=relayBox(18,0,11),r11=relayBox(16,0,11);
export const meadowLaunchers:readonly Level[]=[

 level(1,'First flight','Connect two points with a straight line.',bounds(9,8),
  [cannon('A',1,1)],p(6,6),[perch('exit-ledge',6,6)]),
 level(2,'Double climb','Compare the vertical and horizontal changes.',bounds(8),
  [cannon('A',1,2)],p(4,8),[perch('launch-ledge',1,2,.12,.55,.85),perch('exit-ledge',4,8,.12,.55,.95)]),
 level(3,'Skyward','Explore a steeper positive gradient.',bounds(7,11),
  [cannon('A',1,3)],p(3,9),[perch('launch-ledge',1,3),perch('exit-ledge',3,9,.10,.55,1.1)]),
 level(10,'Meadow relay','Program two independent lines to reach the exit.',bounds(13),
  [cannon('A',1,2),cannon('B',5,6)],p(10,1),[
   perch('launch-ledge',1,2),wall('relay-wall',3,4,.4,3.4),
   perch('relay-ledge',5,6,.12,.45,1.0)]),
 relay(5,'Under and over','Begin with a horizontal line beneath the arch; then climb using a non-zero intercept.',r5,[[1,3],[5,3],[9,7]],[
  ...relayGate('low-arch',3,2.35,3.65,r5),wall('rise-wall',7,7.3,.4,4.3)]),
 relay(6,'Twin slopes','Combine a steep positive and a steep negative gradient through two openings.',r6,[[1,2],[4,8],[7,2]],[
  ...relayGate('up-slot',2.5,4.1,5.9,r6,.12),...relayGate('down-slot',5.5,4.1,5.9,r6,.12)]),
 level(11,'Three-way trail','Combine rising, falling and horizontal sections.',bounds(15),
  [cannon('A',1,2),cannon('B',4,8),cannon('C',8,4)],p(13,4),[
   perch('launch-ledge',1,2),wall('first-barrier',3,3.5,.4,5),
   perch('high-ledge',4,8,.12,.40,1.0),ceiling('low-roof',7,7.5,6.4,10),
   perch('middle-ledge',8,4,.25,.5,.65),perch('exit-ledge',13,4,.25,.5,.65)]),
 relay(8,'Below the origin','Use negative intercepts and cross the x-axis in a three-leg route.',r8,[[1,3],[4,0],[7,3],[10,0]],[
  ...relayGate('valley-entry',2.5,.8,2.2,r8),...relayGate('valley-climb',5.5,.8,2.2,r8),...relayGate('valley-exit',8.5,.8,2.2,r8)]),
 relay(9,'Three ridge run','Mix steep climbs with a descending line; choose each intercept independently.',r9,[[1,1],[4,7],[8,3],[11,9]],[
  ...relayGate('first-ridge',2.5,3.1,4.9,r9,.12),...relayGate('middle-ridge',6,4.25,5.75,r9),...relayGate('last-ridge',9.5,5.1,6.9,r9,.12)]),
 relay(10,'Meadow circuit','Plan four different lines: climb, descend, travel horizontally, then climb steeply.',r10,[[1,3],[5,7],[9,3],[13,3],[16,9]],[
  ...relayGate('climb',3,4.3,5.7,r10),...relayGate('descent',7,4.3,5.7,r10),...relayGate('flat',11,2.35,3.65,r10),...relayGate('final-rise',14.5,5.1,6.9,r10,.12)]),
 relay(11,'Rolling ramparts','Alternate steep and gentle gradients, keeping the four intercepts distinct.',r11,[[1,8],[4,2],[7,8],[10,5],[14,9]],[
  ...relayGate('first-drop',2.5,4.1,5.9,r11,.12),...relayGate('second-rise',5.5,4.1,5.9,r11,.12),...relayGate('third-drop',8.5,5.8,7.2,r11),...relayGate('fourth-rise',12,6.3,7.7,r11)]),
 level(12,'Meadow gauntlet','Plan a four-cannon journey through walls and a narrow gate.',bounds(17),
  [cannon('A',1,2),cannon('B',4,8),cannon('C',8,4),cannon('D',12,8)],p(16,4),[
   perch('launch-ledge',1,2),wall('first-barrier',3,3.4,.4,5),
   perch('high-ledge',4,8,.12,.4,1.0),ceiling('low-roof',7,7.5,6.2,10),
   perch('middle-ledge',8,4,.25,.5,.9),wall('second-barrier',10,10.5,.4,5.3),
   perch('last-ledge',12,8,.25,.5,1.0),
   ...narrowPassage('final-gate',{minX:14,maxX:14.3,minY:.4,maxY:10,gapBottom:5.3,gapTop:6.6}),
   perch('exit-ledge',16,4,.12,.45,.9)])
].map(withAuthoredGems);
