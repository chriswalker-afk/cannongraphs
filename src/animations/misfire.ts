import type {Bounds,Point} from '../engine/coordinates';
import type {Obstacle} from '../levels/schema';
import {PIP_RADIUS} from '../engine/simulation/linearAttempt';
import type {PipPose} from './launch';
export const MISFIRE_ROLL_MS=620,MISFIRE_PAUSE_MS=620,MISFIRE_WALK_MS=1120;
export const MISFIRE_MS=MISFIRE_ROLL_MS+MISFIRE_PAUSE_MS+MISFIRE_WALK_MS;
export const MISFIRE_REDUCED_MS=1000;
export interface MisfireStaging {landing:Point;departure:Point}
const clamp=(n:number,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
// Only for the local character gag, never the mathematical flight or capture logic.
export function stageMisfire(source:Point,direction:1|-1,bounds:Bounds,obstacles:readonly Obstacle[]):MisfireStaging{
 const x=clamp(source.x+direction*.56,bounds.minX,bounds.maxX);
 const supports=obstacles.filter(o=>x>=o.bounds.minX+PIP_RADIUS&&x<=o.bounds.maxX-PIP_RADIUS&&o.bounds.maxY+PIP_RADIUS<=source.y+1e-9).sort((a,b)=>b.bounds.maxY-a.bounds.maxY);
 const support=supports[0]?.bounds;
 const ground=Math.min(source.y,(support?.maxY??bounds.minY)+PIP_RADIUS);
 const lower=support?support.minX+PIP_RADIUS:bounds.minX;
 const upper=support?support.maxX-PIP_RADIUS:bounds.maxX;
 let departureX=clamp(x+direction*1.02,lower,upper);
 // Keep the short walk on the landing surface and stop before a neighbouring wall.
 for(const o of obstacles){
  const b=o.bounds;
  if(b.maxY<=ground-PIP_RADIUS+1e-9||b.minY>=ground+PIP_RADIUS)continue;
  if(direction===1&&b.minX-PIP_RADIUS>=x&&b.minX-PIP_RADIUS<departureX)departureX=b.minX-PIP_RADIUS;
  if(direction===-1&&b.maxX+PIP_RADIUS<=x&&b.maxX+PIP_RADIUS>departureX)departureX=b.maxX+PIP_RADIUS;
 }
 return {landing:{x,y:ground},departure:{x:departureX,y:ground}};
}
export interface MisfirePose {pip:Point;pose:PipPose;tilt:number;stretch:number;opacity:number;walkCycle?:number}
export function sampleMisfire(ms:number,source:Point,direction:1|-1,reduced=false,staging?:MisfireStaging):MisfirePose{
 const t=Math.max(0,ms);
 const {landing,departure}=staging??{landing:{x:source.x+direction*.56,y:source.y-.4},departure:{x:source.x+direction*1.58,y:source.y-.4}};
 if(reduced)return {pip:t<250?source:landing,pose:'disappointed',tilt:0,stretch:1,opacity:1-clamp((t-800)/200)};
 if(t<MISFIRE_ROLL_MS){
  const p=clamp(t/MISFIRE_ROLL_MS);
  return {pip:{x:lerp(source.x,landing.x,p),y:lerp(source.y,landing.y,p*p)},pose:'rolling',tilt:direction*360*p,stretch:1-.05*Math.sin(Math.PI*p),opacity:1};
 }
 if(t<MISFIRE_ROLL_MS+MISFIRE_PAUSE_MS)return {pip:landing,pose:'disappointed',tilt:0,stretch:.98,opacity:1};
 const p=clamp((t-MISFIRE_ROLL_MS-MISFIRE_PAUSE_MS)/MISFIRE_WALK_MS),cycle=p*3;
 return {pip:{x:lerp(landing.x,departure.x,p),y:landing.y+.022*Math.abs(Math.sin(cycle*2*Math.PI))},pose:'walking',tilt:direction*6,stretch:1,opacity:1-clamp((p-.72)/.28),walkCycle:cycle};
}
