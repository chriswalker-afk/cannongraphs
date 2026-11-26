import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stageMisfire,sampleMisfire,MISFIRE_ROLL_MS,MISFIRE_PAUSE_MS,MISFIRE_MS,MISFIRE_REDUCED_MS} from '../src/animations/misfire';
import {sampleAttempt,attemptDuration} from '../src/animations/attempt';
import {FIRE_MS} from '../src/animations/launch';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {simulateLinearAttempt} from '../src/engine/simulation/linearAttempt';
import {meadowPreview} from '../src/levels/worlds/meadow';
const cannon=meadowPreview.cannons[0],source=cannon.position,staging=stageMisfire(source,1,meadowPreview.bounds,meadowPreview.obstacles);
const result=simulateLinearAttempt(parseLinearEquation('x+1'),cannon,meadowPreview);
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8);
test('local gag rolls from the muzzle onto the floor, pauses, then walks away',()=>{
 near(staging.landing.y,.6);assert.ok(staging.departure.x>staging.landing.x);
 assert.deepEqual(sampleMisfire(0,source,1,false,staging).pip,source);
 const rolling=sampleMisfire(300,source,1,false,staging);assert.equal(rolling.pose,'rolling');assert.ok(rolling.pip.x>source.x&&rolling.pip.y<source.y);assert.notEqual(rolling.tilt,0);
 const sad=sampleMisfire(MISFIRE_ROLL_MS,source,1,false,staging);assert.deepEqual(sad.pip,staging.landing);assert.equal(sad.pose,'disappointed');
 const walk=sampleMisfire(MISFIRE_ROLL_MS+MISFIRE_PAUSE_MS+300,source,1,false,staging);assert.equal(walk.pose,'walking');assert.ok(walk.pip.x>staging.landing.x);assert.ok(walk.walkCycle!>0);
 const end=sampleMisfire(MISFIRE_MS,source,1,false,staging);near(end.pip.x,staging.departure.x);assert.equal(end.opacity,0);
});
test('misfire never produces a flight trail, cannon recoil, burst, splat or exit event',()=>{
 assert.equal(result.event.kind,'misfire');assert.equal(result.length,0);assert.deepEqual(result.end,source);
 for(const ms of [0,FIRE_MS-1,FIRE_MS,FIRE_MS+300,FIRE_MS+700,FIRE_MS+1400,attemptDuration(result)]){
  const frame=sampleAttempt(ms,result,false,staging);assert.equal(frame.trace,null);assert.equal(frame.burst,null);assert.equal(frame.recoil,0);assert.notEqual(frame.pose,'splat');assert.notEqual(frame.pose,'flying');
 }
 assert.equal(attemptDuration(result),FIRE_MS+MISFIRE_MS);
 assert.equal(sampleAttempt(attemptDuration(result),result,false,staging).opacity,0);
});
test('reduced motion shows a disappointed static pose without rotation or walking cycle',()=>{
 for(const t of [0,300,600,MISFIRE_REDUCED_MS]){
  const f=sampleMisfire(t,source,1,true,staging);assert.equal(f.pose,'disappointed');assert.equal(f.tilt,0);assert.equal(f.stretch,1);assert.equal(f.walkCycle,undefined);
 }
 assert.equal(attemptDuration(result,true),FIRE_MS+MISFIRE_REDUCED_MS);
});
test('reverse direction and nearby wall constrain the local departure',()=>{
 const reverse=stageMisfire({x:3,y:1},-1,meadowPreview.bounds,meadowPreview.obstacles);assert.ok(reverse.departure.x<reverse.landing.x);
 const wall={id:'close',kind:'wall' as const,bounds:{minX:2.3,maxX:3,minY:.4,maxY:2}};
 const constrained=stageMisfire(source,1,meadowPreview.bounds,[...meadowPreview.obstacles,wall]);near(constrained.departure.x,2.1);
});
