// Bounded, exact rational polynomial arithmetic: never execute user text.
export type EquationErrorCode='empty'|'syntax'|'nonlinear'|'domain'|'complexity';
export class EquationError extends Error {
 constructor(public readonly code:EquationErrorCode,message:string){super(message);this.name='EquationError';}
}
type R={n:bigint;d:bigint};
type Poly=R[];
const ZERO:R={n:0n,d:1n},ONE:R={n:1n,d:1n};
const LIMIT=10n**60n,MAX_DEGREE=8;
const abs=(n:bigint)=>n<0n?-n:n;
function gcd(a:bigint,b:bigint):bigint{a=abs(a);b=abs(b);while(b){const r=a%b;a=b;b=r;}return a;}
function rational(n:bigint,d:bigint=1n):R{
 if(!d)throw new EquationError('domain','Division by zero is undefined.');
 if(!n)return ZERO;
 const g=gcd(n,d);n/=g;d/=g;if(d<0n){n=-n;d=-d;}
 if(abs(n)>LIMIT||d>LIMIT)throw new EquationError('complexity','These numbers are too large or too precise. Try a simpler form.');
 return {n,d};
}
const plus=(a:R,b:R)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
const neg=(a:R)=>({n:-a.n,d:a.d});
const times=(a:R,b:R)=>rational(a.n*b.n,a.d*b.d);
const divide=(a:R,b:R)=>rational(a.n*b.d,a.d*b.n);
const trim=(p:Poly):Poly=>{while(p.length>1&&p[p.length-1].n===0n)p.pop();return p;};
function add(a:Poly,b:Poly):Poly{return trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>plus(a[i]??ZERO,b[i]??ZERO)));}
function multiply(a:Poly,b:Poly):Poly{
 if(a.length+b.length-2>MAX_DEGREE)throw new EquationError('complexity','Use an expression of degree eight or less.');
 const out=Array<R>(a.length+b.length-1).fill(ZERO);
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)out[i+j]=plus(out[i+j],times(a[i],b[j]));
 return trim(out);
}
function power(a:Poly,b:Poly):Poly{
 if(b.length!==1||b[0].d!==1n)throw new EquationError('nonlinear','Use whole-number powers for this cannon.');
 const n=b[0].n;
 if(n<0n&&a.length!==1)throw new EquationError('domain','A variable in the denominator is not a polynomial defined for every x.');
 if(n>8n||n< -8n)throw new EquationError('complexity','Use powers between −8 and 8.');
 if(n===0n&&a.length===1&&a[0].n===0n)throw new EquationError('domain','Zero to the power zero is undefined here.');
 let out:Poly=[ONE];for(let i=0n;i<abs(n);i++)out=multiply(out,a);
 return n<0n?[divide(ONE,out[0])]:out;
}
function decimal(s:string):R{
 const parts=s.split('.'),a=parts[0]||'0',b=parts[1]??'';
 if(a.length+b.length>30)throw new EquationError('complexity','Use numbers with at most 30 digits.');
 return rational(BigInt(a+b),10n**BigInt(b.length));
}
type Token={kind:'number'|'x'|'+'|'-'|'*'|'/'|'^'|'('|')'|'end';value:string};
function tokenize(input:string):Token[]{
 if(input.length>180)throw new EquationError('complexity','The equation is too long. Try a shorter expression.');
 let s=input.trim().replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/²/g,'^2').replace(/³/g,'^3').toLowerCase();
 if(!s)throw new EquationError('empty','Enter an equation to program the cannon.');
 if(s.includes('=')){
  const parts=s.split('=');
  if(parts.length!==2||parts[0].trim()!=='y')throw new EquationError('syntax','Write the equation in the form y = expression in x.');
  s=parts[1].trim();
 }
 if(!s)throw new EquationError('empty','Enter the expression after y =.');
 const tokens:Token[]=[];
 for(let i=0;i<s.length;){
  if(/\s/.test(s[i])){i++;continue;}
  const number=/^(?:\d+(?:\.\d*)?|\.\d+)/.exec(s.slice(i));
  if(number){tokens.push({kind:'number',value:number[0]});i+=number[0].length;}
  else if('x+-*/^()'.includes(s[i])){tokens.push({kind:s[i] as Token['kind'],value:s[i]});i++;}
  else throw new EquationError('syntax','Use x, numbers, brackets and arithmetic operations only.');
  if(tokens.length>128)throw new EquationError('complexity','Try a shorter equation.');
 }
 tokens.push({kind:'end',value:''});return tokens;
}
class Parser {
 private i=0;
 constructor(private readonly tokens:Token[]){}
 private kind(){return this.tokens[this.i].kind;}
 private take(){return this.tokens[this.i++];}
 parse():Poly{const result=this.sum();if(this.kind()!=='end')throw new EquationError('syntax','Check for a missing operation or unmatched bracket.');return result;}
 private sum():Poly{
  let p=this.product();
  while(this.kind()==='+'||this.kind()==='-'){const op=this.take().kind,q=this.product();p=add(p,op==='-'?q.map(neg):q);}
  return p;
 }
 private product():Poly{
  let p=this.unary();
  while(true){
   const op=this.kind();
   if(op==='*'||op==='/'){
    this.take();const q=this.unary();
    if(op==='*')p=multiply(p,q);
    else{if(q.length!==1)throw new EquationError('domain','A variable denominator may make the flight path undefined. Use a constant denominator.');p=trim(p.map(a=>divide(a,q[0])));}
   }else if(op==='x'||op==='(')p=multiply(p,this.unary());
   else break;
  }
  return p;
 }
 private unary():Poly{
  if(this.kind()==='+'){this.take();return this.unary();}
  if(this.kind()==='-'){this.take();return this.unary().map(neg);}
  return this.exponent();
 }
 private exponent():Poly{const p=this.atom();if(this.kind()!=='^')return p;this.take();return power(p,this.unary());}
 private atom():Poly{
  const token=this.take();
  if(token.kind==='number')return [decimal(token.value)];
  if(token.kind==='x')return [ZERO,ONE];
  if(token.kind==='('){const p=this.sum();if(this.kind()!==')')throw new EquationError('syntax','Close the bracket.');this.take();return p;}
  throw new EquationError('syntax','Expected a number, x or an opening bracket.');
 }
}
export interface RationalCoefficient {numerator:string;denominator:string}
export interface LinearEquation {readonly gradient:number;readonly intercept:number;readonly exactGradient:RationalCoefficient;readonly exactIntercept:RationalCoefficient}
const coefficient=(r:R):RationalCoefficient=>({numerator:String(r.n),denominator:String(r.d)});
const numeric=(r:R)=>Number(r.n)/Number(r.d);
export function parseLinearEquation(input:string):LinearEquation{
 const p=new Parser(tokenize(input)).parse();
 if(p.length>2)throw new EquationError('nonlinear','This cannon needs a straight-line equation, not a curve.');
 const m=p[1]??ZERO,c=p[0];
 return {gradient:numeric(m),intercept:numeric(c),exactGradient:coefficient(m),exactIntercept:coefficient(c)};
}
export function evaluateLinear(e:LinearEquation,x:number):number{
 const y=e.gradient*x+e.intercept;if(!Number.isFinite(x)||!Number.isFinite(y))throw new RangeError('Non-finite flight coordinate');return y;
}

export interface QuadraticEquation {
 readonly quadratic:number;readonly linear:number;readonly constant:number;
 readonly exactQuadratic:RationalCoefficient;readonly exactLinear:RationalCoefficient;readonly exactConstant:RationalCoefficient;
}
export type FlightEquation=LinearEquation|QuadraticEquation;
export function isQuadratic(e:FlightEquation):e is QuadraticEquation{return 'quadratic' in e;}
export function parseQuadraticEquation(input:string):QuadraticEquation{
 const p=new Parser(tokenize(input)).parse();
 if(p.length!==3)throw new EquationError('nonlinear','This cannon needs a genuine quadratic equation (a nonzero x² term after simplifying).');
 const [c,b,a]=p;
 return {quadratic:numeric(a),linear:numeric(b),constant:numeric(c),exactQuadratic:coefficient(a),exactLinear:coefficient(b),exactConstant:coefficient(c)};
}
export function evaluateQuadratic(e:QuadraticEquation,x:number):number{
 const y=(e.quadratic*x+e.linear)*x+e.constant;
 if(!Number.isFinite(x)||!Number.isFinite(y))throw new RangeError('Non-finite flight coordinate');
 return y;
}
export function evaluateEquation(e:FlightEquation,x:number):number{return isQuadratic(e)?evaluateQuadratic(e,x):evaluateLinear(e,x);}
export function parseFlightEquation(input:string,family:'linear'|'quadratic'):FlightEquation{
 return family==='quadratic'?parseQuadraticEquation(input):parseLinearEquation(input);
}
export function equationCoefficients(e:FlightEquation):readonly RationalCoefficient[]{
 return isQuadratic(e)?[e.exactQuadratic,e.exactLinear,e.exactConstant]:[e.exactGradient,e.exactIntercept];
}
