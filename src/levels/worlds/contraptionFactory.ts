import type {Bounds,Point} from '../../engine/coordinates';
import type {Cannon,Level,Obstacle,Gem} from '../schema';
import {floor,platform,narrowPassage} from '../terrain';
const area=(minX:number,maxX:number,minY:number,maxY:number):Bounds=>({minX,maxX,minY,maxY});
const p=(x:number,y:number):Point=>({x,y});
const cubic=(id:string,x:number,y:number,direction:1|-1=1):Cannon=>({id,type:'cubic',position:p(x,y),direction});
const reciprocal=(id:string,x:number,y:number,direction:1|-1=1):Cannon=>({id,type:'reciprocal',position:p(x,y),direction});
const line=(id:string,x:number,y:number):Cannon=>({id,type:'linear',position:p(x,y),direction:1});
const perch=(id:string,x:number,y:number,drop=1.6)=>platform(id,x-.12,x+.12,y-drop-.28,y-drop);
const gate=(id:string,x1:number,x2:number,bottom:number,top:number,b:Bounds)=>narrowPassage(id,{minX:x1,maxX:x2,minY:b.minY+.4,maxY:b.maxY,gapBottom:bottom,gapTop:top});
const gems=(points:readonly (readonly [number,number])[]):readonly Gem[]=>points.map(([x,y],i)=>({id:'gem-'+(i+1),position:p(x,y)}));
function level(n:number,title:string,objective:string,bounds:Bounds,cannons:Cannon[],exit:Point,obstacles:Obstacle[],collectibles:readonly (readonly [number,number])[]=[]):Level{
 return {id:'5-'+String(n).padStart(2,'0'),world:5,title,objective,bounds,creatures:5,startId:'A',cannons,exit,obstacles:[floor(bounds,.4,'factory-floor'),...obstacles],...(collectibles.length?{gems:gems(collectibles)}:{})};
}
const b2=area(-4,4,-5,5),b3=area(-4,4,-8,8),b4=area(-2,6,-5,7),b5=area(-5,5,-6,6),b6=area(-5,7,-7,9);
const b7=area(0,8,-2,9),b8=area(-8,2,-7,4),b9=area(0,12,-4,7),b10=area(-2,7,-8,5);
const b11=area(-6,12,-9,9),b12=area(-6,26,-9,10);
// The chicane requires a high point, a low point, then a rise into B.
// A later descent makes the skipped route impossible for a single cubic.
function firstChicane(b:Bounds):Obstacle[]{
 return [perch('launch-stand',-4,-4),...gate('upper-press',-2.35,-1.65,3.25,4.75,b),
  ...gate('lower-press',1.65,2.35,-4.75,-3.25,b),perch('gearbox-stand',4,4,3.7),
  ...gate('pressure-slot',5.3,5.7,-.2,1.6,b)];
}
// Authored coordinates, obstacles and optional gem locations only. Reference
// equations are regression fixtures, not hidden answer requirements.
export const contraptionFactory:readonly Level[]=[
 level(1,'Cube drive','Connect the marked points using the basic cube function.',area(-3,4,-5,11),
  [cubic('A',-1,-1)],p(2,8),[perch('launch-stand',-1,-1)],[[0,0],[1,1]]),
 level(2,'Variable transmission','Scale the cube graph to fit the marked points and pass through the slot.',b2,
  [cubic('A',-2,-2)],p(2,2),[perch('launch-stand',-2,-2),...gate('scale-slot',.85,1.15,-.65,1.15,b2),perch('exit-stand',2,2)],[[0,0],[1,.25]]),
 level(3,'Reverse torque','Use a negative cubic coefficient to create a descending graph.',b3,
  [cubic('A',-2,4)],p(2,-4),[perch('launch-stand',-2,4,2.7),...gate('torque-slot',-.3,.3,-.65,.65,b3),perch('exit-stand',2,-4)],[[-1,.5],[1,-.5]]),
 level(4,'Offset piston','Translate a cubic horizontally and vertically; locate its point of inflection.',b4,
  [cubic('A',0,-1)],p(4,3),[perch('launch-stand',0,-1),...gate('piston-slot',1.75,2.25,.35,1.65,b4),perch('exit-stand',4,3)],[[2,1]]),
 level(5,'Triple gear','Use three roots and a suitable scale to create two turning points.',b5,
  [cubic('A',-3,0)],p(3,0),[perch('launch-stand',-3,0),...gate('upper-gear',-1.7,-1.3,2.8,4.2,b5),
   ...gate('lower-gear',1.3,1.7,-4.2,-2.8,b5),perch('exit-stand',3,0,2.8)],[[-1.5,3.375],[0,0],[1.5,-3.375]]),
 level(6,'Double-action press','Control both turning points of a translated cubic through unequal-height anchors.',b6,
  [cubic('A',-3,-3)],p(5,5),[perch('launch-stand',-3,-3),...gate('high-press',-1.3,-.7,4.2,5.8,b6),
   ...gate('low-press',2.7,3.3,-3.8,-2.2,b6),perch('exit-stand',5,5,3.8)],[[-1,5],[3,-3]]),
 level(7,'Hydraulic branch','Use inverse proportion on a single positive-x reciprocal branch.',b7,
  [reciprocal('A',2,6)],p(6,2),[perch('launch-stand',2,6,2.3),...gate('hydraulic-slot',3.8,4.2,2.35,3.65,b7),perch('exit-stand',6,2)],[[4,3]]),
 level(8,'Vacuum chamber','Use the negative-x reciprocal branch; keep the flight away from the asymptote.',b8,
  [reciprocal('A',-6,-1)],p(-2,-3),[perch('launch-stand',-6,-1),...gate('vacuum-slot',-3.2,-2.8,-2.85,-1.2,b8),perch('exit-stand',-2,-3)],[[-3,-2]]),
 level(9,'Offset pressure','Translate a reciprocal graph and reason about its vertical and horizontal asymptotes.',b9,
  [reciprocal('A',4,3)],p(10,0),[perch('launch-stand',4,3,2),...gate('pressure-slot',5.8,6.2,.25,1.75,b9),perch('exit-stand',10,0)],[[6,1],[8.4,.25]]),
 level(10,'Return valve','Fire leftward along a reflected, translated reciprocal branch.',b10,
  [reciprocal('A',5,0,-1)],p(1,-4),[perch('launch-stand',5,0),...gate('return-slot',2.8,3.2,-1.75,-.25,b10),perch('exit-stand',1,-4,1.7)],[[3,-1]]),
 level(11,'Gearshift relay','Link a cubic with two turning points to a descending reciprocal branch.',b11,
  [cubic('A',-4,-4),reciprocal('B',4,4)],p(10,-2),
  [...firstChicane(b11),perch('exit-stand',10,-2)],[[-2,4],[2,-4],[6,0]]),
 level(12,'Assembly line','Program a cubic, a reciprocal, a second cubic and a final straight line through the presses.',b12,
  [cubic('A',-4,-4),reciprocal('B',4,4),cubic('C',10,-2),line('D',18,6)],p(24,0),[
   ...firstChicane(b12),...gate('return-pressure',7.8,8.2,-2,-.65,b12),perch('transfer-stand',10,-2),
   ...gate('second-upper',11.65,12.35,5.2,6.8,b12),...gate('second-lower',15.65,16.35,-2.8,-1.2,b12),
   perch('finishing-stand',18,6,3.8),...gate('finishing-high',19.25,19.75,3.75,5.25,b12),
   ...gate('finishing-low',21.8,22.2,1.35,2.65,b12),perch('exit-stand',24,0)
  ],[[-2,4],[2,-4],[6,0],[12,6],[16,-2],[22,2]])
];
