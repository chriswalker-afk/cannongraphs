import type {Level} from '../schema';
// The launch/capture points are exact world coordinates, not sprite centres.
export const meadowPreview:Level={id:'1-01',world:1,title:'First flight',objective:'Explore a straight-line route',bounds:{minX:0,maxX:12,minY:0,maxY:8},creatures:5,startId:'A',cannons:[{id:'A',type:'linear',position:{x:1,y:1},direction:1}],exit:{x:6,y:6},obstacles:[{id:'floor',kind:'floor',bounds:{minX:0,maxX:12,minY:0,maxY:0.4}},{id:'exit-ledge',kind:'platform',bounds:{minX:5.85,maxX:6.65,minY:5.20,maxY:5.50}},{id:'meadow-wall',kind:'wall',bounds:{minX:8.5,maxX:9.5,minY:0.4,maxY:2.5}},{id:'floating-ledge',kind:'platform',bounds:{minX:10,maxX:11.5,minY:3,maxY:3.4}}]};

// A separate routing preview; the original single-cannon level remains available.
export const meadowRelay:Level={id:'1-02',world:1,title:'Cannon relay',objective:'Program both cannons, then make one continuous journey.',bounds:{minX:0,maxX:12,minY:0,maxY:8},creatures:5,startId:'A',cannons:[
 {id:'A',type:'linear',position:{x:1,y:1},direction:1},
 {id:'B',type:'linear',position:{x:5,y:5},direction:1}
],exit:{x:10,y:2},obstacles:[
 {id:'floor',kind:'floor',bounds:{minX:0,maxX:12,minY:0,maxY:.4}},
 {id:'relay-ledge',kind:'platform',bounds:{minX:4.25,maxX:5.25,minY:3.45,maxY:3.85}},
 {id:'exit-ledge',kind:'platform',bounds:{minX:9.8,maxX:10.7,minY:1.25,maxY:1.48}}
]};
// Intended route: y=x, then y=-3x/5+8. The platform under B is behind
// the muzzle and sufficiently low to leave clearance for the incoming line.
