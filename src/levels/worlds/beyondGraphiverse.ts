import type {Bounds,Point} from '../../engine/coordinates';
import type {Cannon,Level,Obstacle,Gem} from '../schema';
import type {CannonType} from '../../game/cannons';
import {floor,platform,narrowPassage} from '../terrain';
const area=(minX:number,maxX:number,minY:number,maxY:number):Bounds=>({minX,maxX,minY,maxY});
const p=(x:number,y:number):Point=>({x,y});
const cannon=(id:string,type:CannonType,x:number,y:number,direction:1|-1=1):Cannon=>({id,type,position:p(x,y),direction});
const perch=(id:string,x:number,y:number,drop=1.6)=>platform(id,x-.12,x+.12,y-drop-.28,y-drop);
const gate=(id:string,x:number,halfWidth:number,bottom:number,top:number,b:Bounds)=>narrowPassage(id,{minX:x-halfWidth,maxX:x+halfWidth,minY:b.minY+.4,maxY:b.maxY,gapBottom:bottom,gapTop:top});
function level(n:number,title:string,objective:string,bounds:Bounds,cannons:Cannon[],exit:Point,obstacles:Obstacle[],collectibles:readonly (readonly [number,number])[]):Level{
 const gems:Gem[]=collectibles.map(([x,y],i)=>({id:'gem-'+(i+1),position:p(x,y)}));
 return {id:'6-'+String(n).padStart(2,'0'),world:6,title,objective,bounds,creatures:5,startId:'A',cannons,exit,obstacles:[floor(bounds,.4,'station-floor'),...obstacles],gems};
}
const b1=area(-2,5,-3,11),b4=area(-1,12,-4,5),b7=area(-2,6,-3,8),b11=area(-2,15,-4,8);
const naturalMid=1+Math.log(2),naturalEnd=1+Math.log(4);
const logMid=1+Math.E,logEnd=1+Math.E**2;
// Only authored geometry and curricular prompts are shipped. Reference
// equations live in tests. Some optional gems approximate transcendental
// values (within the pickup radius); irrational anchors are specified exactly
// in the objective rather than asking students to use rounded coordinates.
// New routes use new stable IDs; displayed level numbers are catalogue order.
type Anchor=readonly [Cannon['type'],number,number,(1|-1)?,number?];
type Opening=readonly [string,number,number,number,number];
function relay(n:number,title:string,objective:string,bounds:Bounds,anchors:readonly Anchor[],openings:readonly Opening[],collectibles:readonly (readonly [number,number])[],exactCoordinateNote?:string):Level{
 const cannons:Cannon[]=anchors.slice(0,-1).map(([type,x,y,direction=1],i)=>({id:String.fromCharCode(65+i),type,position:p(x,y),direction}));
 const [,x,y]=anchors[anchors.length-1];
 const stands=anchors.map(([,px,py,,drop=1.6],i)=>perch(i===0?'launch-stand':i===anchors.length-1?'exit-stand':'relay-'+i,px,py,drop));
 const barriers=openings.flatMap(([id,cx,half,bottom,top])=>gate(id,cx,half,bottom,top,bounds));
 return {...level(n,title,objective,bounds,cannons,p(x,y),[...stands,...barriers],collectibles),id:'6'+'-r'+String(n).padStart(2,'0'),...(exactCoordinateNote?{exactCoordinateNote}:{})};
}
export const beyondGraphiverse:readonly Level[]=[
 level(1,'Starburst','Use exponential growth with base 2.',b1,
  [cannon('A','exponential',0,1)],p(3,8),[
   perch('launch-stand',0,1),...gate('growth-slot',2,.12,2.95,5.3,b1),perch('exit-stand',3,8,2.8)],[[1,2],[2,4]]),
 level(4,'Log beacon','Use the base-10 logarithm. Relate 0.1, 1 and 10 to powers of 10.',b4,
  [cannon('A','logarithmic',.1,-1)],p(10,1),[
   perch('launch-stand',.1,-1,1.7),...gate('log-slot',1,.15,-.65,.65,b4),perch('exit-stand',10,1)],[[1,0]]),
 level(7,'Sine signal','Use sine in radians to control amplitude and period.',b7,
  [cannon('A','wave',0,3)],p(4,3),[
   perch('launch-stand',0,3,1.9),...gate('signal-crest',1,.15,4.3,5.7,b7),
   ...gate('signal-trough',3,.15,.3,1.7,b7),perch('exit-stand',4,3,2)],[[1,5],[3,1]]),
 relay(4,'Fading signal relay','Connect exponential decay to a rising base-10 logarithm.',area(-2,8,-3,11),[
 ['exponential',0,8,1,2.8],['logarithmic',3,1],['linear',6,3]],[
 ['decay-slot',1,.10,2.85,5.25],['decay-low',2,.10,1.25,2.75],['log-rise',4.5,.15,1.75,3.2]],[[1,4],[2,2],[4,1+2*Math.log10(4)]]),
 relay(5,'Natural orbit relay','Use exponential decay, then translate a natural logarithm.',area(-4,11,-3,7),[
 ['exponential',-2,4,1,2.1],['logarithmic',2,1],['linear',logEnd,3]],[
 ['decay-slot',0,.15,1.25,2.75],['orbit-slot',logMid,.15,1.35,2.65]],[[0,2],[logMid,2]],'Exact x: gem 1+e, exit 1+e².'),
 relay(6,'Cosmic tide relay','Fire leftward on a reflected logarithmic domain, then complete a cosine period.',area(-14,6,-7,8),[
 ['logarithmic',3.9,4,-1,2.3],['wave',-6,2,-1],['linear',-12,2]],[
 ['horizon-slot',3,.10,2.35,3.65],['tide-trough',-9,.2,-4.75,-3.25]],[
 [3,3],[-7.5,-1],[-9,-4],[-10.5,-1]]),
 relay(7,'Natural reversal relay','Combine base-2 decay, logarithmic growth and a reflected natural exponential.',area(-11,5,-3,8),[
 ['exponential',-9,4,1,1.9],['logarithmic',-5,1],['exponential',1,5,1,1.9],['linear',naturalEnd,2,1,2.1]],[
 ['decay-slot',-7,.15,1.35,2.65],['log-transfer',-3,.15,2.75,4.1],['log-crest',0,.12,4.05,5.4],['natural-slot',naturalMid,.07,3.25,4.75]],[
 [-7,2],[-3,3.40824],[naturalMid,4]],'Exact x: final gem 1+ln(2), exit 1+ln(4).'),
 relay(8,'Phase-shift relay','Fly leftward through growth, a logarithmic descent and a reflected sine wave.',area(-3,15,-5,8),[
 ['exponential',13,1,-1],['logarithmic',9,4,-1,1.9],['wave',5,1,-1,2],['linear',-1,1,-1,2]],[
 ['growth-slot',11,.15,1.35,2.65],['log-transfer',7,.15,2.5,3.9],['phase-crest',3.5,.2,2.3,3.7],['phase-trough',.5,.2,-1.7,-.3]],[
 [11,2],[7,3.22109],[3.5,3],[.5,-1]]),
 level(11,'Deep-space relay','Combine exponential growth, a decreasing logarithm and a two-period sine wave.',b11,
  [cannon('A','exponential',0,1),cannon('B','logarithmic',2,4),cannon('C','wave',5,2)],p(13,2),[
   perch('launch-stand',0,1),...gate('boost-slot',1.8,.04,2.65,4.5,b11),perch('relay-stand',2,4,2),
   ...gate('log-transfer',3.5,.12,1.8,3.2,b11),perch('wave-stand',5,2,2),
   ...gate('wave-crest-one',6,.15,3.3,4.7,b11),...gate('wave-trough-one',8,.15,-.7,.7,b11),
   ...gate('wave-crest-two',10,.15,3.3,4.7,b11),...gate('wave-trough-two',12,.15,-.7,.7,b11),
   perch('exit-stand',13,2,2)],[[1,2],[3,2.8],[6,4],[8,0],[10,4],[12,0]]),
 relay(10,'Orbital transfer','Combine linear, quadratic and cubic graphs before an exponential descent.',area(-2,26,-4,13),[
 ['linear',0,0],['quadratic',4,2,1,1.9],['cubic',10,2,1,1.9],['exponential',18,10,1,3.8],['linear',24,3]],[
 ['linear-slot',2,.2,.35,1.65],['arch-slot',7,.3,5.8,7.2],['cubic-crest',12,.3,9.25,10.75],['cubic-trough',16,.3,1.25,2.75],['decay-upper',20,.15,5.3,6.9],['decay-lower',22,.15,3.35,4.65]],[
 [2,1],[7,6.5],[12,10],[16,2],[20,6],[22,4]]),
 relay(11,'Tangent transfer','Link exponential growth, logarithmic decay, a reciprocal branch and a continuous tangent branch.',area(-2,15,-4,11),[
 ['exponential',0,1],['logarithmic',3,8,1,2.8],['reciprocal',7,2],['wave',11,6,1,2.1],['linear',13,2,1,2.4]],[
 ['growth-slot',2,.12,2.95,5.3],['log-descent',5,.15,2.8,4.4],['log-low',6.8,.06,1.35,2.85],['reciprocal-rise',9,.15,4.3,5.7],['tangent-slot',12,.15,3.15,4.85]],[
 [1,2],[2,4],[5,8-6*Math.log10(5.5)],[9,5],[12,4]]),
 relay(12,'The Graphiverse gauntlet','Finish with reciprocal, exponential, logarithmic and two-period wave flights through the station.',area(16,41,-4,13),[
 ['reciprocal',18,10,1,3.8],['exponential',24,4],['logarithmic',28,7,1,1.9],['wave',31,6,1,2],['linear',39,6,1,2]],[
 ['reciprocal-upper',20,.15,5.3,6.9],['reciprocal-lower',22,.15,4,5.15],['exponential-boost',27.75,.10,6.1,7.35],['log-slot',29,.15,5.85,7.1],['final-crest-one',32,.15,7.3,8.7],['final-trough-one',34,.15,3.3,4.7],['final-crest-two',36,.15,7.3,8.7],['final-trough-two',38,.15,3.3,4.7]],[
 [20,6],[26,5],[29,6.4],[32,8],[34,4],[36,8],[38,4]])
];
