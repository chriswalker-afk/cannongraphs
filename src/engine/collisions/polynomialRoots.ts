// Roots of low-degree polynomials in [0,1]. Derivative roots partition the
// interval into monotone pieces, so tangencies are not missed by sign sampling.
// Coefficients are ascending powers. No fixed frame/grid sampling is used.
export function polynomialValue(p:readonly number[],x:number):number{
 let v=0;for(let i=p.length-1;i>=0;i--)v=v*x+p[i];return v;
}
export function polynomialDerivative(p:readonly number[]):number[]{return p.slice(1).map((v,i)=>v*(i+1));}
export function uniqueParameters(values:readonly number[]):number[]{
 return [...new Set(values.filter(t=>Number.isFinite(t)&&t>=0&&t<=1))].sort((a,b)=>a-b);
}
export function rootsInUnitInterval(coefficients:readonly number[]):number[]{
 const p=[...coefficients];while(p.length>1&&p[p.length-1]===0)p.pop();
 if(p.length<2)return [];
 const scale=Math.max(...p.map(Math.abs));if(!Number.isFinite(scale)||scale===0)throw new RangeError('Invalid polynomial');
 const q=p.map(v=>v/scale);
 if(q.length===2){const t=-q[0]/q[1];return t>=0&&t<=1?[t]:[];}
 const knots=uniqueParameters([0,...rootsInUnitInterval(polynomialDerivative(q)),1]),roots:number[]=[];
 const value=(t:number)=>polynomialValue(q,t);
 // Relative roundoff at each t, not an arbitrary tolerance scaled by the
 // largest coefficient: this preserves small roots near t=0.
 const zero=(t:number,v:number)=>Math.abs(v)<=32*Number.EPSILON*q.reduce((sum,c,i)=>sum+Math.abs(c)*t**i,0);
 for(const t of knots)if(zero(t,value(t)))roots.push(t);
 for(let i=1;i<knots.length;i++){
  let lo=knots[i-1],hi=knots[i],f=value(lo),g=value(hi);
  if(f===0||g===0||Math.sign(f)===Math.sign(g))continue;
  // 256 iterations also cover the parser's bounded but very small coefficients.
  for(let k=0;k<256;k++){
   const mid=lo+(hi-lo)/2;if(mid===lo||mid===hi)break;
   const m=value(mid);if(m===0){lo=hi=mid;break;}
   if(Math.sign(m)===Math.sign(f)){lo=mid;f=m;}else hi=mid;
  }
  roots.push(lo+(hi-lo)/2);
 }
 return uniqueParameters(roots);
}
