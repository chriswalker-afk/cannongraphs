import type {AttemptResult} from '../engine/simulation/linearAttempt';
import {routeLegs,routeGemHits} from '../engine/simulation/linearRoute';
import {attemptDuration,flightDuration} from './attempt';
import {FIRE_MS} from './launch';
export interface TimedGemHit {readonly gemId:string;readonly at:number}
export function gemTimeline(result:AttemptResult,reduced=false):readonly TimedGemHit[]{
 const legs=routeLegs(result),offsets:number[]=[];let time=0;
 for(const leg of legs){offsets.push(time);time+=attemptDuration(leg,reduced);}
 return routeGemHits(result).map(hit=>({
  gemId:hit.gemId,at:offsets[hit.legIndex]+FIRE_MS+flightDuration(legs[hit.legIndex],reduced)*hit.progress
 }));
}
export function gemsAt(timeline:readonly TimedGemHit[],elapsed:number):readonly string[]{
 return timeline.filter(hit=>hit.at<=elapsed).map(hit=>hit.gemId);
}
// Only a verified exit banks gems; a failed journey's provisional pickups reset.
export function bankedGems(result:AttemptResult|null|undefined):readonly string[]{
 return result?.event.kind==='exit'?routeGemHits(result).map(hit=>hit.gemId):[];
}
