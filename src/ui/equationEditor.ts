import {EquationError,parseLinearEquation,type LinearEquation,type RationalCoefficient} from '../engine/equations/linear';
import {buildLinearFlight,type LinearFlight} from '../engine/trajectories/linear';
import type {Cannon,Level} from '../levels/schema';
export interface EquationDraft {text:string;equation:LinearEquation|null;flight:LinearFlight|null}
const mathNS='http://www.w3.org/1998/Math/MathML';
function mathNode(name:string,value?:string){const node=document.createElementNS(mathNS,name);if(value!==undefined)node.textContent=value;return node;}
function magnitude(r:RationalCoefficient){
 const n=mathNode('mn',r.numerator.replace(/^-/,''));
 if(r.denominator==='1')return n;
 const f=mathNode('mfrac');f.append(n,mathNode('mn',r.denominator));return f;
}
function displayEquation(container:HTMLElement,e:LinearEquation|null){
 container.replaceChildren();
 if(!e)return;
 const math=mathNode('math');math.setAttribute('aria-label','Equivalent linear equation');const row=mathNode('mrow');
 row.append(mathNode('mi','y'),mathNode('mo','='));
 const m=e.exactGradient,c=e.exactIntercept;
 if(m.numerator!=='0'){
  if(m.numerator.startsWith('-'))row.append(mathNode('mo','−'));
  if(m.numerator.replace(/^-/,'')!==m.denominator)row.append(magnitude(m));
  row.append(mathNode('mi','x'));
 }
 if(c.numerator!=='0'||m.numerator==='0'){
  if(c.numerator.startsWith('-'))row.append(mathNode('mo','−'));else if(m.numerator!=='0')row.append(mathNode('mo','+'));
  row.append(magnitude(c));
 }
 math.append(row);container.append(math);
}
export function mountEquationEditor(root:HTMLElement,cannon:Cannon,level:Level){
 root.innerHTML=`<div class="editor-top"><label for="equation-input">Cannon <span id="editor-cannon"></span> · Linear</label><span class="editor-family">y = mx + c</span></div><div class="editor-entry"><span aria-hidden="true" class="equation-prefix">y =</span><input id="equation-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="180" aria-label="Right-hand side of the equation, or a full equation beginning y equals" aria-describedby="equation-message" placeholder="Enter a flight equation"><span id="equation-typeset" class="equation-typeset"></span></div><div class="editor-tools" role="group" aria-label="Mathematical input tools"><button type="button" data-insert="x" aria-label="Insert x">x</button><button type="button" data-insert="fraction" aria-label="Insert fraction">a/b</button><button type="button" data-insert="brackets" aria-label="Insert brackets">( )</button><button type="button" data-insert="minus" aria-label="Insert minus">−</button><button type="button" data-insert="multiply" aria-label="Insert multiplication">×</button><button type="button" data-insert="clear" aria-label="Clear equation">Clear</button></div><p id="equation-message" role="status" class="equation-message"></p>`;
 root.querySelector('#editor-cannon')!.textContent=cannon.id;
 const input=root.querySelector<HTMLInputElement>('input')!,message=root.querySelector<HTMLElement>('#equation-message')!,typeset=root.querySelector<HTMLElement>('#equation-typeset')!,prefix=root.querySelector<HTMLElement>('.equation-prefix')!;
 let draft:EquationDraft={text:'',equation:null,flight:null};
 let selection={start:0,end:0};
 const remember=()=>{selection={start:input.selectionStart??input.value.length,end:input.selectionEnd??input.value.length};};
 const update=()=>{
  const text=input.value;draft={text,equation:null,flight:null};prefix.hidden=text.trim().toLowerCase().startsWith('y');
  let state='empty';
  if(text.trim()){
   try{
    const equation=parseLinearEquation(text),flight=buildLinearFlight(equation,cannon.position,cannon.direction,level.bounds);
    draft={text,equation,flight};state='ready';message.textContent='Linear equation ready.';
   }catch(error){
    if(error instanceof EquationError){state=error.code==='empty'?'empty':'invalid';message.textContent=error.message;}
    else{state='invalid';message.textContent='The equation could not be evaluated. Try a simpler expression.';}
   }
  }else message.textContent='Enter your equation. The flight path stays hidden until launch.';
  input.setAttribute('aria-invalid',String(state==='invalid'));root.dataset.state=state;
  displayEquation(typeset,draft.equation);
  remember();
  root.dispatchEvent(new CustomEvent('equationchange',{detail:{ready:draft.equation!==null}}));
 };
 input.addEventListener('input',update);
 for(const event of ['select','keyup','click','blur'])input.addEventListener(event,remember);
 root.querySelectorAll<HTMLButtonElement>('button[data-insert]').forEach(button=>{
  button.addEventListener('pointerdown',()=>{if(document.activeElement===input)remember();});
  button.addEventListener('click',()=>{
   const {start,end}=selection,selected=input.value.slice(start,end);let replacement='',cursor=start;
   switch(button.dataset.insert){
    case 'fraction':replacement='('+selected+')/()';cursor=selected?start+replacement.length-1:start+1;break;
    case 'brackets':replacement='('+selected+')';cursor=selected?start+replacement.length:start+1;break;
    case 'x':replacement='x';cursor=start+1;break;
    case 'minus':replacement='−';cursor=start+1;break;
    case 'multiply':replacement='×';cursor=start+1;break;
    case 'clear':input.value='';input.focus();input.setSelectionRange(0,0);update();return;
   }
   if(input.value.length-(end-start)+replacement.length>input.maxLength)return;
   input.setRangeText(replacement,start,end,'end');input.focus();input.setSelectionRange(cursor,cursor);update();
  });
 });
 update();
 return {getDraft:()=>draft,setText:(text:string)=>{input.value=text;input.setSelectionRange(text.length,text.length);update();},focus:()=>input.focus()};
}
