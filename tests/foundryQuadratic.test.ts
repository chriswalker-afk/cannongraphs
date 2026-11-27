import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foundryQuadratic} from '../src/levels/foundryQuadratic';
import {foundryLevels,initialFoundryPlan,nextFoundryLevel} from '../src/levels/foundry';
import {validateLevel,type Level} from '../src/levels/schema';
import {levelSupports} from '../src/levels/supports';
import {parseLinearEquation} from '../src/engine/equations/linear';
import type {CannonEquation} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {repositionLift} from '../src/game/movableCannons';
import {snapshotPlan,countReady} from '../src/game/flightPlan';
import {lockedLiftEquation} from '../src/levels/liftSpec';
import {levels} from '../src/levels/catalog';

const reference:readonly {heights:number[];equations:Record<string,string>}[]=[
 {heights:[3],equations:{A:'x/4+2'}},
 {heights:[4],equations:{A:'6-x/2'}},
 {heights:[4,4],equations:{A:'x+1'}},
 {heights:[5],equations:{A:'x+1'}},
 {heights:[5,3,3],equations:{A:'x+2'}},
 {heights:[4,2],equations:{A:'2x/3+2',C:'15/2-x/2'}}
];
function* layouts(level:Level,index=0):Generator<Level>{
 const c=level.cannons[index];if(!c){yield level;return;}
 if(!c.lift){yield* layouts(level,index+1);return;}
 for(let y=c.lift.minY;y<=c.lift.maxY;y++){
  let next:Level;try{next=repositionLift(level,c.id,y);}catch{continue;}
  yield* layouts(next,index+1);
 }
}
// Every successful leg of a programmable straight-line cannon must reach
// a forward cannon or the exit. Enumerating those lines covers ALL possible
// successful programmable choices, not just the seeded equations.
function* programs(level:Level,index=0,chosen:ReadonlyMap<string,CannonEquation>=new Map()):Generator<ReadonlyMap<string,CannonEquation>>{
 const c=level.cannons[index];
 if(!c){yield chosen;return;}
 if(c.lift){yield* programs(level,index+1,chosen);return;}
 assert.equal(c.type,'linear');
 const a=c.position;
 for(const target of [...level.cannons.map(other=>other.position),level.exit]){
  const dx=target.x-a.x,dy=target.y-a.y;
  if(dx*c.direction<=0)continue;
  const line=parseLinearEquation('('+dy+'/'+dx+')*(x-('+a.x+'))+('+a.y+')');
  yield* programs(level,index+1,new Map([...chosen,[c.id,line]]));
 }
}
for(const [i,level] of foundryQuadratic.entries())test(level.title+' is solvable with exactly one lift layout, with no route shortcuts',()=>{
 validateLevel(level);levelSupports(level);
 const ref=reference[i],start=initialFoundryPlan(level),seeded=i<3;
 assert.equal(countReady(start),level.cannons.filter(c=>c.lift).length+(seeded?1:0));
 if(seeded)assert.notEqual(simulateRoute(level,snapshotPlan(start)!).event.kind,'exit');
 let solved=level;
 for(const [j,c] of level.cannons.filter(c=>c.lift).entries())solved=repositionLift(solved,c.id,ref.heights[j]);
 const equations=new Map(Object.entries(ref.equations).map(([id,line])=>[id,parseLinearEquation(line)]));
 const result=simulateRoute(solved,equations);
 assert.equal(result.event.kind,'exit');assert.deepEqual(result.legs.map(l=>l.cannonId),level.cannons.map(c=>c.id));
 // A preview or animation must not alter the actual locked coefficients.
 for(const c of solved.cannons.filter(c=>c.lift)){
  const expected=lockedLiftEquation(c);
  const source=level.cannons.find(a=>a.id===c.id)!;
  const original=lockedLiftEquation(source);
  if('quadratic' in expected&&'quadratic' in original){
   assert.deepEqual(expected.exactQuadratic,original.exactQuadratic);
   assert.deepEqual(expected.exactLinear,original.exactLinear);
   assert.ok(Math.abs(expected.constant-original.constant-(c.position.y-source.position.y))<1e-8);
  }
 }
 const winners=new Set<string>();
 for(const layout of layouts(level)){
  levelSupports(layout);
  for(const program of programs(layout)){
   const attempt=simulateRoute(layout,program);
   if(attempt.event.kind!=='exit')continue;
   assert.deepEqual(attempt.legs.map(l=>l.cannonId),level.cannons.map(c=>c.id),'No bypassed cannon');
   winners.add(layout.cannons.filter(c=>c.lift).map(c=>c.position.y).join(','));
  }
 }
 assert.deepEqual([...winners],[ref.heights.join(',')]);
});
test('twelve Foundry puzzles advance across the linear/quadratic boundary without changing the 72 curriculum levels',()=>{
 assert.equal(foundryLevels.length,12);assert.equal(levels.length,72);
 assert.equal(new Set(foundryLevels.map(l=>l.id)).size,12);
 assert.ok(foundryLevels.every(l=>!levels.some(c=>c.id===l.id)));
 for(let i=0;i<11;i++)assert.equal(nextFoundryLevel(foundryLevels[i].id),foundryLevels[i+1]);
 assert.equal(nextFoundryLevel(foundryLevels[11].id),undefined);
 assert.equal(nextFoundryLevel('lift-demo-arc'),undefined);
});
