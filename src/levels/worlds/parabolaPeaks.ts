import {withAuthoredGems} from '../gems';
import type {Bounds,Point} from '../../engine/coordinates';
import type {Cannon,Level,Obstacle} from '../schema';
import {floor,wall,platform,ceiling,narrowPassage} from '../terrain';
import {quadraticPreview} from './quadraticPreview';
const area=(minX:number,maxX:number,minY:number,maxY:number):Bounds=>({minX,maxX,minY,maxY});
const p=(x:number,y:number):Point=>({x,y});
const q=(id:string,x:number,y:number,direction:1|-1=1):Cannon=>({id,type:'quadratic',position:p(x,y),direction});
const line=(id:string,x:number,y:number):Cannon=>({id,type:'linear',position:p(x,y),direction:1});
// Small supports are deliberately below the exact anchors. A steep tangent
// needs more clearance than just checking the vertical drop at the anchor.
const perch=(id:string,x:number,y:number,drop=1.4)=>platform(id,x-.14,x+.14,y-drop-.25,y-drop);
const gate=(id:string,x1:number,x2:number,bottom:number,top:number,b:Bounds)=>narrowPassage(id,{minX:x1,maxX:x2,minY:b.minY+.4,maxY:b.maxY,gapBottom:bottom,gapTop:top});
function level(n:number,title:string,objective:string,bounds:Bounds,cannons:Cannon[],exit:Point,obstacles:Obstacle[]):Level{
 return {id:'3-'+String(n).padStart(2,'0'),world:3,title,objective,bounds,creatures:5,startId:'A',cannons,exit,obstacles:[floor(bounds),...obstacles]};
}
const b11=area(0,15,-4,9),b12=area(0,27,-4,10);
// Coordinates, terrain and a suggested mathematical approach only.
// No answer coefficient or reference equation is read by the game.
// Rebalanced routes get distinct stable IDs. All listed anchors, perches
// and openings are authored geometry, not generated from answer equations.
type AnchorSpec=readonly [number,number,('linear'|'quadratic')?,(1|-1)?,number?];
type Opening=readonly [string,number,number,number,number];
function relay(n:number,title:string,objective:string,bounds:Bounds,anchors:readonly AnchorSpec[],openings:readonly Opening[]):Level{
 const cannons:Cannon[]=anchors.slice(0,-1).map(([x,y,type='quadratic',direction=1],i)=>({id:String.fromCharCode(65+i),type,position:p(x,y),direction}));
 const [x,y]=anchors[anchors.length-1];
 const stands=anchors.map(([px,py,,,drop=1.9],i)=>perch(i===0?'launch-perch':i===anchors.length-1?'exit-perch':'relay-'+i,px,py,drop));
 const barriers=openings.flatMap(([id,x1,x2,bottom,top])=>gate(id,x1,x2,bottom,top,bounds));
 return {...level(n,title,objective,bounds,cannons,p(x,y),[...stands,...barriers]),id:'3'+'-r'+String(n).padStart(2,'0')};
}
export const parabolaPeaks:readonly Level[]=[

 level(1,'Square climb','Explore the basic square function.',area(-1,5,-1,12),
  [q('A',1,1)],p(3,9),[perch('launch-perch',1,1,1.1),perch('exit-perch',3,9,2.4)]),
 level(2,'Stretch the curve','Choose the scale factor in y = ax².',area(0,6,-1,11),
  [q('A',2,2)],p(4,8),[perch('launch-perch',2,2),wall('ridge',2.9,3.15,-.6,3.35),perch('exit-perch',4,8,1.9)]),
 level(3,'Inverted peak','Use y = ax² with a negative coefficient.',area(-4,4,-8,3),
  [q('A',-2,-4)],p(2,-4),[perch('launch-perch',-2,-4,1.9),wall('peak-ridge',-.55,.55,-7.6,-1.15),perch('exit-perch',2,-4,1.9)]),
 {...quadraticPreview,id:'3-r04',title:'Rainbow relay',objective:'Clear the arch with a quadratic, then use a straight line through the exit opening.',obstacles:[...quadraticPreview.obstacles,...gate('rainbow-slot',8.8,9.2,2.35,3.65,quadraticPreview.bounds)]},
 level(11,'Arch and valley','Use two quadratic cannons with opposite opening directions.',b11,
  [q('A',1,2),q('B',7,2)],p(13,2),[
   perch('launch-perch',1,2,1.6),wall('first-peak',3,5,-3.6,4.6),perch('relay-perch',7,2,1.6),
   ...gate('valley-slot',9.5,10.5,-1.8,-.2,b11),perch('exit-perch',13,2,1.6)]),
 relay(6,'Roots of the ravine','Identify both roots of the quadratic, then find a straight line from the second cannon.',area(-1,11,-7,6),[[1,0,'quadratic',1,2],[5,0,'linear',1,2],[9,4]],[
 ['root-slot',2.6,3.4,-5.2,-2.7],['exit-slot',6.8,7.2,1.35,2.65]]),
 relay(7,'Valley and vertex','Combine translated square graphs with a descending line.',area(-4,12,-2,13),[[-2,6],[2,6],[6,6,'linear'],[10,2]],[
 ['valley',-.3,.3,1.2,2.8],['summit',3.7,4.3,9.2,10.8],['last-line',7.8,8.2,3.25,4.75]]),
 relay(8,'Root crossings','Use the roots and vary the scale of three alternating arches and valleys.',area(-5,13,-7,6),[[-3,0],[3,0],[7,0],[11,0]],[
 ['root-arch',-.35,.35,2.25,3.75],['root-valley',4.7,5.3,-4.8,-3.2],['small-arch',8.7,9.3,1.25,2.75]]),
 relay(9,'Offset summits','Use the launch point as a vertex, then a maximum and a different minimum.',area(-1,15,-3,12),[[1,1],[5,5],[9,5],[13,1]],[
 ['vertex-climb',2.8,3.2,1.25,2.75],['high-summit',6.7,7.3,8.2,9.8],['vertex-descent',10.8,11.2,1.25,2.75]]),
 relay(10,'Four arches','Choose scales from four pairs of roots; alternate maxima and minima.',area(-10,16,-7,7),[[-8,0],[-4,0],[2,0],[6,0],[14,0]],[
 ['first-arch',-6.3,-5.7,3.25,4.75],['first-valley',-1.3,-.7,-3.75,-2.25],['second-arch',3.7,4.3,1.25,2.75],['second-valley',9.7,10.3,-4.75,-3.25]]),
 relay(11,'Vertex cascade','Find unequal-height endpoints and different turning points, finishing with a straight line.',area(-1,21,-4,10),[[1,2],[5,6],[9,2],[15,2,'linear'],[19,6]],[
 ['initial-climb',2.8,3.2,2.35,3.65],['second-arch',6.8,7.2,5.25,6.75],['third-valley',11.7,12.3,-1.75,-.25],['last-climb',16.8,17.2,3.25,4.75]]),
 level(12,'Summit gauntlet','Link two arches, a valley and a final straight line through the gate.',b12,
  [q('A',1,2),q('B',7,2),q('C',13,2),line('D',19,2)],p(25,2),[
   perch('launch-perch',1,2,1.6),wall('first-peak',3,5,-3.6,4.6),perch('relay-perch',7,2,1.6),
   ...gate('valley-slot',9.5,10.5,-1.8,-.2,b12),perch('middle-perch',13,2,1.6),
   wall('second-peak',15,17,-3.6,4.6),perch('last-perch',19,2,1.6),
   ...gate('summit-slot',21.8,22.2,1.35,2.65,b12),perch('exit-perch',25,2,1.1)])
].map(withAuthoredGems);
