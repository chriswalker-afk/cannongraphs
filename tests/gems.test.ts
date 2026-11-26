import {test} from 'node:test';
import assert from 'node:assert/strict';
import {levels} from '../src/levels/catalog';
import {validateLevel,GEM_RADIUS,type Gem,type Level} from '../src/levels/schema';
import {PIP_RADIUS} from '../src/engine/collisions/clearance';
import {parseFlightEquation,parseLinearEquation,parseQuadraticEquation,type FlightEquation} from '../src/engine/equations/linear';
import {simulateRoute,routeGemHits} from '../src/engine/simulation/linearRoute';
import {simulateLinearAttempt} from '../src/engine/simulation/linearAttempt';
import {simulateQuadraticAttempt} from '../src/engine/simulation/quadraticAttempt';
import {collectRouteGems} from '../src/engine/simulation/gemContacts';
import {gemTimeline,gemsAt,bankedGems} from '../src/animations/gemTimeline';
import {attemptDuration,flightDuration} from '../src/animations/attempt';
import {FIRE_MS} from '../src/animations/launch';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration,restartLevel} from '../src/game/levelState';
import {levelStars} from '../src/game/scoring';
const get=(id:string)=>levels.find(l=>l.id===id)!;
const gem=(id:string,x:number,y:number):Gem=>({id,position:{x,y}});
const near=(a:number,b:number,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,a+' != '+b);
const references:Readonly<Record<string,Readonly<Record<string,string>>>>={
 '1-01':{A:'x'},'1-06':{A:'3'},'1-10':{A:'x+1',B:'11-x'},
 '2-01':{A:'x/2'},'2-08':{A:'11/3-x/3'},'2-12':{A:'x/2',B:'4-x/2',C:'6',D:'22-2x'},
 '3-01':{A:'x²'},'3-06':{A:'7-(x-4)²/2'},'3-10':{A:'-(x-1)(x-7)/2+2',B:'x/2-3/2'},
 '3-12':{A:'-(x-4)²/2+13/2',B:'(x-10)²/3-1',C:'-(x-16)²/2+13/2',D:'2'},
 '4-01':{A:'4-(x+3)^2/3'},'4-08':{A:'2(x-2)^2/3-4'},
 '4-11':{A:'-4-(x+8)(x-4)/12',B:'(x-4)^2/8-4',C:'4'},
 '4-12':{A:'4-4(x+9)^2/9',B:'(x+3)^2/3-3',C:'0',D:'4-4(x-9)^2/9',E:'(x-15)^2/3-3'}
};
function solve(id:string){
 const l=get(id),plan=new Map<string,FlightEquation>(l.cannons.map(c=>{
  if(c.type!=='linear'&&c.type!=='quadratic')throw new Error('Unexpected cannon family');
  return [c.id,parseFlightEquation(references[id][c.id],c.type)];
 }));
 return simulateRoute(l,plan);
}
test('Worlds 1–4 authored gem placements are valid and reference routes collect them all',()=>{
 const authored=levels.filter(l=>l.world<=4&&l.gems?.length);
 assert.equal(authored.length,Object.keys(references).length);
 assert.equal(new Set(authored.map(l=>l.world)).size,4);
 for(const l of authored){
  validateLevel(l);const r=solve(l.id);
  assert.equal(r.event.kind,'exit',l.id);assert.equal(r.gemHits.length,l.gems!.length,l.id);
  assert.equal(new Set(r.gemHits.map(h=>h.gemId)).size,l.gems!.length);
  for(const h of r.gemHits){
   const p=r.legs[h.legIndex].pointAt(h.progress),g=l.gems!.find(g=>g.id===h.gemId)!;
   near(Math.hypot(p.x-g.position.x,p.y-g.position.y),PIP_RADIUS+GEM_RADIUS,2e-6);
  }
 }
});
test('schema rejects gem IDs colliding with anchors, terrain or each other; validates physical clearance',()=>{
 const l=get('1-01');
 for(const gems of [[gem('A',3,3)],[gem('exit',3,3)],[gem('x',3,3),gem('x',5,5)],[gem('x',3,3),gem('y',3.1,3)],[gem('x',1,1)],[gem('x',6,6)],[gem('x',2,.2)],[gem('x',l.bounds.minX,2)],[gem('x',NaN,2)]]){
  assert.throws(()=>validateLevel({...l,gems}),/Invalid gem/);
 }
 assert.doesNotThrow(()=>validateLevel({...l,gems:undefined}));
});
test('continuous linear contact includes a tangent and excludes a nearby miss',()=>{
 const l:Level={...get('1-06'),obstacles:[],gems:[],exit:{x:9,y:3}};
 const leg=simulateLinearAttempt(parseLinearEquation('3'),l.cannons[0],l),r=PIP_RADIUS+GEM_RADIUS;
 const hits=collectRouteGems([gem('touch',4,3+r),gem('miss',5,3+r+.00001),gem('direct',6,3)], [leg]);
 assert.deepEqual(hits.map(h=>h.gemId),['touch','direct']);near(hits[0].progress,3/8,2e-6);
 near(hits[1].progress,(5-r)/8);
});
test('quadratic contact follows the curve rather than its chord, including vertex tangency',()=>{
 const l=get('3-01'),leg=simulateQuadraticAttempt(parseQuadraticEquation('x²'),l.cannons[0],l);
 assert.deepEqual(collectRouteGems([gem('on-curve',2,4)],[leg]).map(h=>h.gemId),['on-curve']);
 const arch=solve('3-10').legs[0],r=PIP_RADIUS+GEM_RADIUS;
 assert.deepEqual(collectRouteGems([gem('on-arch',4,6.5),gem('on-chord',4,2)],[arch]).map(h=>h.gemId),['on-arch']);
 const tangent=collectRouteGems([gem('touch',4,6.5+r),gem('miss',4,6.5+r+.00001)],[arch]);
 assert.deepEqual(tangent.map(h=>h.gemId),['touch']);near(tangent[0].progress,.5,2e-6);
});
test('reverse traversal orders pickups by flight time, not ascending x',()=>{
 const r=solve('2-08');assert.deepEqual(r.gemHits.map(h=>h.gemId),['gem-1','gem-2']);
 const leg=r.legs[0],hits=collectRouteGems([gem('west',2,3),gem('east',5,2)],[leg]);
 assert.deepEqual(hits.map(h=>h.gemId),['east','west']);
});
test('multiple passes collect a gem only once; misfire and unreached legs cannot collect',()=>{
 const leg=solve('1-01').legs[0],g=gem('unique',3,3);
 assert.equal(collectRouteGems([g],[leg,leg]).length,1);
 const l=get('1-01'),misfire=simulateRoute(l,new Map([['A',parseLinearEquation('x+1')]]));
 assert.equal(misfire.event.kind,'misfire');assert.deepEqual(misfire.gemHits,[]);
 const relay=get('3-10'),r=simulateRoute(relay,new Map<string,FlightEquation>([['A',parseQuadraticEquation('-(x-1)(x-7)/2+2')],['B',parseLinearEquation('x')]]));
 assert.equal(r.event.kind,'misfire');assert.deepEqual(r.gemHits.map(h=>h.gemId),['gem-1']);assert.deepEqual(bankedGems(r),[]);
});
test('solid collision truncates the pickup path and a simultaneous solid contact wins',()=>{
 const l:Level={...get('1-06'),gems:[],obstacles:[{id:'wall',kind:'wall',bounds:{minX:5,maxX:5.2,minY:0,maxY:8}}]};
 const leg=simulateLinearAttempt(parseLinearEquation('3'),l.cannons[0],l);assert.equal(leg.event.kind,'obstacle');
 const r=PIP_RADIUS+GEM_RADIUS;
 assert.deepEqual(collectRouteGems([gem('before',3,3),gem('tie',leg.end.x+r,3),gem('behind',6,3)],[leg]).map(h=>h.gemId),['before']);
});
test('pickup timeline never credits a gem before the corresponding leg reaches it',()=>{
 const r=solve('3-10'),t=gemTimeline(r);
 assert.equal(t.length,2);assert.ok(t[0].at>FIRE_MS);
 assert.deepEqual(gemsAt(t,t[0].at-1e-5),[]);assert.deepEqual(gemsAt(t,t[0].at),['gem-1']);
 assert.ok(t[1].at>attemptDuration(r.legs[0])+FIRE_MS);
 assert.deepEqual(gemsAt(t,Infinity),['gem-1','gem-2']);
 const reduced=gemTimeline(r,true);assert.ok(reduced[1].at>=attemptDuration(r.legs[0],true)+FIRE_MS);
 near(reduced[0].at,FIRE_MS+flightDuration(r.legs[0],true)*r.gemHits[0].progress);
 assert.deepEqual(gemsAt(reduced,Infinity),bankedGems(r));
});
test('gems are optional and do not change creature scoring or multiply on rapid-fire',()=>{
 const l=get('3-01'),alternative=simulateRoute(l,new Map([['A',parseQuadraticEquation('-x²+8x-6')]]));
 assert.equal(alternative.event.kind,'exit');assert.ok(alternative.gemHits.length<l.gems!.length);
 const all=solve('3-01');
 for(const result of [all,alternative]){
  let s=beginAttempt(createLevelState(5),result);assert.deepEqual(bankedGems(s.lastResult),[]);
  s=finishAttempt(s,s.active!.id);const bank=bankedGems(s.lastResult),id=s.celebration!.id;
  assert.equal(bank.length,routeGemHits(result).length);
  s=advanceCelebration(s,id,4,4);s=finishCelebration(s,id);assert.equal(levelStars(s),3);
  assert.deepEqual(bankedGems(s.lastResult),bank);assert.deepEqual(bankedGems(restartLevel(s).lastResult),[]);
 }
 const s=finishAttempt(beginAttempt(createLevelState(1),all),1);assert.equal(s.phase,'success');assert.equal(levelStars(s),3);assert.equal(bankedGems(s.lastResult).length,2);
});
