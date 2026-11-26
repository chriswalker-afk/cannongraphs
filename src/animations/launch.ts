import type {Point} from '../engine/coordinates';
export const BARREL_ANGLE=35;
export const LOAD_MS=520, FIRE_MS=820, CUE_END_MS=1180, DEMO_END_MS=1500;
export type LaunchPhase='loading'|'charging'|'firing'|'recovering'|'done';
export type PipPose='idle'|'excited'|'flying';
export interface LaunchCue {
 phase:LaunchPhase;loadingPoint:Point|null;recoil:number;burst:number|null;charge:number;
}
export interface DemoFrame extends LaunchCue {
 pip:Point|null;pose:PipPose;opacity:number;stretch:number;tilt:number;
}
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>x*x*(3-2*x);
export function barrelVector(direction:1|-1,angle=BARREL_ANGLE):Point{
 const a=angle*Math.PI/180;return {x:direction*Math.cos(a),y:Math.sin(a)};
}
function along(source:Point,v:Point,d:number):Point{return {x:source.x+v.x*d,y:source.y+v.y*d};}
// Rendering-only cues: never infer a mathematical result, or modify the launch anchor.
export function sampleLaunchCue(ms:number,source:Point,direction:1|-1,reduced=false,angle=BARREL_ANGLE):LaunchCue{
 const t=Math.max(0,ms),v=barrelVector(direction,angle);
 if(t<LOAD_MS){
  const p=clamp(t/LOAD_MS),breech=along(source,v,-.64),wait={x:breech.x-.27*direction,y:breech.y+.04};
  const k=reduced?0:smooth(p);
  return {phase:'loading',loadingPoint:{x:wait.x+(breech.x-wait.x)*k,y:wait.y+(breech.y-wait.y)*k+(reduced?0:.17*Math.sin(Math.PI*p))},recoil:0,burst:null,charge:0};
 }
 if(t<FIRE_MS)return {phase:'charging',loadingPoint:null,recoil:0,burst:null,charge:reduced?1:clamp((t-LOAD_MS)/(FIRE_MS-LOAD_MS))};
 if(t<CUE_END_MS){
  const p=clamp((t-FIRE_MS)/(CUE_END_MS-FIRE_MS));
  // Recoil is purely visual and decays back to the marked muzzle.
  return {phase:p<.32?'firing':'recovering',loadingPoint:null,recoil:reduced?0:.16*Math.exp(-5*p)*Math.sin(Math.PI*Math.min(1,p*4))**2,burst:reduced?null:p,charge:0};
 }
 return {phase:'done',loadingPoint:null,recoil:0,burst:null,charge:0};
}
// PR4 only: a clearly labelled, short artistic demonstration.
// PR5 must replace this illustrative ejection with points from the collision engine.
export function sampleDemoFrame(ms:number,source:Point,direction:1|-1,reduced=false,angle=BARREL_ANGLE):DemoFrame{
 const cue=sampleLaunchCue(ms,source,direction,reduced,angle),v=barrelVector(direction,angle);
 if(ms<LOAD_MS)return {...cue,pip:cue.loadingPoint,pose:'excited',opacity:1,stretch:reduced?1:1+.12*Math.sin(Math.PI*clamp(ms/LOAD_MS)),tilt:0};
 if(ms<FIRE_MS||ms>=DEMO_END_MS)return {...cue,pip:null,pose:'idle',opacity:0,stretch:1,tilt:0};
 const p=clamp((ms-FIRE_MS)/(DEMO_END_MS-FIRE_MS)),travel=reduced?0:1.05*(1-(1-p)**2);
 return {...cue,pip:along(source,v,travel),pose:'flying',opacity:reduced?1:1-clamp((p-.58)/.42),stretch:reduced?1:1+.30*(1-p),tilt:reduced?0:-angle*direction};
}
