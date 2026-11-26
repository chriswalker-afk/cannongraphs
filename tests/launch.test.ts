import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sampleLaunchCue,sampleDemoFrame,barrelVector,LOAD_MS,FIRE_MS,CUE_END_MS,DEMO_END_MS} from '../src/animations/launch';
const source={x:1,y:1},near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9);
test('loading, charging, fire, recover and done have deterministic boundaries',()=>{
 assert.equal(sampleLaunchCue(0,source,1).phase,'loading');assert.equal(sampleLaunchCue(LOAD_MS,source,1).phase,'charging');
 assert.equal(sampleLaunchCue(FIRE_MS,source,1).phase,'firing');assert.equal(sampleLaunchCue(FIRE_MS+200,source,1).phase,'recovering');
 assert.equal(sampleLaunchCue(CUE_END_MS,source,1).phase,'done');
 assert.equal(sampleLaunchCue(LOAD_MS,source,1).loadingPoint,null);assert.equal(sampleLaunchCue(CUE_END_MS,source,1).recoil,0);
});
test('ejection begins exactly at the unchanged world anchor',()=>{
 const f=sampleDemoFrame(FIRE_MS,source,1);assert.deepEqual(f.pip,source);assert.equal(f.pose,'flying');
 assert.deepEqual(source,{x:1,y:1});assert.equal(sampleDemoFrame(DEMO_END_MS,source,1).pip,null);
});
test('loading and ejection mirror direction and remain in world units',()=>{
 for(const t of [0,200,519,FIRE_MS,FIRE_MS+200]){
  const a=sampleDemoFrame(t,source,1).pip!,b=sampleDemoFrame(t,source,-1).pip!;
  near(a.x+b.x,2*source.x);near(a.y,b.y);
 }
 const v=barrelVector(1),p=sampleDemoFrame(FIRE_MS+200,source,1).pip!;
 near((p.x-source.x)*v.y,(p.y-source.y)*v.x);
});
test('recoil and smoke reset; reduced motion eliminates travel and stretch',()=>{
 const normal=sampleLaunchCue(FIRE_MS+30,source,1);assert.ok(normal.recoil>0);assert.notEqual(normal.burst,null);
 const reduced=sampleDemoFrame(FIRE_MS+30,source,1,true);assert.equal(reduced.recoil,0);assert.equal(reduced.burst,null);assert.equal(reduced.stretch,1);assert.deepEqual(reduced.pip,source);
 assert.equal(sampleDemoFrame(DEMO_END_MS,source,1,true).pip,null);
});
test('launch cue is independent of camera and can accept a future flight angle',()=>{
 const v=barrelVector(-1,0);assert.deepEqual(v,{x:-1,y:0});
 const f=sampleDemoFrame(FIRE_MS+200,source,1,false,0);assert.ok(f.pip!.x>source.x);near(f.pip!.y,source.y);
});
