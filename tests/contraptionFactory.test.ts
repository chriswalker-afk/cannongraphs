import {test} from 'node:test';
import {referenceSolutions} from './fixtures/referenceSolutions';
import assert from 'node:assert/strict';
import {contraptionFactory} from '../src/levels/worlds/contraptionFactory';
import {worlds,levels,nextLevel,levelPosition,worldForLevel} from '../src/levels/catalog';
import type {Level} from '../src/levels/schema';
import {parseCannonEquation,isAdvanced,evaluateCannonEquation,type CannonEquation,type AdvancedEquation} from '../src/engine/equations/advanced';
import {auditSolution} from '../src/levels/qa';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {simulateAdvancedAttempt} from '../src/engine/simulation/advancedAttempt';
import {bankedGems} from '../src/animations/gemTimeline';
import {makeRapidSchedule,sampleRapidFire,rapidCounts} from '../src/animations/rapidFire';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {levelStars} from '../src/game/scoring';
const refs=referenceSolutions[4];
const plan=(i:number)=>new Map<string,CannonEquation>(contraptionFactory[i].cannons.map(c=>[c.id,parseCannonEquation(refs[i][c.id],c.type)]));
const near=(a:number,b:number,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,a+' != '+b);
const advanced=(i:number,id='A')=>{const e=plan(i).get(id)!;assert.ok(isAdvanced(e));return e;};
test('World 5 contains twelve unlocked levels and replaces the engine preview',()=>{
 assert.equal(worlds.slice(0,5).flatMap(w=>w.levels).length,60);
 assert.equal(worlds[4].name,'Contraption Factory');assert.equal(nextLevel(worlds[3].levels.at(-1)!.id),contraptionFactory[0]);
 assert.equal(new Set(levels.map(l=>l.id)).size,levels.length);
 assert.deepEqual(contraptionFactory.map(l=>l.id),Array.from({length:12},(_,i)=>'5-'+String(i+1).padStart(2,'0')));
 assert.deepEqual(contraptionFactory.map(l=>l.cannons.length),[1,1,1,1,1,1,1,1,1,1,2,4]);
 for(const [i,l] of contraptionFactory.entries()){
  assert.equal(l.creatures,5);assert.equal(worldForLevel(l.id),worlds[4]);assert.deepEqual(levelPosition(l.id),{index:i+1,total:12});
  assert.equal(nextLevel(l.id),contraptionFactory[i+1]??worlds[5]?.levels[0]);
 }
});
test('curriculum moves from genuine cubics through translated reciprocal branches to mixed routes',()=>{
 assert.ok(contraptionFactory.slice(0,6).every(l=>l.cannons[0].type==='cubic'));
 assert.ok(contraptionFactory.slice(6,10).every(l=>l.cannons[0].type==='reciprocal'));
 const cubic=advanced(4);for(const root of [-3,0,3])near(cubic.valueAt(root),0);
 assert.equal(cubic.criticalXs(-3,3).length,2);
 const shifted=advanced(5);assert.deepEqual(shifted.criticalXs(-3,5),[-1,3]);
 near(shifted.valueAt(-1),5);near(shifted.valueAt(3),-3);
 assert.equal(contraptionFactory[9].cannons[0].direction,-1);
 assert.deepEqual(contraptionFactory[11].cannons.map(c=>c.type),['cubic','reciprocal','cubic','linear']);
});
for(const [i,l] of contraptionFactory.entries())test(l.id+' '+l.title+' has a continuous clear reference route and collectible gems',()=>{
 const audit=auditSolution(l,refs[i],l.cannons.map(c=>c.id));
 assert.equal(audit.result.event.kind,'exit');near(audit.result.end.x,l.exit.x);near(audit.result.end.y,l.exit.y);
 assert.ok(audit.minimumClearance>.025,l.id+' clearance '+audit.minimumClearance);
 assert.equal(bankedGems(audit.result).length,l.gems?.length??0);
 const equations=plan(i);
 for(const leg of audit.result.legs){
  const e=equations.get(leg.cannonId)!;
  for(const t of [0,.1,.3,.5,.8,1]){const p=leg.pointAt(t);near(p.y,evaluateCannonEquation(e,p.x));}
 }
});
// Read the actual solid bounds, rather than duplicating the gate heights.
// A flight must pass through this opening at the shared x-slice. Ignoring
// the Pip radius only relaxes the constraint, making the proof conservative.
type Interval=readonly [number,number];
function gap(l:Level,id:string):Interval{
 const a=l.obstacles.find(o=>o.id===id+'-lower')!.bounds,b=l.obstacles.find(o=>o.id===id+'-upper')!.bounds;
 assert.equal(a.minX,b.minX);assert.equal(a.maxX,b.maxX);assert.equal(a.minY,l.bounds.minY+.4);assert.equal(b.maxY,l.bounds.maxY);
 return [a.maxY,b.minY];
}
const fixed=(y:number):Interval=>[y,y];
function orderedGates(l:Level,from:number,to:number,ids:readonly string[]){
 let previous=from;
 for(const id of ids){const b=l.obstacles.find(o=>o.id===id+'-lower')!.bounds;const x=(b.minX+b.maxX)/2;assert.ok(x>previous&&x<to,id);previous=x;}
}
function alternating(ys:readonly Interval[]){
 assert.ok(ys.length>=5);
 for(let i=1;i<ys.length;i++){
  const a=ys[i-1],b=ys[i];
  assert.ok(i%2?a[1]<b[0]:a[0]>b[1],'Expected separated alternating intervals '+i);
 }
 // Four consecutive opposite-sign changes require at least three distinct
 // zeros of the derivative, by the mean value theorem and continuity.
}
test('nonadjacent cubic shortcuts require more turning points than a genuine cubic can have',()=>{
 const relay=contraptionFactory[10],finale=contraptionFactory[11];
 alternating([fixed(relay.cannons[0].position.y),gap(relay,'upper-press'),gap(relay,'lower-press'),gap(relay,'pressure-slot'),fixed(relay.exit.y)]);
 orderedGates(relay,relay.cannons[0].position.x,relay.exit.x,['upper-press','lower-press','pressure-slot']);
 orderedGates(finale,finale.cannons[0].position.x,finale.cannons[2].position.x,['upper-press','lower-press','pressure-slot','return-pressure']);
 orderedGates(finale,finale.cannons[2].position.x,finale.exit.x,['second-upper','second-lower','finishing-high']);
 // Every target beyond B lies past the return-pressure slice, so all
 // A->C, A->D and A->exit paths encounter the same contradiction.
 alternating([fixed(finale.cannons[0].position.y),gap(finale,'upper-press'),gap(finale,'lower-press'),gap(finale,'pressure-slot'),gap(finale,'return-pressure')]);
 alternating([fixed(finale.cannons[2].position.y),gap(finale,'second-upper'),gap(finale,'second-lower'),gap(finale,'finishing-high'),fixed(finale.exit.y)]);
 assert.ok(finale.cannons[2].position.x>finale.obstacles.find(o=>o.id==='return-pressure-upper')!.bounds.maxX);
});
test('a reciprocal branch cannot bypass the second cubic and reach later targets',()=>{
 const l=contraptionFactory[11],start=l.cannons[1].position.y;
 assert.ok(gap(l,'pressure-slot')[1]<start);
 assert.ok(gap(l,'second-upper')[0]>gap(l,'pressure-slot')[1]);
 // The second-upper slice occurs before D and the exit. A transformed
 // reciprocal is strictly monotone on each connected domain branch.
 orderedGates(l,l.cannons[1].position.x,l.cannons[3].position.x,['pressure-slot','second-upper']);
 const e=advanced(11,'B');assert.ok(e.slopeAt(5)<0);assert.ok(e.slopeAt(12)<0);
});
test('reverse reciprocal travels leftward without crossing its shifted asymptote',()=>{
 const l=contraptionFactory[9],r=simulateRoute(l,plan(9)),e=advanced(9),leg=r.legs[0];
 assert.equal(r.event.kind,'exit');assert.equal(leg.direction,-1);assert.ok(leg.pointAt(.2).x>leg.pointAt(.8).x);
 near(leg.pointAt(.5).y,-1);assert.ok(leg.angleAt!(.5)<0);
 assert.equal(e.domainEdge(5,-1)!.x,-1);
 const wrong=simulateAdvancedAttempt(parseCannonEquation('12/(x+1)-2','reciprocal') as AdvancedEquation,l.cannons[0],l);
 assert.notEqual(wrong.event.kind,'exit');
});
test('another valid cubic through the introductory anchors succeeds without requiring the reference equation',()=>{
 const l=contraptionFactory[0],e=parseCannonEquation('x³+(x+1)(x-2)/4','cubic');
 const r=simulateRoute(l,new Map([['A',e]]));assert.equal(r.event.kind,'exit');
});
test('a cubic with insufficient turning-point height fails at the upper press',()=>{
 const l=contraptionFactory[10],e=parseCannonEquation('x³/16','cubic') as AdvancedEquation;
 const r=simulateAdvancedAttempt(e,l.cannons[0],l);assert.equal(r.event.kind,'obstacle');
 if(r.event.kind==='obstacle')assert.equal(r.event.obstacleId,'upper-press-lower');
});
test('finale rapid-fire follows all four legs across three families, retaining gems and creature-based scoring',()=>{
 const l=contraptionFactory[11],equations=plan(11),r=simulateRoute(l,equations),schedule=makeRapidSchedule(r,4);
 assert.equal(r.event.kind,'exit');assert.equal(r.legs.length,4);assert.equal(bankedGems(r).length,l.gems!.length);
 for(const [i,timing] of schedule.legs.entries()){
  const f=sampleRapidFire(schedule.lead+timing.offset+timing.load+30,r,schedule);
  const pip=f.pips.find(p=>p.index===0&&p.legIndex===i&&p.phase==='flying')!;assert.ok(pip);
  near(pip.point.y,evaluateCannonEquation(equations.get(r.legs[i].cannonId)!,pip.point.x));assert.equal(f.arrived,0);
 }
 let s=beginAttempt(createLevelState(5),r);s=finishAttempt(s,s.active!.id);
 const id=s.celebration!.id,counts=rapidCounts(schedule.duration,schedule);s=advanceCelebration(s,id,counts.dispatched,counts.arrived);s=finishCelebration(s,id);
 assert.equal(s.saved,5);assert.equal(levelStars(s),3);assert.equal(bankedGems(s.lastResult).length,l.gems!.length);
});
