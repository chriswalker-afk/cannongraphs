import type {Bounds,Point} from '../../engine/coordinates';
import type {Cannon,Level,Obstacle} from '../schema';
import {floor,wall,ceiling,platform,narrowPassage} from '../terrain';
const box=(minX:number,maxX:number,minY:number,maxY:number):Bounds=>({minX,maxX,minY,maxY});
const p=(x:number,y:number):Point=>({x,y});
const cannon=(id:string,x:number,y:number,direction:1|-1=1):Cannon=>({id,type:'linear',position:p(x,y),direction});
const island=(id:string,x:number,y:number,drop=1.2)=>platform(id,x-.85,x+.85,y-drop-.35,y-drop);
function level(n:number,title:string,objective:string,bounds:Bounds,cannons:Cannon[],exit:Point,terrain:Obstacle[]):Level{
 return {id:'2-'+String(n).padStart(2,'0'),world:2,title,objective,bounds,creatures:5,startId:'A',cannons,exit,obstacles:[floor(bounds,.4,'cloud-bank'),...terrain]};
}
// Authored coordinates and terrain only. Reference solutions are test fixtures.
export const floatingIsles:readonly Level[]=[
 level(1,'Gentle ascent','Find a gradient smaller than one.',box(0,12,-2,8),[cannon('A',2,1)],p(10,5),
  [island('launch-isle',2,1),island('exit-isle',10,5)]),
 level(2,'Cloud steps','Use rise over run with a non-unit numerator.',box(0,14,-1,10),[cannon('A',3,2)],p(12,8),
  [island('launch-isle',3,2),wall('cloud-pillar',7,7.5,-.6,3.7),island('exit-isle',12,8)]),
 level(3,'Glide down','Use a negative fractional gradient through a gate.',box(0,12,-1,9),[cannon('A',2,6)],p(10,2),
  [island('launch-isle',2,6),...narrowPassage('cloud-gate',{minX:5,maxX:6,minY:-.6,maxY:9,gapBottom:3.65,gapTop:4.85}),island('exit-isle',10,2)]),
 level(4,'Halfway up','Find a fractional intercept as well as a fractional gradient.',box(0,10,-1,8),[cannon('A',1,2)],p(7,5),
  [island('launch-isle',1,2),platform('drifting-shelf',3.5,4.8,.75,2.1),island('exit-isle',7,5)]),
 level(5,'Across the axis','Work with a negative x-coordinate and a positive gradient.',box(-8,8,-2,8),[cannon('A',-6,1)],p(6,5),
  [island('launch-isle',-6,1),wall('west-spire',-2,-1,-1.6,1.65),island('exit-isle',6,5)]),
 level(6,'Through the origin','Connect points in quadrants III and I.',box(-8,8,-6,6),[cannon('A',-6,-3)],p(6,3),
  [island('launch-isle',-6,-3),...narrowPassage('origin-gate',{minX:-1,maxX:1,minY:-5.6,maxY:6,gapBottom:-1,gapTop:1}),island('exit-isle',6,3)]),
 level(7,'Crosswind','Use a negative fractional gradient across quadrants II and IV.',box(-8,8,-8,6),[cannon('A',-6,3)],p(6,-5),
  [island('launch-isle',-6,3),ceiling('west-roof',-3,-2,2,6),wall('east-spire',2,3,-7.6,-4.6),island('exit-isle',6,-5)]),
 level(8,'Westward','Fire leftward while the graph has a negative gradient.',box(-6,10,-2,8),[cannon('A',8,1,-1)],p(-4,5),
  [island('launch-isle',8,1),...narrowPassage('west-gate',{minX:1,maxX:2,minY:-1.6,maxY:8,gapBottom:2.5,gapTop:3.9}),island('exit-isle',-4,5)]),
 level(9,'Return descent','Travel leftward on a positive-gradient line.',box(-8,8,-6,8),[cannon('A',6,5,-1)],p(-6,-3),
  [island('launch-isle',6,5),ceiling('mist-roof',-2,0,2,8),wall('mist-spire',-4,-3,-5.6,-2.6),island('exit-isle',-6,-3)]),
 level(10,'Island hopping','Combine two fractional equations across the axes.',box(-10,10,-6,6),
  [cannon('A',-8,-2),cannon('B',-2,2)],p(8,0),
  [island('launch-isle',-8,-2),wall('relay-spire',-5,-4.5,-5.6,-.6),island('relay-isle',-2,2),island('exit-isle',8,0)]),
 level(11,'Three winds','Program three lines with mixed signs and fractional intercepts.',box(-10,12,-6,8),
  [cannon('A',-8,0),cannon('B',-2,4),cannon('C',4,-2)],p(10,1),
  [island('launch-isle',-8,0),wall('west-spire',-5,-4.5,-5.6,1.2),island('high-isle',-2,4),
   ceiling('cloud-roof',1,2,2.3,8),island('low-isle',4,-2),island('exit-isle',10,1)]),
 level(12,'Skyway switchback','Reverse direction midway through a four-cannon journey.',box(-10,14,-8,10),
  [cannon('A',-8,-4),cannon('B',4,2,-1),cannon('C',-4,6),cannon('D',8,6)],p(12,-2),
  [island('launch-isle',-8,-4),platform('west-block',-6,-5.6,-2.4,4.8),
   ...narrowPassage('switchback-gate',{minX:-2,maxX:-1.6,minY:-7.6,maxY:4.25,gapBottom:-1.55,gapTop:-.25}),
   island('relay-isle',4,2),island('return-isle',-4,6),island('high-isle',8,6,2.4),island('exit-isle',12,-2)])
];
