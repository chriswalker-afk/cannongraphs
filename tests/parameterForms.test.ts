import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parameterForms,formsFor,parameterEquation,validParameter,stepParameter,polynomialParameters,type ParameterValues} from '../src/game/parameterForms';
import {cannonTypes,type CannonType} from '../src/game/cannons';
import {parseCannonEquation,cannonEquationKey,evaluateCannonEquation} from '../src/engine/equations/advanced';
import {popupPosition} from '../src/ui/popupPosition';
import {createFlightPlan,editPlan,planStatus,recordFlightEvidence,clearEvidence,snapshotPlan,countReady} from '../src/game/flightPlan';
import {levels} from '../src/levels/catalog';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
const form=(id:string)=>parameterForms.find(f=>f.id===id)!;
test('all seven families expose editable parameter forms with no pre-filled answer',()=>{
 for(const family of Object.keys(cannonTypes) as CannonType[]){
  const fs=formsFor(family);assert.ok(fs.length);
  for(const f of fs){assert.equal(parameterEquation(f,{}),'');assert.ok(f.fields.length>=2);assert.equal(new Set(f.fields.map(p=>p.id)).size,f.fields.length);}
 }
});
test('signed and exact fractional coefficients compile to the same rational equations',()=>{
 const cases:[string,ParameterValues,string][]=[
  ['linear',{m:'-2/3',c:'11/3'},'11/3-2x/3'],
  ['linear',{m:'0',c:'3'},'3'],
  ['quadratic',{a:'1/2',b:'-2',c:'-3'},'x²/2-2x-3'],
  ['vertex',{a:'-1/2',h:'4',k:'13/2'},'-(x-4)²/2+13/2'],
  ['roots',{a:'-1/3',r:'-3',s:'3'},'-(x+3)(x-3)/3'],
  ['cubic',{a:'1/4',b:'0',c:'-3',d:'0'},'x³/4-3x'],
  ['shifted-cubic',{a:'1/4',h:'2',k:'1'},'(x-2)³/4+1'],
  ['reciprocal',{a:'16',h:'2',k:'-4'},'16/(x-2)-4'],
  ['exponential',{a:'8',b:'1/2',p:'1',q:'0',k:'0'},'8(1/2)^x'],
  ['natural-exponential',{a:'-1',p:'1',q:'-1',k:'6'},'6-exp(x-1)'],
  ['log',{a:'-2',b:'3',c:'-5',k:'4'},'4-2log(3(x-2)+1)'],
  ['ln',{a:'1',b:'1',c:'-1',k:'1'},'ln(x-1)+1'],
  ['sin',{a:'2',b:'π/2',c:'-5*pi/2',k:'2'},'2sin(pi(x-5)/2)+2'],
  ['cos',{a:'3',b:'pi/3',c:'0',k:'2'},'3cos(pi*x/3)+2'],
  ['tan',{a:'2',b:'pi/4',c:'0',k:'2'},'2tan(pi*x/4)+2']
 ];
 for(const [id,values,expected] of cases){
  const f=form(id),got=parseCannonEquation(parameterEquation(f,values),f.family),wanted=parseCannonEquation(expected,f.family);
  for(const x of [2.4,3.7,6.3]){
   const a=evaluateCannonEquation(got,x),b=evaluateCannonEquation(wanted,x);
   if(Number.isNaN(b))assert.ok(Number.isNaN(a),id);else assert.ok(Math.abs(a-b)<1e-8,id+' '+a+' '+b);
  }
 }
});
test('blank or invalid fields do not silently become coefficients or a valid equation',()=>{
 for(const f of parameterForms){
  const incomplete=parameterEquation(f,{[f.fields[0].id]:'1'});
  assert.throws(()=>parseCannonEquation(incomplete,f.family));
 }
 for(const v of ['x','1/0','2x+1','1)+x+(','alert(1)','Infinity','1e999','((1)','2**3'])assert.ok(!validParameter(v,'linear'),v);
 assert.ok(validParameter('−2/3','linear'));assert.ok(validParameter('π/2','wave'));assert.ok(!validParameter('π/2','linear'));
 assert.throws(()=>parseCannonEquation(parameterEquation(form('quadratic'),{a:'0',b:'2',c:'1'}),'quadratic'));
});
test('keyboard stepping is exact and never rewrites malformed or symbolic fields',()=>{
 assert.equal(stepParameter('',1),'1');assert.equal(stepParameter('',-1),'-1');
 assert.equal(stepParameter('2/3',1),'5/3');assert.equal(stepParameter('2/3',-1),'-1/3');
 assert.equal(stepParameter('-2/3',1,true),'-17/30');assert.equal(stepParameter('0.2',-1,true),'1/10');
 assert.equal(stepParameter('π/2',1),'π/2');assert.equal(stepParameter('bad',1),'bad');
});
test('equivalent polynomial free input can be converted back to exact expanded boxes',()=>{
 for(const [family,text] of [['linear','11/3-x/3'],['quadratic','-(x-4)^2/2+13/2'],['cubic','(x-2)^3/4+1']] as const){
  const values=polynomialParameters(text,family)!;
  assert.ok(values);assert.equal(cannonEquationKey(parseCannonEquation(parameterEquation(formsFor(family)[0],values),family)),cannonEquationKey(parseCannonEquation(text,family)));
 }
 assert.equal(polynomialParameters('x²','linear'),undefined);assert.equal(polynomialParameters('2^x','exponential'),undefined);
});
test('halo status follows real flight evidence and only the edited cannon loses its evidence',()=>{
 const l=levels.find(l=>l.id==='1-10')!,ids=l.cannons.map(c=>c.id),a=(s:string)=>({text:s,equation:parseCannonEquation(s,'linear')});
 let plan=createFlightPlan(ids);assert.deepEqual(plan.map(planStatus),['empty','empty']);
 plan=editPlan(plan,'A',a('x+1'));plan=editPlan(plan,'B',{text:'?',equation:null});assert.deepEqual(plan.map(planStatus),['ready','invalid']);
 plan=editPlan(plan,'B',a('x+1'));assert.equal(countReady(plan),2);const launched=plan;
 const result=simulateRoute(l,snapshotPlan(plan)!);assert.equal(result.terminalCannonId,'B');assert.notEqual(result.event.kind,'exit');
 plan=recordFlightEvidence(plan,launched,result);assert.deepEqual(plan.map(planStatus),['tested','revise']);
 plan=editPlan(plan,'B',a('11-x'));assert.deepEqual(plan.map(planStatus),['tested','ready']);
 const success=simulateRoute(l,snapshotPlan(plan)!);assert.equal(success.event.kind,'exit');
 plan=recordFlightEvidence(plan,plan,success);assert.deepEqual(plan.map(planStatus),['tested','tested']);
 assert.deepEqual(clearEvidence(plan).map(planStatus),['ready','ready']);
});
test('anchored popup placement is clamped on all sides, including a narrow viewport',()=>{
 for(const area of [{left:8,top:80,right:1290,bottom:710},{left:8,top:150,right:382,bottom:620}]){
  const w=Math.min(435,area.right-area.left),h=200;
  for(const x of [area.left,area.right,300])for(const y of [area.top,area.bottom,250]){
   const p=popupPosition({left:x-10,right:x+10,top:y-10,bottom:y+10},area,w,h);
   assert.ok(p.left>=area.left&&p.left+w<=area.right);assert.ok(p.top>=area.top&&p.top+h<=area.bottom);
  }
 }
});
