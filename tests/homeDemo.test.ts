import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHomeDemo,homeLayout,homeElapsed,sampleHomeDemo,stillHomeDemo} from '../src/animations/homeDemo';
import {createHomeClock,type FrameScheduler} from '../src/animations/homeClock';
import {levels,worlds} from '../src/levels/catalog';
import {coordinateSystem} from '../src/engine/coordinates';
import {flightPath} from '../src/rendering/flightPath';
import {PIP_RADIUS,segmentRectangleDistance} from '../src/engine/collisions/clearance';
import {quadraticRectangleDistance} from '../src/engine/collisions/quadraticSweep';
import {graphRectangleClearance} from '../src/engine/collisions/graphSweep';
const near=(a:number,b:number,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,a+' != '+b);
test('responsive home chooses a landscape or a compact vertical switchback',()=>{
 assert.equal(homeLayout(1100,430),'landscape');assert.equal(homeLayout(320,520),'switchback');
 assert.equal(homeLayout(700,620),'switchback');assert.equal(homeLayout(812,210),'landscape');
});
for(const layout of ['landscape','switchback'] as const){
 test(layout+' is a verified separate demonstration, with exact captures and positive body clearance',()=>{
  const d=createHomeDemo(layout);assert.equal(d.result.event.kind,'exit');
  assert.equal(d.result.legs.length,d.level.cannons.length);
  assert.ok(!levels.some(l=>l.id===d.level.id));assert.equal(levels.length,96);assert.equal(worlds.length,8);
  for(const [i,leg] of d.result.legs.entries()){
   const target=d.level.cannons[i+1]?.position??d.level.exit;
   near(leg.end.x,target.x);near(leg.end.y,target.y);
   for(const o of d.level.obstacles){
    const clearance=leg.graphSegment?graphRectangleClearance(leg.graphSegment,PIP_RADIUS,o.bounds):(leg.quadraticSegment?quadraticRectangleDistance(leg.quadraticSegment,o.bounds):segmentRectangleDistance(leg.start,leg.end,o.bounds))-PIP_RADIUS;
    assert.ok(clearance>.025,layout+' '+leg.cannonId+' '+o.id+' '+clearance);
   }
  }
 });
 test(layout+' timeline follows each actual route leg and loops only after every Pip arrives',()=>{
  const d=createHomeDemo(layout),s=d.schedule;
  for(const [i,timing] of s.legs.entries()){
   const leg=d.result.legs[i],progress=.37,t=s.lead+timing.offset+timing.load+timing.flight*progress;
   const frame=sampleHomeDemo(t,d),pip=frame.pips.find(p=>p.index===0&&p.legIndex===i&&p.phase==='flying')!;
   assert.ok(pip);near(pip.point.x,leg.pointAt(progress).x);near(pip.point.y,leg.pointAt(progress).y);
   near(pip.tilt,-(leg.angleAt?.(progress)??leg.angle)*leg.direction);
   assert.equal(frame.arrived,0);
  }
  assert.equal(sampleHomeDemo(s.duration,d).arrived,s.count);
  assert.equal(sampleHomeDemo(d.cycleMs-1,d).pips.length,0);
  near(homeElapsed(d.cycleMs+10,d),10);
  assert.deepEqual(sampleHomeDemo(d.cycleMs+10,d),sampleHomeDemo(10,d));
 });
 test(layout+' reduced-motion still shows every family with no moving queue or invalid points',()=>{
  const d=createHomeDemo(layout),frame=stillHomeDemo(d),project=coordinateSystem(d.level.bounds,{width:400,height:440,padding:16});
  assert.equal(frame.pips.length,d.result.legs.length);assert.equal(frame.cannonCues.every(c=>c.recoil===0&&c.burst===null),true);
  for(const p of frame.pips){
   const leg=d.result.legs[p.legIndex],a=project.toScreen(p.point);
   near(p.point.y,leg.pointAt(.46).y);assert.ok(a.x>0&&a.x<400&&a.y>0&&a.y<440);
   assert.ok(!flightPath(leg,leg.start,leg.end,project.toScreen).includes('NaN'));
  }
 });
}
function fakeFrames(){
 let next=0;const pending=new Map<number,(time:number)=>void>();
 const scheduler:FrameScheduler={request(fn){pending.set(++next,fn);return next;},cancel(id){pending.delete(id);}};
 return {scheduler,pending,step(t:number){const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(t));}};
}
test('clock has one pending frame, preserves elapsed time while paused and ignores long hidden gaps',()=>{
 const f=fakeFrames(),samples:number[]=[],clock=createHomeClock(f.scheduler,t=>samples.push(t));
 clock.resume();clock.resume();assert.equal(f.pending.size,1);
 f.step(100);f.step(116);near(clock.elapsed(),16);
 clock.pause();assert.equal(f.pending.size,0);f.step(10000);
 clock.resume();f.step(10016);near(clock.elapsed(),16);f.step(10032);near(clock.elapsed(),32);
 f.step(20000);near(clock.elapsed(),132);
 clock.reset();near(clock.elapsed(),0);f.step(20016);near(clock.elapsed(),0);
 clock.destroy();assert.equal(f.pending.size,0);clock.resume();assert.equal(f.pending.size,0);
});
test('destroy during paint never schedules another frame',()=>{
 const f=fakeFrames();const clock=createHomeClock(f.scheduler,()=>clock.destroy());
 clock.resume();f.step(1);assert.equal(f.pending.size,0);
});
