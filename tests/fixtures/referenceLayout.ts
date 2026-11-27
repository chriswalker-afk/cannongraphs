// Solved platform heights are test-only; the shipped catalogue is unchanged.
import type {Level} from '../../src/levels/schema';
import {repositionLift} from '../../src/game/movableCannons';
import {materializeAnchorLayout} from '../../src/levels/anchorSpec';
const heights:Readonly<Record<string,readonly number[]>>={
 'foundry-linear-1':[2],'foundry-linear-2':[6],'foundry-linear-3':[3],
 'foundry-linear-4':[5,2],'foundry-linear-5':[6],'foundry-linear-6':[6,2],
 'foundry-quadratic-7':[3],'foundry-quadratic-8':[4],'foundry-quadratic-9':[4,4],
 'foundry-quadratic-10':[5],'foundry-quadratic-11':[5,3,3],'foundry-quadratic-12':[4,2]
};
const mounts:Readonly<Record<string,readonly string[]>>={
 'salvage-linear-1':['Q'],'salvage-linear-2':['R'],'salvage-linear-3':['T'],'salvage-linear-4':['P','T'],'salvage-linear-5':['U','R'],'salvage-linear-6':['R','V'],
 'salvage-quadratic-7':['R'],'salvage-quadratic-8':['R','Q'],'salvage-quadratic-9':['Q','S'],'salvage-quadratic-10':['Q','R','S'],'salvage-quadratic-11':['R','P','T'],'salvage-quadratic-12':['P','Q','R']
};
export function referenceOrder(level:Level):readonly string[]{return level.id==='salvage-quadratic-11'?['A','C','B','D']:level.cannons.map(c=>c.id);}
export function referenceLayout(level:Level):Level{
 if(level.anchorPuzzle){const ids=mounts[level.id];if(!ids||ids.length!==level.anchorPuzzle.inventory.length)throw Error('Missing mount reference for '+level.id);return materializeAnchorLayout(level,new Map(level.anchorPuzzle.inventory.map((c,i)=>[c.id,ids[i]])));}
 const lifts=level.cannons.filter(c=>c.lift),ys=heights[level.id];
 if(!lifts.length)return level;
 if(!ys||ys.length!==lifts.length)throw Error('Missing lift reference for '+level.id);
 return lifts.reduce((layout,c,i)=>repositionLift(layout,c.id,ys[i]),level);
}
