import {test} from 'node:test';
import assert from 'node:assert/strict';
import {levels,worlds} from '../src/levels/catalog';
import {referenceSolutions} from './fixtures/referenceSolutions';
import {referenceLayout} from './fixtures/referenceLayout';
import {waitingCrewSlots,waitingIndices,departingIndex,canBoardFrom,boardingPoint} from '../src/animations/waitingCrew';
import {pointRectangleDistance,segmentRectangleDistance} from '../src/engine/collisions/clearance';
import {parseCannonEquation,evaluateCannonEquation} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {sampleRouteAttempt} from '../src/animations/routeAttempt';
import {flightDuration,attemptDuration,sampleAttempt} from '../src/animations/attempt';
import {FIRE_MS,LOAD_MS,sampleLaunchCue} from '../src/animations/launch';
import {makeRapidSchedule,sampleRapidFire} from '../src/animations/rapidFire';
import type {Point} from '../src/engine/coordinates';
const near=(a:number,b:number,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,a+' != '+b);
test('every authored level can stage all five waiting Pips on existing surfaces, with no overlap of targets or terrain',()=>{
 for(const level of levels){
  const crew=waitingCrewSlots(level,5),anchors=[...level.cannons.map(c=>c.position),level.exit,...(level.gems??[]).map(g=>g.position)];
  assert.equal(crew.length,5,level.id);
  assert.deepEqual(crew,waitingCrewSlots(level,5));
  for(const [i,p] of crew.entries()){
   assert.ok(p.x>=level.bounds.minX+.245-1e-9&&p.x<=level.bounds.maxX-.245+1e-9,level.id);
   assert.ok(p.y+.44<=level.bounds.maxY+1e-9,level.id);
   assert.ok(level.obstacles.some(o=>Math.abs(p.y-o.bounds.maxY-.23)<1e-8&&p.x>=o.bounds.minX&&p.x<=o.bounds.maxX),level.id);
   assert.ok(level.obstacles.every(o=>pointRectangleDistance(p,o.bounds)>=.23-1e-9),level.id);
   assert.ok(anchors.every(a=>Math.hypot(a.x-p.x,a.y-p.y)>=.82-1e-9),level.id);
   for(const q of crew.slice(0,i))assert.ok(Math.hypot(q.x-p.x,q.y-p.y)>=.57-1e-9,level.id);
  }
 }
});
test('crew indices follow the actual finite queue, Cadet replenishment, and rapid-fire departures',()=>{
 for(const total of [3,5]){
  assert.deepEqual(waitingIndices(total,total,total),Array.from({length:total},(_,i)=>i));
  for(let waiting=total-1;waiting>=0;waiting--){
   const before=waitingIndices(total,waiting+1,total),after=waitingIndices(total,waiting,total);
   assert.equal(after.length,waiting);assert.equal(before[0],departingIndex(total,waiting));assert.deepEqual(before.slice(1),after);
  }
  assert.equal(waitingIndices(total,total,total).length,total);
 }
});
test('pre-fire hop is optional, bounded and clearance-checked, including reverse and raised starts',()=>{
 let checked=0;
 for(const [wi,w] of worlds.entries())for(const [li,authored] of w.levels.entries()){
  const level=referenceLayout(authored);
  const c=level.cannons.find(c=>c.id===level.startId)!,e=parseCannonEquation(referenceSolutions[wi][li][c.id],c.type),route=simulateRoute(level,new Map(level.cannons.map(c=>[c.id,parseCannonEquation(referenceSolutions[wi][li][c.id],c.type)])));
  const first=route.legs[0],from=waitingCrewSlots(level,5)[0],to=sampleLaunchCue(LOAD_MS-1,first.source,first.direction,false,first.angle).loadingPoint!;
  if(!from||!canBoardFrom(level,from,to))continue;
  checked++;
  assert.deepEqual(boardingPoint(from,to,0),from);assert.deepEqual(boardingPoint(from,to,1),to);
  const start=sampleRouteAttempt(0,route,level,false,from);assert.deepEqual(start.frame.pip,from);assert.equal(start.frame.trace,null);
  for(let i=0;i<=20;i++){
   const p=boardingPoint(from,to,i/20);assert.ok(level.obstacles.every(o=>pointRectangleDistance(p,o.bounds)>=.19-1e-8));
  }
  const fire=sampleRouteAttempt(FIRE_MS,route,level,false,from);
  assert.deepEqual(fire.frame.pip,first.start);near(fire.frame.pip!.y,evaluateCannonEquation(e,fire.frame.pip!.x));
 }
 assert.ok(checked>0,'at least some real levels have a visible hop');
});
test('normal animation moves the same Pip along all seven families without revealing a path before launch',()=>{
 for(const [wi,w] of worlds.entries())for(const [li,authored] of w.levels.entries()){
  const level=referenceLayout(authored);
  const plan=new Map(level.cannons.map(c=>[c.id,parseCannonEquation(referenceSolutions[wi][li][c.id],c.type)])),route=simulateRoute(level,plan);
  assert.equal(route.event.kind,'exit',level.id);
  let offset=0;
  for(const leg of route.legs){
   const before=sampleRouteAttempt(offset+LOAD_MS/2,route,level);
   assert.equal(before.frame.trace,null);assert.equal(before.frame.trailStart,undefined);
   const duration=flightDuration(leg);
   for(const progress of [.2,.5,.8]){
    const frame=sampleRouteAttempt(offset+FIRE_MS+duration*progress,route,level).frame,p=frame.pip!,trail=frame.trailStart!;
    assert.equal(frame.pose,'flying');assert.ok(trail);
    near(p.x,leg.pointAt(progress).x);near(p.y,leg.pointAt(progress).y);
    near(p.y,evaluateCannonEquation(plan.get(leg.cannonId)!,p.x));
    near(trail.x,leg.pointAt(progress-.13).x);near(trail.y,leg.pointAt(progress-.13).y);
   }
   const reduced=sampleAttempt(FIRE_MS+20,leg,true);
   assert.equal(reduced.trailStart,undefined);assert.equal(reduced.recoil,0);assert.equal(reduced.burst,null);
   offset+=attemptDuration(leg);
  }
 }
});
test('misfire stays a local disappointed gag, never a graph flight, with no trail or burst',()=>{
 const level=levels[0],result=simulateRoute(level,new Map([['A',parseCannonEquation('x+1','linear')]]));
 assert.equal(result.event.kind,'misfire');
 for(const elapsed of [0,300,FIRE_MS,FIRE_MS+600,FIRE_MS+900,FIRE_MS+1700]){
  const f=sampleRouteAttempt(elapsed,result,level,false,waitingCrewSlots(level,5)[0]).frame;
  assert.equal(f.trace,null);assert.equal(f.trailStart,undefined);assert.equal(f.burst,null);assert.equal(f.recoil,0);
 }
});
test('rapid fire retains an overlapping stream with actual moving graph trails',()=>{
 const level=levels[0],route=simulateRoute(level,new Map([['A',parseCannonEquation('x','linear')]])),s=makeRapidSchedule(route,4);
 const f=sampleRapidFire(s.lead+s.load+s.interval+60,route,s);
 assert.ok(f.pips.filter(p=>p.phase==='flying').length>=2);
 for(const p of f.pips.filter(p=>p.phase==='flying')){near(p.point.y,p.point.x);assert.ok(p.trailStart);near(p.trailStart!.y,p.trailStart!.x);}
});
