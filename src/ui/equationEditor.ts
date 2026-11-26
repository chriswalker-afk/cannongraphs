import {EquationError,isQuadratic,equationCoefficients,type RationalCoefficient} from '../engine/equations/linear';
import {parseCannonEquation,isAdvanced,equationFamily,type CannonEquation} from '../engine/equations/advanced';
import {buildLinearFlight,type LinearFlight} from '../engine/trajectories/linear';
import type {Cannon,Level} from '../levels/schema';
import {cannonTypes} from '../game/cannons';
import {quadraticSegment,type QuadraticSegment} from '../engine/trajectories/quadratic';
export interface EquationDraft {text:string;equation:CannonEquation|null;flight:LinearFlight|QuadraticSegment|null}
const mathNS='http://www.w3.org/1998/Math/MathML';
function mathNode(name:string,value?:string){const node=document.createElementNS(mathNS,name);if(value!==undefined)node.textContent=value;return node;}
function magnitude(r:RationalCoefficient){
 const n=mathNode('mn',r.numerator.replace(/^-/,''));
 if(r.denominator==='1')return n;
 const f=mathNode('mfrac');f.append(n,mathNode('mn',r.denominator));return f;
}
function displayEquation(container:HTMLElement,e:CannonEquation|null){
 container.replaceChildren();if(!e)return;
 if(isAdvanced(e)&&!e.coefficients)return;
 const math=mathNode('math');math.setAttribute('aria-label','Equivalent '+equationFamily(e)+' equation');const row=mathNode('mrow');
 row.append(mathNode('mi','y'),mathNode('mo','='));
 const coefficients=isAdvanced(e)?e.coefficients!:equationCoefficients(e);let written=false;
 coefficients.forEach((r,i)=>{
  const power=coefficients.length-i-1;
  if(r.numerator==='0'&&(power!==0||written))return;
  if(r.numerator.startsWith('-'))row.append(mathNode('mo','−'));else if(written)row.append(mathNode('mo','+'));
  if(power===0||r.numerator.replace(/^-/,'')!==r.denominator)row.append(magnitude(r));
  if(power===1)row.append(mathNode('mi','x'));
  if(power>=2){const exponent=mathNode('msup');exponent.append(mathNode('mi','x'),mathNode('mn',String(power)));row.append(exponent);}
  written=true;
 });
 math.append(row);container.append(math);
}
export function mountEquationEditor(root:HTMLElement,cannon:Cannon,level:Level){
 const family=cannon.type,style=cannonTypes[family];
 const extra:Record<string,string[]>={quadratic:['square'],cubic:['square','cube'],reciprocal:['inverse'],exponential:['power','exp'],logarithmic:['ln','log'],wave:['sin','cos','tan','pi']};
 const labels:Record<string,string>={square:'x²',cube:'x³',inverse:'1/x',power:'^',exp:'exp',ln:'ln',log:'log',sin:'sin',cos:'cos',tan:'tan',pi:'π'};
 const buttons=(extra[family]??[]).map(key=>'<button type="button" data-insert="'+key+'" aria-label="Insert '+labels[key]+'">'+labels[key]+'</button>').join('');
 root.innerHTML=`<div class="editor-top"><label for="equation-input">Cannon <span id="editor-cannon"></span> · ${style.label}</label><span class="editor-family">${style.form}</span></div><div class="editor-entry"><span aria-hidden="true" class="equation-prefix">y =</span><input id="equation-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="180" aria-label="Right-hand side of the equation, or a full equation beginning y equals" aria-describedby="equation-message" placeholder="Enter a flight equation"><span id="equation-typeset" class="equation-typeset"></span></div><div class="editor-tools" role="group" aria-label="Mathematical input tools"><button type="button" data-insert="x" aria-label="Insert x">x</button>${buttons}<button type="button" data-insert="fraction" aria-label="Insert fraction">a/b</button><button type="button" data-insert="brackets" aria-label="Insert brackets">( )</button><button type="button" data-insert="minus" aria-label="Insert minus">−</button><button type="button" data-insert="multiply" aria-label="Insert multiplication">×</button><button type="button" data-insert="clear" aria-label="Clear equation">Clear</button></div><p id="equation-message" role="status" class="equation-message"></p>`;
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
    const equation=parseCannonEquation(text,family),flight=isAdvanced(equation)?null:isQuadratic(equation)?quadraticSegment(equation,cannon.position.x,cannon.direction===1?level.bounds.maxX:level.bounds.minX):buildLinearFlight(equation,cannon.position,cannon.direction,level.bounds);
    draft={text,equation,flight};state='ready';message.textContent=style.label+' equation ready.'+(family==='wave'?' Angles in radians.':family==='logarithmic'?' ln: natural log; log: base 10.':'');
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
    case 'square':replacement=selected?'('+selected+')²':'x²';cursor=start+replacement.length;break;
    case 'cube':replacement=selected?'('+selected+')³':'x³';cursor=start+replacement.length;break;
    case 'inverse':replacement='1/('+selected+')';cursor=selected?start+replacement.length:start+3;break;
    case 'power':replacement='^';cursor=start+1;break;
    case 'pi':replacement='π';cursor=start+1;break;
    case 'exp':case 'ln':case 'log':case 'sin':case 'cos':case 'tan':{const name=button.dataset.insert!;replacement=name+'('+selected+')';cursor=selected?start+replacement.length:start+name.length+1;break;}
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
