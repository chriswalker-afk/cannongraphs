import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCannonEquation,isAdvanced,equationFamily,cannonEquationKey,type AdvancedEquation,type CannonEquation} from '../src/engine/equations/advanced';
import {EquationError} from '../src/engine/equations/linear';
import {graphSegment} from '../src/engine/trajectories/graph';
import {sweepGraphDisk,graphRectangleClearance} from '../src/engine/collisions/graphSweep';
import {simulateAdvancedAttempt} from '../src/engine/simulation/advancedAttempt';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {auditSolution} from '../src/levels/qa';
import {factoryPreview,universePreview} from '../src/levels/worlds/advancedPreviews';
import {worlds,nextLevel,levels} from '../src/levels/catalog';
import {flightPath} from '../src/rendering/flightPath';
import {collectRouteGems} from '../src/engine/simulation/gemContacts';
import {sampleAttempt,flightDuration} from '../src/animations/attempt';
import {FIRE_MS} from '../src/animations/launch';
import {makeRapidSchedule,sampleRapidFire,rapidCounts} from '../src/animations/rapidFire';
import {diagnoseFlight} from '../src/game/flightDiagnosis';
import {attemptFeedback} from '../src/game/attemptFeedback';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {levelStars} from '../src/game/scoring';
import type {CannonType} from '../src/game/cannons';
import type {Level} from '../src/levels/schema';
const near=(a:number,b:number,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,a+' != '+b);
function parse(input:string,family:CannonType):AdvancedEquation{
 const e=parseCannonEquation(input,family);assert.ok(isAdvanced(e));return e;
}
function single(e:AdvancedEquation,x:number,y:number,tx:number,ty:number,direction:1|-1=1,bounds={minX:-10,maxX:10,minY:-10,maxY:10}):Level{
 return {id:'advanced-test',world:5,title:'Test',objective:'Test',bounds,creatures:5,startId:'A',cannons:[{id:'A',type:e.family,position:{x,y},direction}],exit:{x:tx,y:ty},obstacles:[]};
}
test('genuine cubic uses exact rational polynomial normalization',()=>{
 const a=parse('(x-1)(x+2)(x-3)/2','cubic'),b=parse('(x³-2x²-5x+6)/2','cubic');
 assert.equal(cannonEquationKey(a),cannonEquationKey(b));
 near(a.valueAt(1),0);near(a.valueAt(3),0);near(a.valueAt(-2),0);
 assert.equal(a.criticalXs(-5,5).length,2);
 assert.throws(()=>parse('x³-x³+x²','cubic'),EquationError);
});
test('transformed standard families, constants, implicit products and radian arguments',()=>{
 const recip=parse('6/(x-3)+2','reciprocal');near(recip.valueAt(5),5);near(recip.valueAt(9),3);near(recip.slopeAt(5),-1.5);
 near(parse('3(x+2)^(-1)-1','reciprocal').valueAt(1),0);
 near(parse('2^(x-1)+1','exponential').valueAt(3),5);
 near(parse('3e^(x/2)-2','exponential').valueAt(0),1);
 near(parse('2exp(-x)+1','exponential').valueAt(0),3);
 near(parse('ln(x-2)+5','logarithmic').valueAt(3),5);
 near(parse('log(x-2)+5','logarithmic').valueAt(12),6);
 near(parse('2sin(π(x-12)/2)+6','wave').valueAt(13),8);
 near(parse('cos(pi*x)','wave').valueAt(1),-1);
 near(parse('tan(pi*x/4)','wave').valueAt(1),1);
});
test('unsupported expressions and unsafe inputs are rejected, not executed',()=>{
 for(const [s,f] of [['x²','cubic'],['1/(x²+1)','reciprocal'],['1/(x-x)','reciprocal'],['0/x','reciprocal'],['(-2)^x','exponential'],['1^x','exponential'],['x^x','exponential'],['ln(x²)','logarithmic'],['sin(x)+cos(x)','wave'],['sin(100x)','wave'],['sin(x);alert(1)','wave'],['sin(','wave'],['1/x','wave']] as const)assert.throws(()=>parse(s,f),EquationError,s);
 assert.equal(equationFamily(parseCannonEquation('x','linear')),'linear');
});
test('reciprocal branches never bridge a pole in either direction',()=>{
 const e=parse('1/x','reciprocal');
 for(const direction of [1,-1] as const){
  const l=single(e,-direction,-direction,direction,direction,direction),r=simulateAdvancedAttempt(e,l.cannons[0],l);
  assert.equal(r.event.kind,'boundary');assert.ok(r.end.x*direction<0);near(Math.abs(r.end.y),10);
  for(let i=0;i<=20;i++)assert.ok(r.pointAt(i/20).x*direction<0);
 }
 const l=single(e,1,1,2,.5),r=simulateAdvancedAttempt(e,l.cannons[0],l);assert.equal(r.event.kind,'exit');
});
test('logarithm handles positive argument and reflected domain; undefined launch is a misfire',()=>{
 const e=parse('ln(-x)','logarithmic'),l=single(e,-1,0,1,0);
 const r=simulateAdvancedAttempt(e,l.cannons[0],l);assert.equal(r.event.kind,'boundary');assert.ok(r.end.x<0);near(r.end.y,-10);
 const bad=single(e,0,0,-1,0,-1),mis=simulateRoute(bad,new Map([['A',e]]));
 assert.equal(mis.event.kind,'misfire');if(mis.event.kind==='misfire')assert.equal(mis.event.undefinedAtSource,true);
 assert.match(attemptFeedback(mis),/undefined/);assert.equal(diagnoseFlight(bad,mis,new Map([['A',e]]))!.kind,'domain');
 assert.equal(sampleAttempt(FIRE_MS+100,mis.legs[0]).pose,'rolling');
});
test('tan asymptotes stop travel and cannot capture a point on the next branch',()=>{
 const e=parse('tan(x)','wave'),l=single(e,0,0,Math.PI,0),r=simulateAdvancedAttempt(e,l.cannons[0],l);
 assert.equal(r.event.kind,'boundary');assert.ok(r.end.x<Math.PI/2);near(r.end.y,10);
 const reverse=single(e,Math.PI,0,0,0,-1),rr=simulateAdvancedAttempt(e,reverse.cannons[0],reverse);
 assert.equal(rr.event.kind,'boundary');assert.ok(rr.end.x>Math.PI/2);near(rr.end.y,-10);
 const bad=single(e,Math.PI/2,0,Math.PI,0);assert.equal(simulateAdvancedAttempt(e,bad.cannons[0],bad).event.kind,'misfire');
});
test('multiple wave extrema catch the first boundary, even when endpoints are inside',()=>{
 const e=parse('2sin(pi*x)','wave'),l=single(e,0,0,4,0,1,{minX:-1,maxX:5,minY:-3,maxY:1});
 const r=simulateAdvancedAttempt(e,l.cannons[0],l);assert.equal(r.event.kind,'boundary');near(r.end.x,1/6);near(r.end.y,1);
 const s=graphSegment(e,0,4);assert.equal(s.knots.length,6);
});
test('exponential overflow cannot escape world clipping or produce nonfinite frames',()=>{
 const e=parse('exp(1000x)','exponential'),l=single(e,0,1,5,2);
 const r=simulateAdvancedAttempt(e,l.cannons[0],l);assert.equal(r.event.kind,'boundary');near(r.end.x,Math.log(10)/1000);
 assert.ok(Number.isFinite(r.length));near(r.pointAt(1).y,10);
});
test('continuous advanced sweep catches a thin obstacle and an exact tangent, with a nearby miss',()=>{
 const e=parse('sin(pi*x/2)','wave'),s=graphSegment(e,0,2);
 const thin={minX:.734,maxX:.73401,minY:-2,maxY:2};
 const hit=sweepGraphDisk(s,.2,thin)!;assert.ok(hit&&!hit.uncertain);near(hit.center.x,.534,2e-6);
 const tangent={minX:.9,maxX:1.1,minY:1.2,maxY:1.5};
 const touch=sweepGraphDisk(s,.2,tangent)!;assert.ok(touch&&!touch.uncertain);near(touch.center.y,1,2e-6);
 assert.equal(sweepGraphDisk(s,.2,{...tangent,minY:1.20001}),null);
 assert.ok(graphRectangleClearance(s,.2,{...tangent,minY:1.3})>.0999);
});
test('curves can clear a solid intersecting their chord; obstacle contact wins a capture tie',()=>{
 const e=parse('sin(pi*x/2)','wave'),l=single(e,0,0,2,0);
 l.obstacles=[{id:'low',kind:'wall',bounds:{minX:.9,maxX:1.1,minY:-2,maxY:.5}}];
 assert.equal(simulateAdvancedAttempt(e,l.cannons[0],l).event.kind,'exit');
 l.obstacles=[{id:'tie',kind:'wall',bounds:{minX:2.2,maxX:3,minY:-2,maxY:2}}];
 const r=simulateAdvancedAttempt(e,l.cannons[0],l);assert.equal(r.event.kind,'obstacle');near(r.end.x,2,2e-6);
});
test('advanced gems follow the actual curve, not the chord, and the trace is curved',()=>{
 const e=parse('sin(pi*x/2)','wave'),l=single(e,0,0,2,0),r=simulateAdvancedAttempt(e,l.cannons[0],l);
 const hits=collectRouteGems([{id:'curve',position:{x:1,y:1}},{id:'chord',position:{x:1,y:0}}],[r]);
 assert.deepEqual(hits.map(h=>h.gemId),['curve']);
 assert.ok(flightPath(r,r.start,r.end,p=>({x:40*p.x,y:40*p.y})).split(' L').length>3);
 const f=sampleAttempt(FIRE_MS+flightDuration(r)/2,r);near(f.pip!.y,1);near(f.tilt,0);
});
const factoryRefs={A:'(x-3)^3/4+3',B:'6/(x-3)+2'},universeRefs={A:'2^(x-1)+1',B:'log(x-2)+5',C:'2sin(pi(x-12)/2)+6'};
function solve(l:Level,refs:Record<string,string>){
 const equations=new Map<string,CannonEquation>(l.cannons.map(c=>[c.id,parseCannonEquation(refs[c.id],c.type)]));
 return {equations,result:simulateRoute(l,equations)};
}
test('both new previews have continuous audited solutions and all existing levels remain available',()=>{
 assert.equal(worlds.slice(0,4).flatMap(w=>w.levels).length,48);
 assert.equal(nextLevel('4-12'),factoryPreview);assert.equal(nextLevel(factoryPreview.id),universePreview);
 assert.equal(new Set(levels.map(l=>l.id)).size,levels.length);
 for(const [l,refs] of [[factoryPreview,factoryRefs],[universePreview,universeRefs]] as const){
  const audit=auditSolution(l,refs,l.cannons.map(c=>c.id));assert.equal(audit.result.event.kind,'exit');assert.ok(audit.minimumClearance>.025,l.id+' clearance '+audit.minimumClearance);
 }
});
test('mixed advanced routes preserve all actual graph values and rapid-fire accounting',()=>{
 const {result:r,equations}=solve(universePreview,universeRefs);
 assert.equal(r.event.kind,'exit');assert.equal(r.legs.length,3);
 const schedule=makeRapidSchedule(r,4);
 for(const [i,timing] of schedule.legs.entries()){
  const f=sampleRapidFire(schedule.lead+timing.offset+timing.load+30,r,schedule),pip=f.pips.find(p=>p.index===0&&p.legIndex===i&&p.phase==='flying')!;
  assert.ok(pip);const e=equations.get(r.legs[i].cannonId)!;assert.ok(isAdvanced(e));near(pip.point.y,e.valueAt(pip.point.x));assert.equal(f.arrived,0);
 }
 let s=beginAttempt(createLevelState(5),r);s=finishAttempt(s,s.active!.id);const id=s.celebration!.id,counts=rapidCounts(schedule.duration,schedule);
 s=advanceCelebration(s,id,counts.dispatched,counts.arrived);s=finishCelebration(s,id);assert.equal(s.saved,5);assert.equal(levelStars(s),3);
});
test('wrong families are rejected before launch, valid source mismatch consumes one Pip',()=>{
 assert.throws(()=>simulateRoute(factoryPreview,new Map([['A',parse('1/x','reciprocal')],['B',parse('1/x','reciprocal')]])),/Program every/);
 const {result,equations}=solve(factoryPreview,{...factoryRefs,A:'x³+1'});
 assert.equal(result.event.kind,'misfire');assert.match(diagnoseFlight(factoryPreview,result,equations)!.prompts[2],/domain/);
 const s=finishAttempt(beginAttempt(createLevelState(5),result),1);assert.equal(s.failed,1);assert.equal(s.waiting,4);
});
