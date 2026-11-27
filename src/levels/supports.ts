import type {Point} from '../engine/coordinates';
import {CANNON_FOOTPRINT,EXIT_FOOTPRINT} from '../game/anchorArtGeometry';
import type {Level,Obstacle,SupportKind,SupportSpec} from './schema';
export interface Deck {readonly minX:number;readonly maxX:number;readonly y:number}
export interface SupportSegment {readonly from:Point;readonly to:Point;readonly role:'brace'|'hanger'}
export interface SupportPlan{
 readonly id:string;readonly kind:SupportKind;readonly anchor:Point;
 readonly deck:Deck;readonly terrainId?:string;readonly attachment:readonly [Point,Point];
 readonly segments:readonly SupportSegment[];readonly backgroundRoof:boolean;
 readonly direction:1|-1;
}
const EPS=1e-8;
const point=(x:number,y:number):Point=>({x,y});
const clamp=(x:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,x));
const width=(d:Deck)=>d.maxX-d.minX;
const centre=(d:Deck)=>(d.minX+d.maxX)/2;
const deckEnds=(d:Deck)=>[point(d.minX+.055,d.y),point(d.maxX-.055,d.y)] as const;
const line=(from:Point,to:Point,role:SupportSegment['role']='brace'):SupportSegment=>({from,to,role});
function platformPlan(level:Level,id:string,anchor:Point,deck:Deck,direction:1|-1,terrain:Obstacle):SupportPlan|undefined{
 const r=terrain.bounds,gap=deck.y-r.maxY;
 // The attachment has to reach real terrain below the artwork.
 if(gap<-EPS||r.maxX<deck.minX-.40||r.minX>deck.maxX+.40)return undefined;
 // Spread the feet across the available ledge, even if the cannon's
 // rearward deck only overlaps its near edge (the early meadow levels).
 const inset=Math.min(.025,(r.maxX-r.minX)*.12),half=Math.min(.32,(r.maxX-r.minX-2*inset)/2);
 const mid=clamp(centre(deck),r.minX+inset+half,r.maxX-inset-half);
 const attachment=[point(mid-half,r.maxY),point(mid+half,r.maxY)] as const;
 const [left,right]=deckEnds(deck);
 const segments=[line(left,attachment[0]),line(right,attachment[1])];
 // Open truss, not a new opaque wall. One diagonal braces a longer mount.
 if(gap>.42)segments.push(line(left,attachment[1]));
 return {id,anchor,deck,direction,kind:'platform',terrainId:terrain.id,attachment,segments,backgroundRoof:false};
}
function wallPlan(id:string,anchor:Point,deck:Deck,direction:1|-1,o:Obstacle):SupportPlan|undefined{
 const r=o.bounds,left=r.maxX<=deck.minX+EPS,right=r.minX>=deck.maxX-EPS;
 if(!left&&!right)return undefined;
 const x=left?r.maxX:r.minX,gap=left?deck.minX-x:x-deck.maxX;
 if(gap>1.35||r.minY>deck.y-.09)return undefined;
 const upper=Math.min(deck.y-.06,r.maxY-.025),lower=Math.max(r.minY+.025,upper-.62);
 if(upper<=lower+EPS||deck.y-upper>1.3)return undefined;
 const attachment=[point(x,upper),point(x,lower)] as const;
 const [a,b]=deckEnds(deck),near=left?a:b,far=left?b:a;
 return {id,anchor,deck,direction,kind:'wall',terrainId:o.id,attachment,segments:[line(near,attachment[0]),line(far,attachment[0]),line(far,attachment[1])],backgroundRoof:false};
}
function suspendedPlan(level:Level,id:string,anchor:Point,deck:Deck,direction:1|-1,terrain?:Obstacle):SupportPlan|undefined{
 // Put the hangers outside the body, not on the moving barrel. The
 // top termination is a real ceiling face or a background roof at the
 // upper scene boundary. No fake solid ceiling is introduced.
 const [a,b]=deckEnds(deck),roof=terrain?.bounds.minY??level.bounds.maxY;
 if(roof<anchor.y+.70||terrain&&(a.x<terrain.bounds.minX-EPS||b.x>terrain.bounds.maxX+EPS))return undefined;
 const attachment=[point(a.x,roof),point(b.x,roof)] as const;
 return {id,anchor,deck,direction,kind:'suspended',terrainId:terrain?.id,attachment,segments:[line(a,attachment[0],'hanger'),line(b,attachment[1],'hanger')],backgroundRoof:!terrain};
}
function resolve(level:Level,id:string,anchor:Point,direction:1|-1,override?:SupportSpec):SupportPlan{
 const b=level.bounds,isExit=id==='exit';
 const rawMin=isExit?anchor.x-EXIT_FOOTPRINT.halfWidth-.10:anchor.x+Math.min(-CANNON_FOOTPRINT.back*direction,-CANNON_FOOTPRINT.front*direction)-.08;
 const rawMax=isExit?anchor.x+EXIT_FOOTPRINT.halfWidth+.10:anchor.x+Math.max(-CANNON_FOOTPRINT.back*direction,-CANNON_FOOTPRINT.front*direction)+.08;
 const deck:Deck={minX:Math.max(b.minX,rawMin),maxX:Math.min(b.maxX,rawMax),y:anchor.y-(isExit?EXIT_FOOTPRINT.drop:CANNON_FOOTPRINT.drop)};
 if(width(deck)<.16||deck.y<b.minY-EPS)throw Error(level.id+': artwork has no support room at '+id);
 const terrain=override?.terrainId?level.obstacles.find(o=>o.id===override.terrainId):undefined;
 if(override?.terrainId&&!terrain)throw Error(level.id+': missing support terrain '+override.terrainId);
 const platforms=level.obstacles.flatMap(o=>{
  const p=platformPlan(level,id,anchor,deck,direction,o);
  if(!p)return [];
  const gap=deck.y-o.bounds.maxY;
  const centreDistance=Math.abs(anchor.x-(o.bounds.minX+o.bounds.maxX)/2);
  // Prefer the small authored ledge directly under the anchor over a
  // nearby unrelated gate. A close floor is still a perfectly good mount.
  const authored=o.kind==='platform'&&anchor.x>=o.bounds.minX-EPS&&anchor.x<=o.bounds.maxX+EPS&&centreDistance<.75;
  const score=gap+Math.abs(centre(deck)-(p.attachment[0].x+p.attachment[1].x)/2)*.35-(authored?2:0);
  return [{p,score,gap}];
 }).sort((a,b)=>a.score-b.score||a.p.terrainId!.localeCompare(b.p.terrainId!));
 let result:SupportPlan|undefined;
 if(override?.kind==='platform')result=terrain?platformPlan(level,id,anchor,deck,direction,terrain):platforms[0]?.p;
 else if(override?.kind==='wall')result=terrain&&wallPlan(id,anchor,deck,direction,terrain);
 else if(override?.kind==='suspended'){
  const expanded={...deck,minX:Math.max(b.minX,deck.minX-.10),maxX:Math.min(b.maxX,deck.maxX+.10)};
  result=suspendedPlan(level,id,anchor,expanded,direction,terrain);
 }else {
  // Avoid tall columns from the ground when a short overhead mount is
  // more believable. Existing authored perches are preserved even in
  // steep-curve levels, whose substantial clearance is intentional.
  const best=platforms[0];
  if(best&&best.gap<=4.05)result=best.p;
  if(!result){
   const expanded={...deck,minX:Math.max(b.minX,deck.minX-.10),maxX:Math.min(b.maxX,deck.maxX+.10)};
   const overhead=level.obstacles.filter(o=>o.bounds.minY>=anchor.y+.70).sort((a,b)=>a.bounds.minY-b.bounds.minY);
   for(const o of overhead){result=suspendedPlan(level,id,anchor,expanded,direction,o);if(result)break;}
   result??=suspendedPlan(level,id,anchor,expanded,direction);
   result??=best?.p;
  }
 }
 if(!result)throw Error(level.id+': no valid visual support for '+id);
 return result;
}
// Pure geometry, calculated once per mounted level, independent of the
// student's equation, mode, camera, cosmetic and animation state.
export function levelSupports(level:Level):readonly SupportPlan[]{
 return [...level.cannons.map(c=>resolve(level,c.id,c.position,c.direction,level.supports?.[c.id])),resolve(level,'exit',level.exit,1,level.supports?.exit)];
}
