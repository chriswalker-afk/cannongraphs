import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PIP_RADIUS,pointRectangleDistance,segmentRectangleDistance} from '../src/engine/collisions/clearance';
import {terrainRect,floor,wall,platform,ceiling,narrowPassage,terrainDimensions} from '../src/levels/terrain';
import {assertAuthoredTerrain,auditLinearSolution} from '../src/levels/qa';
import {meadowPreview,meadowRelay} from '../src/levels/worlds/meadow';
import {wallPreview,archPreview,passagePreview,terrainPreviews} from '../src/levels/worlds/terrainPreviews';
import {validateLevel,type Level} from '../src/levels/schema';
import {simulateLinearRoute} from '../src/engine/simulation/linearRoute';
import {simulateLinearAttempt} from '../src/engine/simulation/linearAttempt';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {terrainInspection} from '../src/rendering/terrain';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,a+' != '+b);
const world={minX:-4,maxX:12,minY:-3,maxY:8};
const run=(level:Level,a:string,b?:string)=>simulateLinearRoute(level,new Map([['A',parseLinearEquation(a)],...(b?[['B',parseLinearEquation(b)] as const]:[])]));
const hit=(r:ReturnType<typeof run>,id:string)=>{assert.equal(r.event.kind,'obstacle');if(r.event.kind==='obstacle')assert.equal(r.event.obstacleId,id);};
test('reusable rectangles preserve exact world bounds and reject malformed geometry',()=>{
 assert.deepEqual(floor(world).bounds,{minX:-4,maxX:12,minY:-3,maxY:-2.6});
 assert.deepEqual(wall('w',-3,-2,-2.6,4).bounds,{minX:-3,maxX:-2,minY:-2.6,maxY:4});
 assert.equal(platform('p',1,2,2,3).kind,'platform');assert.equal(ceiling('c',1,3,5,8).kind,'ceiling');
 assert.throws(()=>floor(world,0));assert.throws(()=>floor(world,20));assert.throws(()=>wall('w',3,2,0,1));assert.throws(()=>terrainRect('exit','wall',world));assert.throws(()=>ceiling('c',0,1,0,Infinity));
});
test('a passage consists of two ordinary rectangles separated by a strictly traversable gap',()=>{
 const spec={minX:4,maxX:6,minY:0,maxY:8,gapBottom:3.6,gapTop:4.4};
 const [lower,upper]=narrowPassage('gate',spec);assert.deepEqual(lower.bounds,{minX:4,maxX:6,minY:0,maxY:3.6});assert.equal(upper.bounds.minY,4.4);
 assert.equal(lower.id,'gate-lower');assert.equal(upper.kind,'ceiling');
 assert.throws(()=>narrowPassage('gate',{...spec,gapBottom:3.8,gapTop:4.2}));assert.throws(()=>narrowPassage('gate',{...spec,gapBottom:5,gapTop:4}));
});
test('centreline clearance is exact for parallel, diagonal, intersecting and degenerate segments',()=>{
 const b={minX:2,maxX:3,minY:2,maxY:3};
 near(pointRectangleDistance({x:1,y:1},b),Math.SQRT2);
 near(segmentRectangleDistance({x:0,y:1.7},{x:5,y:1.7},b),.3);
 near(segmentRectangleDistance({x:0,y:0},{x:1,y:1},b),Math.SQRT2);
 near(segmentRectangleDistance({x:0,y:0},{x:4,y:4},b),0);
 near(segmentRectangleDistance({x:2.5,y:2.5},{x:2.5,y:2.5},b),0);
 near(segmentRectangleDistance({x:1,y:4},{x:3,y:6},b),Math.SQRT2);
});
test('all five authored previews have clear anchors and verified reference solutions',()=>{
 const fixtures:[Level,Record<string,string>,string[]][]=[
  [meadowPreview,{A:'x'},['A']],
  [meadowRelay,{A:'x',B:'8-3x/5'},['A','B']],
  [wallPreview,{A:'x'},['A']],
  [archPreview,{A:'3'},['A']],
  [passagePreview,{A:'x+1',B:'6'},['A','B']]
 ];
 for(const [level,reference,route] of fixtures){
  assert.doesNotThrow(()=>assertAuthoredTerrain(level));
  const audit=auditLinearSolution(level,reference,route);assert.equal(audit.result.event.kind,'exit');assert.ok(audit.minimumClearance>0,level.id);
 }
 near(auditLinearSolution(passagePreview,{A:'x+1',B:'6'}).minimumClearance, .2);
 assert.equal(new Set([meadowPreview,meadowRelay,...terrainPreviews].map(l=>l.id)).size,5);
});
test('wall, ceiling, platform and both passage sides block mathematically valid wrong paths',()=>{
 hit(run(wallPreview,'1'),'meadow-wall');
 hit(run(archPreview,'x/2+5/2'),'arch-roof');
 hit(run(archPreview,'16/5-x/5'),'arch-shelf');
 hit(run(passagePreview,'x+1','11/2+x/10'),'gate-upper');
 hit(run(passagePreview,'x+1','13/2-x/10'),'gate-lower');
 hit(run(passagePreview,'4x/9+14/9','6'),'gate-lower');
});
test('touching a passage edge fails even when the centreline fits',()=>{
 const bounds={minX:0,maxX:12,minY:0,maxY:8};
 const obstacles=[...narrowPassage('slot',{minX:4,maxX:6,minY:0,maxY:8,gapBottom:2.6,gapTop:3.4})];
 const level:Level={...wallPreview,bounds,obstacles,cannons:[{...wallPreview.cannons[0],position:{x:1,y:3}}],exit:{x:10,y:3}};
 assert.equal(run(level,'3').event.kind,'exit');
 for(const y of [2.8,3.2]){
  const tangent={...level,cannons:[{...level.cannons[0],position:{x:1,y}}],exit:{x:10,y}};
  assert.equal(simulateLinearAttempt(parseLinearEquation(String(y)),tangent.cannons[0],tangent).event.kind,'obstacle');
 }
});
test('authored QA catches blocked anchors, impossible reference and unintended bypasses',()=>{
 const bad={...wallPreview,obstacles:[...wallPreview.obstacles,wall('block',.9,1.1,.9,1.1)]};
 assert.throws(()=>assertAuthoredTerrain(bad),/touches/);
 assert.throws(()=>auditLinearSolution(wallPreview,{A:'1'}),/reference route failed/);
 assert.throws(()=>auditLinearSolution(meadowRelay,{A:'x'}),/missing reference/);
 assert.throws(()=>auditLinearSolution(meadowRelay,{A:'x',B:'8-3x/5'},['A']),/unexpected reference/);
 assert.throws(()=>validateLevel({...wallPreview,obstacles:[{...wallPreview.obstacles[0],kind:'water' as never}]}),/Invalid obstacle/);
});
test('inspection reports original rectangle bounds and dimensions, not artwork',()=>{
 const o=ceiling('roof',-2,3.5,4.25,8);
 assert.deepEqual(terrainDimensions(o),{width:5.5,height:3.75});
 assert.deepEqual(terrainInspection(o).lines,['x: [-2, 3.5]','y: [4.25, 8]','Width 5.5 · height 3.75']);
});
