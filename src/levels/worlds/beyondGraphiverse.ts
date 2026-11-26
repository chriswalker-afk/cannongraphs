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
const b1=area(-2,5,-3,11),b2=area(-2,5,-3,11),b3=area(-1,5,-3,8),
 b4=area(-1,12,-4,5),b5=area(0,11,-3,7),b6=area(-8,6,-3,7),
 b7=area(-2,6,-3,8),b8=area(-2,8,-5,8),b9=area(-1,9,-5,7),b10=area(-3,3,-4,8),
 b11=area(-2,15,-4,8),b12=area(-2,41,-4,13);
const naturalMid=1+Math.log(2),naturalEnd=1+Math.log(4);
const logMid=1+Math.E,logEnd=1+Math.E**2;
// Only authored geometry and curricular prompts are shipped. Reference
// equations live in tests. Some optional gems approximate transcendental
// values (within the pickup radius); irrational anchors are specified exactly
// in the objective rather than asking students to use rounded coordinates.
export const beyondGraphiverse:readonly Level[]=[
 level(1,'Starburst','Use exponential growth with base 2.',b1,
  [cannon('A','exponential',0,1)],p(3,8),[
   perch('launch-stand',0,1),...gate('growth-slot',2,.12,3.15,4.9,b1),perch('exit-stand',3,8,2.8)],[[1,2],[2,4]]),
 level(2,'Fading signal','Use exponential decay, with a base between zero and one.',b2,
  [cannon('A','exponential',0,8)],p(3,1),[
   perch('launch-stand',0,8,2.8),...gate('decay-slot',1,.10,3.1,5,b2),perch('exit-stand',3,1)],[[1,4],[2,2]]),
 level(3,'Natural reversal','Reflect and translate a natural exponential. Exact x: gem 1+ln(2), exit 1+ln(4).',b3,
  [cannon('A','exponential',1,5)],p(naturalEnd,2),[
   perch('launch-stand',1,5,1.9),...gate('natural-slot',naturalMid,.07,3.25,4.75,b3),perch('exit-stand',naturalEnd,2,2.1)],[[naturalMid,4]]),
 level(4,'Log beacon','Use the base-10 logarithm. Relate 0.1, 1 and 10 to powers of 10.',b4,
  [cannon('A','logarithmic',.1,-1)],p(10,1),[
   perch('launch-stand',.1,-1,1.7),...gate('log-slot',1,.15,-.65,.65,b4),perch('exit-stand',10,1)],[[1,0]]),
 level(5,'Natural orbit','Translate a natural logarithm. Exact x: gem 1+e, exit 1+e².',b5,
  [cannon('A','logarithmic',2,1)],p(logEnd,3),[
   perch('launch-stand',2,1),...gate('orbit-slot',logMid,.15,1.35,2.65,b5),perch('exit-stand',logEnd,3)],[[logMid,2]]),
 level(6,'Reflected horizon','Fire leftward on a reflected logarithmic domain. Stay to the left of the vertical asymptote.',b6,
  [cannon('A','logarithmic',3.9,4,-1)],p(-6,2),[
   perch('launch-stand',3.9,4,2.3),...gate('horizon-slot',3,.10,2.35,3.65,b6),perch('exit-stand',-6,2)],[[3,3]]),
 level(7,'Sine signal','Use sine in radians to control amplitude and period.',b7,
  [cannon('A','wave',0,3)],p(4,3),[
   perch('launch-stand',0,3,1.9),...gate('signal-crest',1,.15,4.3,5.7,b7),
   ...gate('signal-trough',3,.15,.3,1.7,b7),perch('exit-stand',4,3,2)],[[1,5],[3,1]]),
 level(8,'Cosmic tide','Use cosine to start at a maximum and complete one full period.',b8,
  [cannon('A','wave',0,5)],p(6,5),[
   perch('launch-stand',0,5),...gate('tide-trough',3,.2,-1.75,-.25,b8),perch('exit-stand',6,5)],[[1.5,2],[3,-1],[4.5,2]]),
 level(9,'Phase shift','Reflect and translate a sine wave, then travel through it from right to left.',b9,
  [cannon('A','wave',7,1,-1)],p(1,1),[
   perch('launch-stand',7,1,2),...gate('phase-crest',5.5,.2,2.3,3.7,b9),
   ...gate('phase-trough',2.5,.2,-1.7,-.3,b9),perch('exit-stand',1,1,2)],[[5.5,3],[2.5,-1]]),
 level(10,'Tangent tunnel','Use a single continuous branch of tangent; do not cross an asymptote.',b10,
  [cannon('A','wave',-1,0)],p(1,4),[
   perch('launch-stand',-1,0,2),...gate('tangent-slot',0,.15,1.15,2.85,b10),perch('exit-stand',1,4,2.4)],[[0,2]]),
 level(11,'Deep-space relay','Combine exponential growth, a decreasing logarithm and a two-period sine wave.',b11,
  [cannon('A','exponential',0,1),cannon('B','logarithmic',2,4),cannon('C','wave',5,2)],p(13,2),[
   perch('launch-stand',0,1),...gate('boost-slot',1.8,.07,2.95,4.1,b11),perch('relay-stand',2,4,2),
   ...gate('log-transfer',3.5,.12,1.8,3.2,b11),perch('wave-stand',5,2,2),
   ...gate('wave-crest-one',6,.15,3.3,4.7,b11),...gate('wave-trough-one',8,.15,-.7,.7,b11),
   ...gate('wave-crest-two',10,.15,3.3,4.7,b11),...gate('wave-trough-two',12,.15,-.7,.7,b11),
   perch('exit-stand',13,2,2)],[[1,2],[3,2.8],[6,4],[8,0],[10,4],[12,0]]),
 level(12,'The Graphiverse gauntlet','Program all seven function families to navigate the final station.',b12,
  [cannon('A','linear',0,0),cannon('B','quadratic',4,2),cannon('C','cubic',10,2),cannon('D','reciprocal',18,10),
   cannon('E','exponential',24,4),cannon('F','logarithmic',28,7),cannon('G','wave',31,6)],p(39,6),[
   perch('launch-stand',0,0),...gate('linear-slot',2,.2,.35,1.65,b12),perch('quadratic-stand',4,2,1.9),
   ...gate('arch-slot',7,.3,5.8,7.2,b12),perch('cubic-stand',10,2,1.9),
   ...gate('cubic-crest',12,.3,9.25,10.75,b12),...gate('cubic-trough',16,.3,1.25,2.75,b12),
   perch('reciprocal-stand',18,10,3.8),...gate('reciprocal-upper',20,.15,5.3,6.9,b12),
   ...gate('reciprocal-lower',22,.15,4,5.15,b12),perch('exponential-stand',24,4),
   ...gate('exponential-boost',27.75,.10,6.1,7.35,b12),perch('logarithmic-stand',28,7,1.9),
   ...gate('log-slot',29,.15,5.85,7.1,b12),perch('wave-stand',31,6,2),
   ...gate('final-crest-one',32,.15,7.3,8.7,b12),...gate('final-trough-one',34,.15,3.3,4.7,b12),
   ...gate('final-crest-two',36,.15,7.3,8.7,b12),...gate('final-trough-two',38,.15,3.3,4.7,b12),
   perch('exit-stand',39,6,2)
  ],[[2,1],[7,6.5],[12,10],[16,2],[20,6],[26,5],[29,6.4],[32,8],[34,4],[36,8],[38,4]])
];
