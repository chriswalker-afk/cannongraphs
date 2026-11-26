import {withAuthoredGems} from '../gems';
import type {Bounds,Point} from '../../engine/coordinates';
import type {Cannon,Level,Obstacle} from '../schema';
import {floor,wall,platform,ceiling,narrowPassage} from '../terrain';
const area=(minX:number,maxX:number,minY:number,maxY:number):Bounds=>({minX,maxX,minY,maxY});
const p=(x:number,y:number):Point=>({x,y});
const q=(id:string,x:number,y:number,direction:1|-1=1):Cannon=>({id,type:'quadratic',position:p(x,y),direction});
const line=(id:string,x:number,y:number,direction:1|-1=1):Cannon=>({id,type:'linear',position:p(x,y),direction});
const perch=(id:string,x:number,y:number,drop=1.5)=>platform(id,x-.18,x+.18,y-drop-.3,y-drop);
const gate=(id:string,x1:number,x2:number,bottom:number,top:number,b:Bounds)=>narrowPassage(id,{minX:x1,maxX:x2,minY:b.minY+.4,maxY:b.maxY,gapBottom:bottom,gapTop:top});
function level(n:number,title:string,objective:string,bounds:Bounds,cannons:Cannon[],exit:Point,obstacles:Obstacle[]):Level{
 return {id:'4-'+String(n).padStart(2,'0'),world:4,title,objective,bounds,creatures:5,startId:'A',cannons,exit,obstacles:[floor(bounds,.4,'temple-floor'),...obstacles]};
}
const b1=area(-8,2,-3,8),b2=area(-8,4,-7,4),b3=area(-1,7,-5,5),b4=area(-1,9,-4,9),
 b5=area(-5,6,-4,8),b6=area(-6,5,-6,8),b7=area(-4,8,-5,7),b8=area(-3,7,-7,6),
 b9=area(-6,6,-6,6),b10=area(-10,10,-5,9),b11=area(-10,12,-8,8),b12=area(-14,20,-6,8);
// Authored geometry and curricular prompts only. The simulation accepts any
// valid equation which actually completes the route, not a stored answer.
export const lostArches:readonly Level[]=[
 level(1,'Sunken crown','Use a fractional scale and a maximum in quadrant II.',b1,
  [q('A',-6,1)],p(0,1),[perch('launch-perch',-6,1),...gate('crown-gate',-3.4,-2.6,3.3,4.7,b1),perch('exit-perch',0,1)]),
 level(2,'Buried basin','Find a minimum in quadrant III using completed-square form.',b2,
  [q('A',-6,0)],p(2,0),[perch('launch-perch',-6,0),...gate('basin-gate',-2.5,-1.5,-4.7,-3.25,b2),perch('exit-perch',2,0)]),
 level(3,'Fallen keystone','Combine a fractional scale and a turning point in quadrant IV.',b3,
  [q('A',1,1)],p(5,1),[perch('launch-perch',1,1),...gate('keystone-gate',2.5,3.5,-2.65,-1.2,b3),perch('exit-perch',5,1)]),
 level(4,'Eastern vault','Use a negative fractional coefficient and a maximum in quadrant I.',b4,
  [q('A',1,0)],p(7,0),[perch('launch-perch',1,0),...gate('vault-gate',3.5,4.5,5.15,6.65,b4),perch('exit-perch',7,0)]),
 level(5,'Split roots','Use two fractional roots and choose a scale that clears the arch.',b5,
  [q('A',-2.5,0)],p(3.5,0),[perch('launch-perch',-2.5,0),...gate('root-gate',0,1,3.8,5.1,b5),perch('exit-perch',3.5,0)]),
 level(6,'Offset well','Find a translated quadratic through unequal-height points and two openings.',b6,
  [q('A',-4,1.5)],p(3,5),[perch('launch-perch',-4,1.5),...gate('well-gate',-1.4,-.6,-3.65,-2.25,b6),
   ...gate('rising-gate',1.5,1.8,-.9,1.95,b6),perch('exit-perch',3,5,2)]),
 level(7,'Reverse arch','Fire leftward over a maximum; distinguish direction from the sign of the quadratic coefficient.',b7,
  [q('A',6,-1,-1)],p(-2,-1),[perch('launch-perch',6,-1),...gate('west-arch',1.5,2.5,2.25,3.65,b7),perch('exit-perch',-2,-1)]),
 level(8,'Reverse well','Travel leftward through a minimum below the x-axis.',b8,
  [q('A',5,2,-1)],p(-1,2),[perch('launch-perch',5,2,2.1),...gate('west-well',1.6,2.4,-4.65,-3.15,b8),perch('exit-perch',-1,2,2.1)]),
 level(9,'Broken symmetry','Use the unequal endpoint heights and both gates to control the turning point.',b9,
  [q('A',-4,3)],p(4,-1),[perch('launch-perch',-4,3),...gate('entry-slot',-2.1,-1.9,-1.85,-.15,b9),
   ...gate('deep-slot',.6,1.4,-3.95,-2.55,b9),perch('exit-perch',4,-1)]),
 level(10,'Temple relay','Combine straight lines and a quadratic arch through the ruined vault.',b10,
  [line('A',-8,-2),q('B',-4,2),line('C',4,2)],p(8,2),[
   perch('launch-perch',-8,-2),wall('entry-wall',-6.2,-5.8,-4.6,-.9),perch('relay-perch',-4,2),
   wall('high-vault',-1.35,-.65,-4.6,4.8),perch('middle-perch',4,2),
   ...gate('exit-slot',4.7,5.3,1.35,2.65,b10),perch('exit-perch',8,2)]),
 level(11,'Labyrinth switchback','Reverse direction in a three-level corridor before the final straight flight.',b11,
  [q('A',-8,-4),q('B',4,-4,-1),line('C',-4,4)],p(10,4),[
   perch('launch-perch',-8,-4),...gate('entry-gate',-6.1,-5.9,-3.1,-1.6,b11),
   ...gate('turn-gate',-4.8,-4.6,-2.3,-.95,b11),
   // Three distinct openings at one x-interval, all made from solid rectangles.
   wall('triple-base',-2.15,-1.85,-7.6,-1.7),platform('triple-divider-low',-2.15,-1.85,-.35,-.15),
   platform('triple-divider-high',-2.15,-1.85,1.35,3.35),ceiling('triple-roof',-2.15,-1.85,4.65,8),
   // The low two trajectories share one wider opening here.
   wall('double-base',-.15,.15,-7.6,-2.75),platform('double-divider',-.15,.15,-.6,3.35),
   ceiling('double-roof',-.15,.15,4.65,8),
   perch('reverse-perch',4,-4),perch('return-perch',-4,4),
   ...gate('exit-gate',5.8,6.2,3.3,4.7,b11),perch('exit-perch',10,4)]),
 level(12,'Vault of five','Plan five linked flights through alternating high, low and central gates.',b12,
  [q('A',-12,0),q('B',-6,0),line('C',0,0),q('D',6,0),q('E',12,0)],p(18,0),[
   perch('launch-perch',-12,0),...gate('first-vault',-9.45,-8.55,3.2,4.65,b12),perch('b-perch',-6,0),
   ...gate('first-well',-3.45,-2.55,-3.65,-2.25,b12),perch('c-perch',0,0),
   ...gate('central-slot',2.65,3.35,-.65,.65,b12),perch('d-perch',6,0),
   ...gate('second-vault',8.55,9.45,3.2,4.65,b12),perch('e-perch',12,0),
   ...gate('second-well',14.55,15.45,-3.65,-2.25,b12),perch('exit-perch',18,0)])
].map(withAuthoredGems);
