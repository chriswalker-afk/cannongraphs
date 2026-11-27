// Solved platform heights are test-only; the shipped catalogue is unchanged.
import type {Level} from '../../src/levels/schema';
import {repositionLift} from '../../src/game/movableCannons';
const heights:Readonly<Record<string,readonly number[]>>={
 'foundry-linear-1':[2],'foundry-linear-2':[6],'foundry-linear-3':[3],
 'foundry-linear-4':[5,2],'foundry-linear-5':[6],'foundry-linear-6':[6,2],
 'foundry-quadratic-7':[3],'foundry-quadratic-8':[4],'foundry-quadratic-9':[4,4],
 'foundry-quadratic-10':[5],'foundry-quadratic-11':[5,3,3],'foundry-quadratic-12':[4,2]
};
export function referenceLayout(level:Level):Level{
 const lifts=level.cannons.filter(c=>c.lift),ys=heights[level.id];
 if(!lifts.length)return level;
 if(!ys||ys.length!==lifts.length)throw Error('Missing lift reference for '+level.id);
 return lifts.reduce((layout,c,i)=>repositionLift(layout,c.id,ys[i]),level);
}
