import type {Point} from '../engine/coordinates';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
export interface RapidSchedule {count:number;lead:number;interval:number;load:number;flight:number;tail:number;duration:number;reduced:boolean}
export interface RapidCounts {dispatched:number;arrived:number}
export interface RapidPip {index:number;point:Point;phase:'loading'|'flying'|'arriving';opacity:number;scale:number;stretch:number;tilt:number;trailStart:Point|null}
export interface RapidFrame extends RapidCounts {pips:RapidPip[];recoil:number;burst:number|null;portal:number;done:boolean}
const clamp=(p:number)=>Math.max(0,Math.min(1,p));
export function makeRapidSchedule(result:AttemptResult,count:number,reduced=false):RapidSchedule{
 if(result.event.kind!=='exit'||!Number.isSafeInteger(count)||count<1||!Number.isFinite(result.length)||result.length<=0)throw new RangeError('Rapid fire requires a verified exit route and a nonempty queue');
 const lead=reduced?150:360,interval=reduced?180:260,load=reduced?70:150,flight=reduced?100:Math.round(Math.max(420,Math.min(1650,result.length*100))),tail=reduced?180:450;
 return {count,lead,interval,load,flight,tail,reduced,duration:lead+(count-1)*interval+load+flight+tail};
}
function countAt(ms:number,first:number,s:RapidSchedule):number{
 return Math.max(0,Math.min(s.count,Math.floor((ms-first)/s.interval)+1));
}
export function rapidCounts(ms:number,s:RapidSchedule):RapidCounts{
 return {dispatched:countAt(ms,s.lead,s),arrived:countAt(ms,s.lead+s.load+s.flight,s)};
}
export function sampleRapidFire(ms:number,result:AttemptResult,s:RapidSchedule):RapidFrame{
 const t=Math.max(0,ms),counts=rapidCounts(t,s),pips:RapidPip[]=[];
 let recoil=0,burst:number|null=null,portal=0;
 // Only sample currently visible Pips; no path is reconstructed from mutable equations.
 const first=Math.max(0,Math.floor((t-s.lead-s.load-s.flight-s.tail)/s.interval));
 for(let i=first;i<counts.dispatched;i++){
  const local=t-s.lead-i*s.interval,flightTime=local-s.load,arrival=flightTime-s.flight;
  if(arrival>=s.tail)continue;
  if(flightTime<0){
   const k=clamp(local/s.load),v={x:Math.cos(result.angle*Math.PI/180)*result.direction,y:Math.sin(result.angle*Math.PI/180)};
   const distance=s.reduced?-.36:-.65*(1-k);
   pips.push({index:i,point:{x:result.source.x+v.x*distance,y:result.source.y+v.y*distance},phase:'loading',opacity:1,scale:1,stretch:1,tilt:0,trailStart:null});
  }else if(arrival<0){
   const k=clamp(flightTime/s.flight),progress=s.reduced?0:k;
   pips.push({index:i,point:result.pointAt(progress),phase:'flying',opacity:1,scale:1,stretch:s.reduced?1:1+.16*Math.exp(-flightTime/110),tilt:s.reduced?0:-result.angle*result.direction,trailStart:s.reduced?null:result.pointAt(Math.max(0,progress-.13))});
  }else{
   const p=clamp(arrival/s.tail);
   pips.push({index:i,point:result.pointAt(1),phase:'arriving',opacity:1-p,scale:s.reduced?1:Math.max(.08,1-p),stretch:1,tilt:0,trailStart:null});
   portal=Math.max(portal,1-p);
  }
  if(!s.reduced&&flightTime>=0&&flightTime<190){
   const p=flightTime/190;
   recoil=Math.max(recoil,.14*Math.sin(Math.PI*p)*Math.exp(-2*p));
   burst=burst===null?p:Math.min(burst,p);
  }
 }
 return {...counts,pips,recoil,burst,portal,done:t>=s.duration};
}
