import type {Level} from '../levels/schema';
import {floor,platform,wall} from '../levels/terrain';
import {parseCannonEquation} from '../engine/equations/advanced';
import {simulateRoute,type RouteResult} from '../engine/simulation/linearRoute';
import {makeRapidSchedule,sampleRapidFire,type RapidSchedule,type RapidFrame} from './rapidFire';
export type HomeLayout='landscape'|'switchback';
export interface HomeDemo {
 readonly layout:HomeLayout;readonly level:Level;readonly result:RouteResult;
 readonly schedule:RapidSchedule;readonly cycleMs:number;
}
// These are purpose-built demonstration scenes, not playable catalog levels.
// Their programmed paths reveal no puzzle answers and never change progress.
const wide:Level={
 id:'home-landscape',world:1,title:'Home demonstration',objective:'',bounds:{minX:-1,maxX:26,minY:0,maxY:10},creatures:4,startId:'A',
 cannons:[{id:'A',type:'linear',position:{x:1.5,y:2},direction:1},{id:'B',type:'quadratic',position:{x:6,y:4},direction:1},{id:'C',type:'cubic',position:{x:12,y:4},direction:1},{id:'D',type:'wave',position:{x:18,y:6},direction:1}],
 exit:{x:24,y:6},obstacles:[
  floor({minX:-1,maxX:26,minY:0,maxY:10},.35),
  platform('start-isle',.35,2.2,.4,.85),platform('arch-isle',5.25,6.65,2.2,2.65),
  wall('arch-ridge',8.5,9.5,.35,5.65),platform('cubic-isle',11.35,12.65,2.1,2.6),
  platform('wave-isle',17.4,18.65,4.1,4.6),platform('distant-isle',20.4,21.6,2.2,2.75),
  platform('portal-isle',23.65,24.8,4.1,4.6)
 ]
};
const compact:Level={
 id:'home-switchback',world:1,title:'Home demonstration',objective:'',bounds:{minX:-.7,maxX:8.4,minY:0,maxY:9.5},creatures:4,startId:'A',
 cannons:[{id:'A',type:'linear',position:{x:1,y:2},direction:1},{id:'B',type:'quadratic',position:{x:6,y:3},direction:-1},{id:'C',type:'wave',position:{x:2,y:7},direction:1}],
 exit:{x:7,y:7},obstacles:[
  floor({minX:-.7,maxX:8.4,minY:0,maxY:9.5},.35),
  platform('start-isle',.25,1.5,.5,.85),platform('turn-isle',5.85,6.8,1.55,1.9),
  platform('wave-isle',1.65,2.5,5.25,5.65),platform('portal-isle',6.65,7.65,5.1,5.55)
 ]
};
const reference={
 landscape:{A:'(4x+12)/9',B:'7-(x-9)^2/3',C:'(x-15)^3/27+5',D:'2sin(pi*(x-18)/3)+6'},
 switchback:{A:'x/5+9/5',B:'15/2-(x-3)^2/2',C:'sin(2pi*(x-2)/5)+7'}
} as const;
export function homeLayout(width:number,height:number):HomeLayout{
 // Choose a tall route when a wide one would shrink the characters too far.
 return width>=600&&width/Math.max(1,height)>=1.38?'landscape':'switchback';
}
export function createHomeDemo(layout:HomeLayout):HomeDemo{
 const level=layout==='landscape'?wide:compact;
 const expressions:Readonly<Record<string,string>>=reference[layout];
 const plan=new Map(level.cannons.map(c=>[c.id,parseCannonEquation(expressions[c.id],c.type)]));
 const result=simulateRoute(level,plan);
 if(result.event.kind!=='exit'||result.legs.length!==level.cannons.length)throw new Error('Invalid home demonstration route');
 const base=makeRapidSchedule(result,level.creatures),interval=620;
 const schedule={...base,interval,duration:base.duration+(base.count-1)*(interval-base.interval)};
 return {layout,level,result,schedule,cycleMs:schedule.duration+900};
}
export function homeElapsed(ms:number,demo:HomeDemo):number{
 return Number.isFinite(ms)?((Math.max(0,ms)%demo.cycleMs)+demo.cycleMs)%demo.cycleMs:0;
}
export function sampleHomeDemo(ms:number,demo:HomeDemo):RapidFrame{
 return sampleRapidFire(homeElapsed(ms,demo),demo.result,demo.schedule);
}
// A meaningful still scene, not a frozen empty waiting frame. This is used
// for reduced motion and when the animation is manually paused before launch.
export function stillHomeDemo(demo:HomeDemo):RapidFrame{
 const frame=sampleRapidFire(0,demo.result,demo.schedule);
 frame.pips=demo.result.legs.map((leg,i)=>{
  const t=.46;
  return {index:i,point:leg.pointAt(t),phase:'flying',opacity:1,scale:1,stretch:1,
   tilt:-(leg.angleAt?.(t)??leg.angle)*leg.direction,trailStart:leg.pointAt(.30),legIndex:i};
 });
 frame.dispatched=demo.result.legs.length;
 return frame;
}
