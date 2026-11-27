import {mountEquationEditor} from './equationEditor';
import {formsFor,formFormula,parameterEquation,stepParameter,validParameter,polynomialParameters,type ParameterValues,type FormDrafts} from '../game/parameterForms';
import {cannonTypes} from '../game/cannons';
import type {Cannon,Level} from '../levels/schema';
import {lockedLiftEquation,lockedLiftText} from '../levels/liftSpec';
import {inventoryCannon,lockedAnchorEquation,anchorAt} from '../levels/anchorSpec';
import {modePolicy,type LearningMode} from '../game/learningModes';
export interface EditorMemory {readonly form:string;readonly values:ParameterValues;readonly raw:boolean;readonly drafts?:FormDrafts}
function node<K extends keyof HTMLElementTagNameMap>(tag:K,cls:string,parent:Element,text?:string):HTMLElementTagNameMap[K]{
 const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;parent.append(n);return n;
}
export function mountCannonParameterEditor(root:HTMLElement,cannon:Cannon,level:Level,mode:LearningMode,text:string,memory?:EditorMemory,onLiftMove?:(id:string,y:number)=>void){
 root.replaceChildren();
 if(cannon.lift){
  let current=cannon;
  const label=node('p','lift-lock-label',root,'Locked firing mechanism');
  label.setAttribute('aria-label','Locked firing mechanism');
  const equation=node('output','lift-equation',root);
  const row=node('div','lift-popup-controls',root);
  const down=node('button','lift-step',row,'↓ Lower');down.type='button';
  const position=node('output','lift-position',row);
  const up=node('button','lift-step',row,'↑ Raise');up.type='button';
  node('p','parameter-help',root,'Drag the striped deck or use these arrows. Only the constant changes.');
  function updateLift(next:Cannon){current=next;equation.textContent=lockedLiftText(lockedLiftEquation(current));position.textContent=modePolicy(mode).coordinates?'y = '+current.position.y:'Slide';down.disabled=current.position.y<=current.lift!.minY;up.disabled=current.position.y>=current.lift!.maxY;}
  down.onclick=()=>onLiftMove?.(current.id,current.position.y-1);
  up.onclick=()=>onLiftMove?.(current.id,current.position.y+1);
  updateLift(cannon);
  return {getDraft:()=>({text:lockedLiftText(lockedLiftEquation(current)),equation:lockedLiftEquation(current)}),getMemory:():EditorMemory=>({form:'locked',values:{},raw:false}),focus:()=>{(up.disabled?down:up).focus();},updateLift};
 }
 const part=inventoryCannon(level,cannon.id);
 if(part?.lockedShape!==undefined){
  const locked=lockedAnchorEquation(level,cannon)!;
  node('p','lift-lock-label',root,'Locked firing mechanism · Mount '+anchorAt(level,cannon.position)!.id);
  const output=node('output','lift-equation anchor-equation',root,lockedLiftText(locked));output.tabIndex=0;
  if(modePolicy(mode).coordinates)node('p','parameter-help',root,'Muzzle: ('+cannon.position.x+', '+cannon.position.y+')');
  node('p','parameter-help',root,'Move this cannon to another mount to change the constant. Select its tray card or drag its deck grip.');
  return {getDraft:()=>({text:lockedLiftText(locked),equation:locked}),getMemory:():EditorMemory=>({form:'locked',values:{},raw:false}),focus:()=>output.focus(),updateLift:undefined};
 }
 const forms=formsFor(cannon.type);
 let form=forms.find(f=>f.id===memory?.form)??forms[0],values={...memory?.values},rawMode=memory?.raw??!!text;
 // Each form has its own draft. Selecting a different form deliberately
 // activates only that form's equation; never derive answers automatically.
 const drafts:Record<string,ParameterValues>={...memory?.drafts};
 const options=node('div','parameter-options',root);
 const chooseLabel=node('span','parameter-choose-label',options,'Equation form');
 const toggle=node('button','parameter-toggle',options,'Free equation');toggle.type='button';
 const formChoices=node('div','parameter-form-choices',root);
 formChoices.setAttribute('role','group');formChoices.setAttribute('aria-label','Equation forms');
 const choices=new Map<string,HTMLButtonElement>();
 for(const choice of forms){
  const b=node('button','parameter-form-choice',formChoices);b.type='button';b.dataset.formId=choice.id;
  node('span','form-choice-name',b,choice.name);
  node('span','form-choice-formula',b,formFormula(choice));
  b.setAttribute('aria-label',choice.name+' — '+formFormula(choice));b.setAttribute('aria-pressed',String(choice.id===form.id));
  choices.set(choice.id,b);
  b.addEventListener('click',()=>{if(rawMode||choice===form)return;drafts[form.id]={...values};form=choice;values={...drafts[choice.id]};render();apply();first?.focus();});
 }
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
 function refresh(){rawRoot.hidden=!rawMode;boxes.hidden=rawMode;formChoices.hidden=rawMode||forms.length===1;chooseLabel.textContent=rawMode?'Free equation':'Choose a form';toggle.textContent=rawMode?(polynomialParameters(raw.getDraft().text,cannon.type)||raw.getDraft().text===parameterEquation(form,values)||!raw.getDraft().text?'Use boxes':'New box equation'):'Free equation';}
 function apply(){raw.setText(parameterEquation(form,values));syncMessage();}
 function render(){
  equation.replaceChildren();inputs.clear();first=undefined;
  for(const [id,b] of choices)b.setAttribute('aria-pressed',String(id===form.id));
  node('span','parameter-math',equation,'y = ');
  for(const part of form.parts){
   if(typeof part==='string'){node('span','parameter-math',equation,part);continue;}
   const fieldId=part.id;
   const field=node('span','parameter-field',equation),input=node('input','coefficient-input',field);input.type='text';input.autocomplete='off';input.spellcheck=false;input.maxLength=45;input.placeholder='▢';input.value=values[part.id]??'';input.dataset.parameter=part.id;input.setAttribute('aria-label',part.label);inputs.set(part.id,input);first??=input;
   const steppers=node('span','parameter-steppers',field);
   function step(direction:1|-1,fine=false){input.value=stepParameter(input.value,direction,fine);values={...values,[fieldId]:input.value};apply();}
   for(const direction of [1,-1] as const){const b=node('button','parameter-step',steppers,direction===1?'▴':'▾');b.type='button';b.setAttribute('aria-label',(direction===1?'Increase ':'Decrease ')+part.label);b.addEventListener('click',()=>{step(direction);input.focus();});}
   input.addEventListener('input',()=>{values={...values,[fieldId]:input.value};apply();});
   input.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();step(e.key==='ArrowUp'?1:-1,e.shiftKey);}});
  }
  syncMessage();
 }
 toggle.addEventListener('click',()=>{
  if(!rawMode){rawMode=true;refresh();root.dispatchEvent(new CustomEvent('equationchange'));raw.focus();return;}
  const current=raw.getDraft().text,parsed=polynomialParameters(current,cannon.type);
  if(current!==parameterEquation(form,values)){
   if(current.trim()&&!parsed&&!window.confirm('Start a new box equation? This replaces the current free equation.'))return;
   drafts[form.id]={...values};
   if(parsed){form=forms[0];values={...parsed};}
   else {values={};}
  }
  rawMode=false;render();refresh();apply();first?.focus();
 });
 rawRoot.addEventListener('equationchange',()=>{if(rawMode)refresh();});
 render();refresh();syncMessage();
 return {getDraft:raw.getDraft,getMemory:():EditorMemory=>({form:form.id,values:{...values},raw:rawMode,drafts:{...drafts,[form.id]:{...values}}}),focus:()=>rawMode?raw.focus():first?.focus(),updateLift:undefined};
}
