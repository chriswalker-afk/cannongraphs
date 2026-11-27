import type {CannonType} from './cannons';
import {parseLinearEquation,equationCoefficients} from '../engine/equations/linear';
import {parseCannonEquation,isAdvanced} from '../engine/equations/advanced';
export interface ParameterField {readonly id:string;readonly label:string}
export interface ParameterForm {readonly id:string;readonly name:string;readonly family:CannonType;readonly fields:readonly ParameterField[];readonly parts:readonly (string|ParameterField)[]}
const f=(id:string,label:string):ParameterField=>({id,label});
const make=(family:CannonType,id:string,name:string,...parts:(string|ParameterField)[]):ParameterForm=>({id,name,family,parts,fields:parts.filter((p):p is ParameterField=>typeof p!=='string')});
export const parameterForms:readonly ParameterForm[]=[
 make('linear','linear','Gradient–intercept',f('m','Gradient m'),'x + ',f('c','Intercept c')),
 make('linear','point-slope','Point–slope',f('m','Gradient m'),'(x − ',f('h','Point x-coordinate h'),') + ',f('k','Point y-coordinate k')),
 make('quadratic','quadratic','Expanded',f('a','Quadratic coefficient a'),'x² + ',f('b','Linear coefficient b'),'x + ',f('c','Constant c')),
 make('quadratic','factorised','Factorised','(',f('a','First x coefficient a'),'x + ',f('b','First constant b'),')(',f('c','Second x coefficient c'),'x + ',f('d','Second constant d'),')'),
 make('quadratic','vertex','Completed square',f('a','Scale a'),'(x − ',f('h','Turning point x-coordinate h'),')² + ',f('k','Turning point y-coordinate k')),
 make('quadratic','roots','Root form',f('a','Scale a'),'(x − ',f('r','First root'),')(x − ',f('s','Second root'),')'),
 make('cubic','cubic','Expanded',f('a','Cubic coefficient a'),'x³ + ',f('b','Quadratic coefficient b'),'x² + ',f('c','Linear coefficient c'),'x + ',f('d','Constant d')),
 make('cubic','shifted-cubic','Shifted cubic',f('a','Scale a'),'(x − ',f('h','Horizontal shift h'),')³ + ',f('k','Vertical shift k')),
 make('cubic','cubic-roots','Factorised',f('a','Scale a'),'(x − ',f('r','First root'),')(x − ',f('s','Second root'),')(x − ',f('t','Third root'),')'),
 make('reciprocal','reciprocal','Reciprocal',f('a','Numerator a'),' / (x − ',f('h','Vertical asymptote h'),') + ',f('k','Horizontal asymptote k')),
 make('reciprocal','reciprocal-affine','Linear denominator',f('a','Numerator a'),' / (',f('b','Denominator x coefficient b'),'x + ',f('c','Denominator constant c'),') + ',f('k','Vertical shift k')),
 make('exponential','exponential','General base',f('a','Scale a'),' × ',f('b','Base b'),'^(',f('p','Exponent coefficient p'),'x + ',f('q','Exponent constant q'),') + ',f('k','Vertical shift k')),
 make('exponential','simple-exponential','Base form',f('a','Scale a'),' × ',f('b','Base b'),'ˣ + ',f('k','Vertical shift k')),
 make('exponential','natural-exponential','Natural exponential',f('a','Scale a'),' e^(',f('p','Exponent coefficient p'),'x + ',f('q','Exponent constant q'),') + ',f('k','Vertical shift k')),
 make('exponential','simple-natural-exponential','Natural growth',f('a','Scale a'),' e^(',f('p','Exponent coefficient p'),'x) + ',f('k','Vertical shift k')),
 ...(['log','ln'] as const).map(name=>make('logarithmic',name,name==='ln'?'Natural logarithm':'Base 10 logarithm',f('a','Scale a'),name+'(',f('b','Argument coefficient b'),'x + ',f('c','Argument constant c'),') + ',f('k','Vertical shift k'))),
 ...(['sin','cos','tan'] as const).map(name=>make('wave',name,name,f('a','Amplitude / scale a'),name+'(',f('b','Frequency b'),'x + ',f('c','Phase c'),') + ',f('k','Vertical shift k')))
];
export function formsFor(family:CannonType){return parameterForms.filter(p=>p.family===family);}
// Formula captions come from the same parts as the actual input fields,
// so the selected form cannot disagree with the equation shown to students.
export function formFormula(form:ParameterForm):string{return 'y = '+form.parts.map(part=>typeof part==='string'?part:part.id).join('');}
export type ParameterValues=Readonly<Record<string,string>>;
export type FormDrafts=Readonly<Record<string,ParameterValues>>;
export function validParameter(value:string,family:CannonType):boolean{
 const s=value.trim().replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/π/g,'pi');
 if(!s||s.length>45||! /^(?:[0-9.()+*/^\s-]|pi|e)+$/.test(s))return false;
 let depth=0;for(const ch of s){if(ch==='(')depth++;else if(ch===')'&&--depth<0)return false;}if(depth!==0)return false;
 try{
  if(!/[a-z]/i.test(s)){const q=parseLinearEquation('('+s+')');return q.exactGradient.numerator==='0';}
  if(['linear','quadratic','cubic'].includes(family))return false;
  parseCannonEquation('exp(x)+('+s+')','exponential');return true;
 }catch{return false;}
}
export function parameterEquation(form:ParameterForm,values:ParameterValues):string{
 if(form.fields.every(p=>!(values[p.id]??'').trim()))return '';
 // Multiplication and grouping are explicit. In particular a fractional
 // or negative coefficient never accidentally binds to an exponent.
 const raw=(id:string)=>{const v=values[id]??'';return validParameter(v,form.family)?'('+v.trim()+')':'?';};
 const a=raw('a'),b=raw('b'),c=raw('c'),d=raw('d'),h=raw('h'),k=raw('k'),p=raw('p'),q=raw('q');
 switch(form.id){
  case 'linear':return raw('m')+'*x+'+c;
  case 'point-slope':return raw('m')+'*(x-'+h+')+'+k;
  case 'quadratic':return a+'*x²+'+b+'*x+'+c;
  case 'factorised':return '('+a+'*x+'+b+')*('+c+'*x+'+d+')';
  case 'vertex':return a+'*(x-'+h+')²+'+k;
  case 'roots':return a+'*(x-'+raw('r')+')*(x-'+raw('s')+')';
  case 'cubic':return a+'*x³+'+b+'*x²+'+c+'*x+'+d;
  case 'shifted-cubic':return a+'*(x-'+h+')³+'+k;
  case 'cubic-roots':return a+'*(x-'+raw('r')+')*(x-'+raw('s')+')*(x-'+raw('t')+')';
  case 'reciprocal':return a+'/(x-'+h+')+'+k;
  case 'reciprocal-affine':return a+'/('+b+'*x+'+c+')+'+k;
  case 'exponential':return a+'*'+b+'^('+p+'*x+'+q+')+'+k;
  case 'simple-exponential':return a+'*'+b+'^x+'+k;
  case 'natural-exponential':return a+'*exp('+p+'*x+'+q+')+'+k;
  case 'simple-natural-exponential':return a+'*exp('+p+'*x)+'+k;
  default:return a+'*'+form.id+'('+b+'*x+'+c+')+'+k;
 }
}
const abs=(n:bigint)=>n<0n?-n:n;
function gcd(a:bigint,b:bigint):bigint{a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a||1n;}
// Arrow and on-screen step controls change an exact value by one (Shift:
// one tenth). Fractions remain fractions instead of rounded floats.
export function stepParameter(value:string,direction:1|-1,fine=false):string{
 const s=value.trim();if(!s)return fine?(direction===1?'0.1':'-0.1'):String(direction);
 try{
  if(!validParameter(s,'linear'))return value;
  const e=parseLinearEquation('('+s+')'),n=BigInt(e.exactIntercept.numerator),d=BigInt(e.exactIntercept.denominator),t=fine?10n:1n;
  const top=n*t+BigInt(direction)*d,bottom=d*t,g=gcd(top,bottom),num=top/g,den=bottom/g;
  const result=den===1n?String(num):num+'/'+den;
  return result.length<=45?result:value;
 }catch{return value;}
}
export function polynomialParameters(text:string,family:CannonType):ParameterValues|undefined{
 if(!['linear','quadratic','cubic'].includes(family)||!text.trim())return undefined;
 try{
  const e=parseCannonEquation(text,family),coefficients=isAdvanced(e)?e.coefficients:equationCoefficients(e),form=formsFor(family)[0];
  if(!coefficients||coefficients.length!==form.fields.length)return undefined;
  return Object.fromEntries(form.fields.map((field,i)=>{const c=coefficients[i];return [field.id,c.denominator==='1'?c.numerator:c.numerator+'/'+c.denominator];}));
 }catch{return undefined;}
}
