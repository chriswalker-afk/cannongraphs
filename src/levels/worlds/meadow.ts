import type {Level} from '../schema';
import {floor,platform,wall} from '../terrain';
const bounds={minX:0,maxX:12,minY:0,maxY:8};
// The launch/capture points are exact world coordinates, not sprite centres.
export const meadowPreview:Level={id:'1-01',world:1,title:'First flight',objective:'Explore a straight-line route',bounds,creatures:5,startId:'A',cannons:[{id:'A',type:'linear',position:{x:1,y:1},direction:1}],exit:{x:6,y:6},obstacles:[floor(bounds),platform('exit-ledge',5.85,6.65,5.20,5.50),wall('meadow-wall',8.5,9.5,.4,2.5),platform('floating-ledge',10,11.5,3,3.4)]};

// A separate routing preview; the original single-cannon level remains available.
export const meadowRelay:Level={id:'1-02',world:1,title:'Cannon relay',objective:'Program both cannons, then make one continuous journey.',bounds,creatures:5,startId:'A',cannons:[
 {id:'A',type:'linear',position:{x:1,y:1},direction:1},
 {id:'B',type:'linear',position:{x:5,y:5},direction:1}
],exit:{x:10,y:2},obstacles:[
 floor(bounds),
 wall('relay-wall',2.7,3.2,.4,2.1),
 platform('relay-ledge',4.65,5.8,3.85,4.25),
 platform('exit-ledge',9.8,10.7,1.25,1.48)
]};
// Intended route: y=x, then y=-3x/5+8. The wall blocks the direct shortcut, and the ledge leaves clearance for both legs.
