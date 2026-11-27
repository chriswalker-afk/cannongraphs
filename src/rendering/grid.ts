// Unit grid geometry and label density are independent. Even when the
// viewport is small or zoomed, each integer coordinate retains a grid line.
export function integerTicks(lo:number,hi:number):number[]{
 const result:number[]=[];
 for(let k=Math.ceil(lo-1e-9);k<=hi+1e-9;k++)result.push(k===0?0:k);
 return result;
}
export function labelStep(scale:number):number{
 if(!Number.isFinite(scale)||scale<=0)return 1;
 return Math.max(1,Math.ceil(28/scale));
}
export function gridTicks(lo:number,hi:number,scale:number){
 const step=labelStep(scale),units=integerTicks(lo,hi);
 return {units,labels:units.filter(k=>k%step===0),step};
}
