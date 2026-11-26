import {test} from 'node:test';
import assert from 'node:assert/strict';
import {beyondGraphiverse} from '../src/levels/worlds/beyondGraphiverse';
import {worlds,levels,nextLevel,levelPosition,worldForLevel} from '../src/levels/catalog';
import {cannonTypes} from '../src/game/cannons';
import type {Level} from '../src/levels/schema';
import {parseCannonEquation,isAdvanced,evaluateCannonEquation,type CannonEquation,type AdvancedEquation} from '../src/engine/equations/advanced';
import {auditSolution} from '../src/levels/qa';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {simulateAdvancedAttempt} from '../src/engine/simulation/advancedAttempt';
import {CAPTURE_EPSILON} from '../src/engine/simulation/linearAttempt';
import {bankedGems} from '../src/animations/gemTimeline';
import {makeRapidSchedule,sampleRapidFire,rapidCounts} from '../src/animations/rapidFire';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {levelStars} from '../src/game/scoring';
const refs:readonly Readonly<Record<string,string>>[]=[
 {A:'2^x'}, {A:'8(1/2)^x'}, {A:'6-exp(x-1)'}, {A:'log(x)'}, {A:'ln(x-1)+1'}, {A:'3-log(4-x)'},
 {A:'2sin(pi*x/2)+3'}, {A:'3cos(pi*x/3)+2'}, {A:'-2sin(pi(x-1)/3)+1'}, {A:'2tan(pi*x/4)+2'},
 {A:'2^x',B:'4-2log(3(x-2)+1)',C:'2sin(pi(x-5)/2)+2'},
 {A:'x/2',B:'-(x-7)^2/2+13/2',C:'(x-14)^3/4-3(x-14)+6',D:'16/(x-16)+2',
  E:'2^((x-24)/2)+3',F:'7-log(3(x-28)+1)',G:'2sin(pi(x-31)/2)+6'}
];
const plan=(i:number)=>new Map<string,CannonEquation>(beyondGraphiverse[i].cannons.map(c=>[c.id,parseCannonEquation(refs[i][c.id],c.type)]));
const near=(a:number,b:number,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,a+' != '+b);
const advanced=(i:number,id='A')=>{const e=plan(i).get(id)!;assert.ok(isAdvanced(e));return e;};
test('six complete worlds expose all 72 levels, with no remaining playable preview or finale wraparound',()=>{
 assert.equal(worlds.length,6);assert.equal(levels.length,72);
 assert.ok(worlds.every(w=>w.levels.length===12&&!w.name.includes('preview')));
 assert.equal(new Set(levels.map(l=>l.id)).size,72);
 assert.equal(worlds[5].name,'Beyond the Graphiverse');assert.equal(nextLevel('5-12'),beyondGraphiverse[0]);
 assert.deepEqual(beyondGraphiverse.map(l=>l.id),Array.from({length:12},(_,i)=>'6-'+String(i+1).padStart(2,'0')));
 for(const [i,l] of beyondGraphiverse.entries()){
  assert.equal(l.creatures,5);assert.equal(worldForLevel(l.id),worlds[5]);assert.deepEqual(levelPosition(l.id),{index:i+1,total:12});
  assert.equal(nextLevel(l.id),beyondGraphiverse[i+1]);
 }
 assert.deepEqual(new Set(beyondGraphiverse[11].cannons.map(c=>c.type)),new Set(Object.keys(cannonTypes)));
});
test('curriculum covers growth, decay, reflected natural exponential, both log bases and all three trig functions',()=>{
 assert.ok(beyondGraphiverse.slice(0,3).every(l=>l.cannons[0].type==='exponential'));
 assert.ok(beyondGraphiverse.slice(3,6).every(l=>l.cannons[0].type==='logarithmic'));
 assert.ok(beyondGraphiverse.slice(6,10).every(l=>l.cannons[0].type==='wave'));
 assert.ok(advanced(0).slopeAt(1)>0);assert.ok(advanced(1).slopeAt(1)<0);assert.ok(advanced(2).slopeAt(1)<0);
 near(advanced(3).valueAt(.1),-1);near(advanced(4).valueAt(1+Math.E),2);
 assert.deepEqual([advanced(6).primitive,advanced(7).primitive,advanced(8).primitive,advanced(9).primitive],['sin','cos','sin','tan']);
 assert.deepEqual([beyondGraphiverse[5].cannons[0].direction,beyondGraphiverse[8].cannons[0].direction],[-1,-1]);
});
test('irrational coordinates are exact in authored data and explicitly identified in the objectives',()=>{
 const natural=beyondGraphiverse[2],log=beyondGraphiverse[4];
 near(natural.exit.x,1+Math.log(4),1e-12);near(natural.gems![0].position.x,1+Math.log(2),1e-12);
 near(log.exit.x,1+Math.E**2,1e-12);near(log.gems![0].position.x,1+Math.E,1e-12);
 assert.match(natural.objective,/1\+ln\(4\)/);assert.match(log.objective,/1\+e²/);
});
for(const [i,l] of beyondGraphiverse.entries())test(l.id+' '+l.title+' has an audited continuous route and all optional gems',()=>{
 const audit=auditSolution(l,refs[i],l.cannons.map(c=>c.id));
 assert.equal(audit.result.event.kind,'exit');near(audit.result.end.x,l.exit.x);near(audit.result.end.y,l.exit.y);
 assert.ok(audit.minimumClearance>.025,l.id+' clearance '+audit.minimumClearance);
 assert.equal(bankedGems(audit.result).length,l.gems!.length);
 const equations=plan(i);
 for(const leg of audit.result.legs){
  const e=equations.get(leg.cannonId)!;
  for(const t of [0,.1,.3,.5,.8,1]){const p=leg.pointAt(t);near(p.y,evaluateCannonEquation(e,p.x));}
 }
});
// A conservative mathematical shortcut audit based solely on actual solid
// bounds. Any continuous curve passing an ordered set of separated vertical
// intervals must make the corresponding successive changes in height.
// Alternating changes imply distinct zeros of its derivative, even if we
// ignore the creature radius and allow touching the gate bounds.
type Slice={x:number;lo:number;hi:number};
function gateSlices(l:Level):Slice[]{
 return l.obstacles.filter(o=>o.id.endsWith('-lower')).map(o=>{
  const roof=l.obstacles.find(z=>z.id===o.id.slice(0,-6)+'-upper')!;
  assert.ok(roof);assert.equal(o.bounds.minX,roof.bounds.minX);assert.equal(o.bounds.maxX,roof.bounds.maxX);
  assert.equal(o.bounds.minY,l.bounds.minY+.4);assert.equal(roof.bounds.maxY,l.bounds.maxY);
  return {x:(o.bounds.minX+o.bounds.maxX)/2,lo:o.bounds.maxY,hi:roof.bounds.minY};
 });
}
function forcedTurns(slices:readonly Slice[]):number{
 const best=slices.map(()=>[0,0]);let edges=0;
 for(let i=1;i<slices.length;i++)for(let j=0;j<i;j++){
  const a=slices[j],b=slices[i];let direction=-1;
  if(a.hi<b.lo)direction=0;else if(a.lo>b.hi)direction=1;
  if(direction<0)continue;
  best[i][direction]=Math.max(best[i][direction],1+best[j][1-direction]);edges=Math.max(edges,best[i][direction]);
 }
 return Math.max(0,edges-1);
}
test('all nonadjacent forward shortcuts in the two relays require too many turning points on one continuous branch',()=>{
 const maxTurns={linear:0,quadratic:1,cubic:2,reciprocal:0,exponential:0,logarithmic:0};
 for(const l of beyondGraphiverse.slice(10)){
  const slices=gateSlices(l),targets=[...l.cannons.map(c=>({id:c.id,position:c.position})),{id:'exit',position:l.exit}];
  for(const [i,c] of l.cannons.entries())for(let j=i+2;j<targets.length;j++){
   const target=targets[j];assert.equal(c.direction,1);assert.ok(target.position.x>c.position.x);
   // Wave is last in both routes, so no periodic-family shortcut is needed.
   if(c.type==='wave')throw new Error('Unexpected nonterminal wave');
   const s=c.position,t=target.position,eps=CAPTURE_EPSILON*2;
   const ordered=[{x:s.x,lo:s.y-eps,hi:s.y+eps},...slices.filter(z=>z.x>s.x&&z.x<t.x).sort((a,b)=>a.x-b.x),{x:t.x,lo:t.y-eps,hi:t.y+eps}];
   assert.ok(forcedTurns(ordered)>maxTurns[c.type],l.id+' bypass '+c.id+' -> '+target.id);
  }
 }
});
test('reflected logarithm and phase-shifted sine travel leftward on their actual graph',()=>{
 for(const i of [5,8]){
  const r=simulateRoute(beyondGraphiverse[i],plan(i)),leg=r.legs[0],e=advanced(i);
  assert.equal(r.event.kind,'exit');assert.equal(leg.direction,-1);assert.ok(leg.pointAt(.2).x>leg.pointAt(.8).x);
  near(leg.pointAt(.5).y,e.valueAt(leg.pointAt(.5).x));
 }
 const e=advanced(5);near(e.domainEdge(3.9,1)!.x,4);assert.equal(e.domainEdge(3.9,-1),undefined);
});
test('a tangent equation matching both anchors on different branches cannot complete the tunnel',()=>{
 const l=beyondGraphiverse[9],e=parseCannonEquation('2tan(pi*x*5/4)+2','wave') as AdvancedEquation;
 near(e.valueAt(-1),0);near(e.valueAt(1),4);
 const r=simulateAdvancedAttempt(e,l.cannons[0],l);
 assert.notEqual(r.event.kind,'exit');assert.ok(r.end.x<-.4);
});
test('equivalent bases and phases are accepted without a stored-answer comparison',()=>{
 const l=beyondGraphiverse[1],equivalent=parseCannonEquation('2^(3-x)','exponential');
 assert.equal(simulateRoute(l,new Map([['A',equivalent]])).event.kind,'exit');
 const w=beyondGraphiverse[7],alternative=parseCannonEquation('3sin(pi*x/3+pi/2)+2','wave');
 assert.equal(simulateRoute(w,new Map([['A',alternative]])).event.kind,'exit');
});
test('seven-family finale rapid fire preserves each leg, banks gems once and awards creature-based stars',()=>{
 const l=beyondGraphiverse[11],equations=plan(11),r=simulateRoute(l,equations),schedule=makeRapidSchedule(r,4);
 assert.equal(r.event.kind,'exit');assert.equal(r.legs.length,7);assert.equal(bankedGems(r).length,l.gems!.length);
 for(const [i,timing] of schedule.legs.entries()){
  const frame=sampleRapidFire(schedule.lead+timing.offset+timing.load+30,r,schedule);
  const pip=frame.pips.find(p=>p.index===0&&p.legIndex===i&&p.phase==='flying')!;assert.ok(pip);
  near(pip.point.y,evaluateCannonEquation(equations.get(r.legs[i].cannonId)!,pip.point.x));assert.equal(frame.arrived,0);
 }
 let s=beginAttempt(createLevelState(5),r);s=finishAttempt(s,s.active!.id);
 const id=s.celebration!.id,counts=rapidCounts(schedule.duration,schedule);s=advanceCelebration(s,id,counts.dispatched,counts.arrived);s=finishCelebration(s,id);
 assert.equal(s.saved,5);assert.equal(levelStars(s),3);assert.equal(bankedGems(s.lastResult).length,l.gems!.length);
});
