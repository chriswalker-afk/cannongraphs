import type {Level} from './schema';
import {createLevelFlightPlan,editPlan} from '../game/flightPlan';
import {parseLinearEquation} from '../engine/equations/linear';

// Deliberately separate from official records and catalogue progression.
// Both demos provide an editable incoming line to isolate anchor reasoning.
export const anchorDemos:readonly Level[]=[
 {id:'anchor-demo-linear',world:8,title:'First mounting',objective:'Place the broken cannon on a mount that both receives the Pip and sends it to the exit.',bounds:{minX:-1,maxX:9,minY:-1,maxY:7},creatures:5,startId:'A',
  cannons:[{id:'A',type:'linear',direction:1,position:{x:0,y:1}}],exit:{x:8,y:1},
  obstacles:[{id:'floor',kind:'floor',bounds:{minX:-1,maxX:9,minY:-1,maxY:-.6}}],
  anchorPuzzle:{anchors:[{id:'P',position:{x:2,y:3}},{id:'Q',position:{x:4,y:5}},{id:'R',position:{x:6,y:3}},{id:'S',position:{x:5,y:2}}],inventory:[{id:'B',type:'linear',direction:1,lockedShape:'-x'}]}},
 {id:'anchor-demo-arc',world:8,title:'Arc recovery',objective:'Mount the locked arc so the incoming flight connects, then clear the scrap furnace and reach the exit.',bounds:{minX:-1,maxX:9,minY:-1,maxY:8},creatures:5,startId:'A',
  cannons:[{id:'A',type:'linear',direction:1,position:{x:0,y:1}}],exit:{x:8,y:3},
  obstacles:[{id:'floor',kind:'floor',bounds:{minX:-1,maxX:9,minY:-1,maxY:-.6}},{id:'furnace',kind:'wall',bounds:{minX:5.6,maxX:6.4,minY:-.6,maxY:4.2}}],
  anchorPuzzle:{anchors:[{id:'P',position:{x:2,y:2}},{id:'Q',position:{x:4,y:3}},{id:'R',position:{x:6,y:5}},{id:'S',position:{x:7,y:2}}],inventory:[{id:'B',type:'quadratic',direction:1,lockedShape:'-x^2/2+6x'}]}}
];
export function initialAnchorDemoPlan(level:Level){
 const text=level.id==='anchor-demo-arc'?'y = x/2 + 1':'y = x + 1';
 return editPlan(createLevelFlightPlan(level),level.startId,{text,equation:parseLinearEquation(text)});
}
