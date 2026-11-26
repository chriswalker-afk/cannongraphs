import type {Level} from '../schema';
import {floor,wall,ceiling,platform,narrowPassage} from '../terrain';
const bounds={minX:0,maxX:12,minY:0,maxY:8};
export const wallPreview:Level={
 id:'1-03',world:1,title:'Over the wall',objective:'Clear the wall to reach the exit.',bounds,creatures:5,startId:'A',
 cannons:[{id:'A',type:'linear',position:{x:1,y:1},direction:1}],exit:{x:7,y:7},
 obstacles:[floor(bounds),wall('meadow-wall',3,4,.4,2.4),platform('exit-ledge',6.85,7.7,6.1,6.4)]
};
export const archPreview:Level={
 id:'1-04',world:1,title:'Under the arch',objective:'Fly beneath the ceiling and above the platform.',bounds,creatures:5,startId:'A',
 cannons:[{id:'A',type:'linear',position:{x:1,y:3},direction:1}],exit:{x:9,y:3},
 obstacles:[floor(bounds),ceiling('arch-roof',3,7,3.65,8),platform('arch-shelf',4,6,1.85,2.4),platform('launch-ledge',.25,1.75,2.15,2.45),platform('exit-ledge',8.8,9.7,2.15,2.45)]
};
export const passagePreview:Level={
 id:'1-05',world:1,title:'Thread the gap',objective:'Use the relay cannon to navigate the narrow passage.',bounds,creatures:5,startId:'A',
 cannons:[{id:'A',type:'linear',position:{x:1,y:2},direction:1},{id:'B',type:'linear',position:{x:5,y:6},direction:1}],
 exit:{x:10,y:6},
 obstacles:[floor(bounds),platform('launch-ledge',.25,1.75,1.05,1.4),platform('relay-ledge',4.65,5.8,4.6,5.0),
  ...narrowPassage('gate',{minX:6.5,maxX:8.5,minY:.4,maxY:8,gapBottom:5.6,gapTop:6.4}),
  platform('exit-ledge',9.8,10.7,5.15,5.45)]
};
export const terrainPreviews=[wallPreview,archPreview,passagePreview] as const;
