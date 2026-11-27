import type {Gem,Level} from './schema';
// Optional authored challenges, independent of reference equations or scoring.
// Coordinates are world points, not pixel offsets or invisible trajectory hints.
const placements:Readonly<Record<string,readonly (readonly [number,number])[]>>={
 '1-01':[[3,3],[5,5]], '1-10':[[3,4],[7,4]],
 '2-01':[[6,3],[8,4]], '2-12':[[0,0],[0,4],[6,6],[10,2]],
 '1-r05':[[3,3],[7,5]], '1-r06':[[2.5,5],[5.5,5]], '1-r08':[[2.5,.5],[5.5,.5],[8.5,.5]],
 '1-r09':[[2.5,4],[6,5],[9.5,6]], '1-r10':[[3,5],[7,5],[11,3],[14.5,6]], '1-r11':[[2.5,5],[5.5,5],[8.5,6.5],[12,7]],
 '2-r05':[[-4,-1],[3,-1]], '2-r06':[[5,2],[2,3],[-7,3.5]], '2-r08':[[-5,0],[1,-.5],[7,-1]],
 '2-r09':[[-2,-1],[0,3],[3,6]], '2-r10':[[-6,-1],[0,-.5],[6,0],[12,1]], '2-r11':[[8,3],[2,2.5],[-4,2],[-10,1]],
 '3-01':[[2,4],[2.5,6.25]], '3-06':[[4,7],[5.5,5.875]], '3-10':[[4,6.5],[9,3]],
 '3-12':[[4,6.5],[10,-1],[16,6.5],[22,2]],
 '4-01':[[-3,4]], '4-08':[[2,-4],[3.5,-2.5]], '4-11':[[-2,-1],[-2,.5],[-2,4],[6,4]],
 '4-12':[[-9,4],[-3,-3],[3,0],[9,4],[15,-3]]
};
export function authoredGems(levelId:string):readonly Gem[]{
 return (placements[levelId]??[]).map(([x,y],i)=>({id:'gem-'+(i+1),position:{x,y}}));
}
export function withAuthoredGems(level:Level):Level{
 const gems=authoredGems(level.id);return gems.length?{...level,gems}:level;
}
