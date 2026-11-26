// Keep small numerical misses visible instead of rounding them to zero.
export function feedbackNumber(n:number):string{
 if(n===0)return '0';
 if(!Number.isFinite(n))return String(n);
 const a=Math.abs(n);
 return a<1e-5||a>=1e9?Number(n.toPrecision(10)).toString():Number(n.toPrecision(12)).toString();
}
export function feedbackPoint(p:{x:number;y:number}):string{return '('+feedbackNumber(p.x)+', '+feedbackNumber(p.y)+')';}
