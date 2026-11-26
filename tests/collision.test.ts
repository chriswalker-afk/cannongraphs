import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {simulateLinearAttempt,PIP_RADIUS} from '../src/engine/simulation/linearAttempt';
import {sweepDiskRectangle} from '../src/engine/collisions/sweep';
import {meadowPreview} from '../src/levels/worlds/meadow';
import type {Level,Obstacle} from '../src/levels/schema';
import {sampleAttempt,flightDuration,attemptDuration} from '../src/animations/attempt';
import {FIRE_MS} from '../src/animations/launch';
import {attemptFeedback} from '../src/game/attemptFeedback';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
const c=meadowPreview.cannons[0],run=(equation:string,level:Level=meadowPreview)=>simulateLinearAttempt(parseLinearEquation(equation),level.cannons[0],level);
test('actual meadow solution reaches exact exit with clearance',()=>{
 const r=run('y=x');assert.equal(r.event.kind,'exit');assert.deepEqual(r.end,{x:6,y:6});
 near(r.length,Math.sqrt(50));const p=r.pointAt(.3);near(p.y,p.x);near(r.angle,45);
});
test('incorrect launch point never teleports a creature onto its equation',()=>{
 const r=run('x+1');assert.equal(r.event.kind,'misfire');assert.deepEqual(r.end,c.position);assert.equal(r.length,0);assert.match(attemptFeedback(r),/not 1/);
 assert.equal(sampleAttempt(FIRE_MS,r).trace,null);
});
test('continuous collision stops at first floor contact with creature clearance',()=>{
 const r=run('2-x');assert.equal(r.event.kind,'obstacle');if(r.event.kind==='obstacle')assert.equal(r.event.obstacleId,'floor');
 near(r.end.y,.4+PIP_RADIUS);near(r.end.x,2-r.end.y);assert.ok(r.pointAt(.5).y>r.end.y);
});
test('thin obstacles cannot be skipped and nearest event wins regardless of array order',()=>{
 const wall=(id:string,x:number):Obstacle=>({id,kind:'wall',bounds:{minX:x,maxX:x+.001,minY:0,maxY:8}});
 const l={...meadowPreview,obstacles:[wall('far',4),wall('near',2)]};
 const r=run('x',l);assert.equal(r.event.kind,'obstacle');if(r.event.kind==='obstacle')assert.equal(r.event.obstacleId,'near');near(r.end.x,2-PIP_RADIUS);
});
test('disk corner contact is rounded, not an inflated square',()=>{
 const b={minX:2,maxX:3,minY:2,maxY:3};
 assert.equal(sweepDiskRectangle({x:0,y:1.79},{x:1,y:0},.2,b,5),null);
 const h=sweepDiskRectangle({x:0,y:1.85},{x:1,y:0},.2,b,5)!;near(h.center.x,2-Math.sqrt(.04-.0225));near(h.center.y,1.85);
 const tangent=sweepDiskRectangle({x:0,y:1.8},{x:1,y:0},.2,b,5)!;near(tangent.center.x,2);
});
test('no broad portal hitbox accepts a mathematically wrong graph',()=>{
 const r=run('1.01x-.01',{...meadowPreview,obstacles:[]});assert.equal(r.event.kind,'boundary');near(r.end.y,8);near(r.end.y,1.01*r.end.x-.01);
});
test('horizontal and reverse directions, steep lines and boundary exit tie',()=>{
 const l={...meadowPreview,obstacles:[],exit:{x:0,y:1},cannons:[{...c,direction:-1 as const}]};
 const r=run('1',l);assert.equal(r.event.kind,'exit');near(r.end.x,0);near(r.end.y,1);
 const steep=run('1000x-999',{...meadowPreview,obstacles:[]});assert.equal(steep.event.kind,'boundary');near(steep.end.y,8);
});
test('solid obstacle at destination defeats capture',()=>{
 const l={...meadowPreview,obstacles:[{id:'blocking',kind:'wall' as const,bounds:{minX:6.2,maxX:7,minY:0,maxY:8}}]};
 assert.equal(run('x',l).event.kind,'obstacle');
});
test('animation shows no graph before launch and samples the computed line until the exact event',()=>{
 const r=run('x');assert.equal(sampleAttempt(FIRE_MS-1,r).trace,null);
 const f=sampleAttempt(FIRE_MS+flightDuration(r)/2,r);assert.ok(f.trace);near(f.pip!.x,f.pip!.y);assert.equal(f.resolved,false);
 const end=sampleAttempt(FIRE_MS+flightDuration(r),r);assert.deepEqual(end.trace,r.end);assert.equal(end.resolved,true);
 assert.equal(sampleAttempt(attemptDuration(r),r).opacity,0);
 const fail=run('2-x');assert.equal(sampleAttempt(attemptDuration(fail)-1,fail).pose,'splat');
 assert.deepEqual(sampleAttempt(FIRE_MS+1,r,true).trace,r.end);
});
