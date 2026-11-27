import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foundryLinear,foundryStartPlan,nextFoundryLinear} from '../src/levels/foundryLinear';
import {validateLevel,type Level} from '../src/levels/schema';
import {levelSupports} from '../src/levels/supports';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {repositionLift} from '../src/game/movableCannons';
import {snapshotPlan,editPlan,countReady} from '../src/game/flightPlan';
import {levels} from '../src/levels/catalog';
const reference=[
 {heights:[2],line:'2'}, {heights:[6],line:'x+2'}, {heights:[3],line:'x/2+1'},
 {heights:[5,2],line:'x+2'}, {heights:[6],line:'x+2'}, {heights:[6,2],line:'x+3'}
];
function* layouts(level:Level,index=0):Generator<Level>{
 const c=level.cannons[index];if(!c){yield level;return;}
 if(!c.lift){yield* layouts(level,index+1);return;}
 for(let y=c.lift.minY;y<=c.lift.maxY;y++){
  let next:Level;try{next=repositionLift(level,c.id,y);}catch{continue;}
  yield* layouts(next,index+1);
 }
}
for(const [i,level] of foundryLinear.entries())test(level.title+' has one successful lift layout and no skipped-cannon shortcut',()=>{
 validateLevel(level);
 const ref=reference[i],start=foundryStartPlan(level),seeded=i<4;
 assert.equal(countReady(start),level.cannons.length-(seeded?0:1));
 if(seeded)assert.notEqual(simulateRoute(level,snapshotPlan(start)!).event.kind,'exit');
 let solved=level;
 for(const [j,c] of level.cannons.filter(c=>c.lift).entries())solved=repositionLift(solved,c.id,ref.heights[j]);
 const result=simulateRoute(solved,new Map([['A',parseLinearEquation(ref.line)]]));
 assert.equal(result.event.kind,'exit');assert.deepEqual(result.legs.map(l=>l.cannonId),level.cannons.map(c=>c.id));
 const winners=new Set<string>();
 // A straight line can reach a marked destination only if it is the
 // unique line through its source and that target. Enumerate every legal
 // lift placement and every possible first destination, including exit.
 for(const layout of layouts(level)){
  levelSupports(layout);
  const a=layout.cannons[0].position;
  for(const target of [...layout.cannons.slice(1).map(c=>c.position),layout.exit]){
   const dx=target.x-a.x,dy=target.y-a.y;
   const line=parseLinearEquation('('+dy+'/'+dx+')*(x-('+a.x+'))+('+a.y+')');
   const attempt=simulateRoute(layout,new Map([['A',line]]));
   if(attempt.event.kind!=='exit')continue;
   assert.deepEqual(attempt.legs.map(l=>l.cannonId),level.cannons.map(c=>c.id),'No bypassed cannon');
   winners.add(layout.cannons.filter(c=>c.lift).map(c=>c.position.y).join(','));
  }
 }
 assert.deepEqual([...winners],[ref.heights.join(',')]);
});
test('Foundry stays separate from existing curriculum and progression stops at the sixth linear puzzle',()=>{
 assert.equal(levels.length,72);
 assert.equal(foundryLinear.length,6);
 assert.ok(foundryLinear.every(l=>!levels.some(other=>other.id===l.id)));
 assert.equal(nextFoundryLinear(foundryLinear[0].id),foundryLinear[1]);
 assert.equal(nextFoundryLinear(foundryLinear[5].id),undefined);
 assert.equal(nextFoundryLinear('lift-demo-linear'),undefined);
});
