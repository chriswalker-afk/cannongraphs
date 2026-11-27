import {withAuthoredGems} from '../gems';
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
// Stable IDs for new routes; existing puzzle identities do not change when
// the menu orders them into new cannon-count bands.
const relayGate=(id:string,x:number,bottom:number,top:number,b:Bounds,half=.15)=>narrowPassage(id,{minX:x-half,maxX:x+half,minY:b.minY+.4,maxY:b.maxY,gapBottom:bottom,gapTop:top});
function relay(n:number,title:string,objective:string,b:Bounds,anchors:readonly (readonly [number,number, (1|-1)?])[],terrain:Obstacle[]):Level{
 const cannons=anchors.slice(0,-1).map(([x,y,direction],i)=>cannon(String.fromCharCode(65+i),x,y,direction??1));
 const [x,y]=anchors[anchors.length-1];
 const stands=anchors.map(([x,y],i)=>island(i===anchors.length-1?'exit-isle':i===0?'launch-isle':'relay-'+i,x,y,1.2));
 return {...level(n,title,objective,b,cannons,p(x,y),[...stands,...terrain]),id:'2-r'+String(n).padStart(2,'0')};
}
const r5=box(-9,9,-6,5),r6=box(-12,10,-3,8),r8=box(-10,12,-6,6),r9=box(-10,12,-7,10),r10=box(-11,17,-6,6),r11=box(-15,13,-4,9);
export const floatingIsles:readonly Level[]=[

 level(1,'Gentle ascent','Find a gradient smaller than one.',box(0,12,-2,8),[cannon('A',2,1)],p(10,5),
  [island('launch-isle',2,1),island('exit-isle',10,5)]),
 level(2,'Cloud steps','Use rise over run with a non-unit numerator.',box(0,14,-1,10),[cannon('A',3,2)],p(12,8),
  [island('launch-isle',3,2),wall('cloud-pillar',7,7.5,-.6,3.7),island('exit-isle',12,8)]),
 level(3,'Glide down','Use a negative fractional gradient through a gate.',box(0,12,-1,9),[cannon('A',2,6)],p(10,2),
  [island('launch-isle',2,6),...narrowPassage('cloud-gate',{minX:5,maxX:6,minY:-.6,maxY:9,gapBottom:3.65,gapTop:4.85}),island('exit-isle',10,2)]),
 level(10,'Island hopping','Combine two fractional equations across the axes.',box(-10,10,-6,6),
  [cannon('A',-8,-2),cannon('B',-2,2)],p(8,0),
  [island('launch-isle',-8,-2),wall('relay-spire',-5,-4.5,-5.6,-.6),island('relay-isle',-2,2),island('exit-isle',8,0)]),
 relay(5,'Across the axes','Use fractional intercepts on two lines in different quadrants.',r5,[[-7,-3],[-1,1],[7,-3]],[
  ...relayGate('western-slot',-4,-1.65,-.35,r5),...relayGate('eastern-slot',3,-1.65,-.35,r5)]),
 relay(6,'Westward return','Fire leftwards with a negative fractional gradient, then descend leftwards with a positive gradient.',r6,[[8,1,-1],[-4,5,-1],[-10,2]],[
  ...relayGate('west-gate',2,2.35,3.65,r6),...relayGate('return-gate',-7,2.85,4.15,r6)]),
 level(11,'Three winds','Program three lines with mixed signs and fractional intercepts.',box(-10,12,-6,8),
  [cannon('A',-8,0),cannon('B',-2,4),cannon('C',4,-2)],p(10,1),
  [island('launch-isle',-8,0),wall('west-spire',-5,-4.5,-5.6,1.2),island('high-isle',-2,4),
   ceiling('cloud-roof',1,2,2.3,8),island('low-isle',4,-2),island('exit-isle',10,1)]),
 relay(8,'Crosswind chain','Combine negative fractional gradients and a positive fractional gradient across all four quadrants.',r8,[[-8,2],[-2,-2],[4,1],[10,-3]],[
  ...relayGate('crosswind-west',-5,-.65,.65,r8),...relayGate('crosswind-centre',1,-1.15,.15,r8),...relayGate('crosswind-east',7,-1.65,-.35,r8)]),
 relay(9,'Cloud turnabout','Reverse direction after the first flight, then climb gently towards the exit.',r9,[[-8,-3],[4,1,-1],[-4,5],[10,7]],[
  platform('turnabout-spire',-6.2,-5.8,-1.8,4.8),platform('upper-mist',-.2,.2,7.5,9)]),
 relay(10,'Four wind crossing','Plan four fractional equations with different intercepts across the signed axes.',r10,[[-9,-3],[-3,1],[3,-2],[9,2],[15,0]],[
  ...relayGate('wind-one',-6,-1.65,-.35,r10),...relayGate('wind-two',0,-1.15,.15,r10),...relayGate('wind-three',6,-.65,.65,r10),...relayGate('wind-four',12,.35,1.65,r10)]),
 relay(11,'Westward gauntlet','Use four leftward flights with mixed fractional gradients and intercepts.',r11,[[11,5,-1],[5,1,-1],[-1,4,-1],[-7,0,-1],[-13,2]],[
  ...relayGate('west-one',8,2.35,3.65,r11),...relayGate('west-two',2,1.85,3.15,r11),...relayGate('west-three',-4,1.35,2.65,r11),...relayGate('west-four',-10,.35,1.65,r11)]),
 level(12,'Skyway switchback','Reverse direction midway through a four-cannon journey.',box(-10,14,-8,10),
  [cannon('A',-8,-4),cannon('B',4,2,-1),cannon('C',-4,6),cannon('D',8,6)],p(12,-2),
  [island('launch-isle',-8,-4),platform('west-block',-6,-5.6,-2.4,4.8),
   ...narrowPassage('switchback-gate',{minX:-2,maxX:-1.6,minY:-7.6,maxY:4.25,gapBottom:-1.55,gapTop:-.25}),
   island('relay-isle',4,2),island('return-isle',-4,6),island('high-isle',8,6,2.4),island('exit-isle',12,-2)])
].map(withAuthoredGems);
