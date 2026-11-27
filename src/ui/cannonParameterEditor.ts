import {mountEquationEditor} from './equationEditor';
import {formsFor,parameterEquation,stepParameter,validParameter,polynomialParameters,type ParameterValues} from '../game/parameterForms';
import {cannonTypes} from '../game/cannons';
import type {Cannon,Level} from '../levels/schema';
import {modePolicy,type LearningMode} from '../game/learningModes';
export interface EditorMemory {readonly form:string;readonly values:ParameterValues;readonly raw:boolean}
function node<K extends keyof HTMLElementTagNameMap>(tag:K,cls:string,parent:Element,text?:string):HTMLElementTagNameMap[K]{
 const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;parent.append(n);return n;
}
export function mountCannonParameterEditor(root:HTMLElement,cannon:Cannon,level:Level,mode:LearningMode,text:string,memory?:EditorMemory){
 root.replaceChildren();
 const forms=formsFor(cannon.type);
 let form=forms.find(f=>f.id===memory?.form)??forms[0],values={...memory?.values},rawMode=memory?.raw??!!text;
 const options=node('div','parameter-options',root),formLabel=node('label','parameter-form-label',options,'Form (changing resets boxes) ');
 const select=node('select','parameter-form',formLabel);select.setAttribute('aria-label','Equation form');
 for(const f of forms){const o=node('option','',select,f.name);o.value=f.id;}
 formLabel.hidden=forms.length===1;
 const toggle=node('button','parameter-toggle',options,'Free equation');toggle.type='button';
 const boxes=node('div','parameter-boxes',root);boxes.id='parameter-boxes';
 const equation=node('div','parameter-equation',boxes);equation.setAttribute('role','group');equation.setAttribute('aria-label',cannonTypes[cannon.type].label+' equation parameters');
 node('p','parameter-help',boxes,'Enter signed numbers or fractions. ↑/↓ changes a number by 1 (Shift: 0.1).'+(['linear','quadratic','cubic'].includes(cannon.type)?'':' π and e are accepted; arrows step rational values. Angles in radians.'));
 const message=node('p','equation-message',boxes);message.setAttribute('role','status');
 const guide=node('p','cadet-guide',boxes);guide.hidden=!modePolicy(mode).templates;
 const rawRoot=node('div','equation-editor popup-raw-editor',root);rawRoot.id='equation-editor';
 const raw=mountEquationEditor(rawRoot,cannon,level,mode);raw.setText(text);
 let first:HTMLInputElement|undefined;
 const inputs=new Map<string,HTMLInputElement>();
 function syncMessage(){
  boxes.dataset.state=rawRoot.dataset.state??'empty';root.dataset.state=boxes.dataset.state;
  const partial=form.fields.some(f=>!(values[f.id]??'').trim());
  message.textContent=!rawMode&&partial?(form.fields.every(f=>!(values[f.id]??'').trim())?'Complete the boxes to program this cannon.':'Complete every box (use 0 where needed).'):rawRoot.querySelector('#equation-message')?.textContent??'';
  guide.textContent=rawRoot.querySelector('#cadet-guide')?.textContent??'';
  for(const [id,input] of inputs)input.setAttribute('aria-invalid',String(!!input.value.trim()&&!validParameter(input.value,cannon.type)));
 }
 rawRoot.addEventListener('equationchange',()=>{syncMessage();root.dispatchEvent(new CustomEvent('equationchange'));});
 function refresh(){rawRoot.hidden=!rawMode;boxes.hidden=rawMode;formLabel.hidden=rawMode||forms.length===1;toggle.textContent=rawMode?(polynomialParameters(raw.getDraft().text,cannon.type)||raw.getDraft().text===parameterEquation(form,values)||!raw.getDraft().text?'Use boxes':'New box equation'):'Free equation';}
 function apply(){raw.setText(parameterEquation(form,values));syncMessage();}
 function render(){
  equation.replaceChildren();inputs.clear();first=undefined;select.value=form.id;
  node('span','parameter-math',equation,'y = ');
  for(const part of form.parts){
   if(typeof part==='string'){node('span','parameter-math',equation,part);continue;}
   const field=node('span','parameter-field',equation),input=node('input','coefficient-input',field);input.type='text';input.autocomplete='off';input.spellcheck=false;input.maxLength=45;input.placeholder='▢';input.value=values[part.id]??'';input.dataset.parameter=part.id;input.setAttribute('aria-label',part.label);inputs.set(part.id,input);first??=input;
   const steppers=node('span','parameter-steppers',field);
   function step(direction:1|-1,fine=false){input.value=stepParameter(input.value,direction,fine);values={...values,[part.id]:input.value};apply();}
   for(const direction of [1,-1] as const){const b=node('button','parameter-step',steppers,direction===1?'▴':'▾');b.type='button';b.setAttribute('aria-label',(direction===1?'Increase ':'Decrease ')+part.label);b.addEventListener('click',()=>{step(direction);input.focus();});}
   input.addEventListener('input',()=>{values={...values,[part.id]:input.value};apply();});
   input.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();step(e.key==='ArrowUp'?1:-1,e.shiftKey);}});
  }
  syncMessage();
 }
 select.addEventListener('change',()=>{const next=forms.find(f=>f.id===select.value);if(!next||next===form)return;form=next;values={};render();apply();first?.focus();});
 toggle.addEventListener('click',()=>{
  if(!rawMode){rawMode=true;refresh();root.dispatchEvent(new CustomEvent('equationchange'));raw.focus();return;}
  const current=raw.getDraft().text,parsed=polynomialParameters(current,cannon.type);
  if(current!==parameterEquation(form,values)){
   if(current.trim()&&!parsed&&!window.confirm('Start a new box equation? This replaces the current free equation.'))return;
   if(parsed){form=forms[0];values={...parsed};}
   else {values={};}
  }
  rawMode=false;render();refresh();apply();first?.focus();
 });
 rawRoot.addEventListener('equationchange',()=>{if(rawMode)refresh();});
 render();refresh();syncMessage();
 return {getDraft:raw.getDraft,getMemory:():EditorMemory=>({form:form.id,values:{...values},raw:rawMode}),focus:()=>rawMode?raw.focus():first?.focus()};
}
