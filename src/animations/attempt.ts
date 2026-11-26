import {BARREL_ANGLE,FIRE_MS,sampleLaunchCue,type DemoFrame} from './launch';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
import type {Point} from '../engine/coordinates';
import {MISFIRE_MS,MISFIRE_REDUCED_MS,sampleMisfire,type MisfireStaging} from './misfire';
export interface AttemptFrame extends DemoFrame {
 trace:Point|null;resolved:boolean;size:number;
}
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export function flightDuration(r:AttemptResult,reduced=false):number{
 if(r.event.kind==='misfire'||r.length===0)return 0;
 return reduced?140:Math.max(180,Math.min(2800,r.length*145));
}
export function attemptDuration(r:AttemptResult,reduced=false):number{return r.event.kind==='misfire'?FIRE_MS+(reduced?MISFIRE_REDUCED_MS:MISFIRE_MS):FIRE_MS+flightDuration(r,reduced)+(r.event.kind==='cannon'?(reduced?140:300):reduced?250:720);}
export function sampleAttempt(ms:number,r:AttemptResult,reduced=false,staging?:MisfireStaging):AttemptFrame{
 const misfire=r.event.kind==='misfire';
 const cue=sampleLaunchCue(ms,r.source,r.direction,reduced,misfire?BARREL_ANGLE:r.angle),duration=flightDuration(r,reduced),since=ms-FIRE_MS;
 const base={...cue,opacity:1,stretch:1,tilt:0,size:1,trace:null,resolved:false};
 if(ms<FIRE_MS)return {...base,pip:cue.loadingPoint,pose:'excited'};
 if(misfire)return {...base,...sampleMisfire(since,r.source,r.direction,reduced,staging),burst:null,recoil:0,charge:0};
 if(since<duration){
  const progress=reduced?1:clamp(since/duration),p=r.pointAt(progress);
  return {...base,pip:p,pose:'flying',tilt:reduced?0:-(r.angleAt?.(progress)??r.angle)*r.direction,stretch:reduced?1:1+.20*Math.exp(-since/160),trace:p};
 }
 const time=Math.max(0,since-duration),p=clamp(time/(r.event.kind==='cannon'?(reduced?140:300):reduced?250:720)),success=r.event.kind==='exit'||r.event.kind==='cannon';
 const normal=r.event.kind==='obstacle'||r.event.kind==='boundary'?r.event.normal:{x:0,y:1};
 const tilt=reduced?0:Math.atan2(normal.x,normal.y)*180/Math.PI;
 return {...base,pip:r.end,trace:r.end,resolved:true,pose:success?'excited':'splat',
  opacity:success?1-p:1-clamp((p-.72)/.28),size:success?(reduced?1:Math.max(.05,1-p)):1,
  stretch:success||reduced?1:1.65-.22*p,tilt:success?0:tilt,
  burst:cue.burst,recoil:cue.recoil};
}
