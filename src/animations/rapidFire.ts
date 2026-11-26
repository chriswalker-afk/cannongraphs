import type {Point} from '../engine/coordinates';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
import {routeLegs} from '../engine/simulation/linearRoute';
export interface LegTiming {offset:number;load:number;flight:number;handoff:number}
export interface RapidSchedule {count:number;lead:number;interval:number;load:number;flight:number;tail:number;duration:number;reduced:boolean;legs:readonly LegTiming[]}
export interface RapidCounts {dispatched:number;arrived:number}
export interface RapidPip {index:number;point:Point;phase:'loading'|'flying'|'arriving';opacity:number;scale:number;stretch:number;tilt:number;trailStart:Point|null;legIndex:number}
export interface CannonCue {cannonId:string;recoil:number;burst:number|null}
export interface RapidFrame extends RapidCounts {pips:RapidPip[];recoil:number;burst:number|null;portal:number;done:boolean;cannonCues:CannonCue[]}
const clamp=(p:number)=>Math.max(0,Math.min(1,p));
export function makeRapidSchedule(result:AttemptResult,count:number,reduced=false):RapidSchedule{
 if(result.event.kind!=='exit'||!Number.isSafeInteger(count)||count<1||!Number.isFinite(result.length)||result.length<=0)throw new RangeError('Rapid fire requires a verified exit route and a nonempty queue');
 const lead=reduced?150:360,interval=reduced?180:260,load=reduced?70:150,tail=reduced?180:450;
 const route=routeLegs(result);let offset=0;
 const legs=route.map((r,i)=>{const flight=reduced?100:Math.round(Math.max(420,Math.min(1650,r.length*100))),handoff=i===route.length-1?0:reduced?50:100;
  const timing={offset,load,flight,handoff};offset+=load+flight+handoff;return timing;});
 const flight=offset-load;
 return {count,lead,interval,load,flight,tail,reduced,legs,duration:lead+(count-1)*interval+offset+tail};
}
function countAt(ms:number,first:number,s:RapidSchedule):number{return Math.max(0,Math.min(s.count,Math.floor((ms-first)/s.interval)+1));}
export function rapidCounts(ms:number,s:RapidSchedule):RapidCounts{return {dispatched:countAt(ms,s.lead,s),arrived:countAt(ms,s.lead+s.load+s.flight,s)};}
export function sampleRapidFire(ms:number,result:AttemptResult,s:RapidSchedule):RapidFrame{
 const t=Math.max(0,ms),counts=rapidCounts(t,s),pips:RapidPip[]=[],route=routeLegs(result);
 const cannonCues:CannonCue[]=route.map(r=>({cannonId:r.cannonId,recoil:0,burst:null}));let portal=0;
 const first=Math.max(0,Math.floor((t-s.lead-s.load-s.flight-s.tail)/s.interval));
 for(let i=first;i<counts.dispatched;i++){
  const local=t-s.lead-i*s.interval,arrival=local-s.load-s.flight;
  if(arrival>=s.tail)continue;
  if(arrival>=0){
   const p=clamp(arrival/s.tail);
   pips.push({index:i,point:result.end,phase:'arriving',opacity:1-p,scale:s.reduced?1:Math.max(.08,1-p),stretch:1,tilt:0,trailStart:null,legIndex:route.length-1});
   portal=Math.max(portal,1-p);continue;
  }
  let j=0;while(j<s.legs.length-1&&local>=s.legs[j+1].offset)j++;
  const leg=route[j],timing=s.legs[j],flightTime=local-timing.offset-timing.load;
  if(flightTime<0){
   const k=clamp((local-timing.offset)/timing.load),v={x:Math.cos(leg.angle*Math.PI/180)*leg.direction,y:Math.sin(leg.angle*Math.PI/180)};
   const distance=s.reduced?-.36:-.65*(1-k);
   pips.push({index:i,point:{x:leg.source.x+v.x*distance,y:leg.source.y+v.y*distance},phase:'loading',opacity:1,scale:1,stretch:1,tilt:0,trailStart:null,legIndex:j});
  }else if(flightTime<timing.flight){
   const progress=s.reduced?0:clamp(flightTime/timing.flight);
   pips.push({index:i,point:leg.pointAt(progress),phase:'flying',opacity:1,scale:1,stretch:s.reduced?1:1+.16*Math.exp(-flightTime/110),tilt:s.reduced?0:-leg.angle*leg.direction,trailStart:s.reduced?null:leg.pointAt(Math.max(0,progress-.13)),legIndex:j});
  }else{
   const p=clamp((flightTime-timing.flight)/Math.max(1,timing.handoff));
   pips.push({index:i,point:leg.end,phase:'arriving',opacity:1-p,scale:s.reduced?1:Math.max(.08,1-p),stretch:1,tilt:0,trailStart:null,legIndex:j});
  }
  if(!s.reduced&&flightTime>=0&&flightTime<190){
   const p=flightTime/190,cue=cannonCues[j];
   cue.recoil=Math.max(cue.recoil,.14*Math.sin(Math.PI*p)*Math.exp(-2*p));cue.burst=cue.burst===null?p:Math.min(cue.burst,p);
  }
 }
 return {...counts,pips,recoil:cannonCues[0].recoil,burst:cannonCues[0].burst,portal,done:t>=s.duration,cannonCues};
}
