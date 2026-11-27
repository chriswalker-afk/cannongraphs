import type {Level} from './schema';
import {floor,platform,wall} from './terrain';
// Unscored practice only. Never added to the regular catalogue or progress.
// Different anchors from the scored first level and the first relay.
const bounds={minX:0,maxX:10,minY:0,maxY:8};
export const firstFlightTutorial:Level={
 id:'tutorial-first-flight',world:1,title:'Flight school',objective:'Learn to read coordinates, programme two cannons and guide Pips to the exit.',
 bounds,creatures:5,startId:'A',
 cannons:[{id:'A',type:'linear',position:{x:1,y:3},direction:1},{id:'B',type:'linear',position:{x:4,y:6},direction:1}],
 exit:{x:8,y:2},
 obstacles:[floor(bounds),platform('launch-ledge',.65,1.45,1.75,2.05),platform('relay-ledge',3.65,4.45,4.75,5.05),platform('exit-ledge',7.65,8.45,.75,1.05),wall('practice-wall',2.45,2.7,.4,3.25)]
};
