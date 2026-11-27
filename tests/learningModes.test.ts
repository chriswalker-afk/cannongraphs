import {test} from 'node:test';
import assert from 'node:assert/strict';
import {levels,worlds} from '../src/levels/catalog';
import {learningModes,modePolicy,modeBudget,modeBudgetLabel,modeObjective,templates,cadetGuidance,type LearningMode} from '../src/game/learningModes';
import {beginSelection,selectWorld,selectMode,selectLevel,selectedLevel,backToModes,backToWorlds} from '../src/game/levelSelection';
import {cannonTypes,type CannonType} from '../src/game/cannons';
import {parseCannonEquation,evaluateCannonEquation,isAdvanced} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import {createLevelState,beginAttempt,finishAttempt,restartLevel,canLaunch,activeCount,advanceCelebration,finishCelebration} from '../src/game/levelState';
import {levelStars} from '../src/game/scoring';
import {recordAttemptFeedback,createFeedbackHistory} from '../src/game/flightDiagnosis';
import {modeAttemptFeedback} from '../src/game/modeFeedback';
import {graphPreview} from '../src/engine/trajectories/graphPreview';
import {bankedGems} from '../src/animations/gemTimeline';
const level=levels[0],plan=(s:string)=>new Map([['A',parseCannonEquation(s,'linear')]]),fail=simulateRoute(level,plan('x+1')),win=simulateRoute(level,plan('x'));
const near=(a:number,b:number,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,a+' != '+b);
test('fresh selection requires world and explicit mode before any of the 84 levels can be played',()=>{
 const ids=new Set<string>();
 for(const w of worlds){
  const modeChoice=selectWorld(beginSelection(),w.number);
  assert.equal(modeChoice.step,'modes');assert.equal(selectedLevel(modeChoice),undefined);
  assert.equal(selectLevel(modeChoice,w.levels[0].id),modeChoice);
  assert.equal(selectMode(modeChoice,'unknown' as LearningMode),modeChoice);
  for(const mode of learningModes){
   const choice=selectMode(modeChoice,mode.id);assert.equal(choice.step,'levels');
   if(choice.step==='levels')assert.equal(choice.mode,mode.id);
   for(const l of w.levels){const s=selectLevel(choice,l.id);assert.equal(selectedLevel(s),l);ids.add(mode.id+':'+l.id);}
  }
 }
 assert.equal(ids.size,252);
});
test('return from gameplay preserves mode and level, and changing mode is an explicit new selection',()=>{
 const s=beginSelection('6-r12',true,'ace');assert.equal(s.step,'levels');
 if(s.step==='levels')assert.equal(s.mode,'ace');
 assert.equal(selectedLevel(s)?.id,'6-r12');
 const modes=backToModes(s);assert.equal(modes.step,'modes');assert.equal(selectedLevel(modes),undefined);
 if(modes.step==='modes')assert.equal(modes.previousMode,'ace');
 const practice=selectMode(modes,'cadet');assert.equal(selectedLevel(practice)?.id,'6-r12');
 if(practice.step==='levels')assert.equal(practice.mode,'cadet');
 assert.equal(backToWorlds(practice).step,'worlds');
 assert.equal(beginSelection('6-r12',false,'ace').step,'worlds');
});
test('mode policies and budgets preserve the same puzzle definitions; Ace retains essential exact anchor data',()=>{
 assert.equal(modeBudget('pilot',level),5);assert.equal(modeBudget('ace',level),3);
 assert.equal(modeBudgetLabel('cadet',level),'Unlimited attempts');
 assert.deepEqual(learningModes.map(p=>[p.preview,p.templates,p.coordinates,p.hints,p.unlimited]),[[true,true,true,true,true],[false,false,true,true,false],[false,false,false,false,false]]);
 assert.equal(modeObjective('pilot',level),level.objective);assert.equal(modeObjective('ace',level),'Plan a route to the exit.');
 assert.match(modeObjective('ace',levels.find(l=>l.id==='6-r07')!),/1\+ln\(4\)/);
 assert.match(modeObjective('ace',levels.find(l=>l.id==='6-r05')!),/1\+e²/);
 for(const mode of learningModes)for(const id of ['6-r05','6-r07']){const l=levels.find(l=>l.id===id)!;assert.ok(modeObjective(mode.id,l).includes(l.exactCoordinateNote!));}
 assert.match(modeObjective('ace',levels.find(l=>l.id==='6-04')!),/0\.1/);
 assert.equal(level.creatures,5);assert.equal(modePolicy('ace').name,'Ace');
});
test('Cadet replenishes after every failure and never exhausts a run',()=>{
 let s=createLevelState(modeBudget('cadet',level),1,true);
 for(let i=0;i<50;i++){
  const a=beginAttempt(s,fail);assert.equal(a.waiting,4);assert.equal(activeCount(a),1);
  assert.equal(finishAttempt(a,a.active!.id+1),a);
  s=finishAttempt(a,a.active!.id);assert.equal(s.waiting,5);assert.equal(s.phase,'retry');assert.ok(canLaunch(s));assert.equal(s.failed,i+1);assert.equal(levelStars(s),null);
 }
 const restarted=restartLevel(s);assert.equal(restarted.unlimited,true);assert.equal(restarted.failed,0);assert.equal(restarted.nextAttemptId,s.nextAttemptId);
});
test('Cadet uses a bounded celebration batch, banks gems and completes without ranked stars',()=>{
 let s=createLevelState(5,1,true);
 for(let i=0;i<8;i++){s=beginAttempt(s,fail);s=finishAttempt(s,s.active!.id);}
 s=beginAttempt(s,win);s=finishAttempt(s,s.active!.id);
 assert.equal(s.phase,'celebrating');assert.equal(s.celebration!.count,4);
 const id=s.celebration!.id;assert.equal(finishCelebration(s,id),s);
 s=advanceCelebration(s,id,4,3);assert.equal(s.saved,4);assert.equal(activeCount(s),1);
 s=advanceCelebration(s,id,4,4);s=finishCelebration(s,id);
 assert.equal(s.phase,'success');assert.equal(s.saved,5);assert.equal(s.failed,8);assert.equal(s.waiting,0);
 assert.equal(levelStars(s),null);assert.deepEqual(bankedGems(s.lastResult),bankedGems(win));
});
test('Pilot and Ace retain finite budgets, exhaustion and proportional creature-based stars',()=>{
 for(const mode of ['pilot','ace'] as const){
  const total=modeBudget(mode,level);
  for(let failures=0;failures<=total;failures++){
   let s=createLevelState(total);
   for(let i=0;i<failures;i++){s=beginAttempt(s,fail);s=finishAttempt(s,s.active!.id);}
   if(failures===total){assert.equal(s.phase,'gameOver');assert.equal(levelStars(s),0);assert.ok(!canLaunch(s));continue;}
   s=beginAttempt(s,win);s=finishAttempt(s,s.active!.id);
   if(s.celebration){const {id,count}=s.celebration;s=advanceCelebration(s,id,count,count);s=finishCelebration(s,id);}
   assert.equal(s.saved,total-failures);assert.equal(s.saved+s.failed,total);
   assert.equal(levelStars(s),failures===0?3:s.saved>=Math.ceil(.6*total)?2:1);
  }
 }
});
test('blank templates cover all families but cannot accidentally become a launchable answer',()=>{
 for(const type of Object.keys(cannonTypes) as CannonType[]){
  assert.match(templates[type],/\?/);assert.throws(()=>parseCannonEquation(templates[type],type));
 }
 assert.match(cadetGuidance(level.cannons[0],null),/gradient/);
 assert.match(cadetGuidance(level.cannons[0],plan('x').get('A')!),/matches the cannon/);
 assert.match(cadetGuidance(level.cannons[0],plan('x+1').get('A')!),/needs y = 1/);
 const reciprocal=levels.find(l=>l.id==='5-07')!;
 assert.match(cadetGuidance(reciprocal.cannons[0],parseCannonEquation('1/(x-2)','reciprocal')),/undefined/);
});
test('Cadet method guidance begins sooner, Pilot stays progressive and Ace reports facts without numerical hints',()=>{
 const p=plan('x+1'),pilot=recordAttemptFeedback(createFeedbackHistory(),1,level,fail,p),cadet=recordAttemptFeedback(createFeedbackHistory(),1,level,fail,p,2);
 assert.equal(pilot.latest!.support,1);assert.equal(cadet.latest!.support,2);
 const next=recordAttemptFeedback(cadet,2,level,fail,p,2);assert.equal(next.latest!.support,3);
 assert.equal(recordAttemptFeedback(next,2,level,fail,p,2),next);
 assert.match(modeAttemptFeedback('pilot',fail),/At x =/);assert.equal(modeAttemptFeedback('ace',fail),'Cannon A — Misfire — one Pip used.');
 assert.equal(modeAttemptFeedback('ace',win),'Success! Your Pip reached the exit.');
});
const bounds={minX:-5,maxX:5,minY:-4,maxY:4};
test('Cadet graph preview supports every family, plots the submitted values and clips to world bounds',()=>{
 for(const [text,type] of [['x+1','linear'],['x²-1','quadratic'],['x³-x','cubic'],['2/x','reciprocal'],['2^x','exponential'],['ln(x)','logarithmic'],['sin(pi*x)','wave']] as const){
  const e=parseCannonEquation(text,type),paths=graphPreview(e,bounds);assert.ok(paths.length,text);
  for(const path of paths){assert.ok(path.length>=2);for(const p of path){assert.ok(p.x>=bounds.minX&&p.x<=bounds.maxX&&p.y>=bounds.minY&&p.y<=bounds.maxY,text);near(p.y,evaluateCannonEquation(e,p.x));}}
 }
 const wrong=graphPreview(plan('x+1').get('A')!,bounds);assert.ok(wrong.flat().some(p=>Math.abs(p.y-p.x-1)<1e-8));
});
test('preview separates reciprocal, log and tangent branches, including exact asymptotes at bounds',()=>{
 for(const [text,type,poles] of [['1/(x-1)','reciprocal',[1]],['ln(x-1)','logarithmic',[1]],['tan(pi*x/2)','wave',[-3,-1,1,3]]] as const){
  const e=parseCannonEquation(text,type);assert.ok(isAdvanced(e));const paths=graphPreview(e,bounds);assert.ok(paths.length);
  for(const path of paths){
   assert.ok(path.every(p=>e.definedAt(p.x)&&Number.isFinite(p.y)));
   for(const pole of poles)assert.ok(path.every(p=>p.x<pole)||path.every(p=>p.x>pole),text+' bridged '+pole);
  }
  if(type==='logarithmic')assert.ok(paths.flat().every(p=>p.x>1));
 }
 const shifted=parseCannonEquation('ln(-x)','logarithmic');assert.ok(graphPreview(shifted,bounds).flat().every(p=>p.x<0));
});
test('preview handles turning points, extreme parameters and invisible equations without changing simulation',()=>{
 const e=parseCannonEquation('2sin(pi*x)','wave'),paths=graphPreview(e,bounds);
 assert.ok(paths.flat().some(p=>Math.abs(p.y-2)<1e-9));assert.ok(paths.flat().some(p=>Math.abs(p.y+2)<1e-9));
 assert.deepEqual(graphPreview(parseCannonEquation('100','linear'),bounds),[]);
 const overflow=graphPreview(parseCannonEquation('exp(1000x)','exponential'),bounds);
 assert.ok(overflow.length);assert.ok(overflow.flat().every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 const before=simulateRoute(level,plan('x'));graphPreview(plan('x').get('A')!,level.bounds);const after=simulateRoute(level,plan('x'));
 assert.deepEqual(before.event,after.event);assert.deepEqual(before.gemHits,after.gemHits);assert.deepEqual(before.end,after.end);
});
