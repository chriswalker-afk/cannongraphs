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
const b1=area(-8,2,-3,8),b2=area(-8,4,-7,4),b5=area(-5,6,-4,8),b10=area(-10,10,-5,9),b11=area(-10,12,-8,8),bFinal=area(-10,18,-8,8);
// Authored geometry and curricular prompts only. The simulation accepts any
// valid equation which actually completes the route, not a stored answer.
// Rebalanced routes get distinct stable IDs. All listed anchors, perches
// and openings are authored geometry, not generated from answer equations.
type AnchorSpec=readonly [number,number,('linear'|'quadratic')?,(1|-1)?,number?];
type Opening=readonly [string,number,number,number,number];
function relay(n:number,title:string,objective:string,bounds:Bounds,anchors:readonly AnchorSpec[],openings:readonly Opening[]):Level{
 const cannons:Cannon[]=anchors.slice(0,-1).map(([x,y,type='quadratic',direction=1],i)=>({id:String.fromCharCode(65+i),type,position:p(x,y),direction}));
 const [x,y]=anchors[anchors.length-1];
 const stands=anchors.map(([px,py,,,drop=1.9],i)=>perch(i===0?'launch-perch':i===anchors.length-1?'exit-perch':'relay-'+i,px,py,drop));
 const barriers=openings.flatMap(([id,x1,x2,bottom,top])=>gate(id,x1,x2,bottom,top,bounds));
 return {...level(n,title,objective,bounds,cannons,p(x,y),[...stands,...barriers]),id:'4'+'-r'+String(n).padStart(2,'0')};
}
export const lostArches:readonly Level[]=[

 level(1,'Sunken crown','Use a fractional scale and a maximum in quadrant II.',b1,
  [q('A',-6,1)],p(0,1),[perch('launch-perch',-6,1),...gate('crown-gate',-3.4,-2.6,3.3,4.7,b1),perch('exit-perch',0,1)]),
 level(2,'Buried basin','Find a minimum in quadrant III using completed-square form.',b2,
  [q('A',-6,0)],p(2,0),[perch('launch-perch',-6,0),...gate('basin-gate',-2.5,-1.5,-4.7,-3.25,b2),perch('exit-perch',2,0)]),
 level(5,'Split roots','Use two fractional roots and choose a scale that clears the arch.',b5,
  [q('A',-2.5,0)],p(3.5,0),[perch('launch-perch',-2.5,0),...gate('root-gate',0,1,3.8,5.1,b5),perch('exit-perch',3.5,0)]),
 relay(4,'Eastern vaults','Combine two fractional scales with opposite opening directions.',area(-1,15,-6,9),[[1,0],[7,0],[13,0]],[
 ['vault-gate',3.5,4.5,5.15,6.65],['well-gate',9.6,10.4,-3.75,-2.25]]),
 relay(5,'Offset well relay','Find a translated curve through unequal endpoint heights and two openings, then a new arch.',area(-6,11,-6,11),[[-4,1.5],[3,5,'quadratic',1,2],[9,5]],[
 ['well-gate',-1.4,-.6,-3.65,-2.25],['rising-gate',1.5,1.8,-.9,1.95],['second-arch',5.7,6.3,7.25,8.75]]),
 relay(6,'Reverse well','Travel leftwards through a minimum and then a maximum using fractional coefficients.',area(-9,7,-7,8),[[5,2,'quadratic',-1,2.1],[-1,2,'quadratic',-1,2.1],[-7,2]],[
 ['west-well',1.6,2.4,-4.65,-3.15],['west-arch',-4.3,-3.7,4.25,5.75]]),
 {...level(10,'Temple relay','Combine straight lines and a quadratic arch through the ruined vault.',b10,
  [line('A',-8,-2),q('B',-4,2),line('C',4,2)],p(8,2),[
   perch('launch-perch',-8,-2),wall('entry-wall',-6.2,-5.8,-4.6,-.9),perch('relay-perch',-4,2),
   wall('high-vault',-1.35,-.65,-4.6,4.8),perch('middle-perch',4,2),
   ...gate('exit-slot',4.7,5.3,1.35,2.65,b10),perch('exit-perch',8,2)]),supports:{C:{kind:'wall' as const,terrainId:'exit-slot-lower'}}},
 relay(8,'Broken symmetry relay','Use unequal endpoint heights, fractional scales and a vertex at the start of the final curve.',area(-6,18,-6,7),[[-4,3],[4,-1],[10,-1],[16,3]],[
 ['entry-slot',-2.1,-1.9,-1.85,-.15],['deep-slot',.6,1.4,-3.95,-2.55],['central-arch',6.7,7.3,2.25,3.75],['last-rise',12.8,13.2,-.75,.75]]),
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
 relay(10,'Vault of four','Plan four linked flights through alternating high, low and central openings.',area(-14,14,-6,8),[[-12,0],[-6,0],[0,0,'linear'],[6,0],[12,0]],[
 ['first-vault',-9.45,-8.55,3.2,4.65],['first-well',-3.45,-2.55,-3.65,-2.25],['central-slot',2.65,3.35,-.65,.65],['second-vault',8.55,9.45,3.2,4.65]]),
 relay(11,'Westward labyrinth','Fly four times to the left, selecting fractional curves and a final line through unequal heights.',area(-14,14,-8,8),[[12,1,'quadratic',-1],[6,1,'quadratic',-1],[0,-2,'quadratic',-1],[-6,-2,'linear',-1],[-12,2]],[
 ['west-one',8.8,9.2,4.25,5.75],['west-two',2.8,3.2,-5.25,-3.75],['west-three',-3.2,-2.8,1.25,2.75],['west-four',-9.2,-8.8,-.75,.75]]),
 {...level(12,'Temple switchback','Reverse direction in the labyrinth, then finish with a fourth curved flight.',bFinal,
  [q('A',-8,-4),q('B',4,-4,-1),line('C',-4,4),q('D',10,4)],p(16,4),[
   perch('launch-perch',-8,-4),...gate('entry-gate',-6.1,-5.9,-3.1,-1.6,bFinal),
   ...gate('turn-gate',-4.8,-4.6,-2.3,-.95,bFinal),
   // Three distinct openings at one x-interval, all made from solid rectangles.
   wall('triple-base',-2.15,-1.85,-7.6,-1.7),platform('triple-divider-low',-2.15,-1.85,-.35,-.15),
   platform('triple-divider-high',-2.15,-1.85,1.35,3.35),ceiling('triple-roof',-2.15,-1.85,4.65,8),
   // The low two trajectories share one wider opening here.
   wall('double-base',-.15,.15,-7.6,-2.75),platform('double-divider',-.15,.15,-.6,3.35),
   ceiling('double-roof',-.15,.15,4.65,8),
   perch('reverse-perch',4,-4),perch('return-perch',-4,4),
   ...gate('exit-gate',5.8,6.2,3.3,4.7,bFinal),perch('d-perch',10,4),...gate('final-arch',12.7,13.3,6.3,7.7,bFinal),perch('exit-perch',16,4)]),id:'4-r12'}
].map(withAuthoredGems);
