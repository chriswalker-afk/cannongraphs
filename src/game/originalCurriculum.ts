import type {ProgressLevel} from './progress';
// Frozen PR33 progress metadata, not playable puzzles or answers. It lets
// us evaluate historic badges from the original on-device v1 records even
// after Worlds 3–6 are revised. Retired records never count as new levels.
const cannonCounts=[
 [1,1,1,1,1,1,1,1,1,2,3,4],
 [1,1,1,1,1,1,1,1,1,2,3,4],
 [1,1,1,1,1,1,1,1,1,2,2,4],
 [1,1,1,1,1,1,1,1,1,3,3,5],
 [1,1,1,1,1,1,1,1,1,1,2,4],
 [1,1,1,1,1,1,1,1,1,1,3,7]
];
const gemCounts=[
 [2,0,0,0,0,2,0,0,0,2,0,0],
 [2,0,0,0,0,0,0,2,0,0,0,4],
 [2,0,0,0,0,2,0,0,0,2,0,4],
 [1,0,0,0,0,0,0,2,0,0,4,5],
 [2,2,2,1,3,2,1,1,2,1,3,6],
 [2,2,1,1,1,1,2,3,2,1,6,11]
];
export const originalCurriculum:readonly ProgressLevel[]=cannonCounts.flatMap((counts,w)=>counts.map((count,i)=>({
 id:(w+1)+'-'+String(i+1).padStart(2,'0'),world:w+1,creatures:5,
 cannons:Array.from({length:count},()=>null),
 gems:Array.from({length:gemCounts[w][i]},(_,j)=>({id:'gem-'+(j+1)}))
})));
