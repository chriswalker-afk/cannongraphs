import {test} from 'node:test';
import assert from 'node:assert/strict';
import {worlds,levels} from '../src/levels/catalog';
import type {Level} from '../src/levels/schema';
import {cannonTypes} from '../src/game/cannons';
import {CAPTURE_EPSILON} from '../src/engine/simulation/linearAttempt';
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

test('advanced relays force every nonadjacent forward shortcut beyond the function family turning-point limit',()=>{
 const maxTurns={linear:0,quadratic:1,cubic:2,reciprocal:0,exponential:0,logarithmic:0};
 let checked=0;
 for(const w of worlds.slice(4,6))for(const l of w.levels.slice(3)){
  const slices=gateSlices(l),targets=[...l.cannons.map(c=>({id:c.id,position:c.position})),{id:'exit',position:l.exit}];
  for(const [i,c] of l.cannons.entries())for(let j=i+2;j<targets.length;j++){
   const t=targets[j].position,s=c.position;if((t.x-s.x)*c.direction<=0)continue;
   if(c.type==='wave')throw Error(l.id+' unexpected nonterminal wave');
   const eps=CAPTURE_EPSILON*2;
   const ordered=[{x:s.x,lo:s.y-eps,hi:s.y+eps},...slices.filter(z=>(z.x-s.x)*c.direction>0&&(t.x-z.x)*c.direction>0).sort((a,b)=>(a.x-b.x)*c.direction),{x:t.x,lo:t.y-eps,hi:t.y+eps}];
   assert.ok(forcedTurns(ordered)>maxTurns[c.type],l.id+' bypass '+c.id+' -> '+targets[j].id+' (turns '+forcedTurns(ordered)+')');
   checked++;
  }
 }
 assert.ok(checked>=60);
});
test('the original six worlds retain the exact 3-3-3-3 curriculum; all seven families appear in the final three levels',()=>{
 assert.equal(levels.length,96);assert.equal(levels.filter(l=>l.world<=6).reduce((n,l)=>n+l.cannons.length,0),180);
 for(const w of worlds.slice(0,6))assert.deepEqual(w.levels.map(l=>l.cannons.length),[1,1,1,2,2,2,3,3,3,4,4,4]);
 assert.deepEqual(worlds[4].levels.filter(l=>!l.id.includes('-r')).map(l=>l.id),['5-01','5-02','5-07','5-11','5-12']);
 assert.deepEqual(worlds[5].levels.filter(l=>!l.id.includes('-r')).map(l=>l.id),['6-01','6-04','6-07','6-11']);
 assert.deepEqual(new Set(worlds[5].levels.slice(9).flatMap(l=>l.cannons.map(c=>c.type))),new Set(Object.keys(cannonTypes)));
});
