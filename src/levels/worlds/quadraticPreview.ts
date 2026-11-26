import type {Level} from '../schema';
import {floor,wall,platform} from '../terrain';
const bounds={minX:0,maxX:13,minY:0,maxY:9};
// A provisional preview for the new engine, replaced by the curriculum in PR15.
export const quadraticPreview:Level={
 id:'3-01',world:3,title:'Over the rainbow',objective:'Use a quadratic arch and then a straight line to reach the exit.',bounds,creatures:5,startId:'A',
 cannons:[{id:'A',type:'quadratic',position:{x:1,y:2},direction:1},{id:'B',type:'linear',position:{x:7,y:2},direction:1}],
 exit:{x:11,y:4},obstacles:[floor(bounds),wall('arch-wall',3,5,.4,4.6),platform('launch-ledge',.35,1.5,.65,.95),platform('relay-ledge',6.65,7.6,.65,.95),platform('exit-ledge',10.5,11.6,2.75,3.05)]
};
