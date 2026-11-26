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
export const meadowLaunchers:readonly Level[]=[
 level(1,'First flight','Connect two points with a straight line.',bounds(9,8),
  [cannon('A',1,1)],p(6,6),[perch('exit-ledge',6,6)]),
 level(2,'Double climb','Compare the vertical and horizontal changes.',bounds(8),
  [cannon('A',1,2)],p(4,8),[perch('launch-ledge',1,2,.12,.55,.85),perch('exit-ledge',4,8,.12,.55,.95)]),
 level(3,'Skyward','Explore a steeper positive gradient.',bounds(7,11),
  [cannon('A',1,3)],p(3,9),[perch('launch-ledge',1,3),perch('exit-ledge',3,9,.10,.55,1.1)]),
 level(4,'Lift off','Find the intercept as well as the gradient.',bounds(10),
  [cannon('A',1,3)],p(6,8),[perch('launch-ledge',1,3),wall('small-wall',3,3.8,.4,4.25),perch('exit-ledge',6,8)]),
 level(5,'High rise','Combine gradient and intercept to clear the wall.',bounds(8,11),
  [cannon('A',1,3)],p(4,9),[perch('launch-ledge',1,3),wall('high-wall',2.5,3,.4,5.1),perch('exit-ledge',4,9,.12,.55,1.0)]),
 level(6,'Under the arch','Keep the height constant through a narrow corridor.',bounds(12,8),
  [cannon('A',1,3)],p(9,3),[
   platform('launch-ledge',.25,1.75,2.15,2.45),
   ceiling('arch-roof',3,7,3.65,8),platform('arch-shelf',4,6,1.85,2.4),
   platform('exit-ledge',8.8,9.7,2.15,2.45)]),
 level(7,'Downhill dash','Use a negative gradient to descend safely.',bounds(10),
  [cannon('A',1,8)],p(7,2),[
   perch('launch-ledge',1,8,.12,.45,.95),ceiling('ridge-roof',3,5,6.9,10),
   wall('lower-ridge',4.8,5.6,.4,2.6),perch('exit-ledge',7,2,.12,.45,.9)]),
 level(8,'Below the origin','Explore a line with a negative y-intercept.',{minX:0,maxX:9,minY:-4,maxY:11},
  [cannon('A',2,1)],p(6,9),[perch('launch-ledge',2,1),wall('valley-wall',3.5,4.2,-3.6,3.2),perch('exit-ledge',6,9,.12,.55,1.0)]),
 level(9,'Two-point plunge','Use both marked points to determine the equation.',bounds(10,11),
  [cannon('A',3,9)],p(7,1),[perch('launch-ledge',3,9,.4,.12,1.0),ceiling('high-arch',5,6,6.2,11)]),
 level(10,'Meadow relay','Program two independent lines to reach the exit.',bounds(13),
  [cannon('A',1,2),cannon('B',5,6)],p(10,1),[
   perch('launch-ledge',1,2),wall('relay-wall',3,4,.4,3.4),
   perch('relay-ledge',5,6,.12,.45,1.0)]),
 level(11,'Three-way trail','Combine rising, falling and horizontal sections.',bounds(15),
  [cannon('A',1,2),cannon('B',4,8),cannon('C',8,4)],p(13,4),[
   perch('launch-ledge',1,2),wall('first-barrier',3,3.5,.4,5),
   perch('high-ledge',4,8,.12,.40,1.0),ceiling('low-roof',7,7.5,6.4,10),
   perch('middle-ledge',8,4,.25,.5,.65),perch('exit-ledge',13,4,.25,.5,.65)]),
 level(12,'Meadow gauntlet','Plan a four-cannon journey through walls and a narrow gate.',bounds(17),
  [cannon('A',1,2),cannon('B',4,8),cannon('C',8,4),cannon('D',12,8)],p(16,4),[
   perch('launch-ledge',1,2),wall('first-barrier',3,3.4,.4,5),
   perch('high-ledge',4,8,.12,.4,1.0),ceiling('low-roof',7,7.5,6.2,10),
   perch('middle-ledge',8,4,.25,.5,.9),wall('second-barrier',10,10.5,.4,5.3),
   perch('last-ledge',12,8,.25,.5,1.0),
   ...narrowPassage('final-gate',{minX:14,maxX:14.3,minY:.4,maxY:10,gapBottom:5.3,gapTop:6.6}),
   perch('exit-ledge',16,4,.12,.45,.9)])
].map(withAuthoredGems);
