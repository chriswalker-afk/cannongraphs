import type {AttemptResult} from '../engine/simulation/linearAttempt';
import {routeLegs} from '../engine/simulation/linearRoute';
import {FIRE_MS} from '../animations/launch';
import {attemptDuration,flightDuration} from '../animations/attempt';
import {gemTimeline} from '../animations/gemTimeline';
import type {RapidSchedule} from '../animations/rapidFire';
import type {SoundEffect} from './effects';
export interface TimedSound{readonly at:number;readonly sound:SoundEffect}
const sorted=(events:TimedSound[])=>events.sort((a,b)=>a.at-b.at);
export function attemptSounds(result:AttemptResult,reduced=false):readonly TimedSound[]{
 const events:TimedSound[]=[],legs=routeLegs(result);let offset=0;
 for(const [i,leg] of legs.entries()){
  events.push({at:offset,sound:'load'});
  const fire=offset+FIRE_MS,arrival=fire+flightDuration(leg,reduced);
  if(leg.event.kind==='misfire')events.push({at:fire,sound:'misfire'});
  else{
   events.push({at:fire,sound:'fire'});
   const event=i===legs.length-1?result.event:leg.event;
   events.push({at:arrival,sound:event.kind==='cannon'?'catch':event.kind==='exit'?'exit':event.kind==='obstacle'||event.kind==='boundary'?'splat':'lost'});
  }
  offset+=attemptDuration(leg,reduced);
 }
 for(const hit of gemTimeline(result,reduced))events.push({at:hit.at,sound:'gem'});
 return sorted(events);
}
export function rapidSounds(result:AttemptResult,s:RapidSchedule):readonly TimedSound[]{
 const events:TimedSound[]=[];
 if(result.event.kind!=='exit'||routeLegs(result).length!==s.legs.length)return events;
 for(let i=0;i<s.count;i++)for(const [j,leg] of s.legs.entries()){
  const fire=s.lead+i*s.interval+leg.offset+leg.load;
  events.push({at:fire,sound:'fire'},{at:fire+leg.flight,sound:j===s.legs.length-1?'exit':'catch'});
 }
 return sorted(events);
}
// Consume each event once from the animation clock, never from painting.
// If a tab or frame stalls, advance the cursor without replaying old sounds.
export function createSoundCursor(events:readonly TimedSound[],emit:(sound:SoundEffect)=>void,maxAge=180){
 let index=0,last=-Infinity;
 return {advance(ms:number,audible=true){
  if(!Number.isFinite(ms)||ms<last)return;
  last=ms;while(index<events.length&&events[index].at<=ms){
   const e=events[index++];if(audible&&ms-e.at<=maxAge)emit(e.sound);
  }
 }};
}
