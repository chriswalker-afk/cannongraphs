import type {Point} from '../engine/coordinates';
import {validateLevel,type Level} from '../levels/schema';
import type {AttemptResult} from '../engine/simulation/linearAttempt';
import {routeLegs} from '../engine/simulation/linearRoute';
import {anchorAssignments,materializeAnchorLayout,unplacedInventory,lockedAnchorEquation} from '../levels/anchorSpec';
import {isQuadratic} from '../engine/equations/linear';
import {simulateLinearAttempt} from '../engine/simulation/linearAttempt';
import {simulateQuadraticAttempt} from '../engine/simulation/quadraticAttempt';

export function playedLayout(authored:Level,played:Level):Level|undefined{
 // Reconstruct the only legal runtime change from the canonical design:
 // the y-coordinate of a lift. Reject changed rails, shapes, terrain,
 // direction, x positions or any other altered geometry.
 try{
  if(authored.anchorPuzzle){
   const canonical=materializeAnchorLayout(authored,anchorAssignments(played));
   if(unplacedInventory(canonical).length||JSON.stringify(canonical)!==JSON.stringify(played))return;
   validateLevel(canonical);return canonical;
  }
  const canonical:Level={...authored,cannons:authored.cannons.map(c=>{
   if(!c.lift)return c;
   const moved=played.cannons.find(other=>other.id===c.id);
   if(!moved)throw Error('Missing lift');
   return {...c,position:{x:c.position.x,y:moved.position.y}};
  })};
  if(JSON.stringify(canonical)!==JSON.stringify(played))return;
  validateLevel(canonical);
  return canonical;
 }catch{return;}
}

export function routeMatchesLayout(l:Level,r:AttemptResult):boolean{
 const start=l.cannons.find(c=>c.id===l.startId)!;
 const legs=routeLegs(r);
 if(l.anchorPuzzle&&(unplacedInventory(l).length||legs.length!==l.cannons.length||new Set(legs.map(leg=>leg.cannonId)).size!==l.cannons.length))return false;
 const near=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)<=1e-7;
 if(!legs.length||legs[0].cannonId!==start.id||legs.some((leg,i)=>{
  const c=l.cannons.find(c=>c.id===leg.cannonId);
  if(!c||leg.direction!==c.direction||!near(leg.source,c.position)||!near(leg.start,c.position))return true;
  const locked=lockedAnchorEquation(l,c);
  if(locked){
   // A matching endpoint alone is not proof that the immutable arc or line
   // was actually flown. Recompute its path and earliest collision/capture.
   const expected=isQuadratic(locked)?simulateQuadraticAttempt(locked,c,l):simulateLinearAttempt(locked,c,l);
   if(JSON.stringify(expected.event)!==JSON.stringify(leg.event)||!near(expected.end,leg.end)||!Number.isFinite(leg.length)||Math.abs(expected.length-leg.length)>1e-7)return true;
   for(const t of [.25,.5,.75])if(!near(expected.pointAt(t),leg.pointAt(t)))return true;
  }
  const next=legs[i+1];
  return next?leg.event.kind!=='cannon'||leg.event.cannonId!==next.cannonId||!near(leg.end,next.source):leg.event.kind!=='exit'||!near(leg.end,l.exit);
 }))return false;

 return true;
}
