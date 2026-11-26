import {EquationError,parseCubicCoefficients,parseFlightEquation,evaluateEquation,equationCoefficients,isQuadratic,type FlightEquation,type RationalCoefficient} from './linear';
import type {CannonType} from '../../game/cannons';
export type AdvancedFamily=Exclude<CannonType,'linear'|'quadratic'>;
type Primitive='inverse'|'exp'|'ln'|'sin'|'cos'|'tan';
type Expr={kind:'number';value:number}|{kind:'x'}|{kind:'unary';op:string;arg:Expr}|{kind:'binary';op:string;left:Expr;right:Expr}|{kind:'call';name:string;arg:Expr};
type Affine={m:number;c:number};
interface Shape {primitive:Primitive;m:number;c:number;scale:number;shift:number}
export interface AdvancedEquation {
 readonly family:AdvancedFamily;readonly key:string;readonly coefficients?:readonly RationalCoefficient[];
 readonly primitive?:Primitive;
 valueAt(x:number):number;
 slopeAt(x:number):number;
 // Undefined means no finite domain endpoint in the firing direction.
 domainEdge(x:number,direction:1|-1):{x:number;limit:number}|undefined;
 definedAt(x:number):boolean;
 // Strictly interior extrema; domain must be continuous between endpoints.
 criticalXs(from:number,to:number):readonly number[];
}
export type CannonEquation=FlightEquation|AdvancedEquation;
export function isAdvanced(e:CannonEquation):e is AdvancedEquation{return 'family' in e;}
export function equationFamily(e:CannonEquation):CannonType{return isAdvanced(e)?e.family:isQuadratic(e)?'quadratic':'linear';}
export function evaluateCannonEquation(e:CannonEquation,x:number):number{return isAdvanced(e)?e.valueAt(x):evaluateEquation(e,x);}
export function cannonEquationKey(e:CannonEquation):string{return isAdvanced(e)?e.key:equationFamily(e)+':'+equationCoefficients(e).map(r=>r.numerator+'/'+r.denominator).join('|');}
const syntax=(message:string):never=>{throw new EquationError('syntax',message);};
const familyError=():never=>{throw new EquationError('nonlinear','Use a single transformed function of this cannon’s family, with constants and a linear argument.');};
const domain=(message:string):never=>{throw new EquationError('domain',message);};
const bounded=(n:number):number=>{
 if(!Number.isFinite(n)||Math.abs(n)>1e6)throw new EquationError('complexity','Use finite parameters with magnitude at most 1,000,000.');
 return n===0?0:n;
};
const nonzero=(n:number):number=>{
 if(Math.abs(n)<1e-8)throw new EquationError('complexity','Use nonzero scale and argument parameters of magnitude at least 0.00000001.');
 return bounded(n);
};
function tokenize(input:string):string[]{
 if(input.length>180)throw new EquationError('complexity','Try a shorter equation.');
 let s=input.trim().toLowerCase().replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/²/g,'^2').replace(/³/g,'^3').replace(/π/g,'pi');
 if(s.includes('=')){const a=s.split('=');if(a.length!==2||a[0].trim()!=='y')syntax('Write y = expression in x.');s=a[1].trim();}
 if(!s)throw new EquationError('empty','Enter the expression after y =.');
 const tokens:string[]=[];
 while(s.length){
  if(/^\s/.test(s)){s=s.slice(1);continue;}
  const m=/^(?:\d+(?:\.\d*)?|\.\d+|sin|cos|tan|exp|ln|log|pi|e|x|[+*/^()-])/.exec(s);
  if(!m)syntax('Use numbers, x, brackets, pi, e and supported function names only.');
  tokens.push(m![0]);s=s.slice(m![0].length);
  if(tokens.length>128)throw new EquationError('complexity','Try a shorter equation.');
 }
 return [...tokens,'end'];
}
class Parser{
 private i=0;
 constructor(private readonly tokens:string[]){}
 private peek(){return this.tokens[this.i];}
 private take(){return this.tokens[this.i++];}
 parse(){const e=this.sum();if(this.peek()!=='end')syntax('Check brackets and operations.');return e;}
 private sum():Expr{let e=this.product();while(['+','-'].includes(this.peek())){const op=this.take();e={kind:'binary',op,left:e,right:this.product()};}return e;}
 private product():Expr{
  let e=this.unary();
  while(true){
   const token=this.peek(),explicit=token==='*'||token==='/';
   if(!explicit&&!['x','(','pi','e','sin','cos','tan','exp','ln','log'].includes(token))break;
   const op=explicit?this.take():'*';e={kind:'binary',op,left:e,right:this.unary()};
  }return e;
 }
 private unary():Expr{if(['+','-'].includes(this.peek()))return {kind:'unary',op:this.take(),arg:this.unary()};return this.power();}
 private power():Expr{const e=this.atom();if(this.peek()!=='^')return e;this.take();return {kind:'binary',op:'^',left:e,right:this.unary()};}
 private atom():Expr{
  const t=this.take();
  if(t==='x')return {kind:'x'};
  if(t==='e'||t==='pi'||/^\d|^\./.test(t))return {kind:'number',value:bounded(t==='e'?Math.E:t==='pi'?Math.PI:Number(t))};
  if(t==='('){const e=this.sum();if(this.take()!==')')syntax('Close the bracket.');return e;}
  if(['sin','cos','tan','exp','ln','log'].includes(t)){if(this.take()!=='(')syntax('Put the function argument in brackets.');const arg=this.sum();if(this.take()!==')')syntax('Close the function bracket.');return {kind:'call',name:t,arg};}
  return syntax('Expected a number, x, function or bracket.');
 }
}
// Recognize affine arithmetic without evaluating arbitrary variable expressions.
function affine(e:Expr):Affine|null{
 if(e.kind==='number')return {m:0,c:e.value};
 if(e.kind==='x')return {m:1,c:0};
 if(e.kind==='unary'){const a=affine(e.arg);return a?{m:e.op==='-'?-a.m:a.m,c:e.op==='-'?-a.c:a.c}:null;}
 if(e.kind==='call')return null;
 const a=affine(e.left),b=affine(e.right);if(!a||!b)return null;
 switch(e.op){
  case '+':return {m:bounded(a.m+b.m),c:bounded(a.c+b.c)};
  case '-':return {m:bounded(a.m-b.m),c:bounded(a.c-b.c)};
  case '*':return a.m&&b.m?null:{m:bounded(a.m*b.c+b.m*a.c),c:bounded(a.c*b.c)};
  case '/':if(b.m)return null;if(!b.c)return domain('Division by zero is undefined.');return {m:bounded(a.m/b.c),c:bounded(a.c/b.c)};
  case '^':if(!b.m&&b.c===1)return a;if(a.m||b.m)return null;if(a.c===0&&b.c<=0)return domain('This power is undefined.');return {m:0,c:bounded(a.c**b.c)};
 }return null;
}
const constant=(e:Expr):number|null=>{const a=affine(e);return a&&a.m===0?a.c:null;};
function shape(e:Expr):Shape{
 if(e.kind==='unary'){const a=shape(e.arg);return e.op==='-'?{...a,scale:-a.scale,shift:-a.shift}:a;}
 if(e.kind==='call'){
  const a=affine(e.arg);if(!a||!a.m)return familyError();
  const primitive=(e.name==='log'?'ln':e.name) as Primitive;
  return {primitive,m:a.m,c:a.c,scale:e.name==='log'?1/Math.LN10:1,shift:0};
 }
 if(e.kind!=='binary')return familyError();
 const a=constant(e.left),b=constant(e.right);
 if(e.op==='/'&&a!==null){
  const denominator=affine(e.right);
  if(denominator&&denominator.m)return {primitive:'inverse',m:denominator.m,c:denominator.c,scale:a,shift:0};
 }
 if(e.op==='^'){
  if(a!==null){const exponent=affine(e.right);if(exponent&&exponent.m){
   if(a<=0||a===1)return domain('An exponential base must be positive and not equal to 1.');
   return {primitive:'exp',m:exponent.m*Math.log(a),c:exponent.c*Math.log(a),scale:1,shift:0};
  }}
  if(b===-1){const argument=affine(e.left);if(argument&&argument.m)return {primitive:'inverse',m:argument.m,c:argument.c,scale:1,shift:0};}
 }
 if(a!==null&&b!==null)return familyError();
 if(b!==null){
  const f=shape(e.left);
  if(e.op==='+'||e.op==='-')return {...f,shift:f.shift+(e.op==='+'?b:-b)};
  if(e.op==='*')return {...f,scale:f.scale*b,shift:f.shift*b};
  if(e.op==='/'){if(!b)return domain('Division by zero is undefined.');return {...f,scale:f.scale/b,shift:f.shift/b};}
 }
 if(a!==null){
  const f=shape(e.right);
  if(e.op==='+')return {...f,shift:a+f.shift};
  if(e.op==='-')return {...f,scale:-f.scale,shift:a-f.shift};
  if(e.op==='*')return {...f,scale:f.scale*a,shift:f.shift*a};
 }
 return familyError();
}
function periodicXs(m:number,c:number,offset:number,step:number,from:number,to:number):number[]{
 const lo=Math.min(from,to),hi=Math.max(from,to),a=Math.min(m*lo+c,m*hi+c),b=Math.max(m*lo+c,m*hi+c);
 const first=Math.ceil((a-offset)/step),last=Math.floor((b-offset)/step);
 if(last-first>8192)throw new EquationError('complexity','Too many oscillations across this level.');
 const xs:number[]=[];for(let k=first;k<=last;k++){const x=(offset+k*step-c)/m;if(x>lo&&x<hi)xs.push(x);}
 return xs.sort((x,y)=>x-y);
}
function cubic(input:string):AdvancedEquation{
 const coefficients=parseCubicCoefficients(input),[a,b,c,d]=coefficients.map(r=>Number(r.numerator)/Number(r.denominator));
 for(const k of [a,b,c,d])bounded(k);nonzero(a);
 const delta=b*b-3*a*c;
 // Stable quadratic formula for the derivative roots.
 let roots:number[]=[];
 if(delta===0)roots=[-b/(3*a)];
 else if(delta>0){const q=-b-(b>=0?1:-1)*Math.sqrt(delta);roots=q===0?[0,-2*b/(3*a)]:[q/(3*a),c/q];}
 return {family:'cubic',key:'cubic:'+coefficients.map(r=>r.numerator+'/'+r.denominator).join('|'),coefficients,
  definedAt:Number.isFinite,valueAt:x=>((a*x+b)*x+c)*x+d,slopeAt:x=>(3*a*x+2*b)*x+c,domainEdge:()=>undefined,
  criticalXs:(from,to)=>roots.filter(x=>x>Math.min(from,to)&&x<Math.max(from,to)).sort((x,y)=>x-y)};
}
function transformed(input:string,family:Exclude<AdvancedFamily,'cubic'>):AdvancedEquation{
 const f=shape(new Parser(tokenize(input)).parse());
 const expected:Record<Exclude<AdvancedFamily,'cubic'>,Primitive[]>={reciprocal:['inverse'],exponential:['exp'],logarithmic:['ln'],wave:['sin','cos','tan']};
 if(!expected[family].includes(f.primitive))return familyError();
 const {primitive}=f,m=nonzero(f.m),c=bounded(f.c),a=nonzero(f.scale),k=bounded(f.shift);
 if(primitive==='sin'||primitive==='cos'||primitive==='tan'){
  if(Math.abs(m)>32||Math.abs(c)>1e4)throw new EquationError('complexity','Use a trigonometric frequency at most 32 radians per unit and a phase at most 10,000 radians.');
 }
 const u=(x:number)=>m*x+c,root=-c/m;
 // Compare against the same representable pole used for branch limits.
 const poleIndex=(x:number)=>Math.round((u(x)-Math.PI/2)/Math.PI);
 const poleX=(i:number)=>(Math.PI/2+i*Math.PI-c)/m;
 const definedAt=(x:number)=>{
  if(!Number.isFinite(x))return false;
  if(primitive==='inverse')return x!==root&&u(x)!==0;
  if(primitive==='ln')return u(x)>0&&x!==root;
  if(primitive==='tan')return Math.abs(x-poleX(poleIndex(x)))>4*Number.EPSILON*Math.max(1,Math.abs(x));
  return true;
 };
 const valueAt=(x:number)=>{
  if(!definedAt(x))return NaN;
  const z=u(x);
  switch(primitive){
   case 'inverse':return a/z+k;case 'exp':return a*Math.exp(z)+k;case 'ln':return a*Math.log(z)+k;
   case 'sin':return a*Math.sin(z)+k;case 'cos':return a*Math.cos(z)+k;case 'tan':return a*Math.tan(z)+k;
  }
 };
 const slopeAt=(x:number)=>{
  const z=u(x);
  switch(primitive){
   case 'inverse':return -a*m/(z*z);case 'exp':return a*m*Math.exp(z);case 'ln':return a*m/z;
   case 'sin':return a*m*Math.cos(z);case 'cos':return -a*m*Math.sin(z);case 'tan':return a*m/(Math.cos(z)**2);
  }
 };
 return {family,key:JSON.stringify([family,primitive,m,c,a,k]),primitive,definedAt,valueAt,slopeAt,
  domainEdge(x,direction){
   if(primitive==='inverse'||primitive==='ln'){
    if((root-x)*direction<=0)return undefined;
    return {x:root,limit:primitive==='ln'?-Math.sign(a)*Infinity:-Math.sign(a*m*direction)*Infinity};
   }
   if(primitive==='tan'){
    const z=(u(x)-Math.PI/2)/Math.PI,step=m*direction>0?1:-1;
    let i=step===1?Math.floor(z)+1:Math.ceil(z)-1,edge=poleX(i);
    if((edge-x)*direction<=0){i+=step;edge=poleX(i);}
    return {x:edge,limit:Math.sign(a*m*direction)*Infinity};
   }
   return undefined;
  },
  criticalXs(from,to){return primitive==='sin'?periodicXs(m,c,Math.PI/2,Math.PI,from,to):primitive==='cos'?periodicXs(m,c,0,Math.PI,from,to):[];}
 };
}
export function parseCannonEquation(input:string,family:CannonType):CannonEquation{
 return family==='linear'||family==='quadratic'?parseFlightEquation(input,family):family==='cubic'?cubic(input):transformed(input,family);
}
