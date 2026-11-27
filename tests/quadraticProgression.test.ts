import {test} from 'node:test';
import assert from 'node:assert/strict';
import {worlds,levels} from '../src/levels/catalog';
import type {Level} from '../src/levels/schema';
import type {Point} from '../src/engine/coordinates';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {simulateLinearAttempt} from '../src/engine/simulation/linearAttempt';
// Conservative necessary constraints: ignore the Pip radius, allow touching
// boundaries and check only selected slices of the actual authored geometry.
// A direct quadratic through the two anchors is chord(x)+a(x-sx)(x-tx).
// If even these relaxed coefficient intervals have empty intersection, no
// exact quadratic through those anchors can make the skipped journey.
type Interval=[number,number];
function openHeights(l:Level,x:number):Interval[]{
 let ranges:Interval[]=[[l.bounds.minY,l.bounds.maxY]];
 for(const {bounds:b} of l.obstacles)if(x>=b.minX&&x<=b.maxX){
  ranges=ranges.flatMap(([lo,hi])=>{
   if(b.maxY<=lo||b.minY>=hi)return [[lo,hi] as Interval];
   const out:Interval[]=[];if(lo<b.minY)out.push([lo,b.minY]);if(b.maxY<hi)out.push([b.maxY,hi]);return out;
  });
 }
 return ranges;
}
function possibleCoefficients(l:Level,s:Point,t:Point,slices:number[]):Interval[]{
 let ranges:Interval[]=[[-Infinity,Infinity]];
 for(const x of slices){
  if(x<=Math.min(s.x,t.x)||x>=Math.max(s.x,t.x))continue;
  const k=(x-s.x)*(x-t.x),chord=s.y+(t.y-s.y)*(x-s.x)/(t.x-s.x);
  const allowed:Interval[]=openHeights(l,x).map(([lo,hi])=>[(hi-chord)/k,(lo-chord)/k]);
  ranges=ranges.flatMap(([lo,hi])=>allowed.map(([a,b]):Interval=>[Math.max(lo,a),Math.min(hi,b)]).filter(([a,b])=>a<=b+1e-10));
 }
 return ranges;
}

test('all quadratic-world relays prevent direct forward skips by actual geometry, not hidden route rules',()=>{
 let quadraticSkips=0,linearSkips=0;
 for(const world of worlds.slice(2,4))for(const l of world.levels.slice(3)){
  const slices=[...new Set(l.obstacles.flatMap(o=>[(o.bounds.minX+o.bounds.maxX)/2,o.bounds.minX,o.bounds.maxX]))];
  const targets=[...l.cannons.map(c=>({id:c.id,position:c.position})),{id:'exit',position:l.exit}];
  for(const [i,c] of l.cannons.entries())for(let j=i+2;j<targets.length;j++){
   const t=targets[j],dx=t.position.x-c.position.x,dy=t.position.y-c.position.y;
   if(dx*c.direction<=0)continue;
   if(c.type==='quadratic'){
    quadraticSkips++;
    assert.deepEqual(possibleCoefficients(l,c.position,t.position,slices),[],l.id+' bypass '+c.id+' -> '+t.id);
   }else{
    linearSkips++;
    const e=parseLinearEquation('('+dy+'*(x-('+c.position.x+')))/('+dx+')+('+c.position.y+')'),r=simulateLinearAttempt(e,c,l);
    assert.ok(t.id==='exit'?r.event.kind!=='exit':r.event.kind!=='cannon'||r.event.cannonId!==t.id,l.id+' bypass '+c.id+' -> '+t.id);
   }
  }
 }
 assert.ok(quadraticSkips>=30);assert.ok(linearSkips>=3);
});
test('retained puzzle IDs are reserved for unchanged puzzles; all new relays have distinct IDs',()=>{
 assert.deepEqual(worlds[2].levels.filter(l=>!l.id.includes('-r')).map(l=>l.id),['3-01','3-02','3-03','3-11','3-12']);
 assert.deepEqual(worlds[3].levels.filter(l=>!l.id.includes('-r')).map(l=>l.id),['4-01','4-02','4-05','4-10','4-11']);
 assert.equal(levels.length,84);
 for(const w of worlds.slice(0,4))assert.deepEqual(w.levels.map(l=>l.cannons.length),[1,1,1,2,2,2,3,3,3,4,4,4]);
});
