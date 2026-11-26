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
const b4=area(-4,4,-1,9),b5=area(-1,7,-2,7),b6=area(0,9,0,9),b7=area(-1,7,-7,3),b8=area(-5,5,-3,6);
const b11=area(0,15,-4,9),b12=area(0,27,-4,10);
// Coordinates, terrain and a suggested mathematical approach only.
// No answer coefficient or reference equation is read by the game.
export const parabolaPeaks:readonly Level[]=[
 level(1,'Square climb','Explore the basic square function.',area(-1,5,-1,12),
  [q('A',1,1)],p(3,9),[perch('launch-perch',1,1,1.1),perch('exit-perch',3,9,2.4)]),
 level(2,'Stretch the curve','Choose the scale factor in y = ax².',area(0,6,-1,11),
  [q('A',2,2)],p(4,8),[perch('launch-perch',2,2),wall('ridge',2.9,3.15,-.6,3.35),perch('exit-perch',4,8,1.9)]),
 level(3,'Inverted peak','Use y = ax² with a negative coefficient.',area(-4,4,-8,3),
  [q('A',-2,-4)],p(2,-4),[perch('launch-perch',-2,-4,1.9),wall('peak-ridge',-.55,.55,-7.6,-1.15),perch('exit-perch',2,-4,1.9)]),
 level(4,'Lift the valley','Translate the basic square graph vertically.',b4,
  [q('A',-2,6)],p(2,6),[perch('launch-perch',-2,6,1.9),...gate('valley-slot',-.4,.4,1.2,3.2,b4),perch('exit-perch',2,6,1.9)]),
 level(5,'Shift sideways','Translate the square graph horizontally to dip beneath the roof.',b5,
  [q('A',1,4)],p(5,4),[perch('launch-perch',1,4,1.9),...gate('shift-slot',2.6,3.4,-.9,1.0,b5),perch('exit-perch',5,4,1.9)]),
 level(6,'Crown of the peak','Use completed-square form and aim for a maximum near (4, 7).',b6,
  [q('A',1,2.5)],p(7,2.5),[perch('launch-perch',1,2.5,1.6),...gate('crown-slot',3,5,5.8,7.8,b6),perch('exit-perch',7,2.5,1.6)]),
 level(7,'Roots of the ravine','Use the two x-intercepts in factorised form; dip beneath the ceiling.',b7,
  [q('A',1,0)],p(5,0),[perch('launch-perch',1,0,2),...gate('root-slot',2.6,3.4,-5.2,-2.7,b7),perch('exit-perch',5,0,2)]),
 level(8,'Between the roots','Choose the scale in factorised form; aim for a peak near (0, 3).',b8,
  [q('A',-3,0)],p(3,0),[perch('launch-perch',-3,0),...gate('root-arch',-.4,.4,2.3,3.65,b8),perch('exit-perch',3,0)]),
 level(9,'Vertex launch','Treat the firing cannon as the turning point; find the scale using the exit.',area(0,8,-2,12),
  [q('A',2,1)],p(6,9),[perch('launch-perch',2,1),wall('vertex-ridge',4.4,4.7,-1.6,3.1),perch('exit-perch',6,9,2)]),
 {...quadraticPreview,id:'3-10',title:'Rainbow relay',objective:'Combine a quadratic arch and a straight line in one journey.'},
 level(11,'Arch and valley','Use two quadratic cannons with opposite opening directions.',b11,
  [q('A',1,2),q('B',7,2)],p(13,2),[
   perch('launch-perch',1,2,1.6),wall('first-peak',3,5,-3.6,4.6),perch('relay-perch',7,2,1.6),
   ...gate('valley-slot',9.5,10.5,-1.8,-.2,b11),perch('exit-perch',13,2,1.6)]),
 level(12,'Summit gauntlet','Link two arches, a valley and a final straight line through the gate.',b12,
  [q('A',1,2),q('B',7,2),q('C',13,2),line('D',19,2)],p(25,2),[
   perch('launch-perch',1,2,1.6),wall('first-peak',3,5,-3.6,4.6),perch('relay-perch',7,2,1.6),
   ...gate('valley-slot',9.5,10.5,-1.8,-.2,b12),perch('middle-perch',13,2,1.6),
   wall('second-peak',15,17,-3.6,4.6),perch('last-perch',19,2,1.6),
   ...gate('summit-slot',21.8,22.2,1.35,2.65,b12),perch('exit-perch',25,2,1.1)])
].map(withAuthoredGems);
