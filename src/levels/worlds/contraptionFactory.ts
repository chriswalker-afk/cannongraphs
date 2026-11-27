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
const b2=area(-4,4,-5,5),b7=area(0,8,-2,9);
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
// New routes use new stable IDs; displayed level numbers are catalogue order.
type Anchor=readonly [Cannon['type'],number,number,(1|-1)?,number?];
type Opening=readonly [string,number,number,number,number];
function relay(n:number,title:string,objective:string,bounds:Bounds,anchors:readonly Anchor[],openings:readonly Opening[],collectibles:readonly (readonly [number,number])[],exactCoordinateNote?:string):Level{
 const cannons:Cannon[]=anchors.slice(0,-1).map(([type,x,y,direction=1],i)=>({id:String.fromCharCode(65+i),type,position:p(x,y),direction}));
 const [,x,y]=anchors[anchors.length-1];
 const stands=anchors.map(([,px,py,,drop=1.6],i)=>perch(i===0?'launch-stand':i===anchors.length-1?'exit-stand':'relay-'+i,px,py,drop));
 const barriers=openings.flatMap(([id,cx,half,bottom,top])=>gate(id,cx-half,cx+half,bottom,top,bounds));
 return {...level(n,title,objective,bounds,cannons,p(x,y),[...stands,...barriers],collectibles),id:'5'+'-r'+String(n).padStart(2,'0'),...(exactCoordinateNote?{exactCoordinateNote}:{})};
}
export const contraptionFactory:readonly Level[]=[
 {...level(1,'Cube drive','Connect the marked points using the basic cube function.',area(-3,4,-5,11),
  [cubic('A',-1,-1)],p(2,8),[perch('launch-stand',-1,-1)],[[0,0],[1,1]]),supports:{exit:{kind:'suspended' as const}}},
 level(2,'Variable transmission','Scale the cube graph to fit the marked points and pass through the slot.',b2,
  [cubic('A',-2,-2)],p(2,2),[perch('launch-stand',-2,-2),...gate('scale-slot',.85,1.15,-.65,1.15,b2),perch('exit-stand',2,2)],[[0,0],[1,.25]]),
 level(7,'Hydraulic branch','Use inverse proportion on a single positive-x reciprocal branch.',b7,
  [reciprocal('A',2,6)],p(6,2),[perch('launch-stand',2,6,2.3),...gate('hydraulic-slot',3.8,4.2,2.35,3.65,b7),perch('exit-stand',6,2)],[[4,3]]),
 relay(4,'Offset piston relay','Link inverse proportion to a translated cubic with a point of inflection.',area(0,12,-3,9),[
 ['reciprocal',2,6,1,2.3],['cubic',6,2,1,1.8],['linear',10,6,1,2.1]],[
 ['hydraulic-slot',4,.2,2.35,3.65],['piston-slot',8,.22,3.3,4.7]],[[4,3],[8,4]]),
 relay(5,'Triple gear relay','Use three roots and two turning points, then a descending reciprocal branch.',area(-5,11,-8,6),[
 ['cubic',-3,0],['reciprocal',3,0,1,2.8],['linear',9,-4]],[
 ['upper-gear',-1.5,.2,2.55,4.2],['lower-gear',1.5,.2,-4.2,-2.55],['gear-transfer',4,.15,-1.95,-.35]],[
 [-1.5,3.375],[0,0],[1.5,-3.375],[6,-8/3]]),
 level(11,'Gearshift relay','Link a cubic with two turning points to a descending reciprocal branch.',b11,
  [cubic('A',-4,-4),reciprocal('B',4,4)],p(10,-2),
  [...firstChicane(b11),perch('exit-stand',10,-2)],[[-2,4],[2,-4],[6,0]]),
 relay(7,'Double-action chain','Control two turning points of a translated cubic, then change to reciprocal and linear graphs.',area(-5,19,-8,9),[
 ['cubic',-3,-3],['reciprocal',5,5,1,3.8],['linear',11,-4,1,1.7],['linear',17,2]],[
 ['high-press',-1,.3,4.2,5.8],['low-press',3,.3,-3.8,-2.2],['return-pressure',6,.1,-.05,2.3],['pressure-release',10,.15,-4.4,-2.8],['final-rise',14,.2,-1.65,-.35]],[
 [-1,5],[3,-3],[6,1],[10,-25/7],[14,-1]]),
 relay(8,'Westward gear train','Reverse all three flights: shifted reciprocal, two-turn cubic, then a straight line.',area(-15,7,-9,9),[
 ['reciprocal',5,0,-1,1.7],['cubic',1,-4,-1,1.9],['linear',-7,4,-1,3.7],['linear',-13,-2,-1,1.6]],[
 ['return-slot',3,.2,-1.75,-.25],['upper-press',-1,.35,3.25,4.75],['lower-press',-5,.35,-4.75,-3.25],['west-exit',-9,.2,1.35,2.65]],[
 [3,-1],[-1,4],[-5,-4],[-9,2]]),
 relay(9,'Pressure cascade','Link two cubics with a shifted reciprocal branch; use both sets of turning points.',area(-6,20,-9,10),[
 ['cubic',-4,-4],['reciprocal',4,4,1,3.7],['cubic',10,-2],['linear',18,6,1,3.8]],[
 ['upper-press',-2,.35,3.25,4.75],['lower-press',2,.35,-4.75,-3.25],['pressure-slot',5.5,.2,-.2,1.6],['return-pressure',8,.2,-2,-.65],['second-upper',12,.35,5.2,6.8],['second-lower',16,.35,-2.8,-1.2]],[
 [-2,4],[2,-4],[6,0],[12,6],[16,-2]]),
 relay(10,'Valve train','Alternate three reciprocal branches with different asymptotes, then a translated cubic.',area(0,20,-3,9),[
 ['reciprocal',2,6,1,2.3],['reciprocal',6,2],['reciprocal',10,6,1,2.3],['cubic',14,2],['linear',18,6,1,2.1]],[
 ['valve-one',5,.15,1.75,3.05],['valve-two',9,.15,4.9,6.3],['valve-three',13,.15,1.75,3.05],['piston-slot',16,.2,3.3,4.7]],[
 [4,3],[8,5],[12,3],[16,4]]),
 relay(11,'Alternating presses','Navigate a negative-x reciprocal branch, a two-turn cubic, a translated reciprocal and a final shifted cube.',area(-12,18,-9,10),[
 ['reciprocal',-10,-1],['cubic',-4,-3,1,2.1],['reciprocal',4,5,1,3.8],['cubic',10,-1],['linear',16,3]],[
 ['vacuum-slot',-7,.18,-2.15,-.85],['high-press',-2,.3,4.25,5.75],['low-press',2,.3,-3.75,-2.25],['pressure-crest',5,.12,1.4,3.3],['pressure-release',8,.15,-1.05,.4],['finishing-slot',13,.2,.35,1.65]],[
 [-7,-1.5],[-2,5],[2,-3],[6,1],[13,1]]),
 level(12,'Assembly line','Program a cubic, a reciprocal, a second cubic and a final straight line through the presses.',b12,
  [cubic('A',-4,-4),reciprocal('B',4,4),cubic('C',10,-2),line('D',18,6)],p(24,0),[
   ...firstChicane(b12),...gate('return-pressure',7.8,8.2,-2,-.65,b12),perch('transfer-stand',10,-2),
   ...gate('second-upper',11.65,12.35,5.2,6.8,b12),...gate('second-lower',15.65,16.35,-2.8,-1.2,b12),
   perch('finishing-stand',18,6,3.8),...gate('finishing-high',19.25,19.75,3.75,5.25,b12),
   ...gate('finishing-low',21.8,22.2,1.35,2.65,b12),perch('exit-stand',24,0)
  ],[[-2,4],[2,-4],[6,0],[12,6],[16,-2],[22,2]])
];
