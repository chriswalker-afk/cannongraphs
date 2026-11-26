import type {Level} from '../schema';
import {floor,wall,platform} from '../terrain';
// Small engine previews only. PR19 and PR20 will replace them with complete
// curricula and their distinct environments.
const factoryBounds={minX:0,maxX:11,minY:-1,maxY:8};
export const factoryPreview:Level={
 id:'5-01',world:5,title:'Gearshift relay',objective:'Use a cubic curve and a reciprocal branch.',bounds:factoryBounds,creatures:5,startId:'A',
 cannons:[{id:'A',type:'cubic',position:{x:1,y:1},direction:1},{id:'B',type:'reciprocal',position:{x:5,y:5},direction:1}],
 exit:{x:9,y:3},obstacles:[floor(factoryBounds),wall('gear-wall',2.8,3.2,-.6,2),platform('launch-ledge',.8,1.2,-.5,-.2),platform('relay-ledge',4.85,5.15,3.5,3.8),platform('exit-ledge',8.7,9.3,1.9,2.2)]
};
const universeBounds={minX:0,maxX:18,minY:0,maxY:10};
export const universePreview:Level={
 id:'6-01',world:6,title:'Signals beyond',objective:'Combine exponential growth, a logarithm and a wave (radians).',bounds:universeBounds,creatures:5,startId:'A',
 cannons:[{id:'A',type:'exponential',position:{x:1,y:2},direction:1},{id:'B',type:'logarithmic',position:{x:3,y:5},direction:1},{id:'C',type:'wave',position:{x:12,y:6},direction:1}],
 exit:{x:16,y:6},obstacles:[floor(universeBounds),platform('launch-ledge',.8,1.2,.65,.9),platform('relay-ledge',2.85,3.15,3.4,3.65),platform('wave-ledge',11.85,12.15,4.1,4.4),platform('exit-ledge',15.85,16.15,4.1,4.4)]
};
