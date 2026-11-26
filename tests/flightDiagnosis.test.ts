import {test} from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseFlight,createFeedbackHistory,recordAttemptFeedback} from '../src/game/flightDiagnosis';
import {feedbackNumber} from '../src/game/feedbackNumbers';
import {parseLinearEquation} from '../src/engine/equations/linear';
import {simulateLinearRoute} from '../src/engine/simulation/linearRoute';
import {meadowPreview,meadowRelay} from '../src/levels/worlds/meadow';
import {wallPreview,archPreview,passagePreview} from '../src/levels/worlds/terrainPreviews';
import type {Level} from '../src/levels/schema';
const plan=(a:string,b?:string)=>new Map([['A',parseLinearEquation(a)],...(b?[['B',parseLinearEquation(b)] as const]:[])]);
const check=(l:Level,a:string,b?:string)=>{const equations=plan(a,b),result=simulateLinearRoute(l,equations);return {equations,result,diagnosis:diagnoseFlight(l,result,equations)};};
test('successful routes generate no failure feedback',()=>{
 assert.equal(check(meadowPreview,'x').diagnosis,null);
 assert.equal(check(meadowRelay,'x','8-3x/5').diagnosis,null);
});
test('source mismatch uses the actual submitted function at the failed cannon, not a presumed intercept error',()=>{
 const {diagnosis:d}=check(meadowRelay,'x','x+1');
 assert.equal(d!.cannonId,'B');assert.equal(d!.kind,'source');assert.match(d!.evidence,/y ≈ 6 at x = 5/);assert.match(d!.evidence,/\(5, 5\)/);
 assert.match(d!.prompts[1],/Substitute x = 5/);assert.match(d!.prompts[2],/c = y − mx/);
 assert.ok(!d!.prompts.join(' ').includes('8-3x/5'));
});
test('tiny genuine misfires and missed targets do not round the error to zero',()=>{
 const s=check(meadowPreview,'x+.000000002');assert.equal(s.diagnosis!.kind,'source');assert.match(s.diagnosis!.evidence,/e-9/);
 assert.notEqual(feedbackNumber(1.000000002),feedbackNumber(1));
 const l={...meadowPreview,obstacles:[]},m=check(l,'1.0000001x-.0000001');
 assert.equal(m.diagnosis!.kind,'missed-target');assert.match(m.diagnosis!.evidence,/above/);assert.match(m.diagnosis!.evidence,/e-7/);
});
test('collisions name the actual terrain and use its bounds and body clearance',()=>{
 const cases:[Level,string,string|undefined,string][]=[
  [wallPreview,'1',undefined,'Stone wall'],
  [archPreview,'x/2+5/2',undefined,'Ceiling'],
  [archPreview,'16/5-x/5',undefined,'Floating platform'],
  [passagePreview,'x+1','11/2+x/10','Ceiling'],
  [passagePreview,'x+1','13/2-x/10','Stone wall'],
  [meadowPreview,'2-x',undefined,'Floor']
 ];
 for(const [l,a,b,label] of cases){const {diagnosis:d,result}=check(l,a,b);assert.equal(result.event.kind,'obstacle');assert.equal(d!.kind,'collision');assert.ok(d!.evidence.includes(label));assert.match(d!.prompts[2],/0.2 units/);}
});
test('a boundary miss diagnoses a passed destination without claiming it is the intended one',()=>{
 const l={...meadowRelay,obstacles:[]},d=check(l,'0.2x+0.8','6').diagnosis!;
 assert.equal(d.kind,'missed-target');assert.match(d.evidence,/For example/);assert.match(d.evidence,/above|below/);
 assert.match(d.prompts[2],/change in y ÷ change in x/);
 const steep=check({...meadowPreview,obstacles:[]},'10x-9').diagnosis!;
 assert.equal(steep.kind,'boundary');assert.match(steep.evidence,/top edge/);assert.ok(!steep.evidence.includes('at the exit'));
});
test('reverse travel and no forward targets are handled without a misleading slope diagnosis',()=>{
 const l:Level={...meadowPreview,obstacles:[],cannons:[{...meadowPreview.cannons[0],position:{x:5,y:3},direction:-1}],exit:{x:9,y:3}};
 const d=check(l,'3').diagnosis!;assert.equal(d.kind,'direction');assert.match(d.evidence,/fires left/);
 const reverse={...l,exit:{x:1,y:2}},miss=check(reverse,'3').diagnosis!;
 assert.equal(miss.kind,'missed-target');assert.match(miss.evidence,/1 units above/);
});
test('loops report the observed sequence and final firing cannon',()=>{
 const l:Level={...meadowRelay,obstacles:[],exit:{x:10,y:6},cannons:[{...meadowRelay.cannons[0],position:{x:1,y:2}},{...meadowRelay.cannons[1],position:{x:5,y:2},direction:-1}]};
 const d=check(l,'2','2').diagnosis!;
 assert.equal(d.kind,'loop');assert.equal(d.cannonId,'B');assert.match(d.evidence,/A → B → A/);
});
test('support escalates only after distinct completed attempts of the same kind at the same cannon',()=>{
 const {result,equations}=check(meadowRelay,'x','x+1');let h=createFeedbackHistory();
 h=recordAttemptFeedback(h,1,meadowRelay,result,equations);assert.equal(h.latest!.support,1);
 assert.equal(recordAttemptFeedback(h,1,meadowRelay,result,equations),h);
 assert.equal(recordAttemptFeedback(h,0,meadowRelay,result,equations),h);
 const other=check(meadowRelay,'x+1','x+1');
 h=recordAttemptFeedback(h,2,meadowRelay,other.result,other.equations);assert.equal(h.latest!.support,1);assert.equal(h.latest!.cannonId,'A');
 h=recordAttemptFeedback(h,3,meadowRelay,result,equations);assert.equal(h.latest!.support,2);
 h=recordAttemptFeedback(h,4,meadowRelay,result,equations);assert.equal(h.latest!.support,3);
 h=recordAttemptFeedback(h,5,meadowRelay,result,equations);assert.equal(h.latest!.support,3);assert.equal(h.latest!.occurrence,4);
 const won=check(meadowRelay,'x','8-3x/5');h=recordAttemptFeedback(h,6,meadowRelay,won.result,won.equations);assert.equal(h.latest,null);
 assert.equal(createFeedbackHistory().counts.size,0);
});
test('feedback remains a record of the launched equation, not a live answer checker',()=>{
 const {result,equations}=check(meadowPreview,'x+1');const h=recordAttemptFeedback(createFeedbackHistory(),1,meadowPreview,result,equations);
 equations.set('A',parseLinearEquation('x'));assert.match(h.latest!.evidence,/y ≈ 2 at x = 1/);assert.equal(h.latest!.support,1);
 assert.equal(diagnoseFlight(meadowPreview,result,new Map()),null);
});
