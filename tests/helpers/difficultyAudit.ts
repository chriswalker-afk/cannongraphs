// Test/authoring only. Never import reference answers into the runtime UI.
import {worlds,levelPosition,nextLevel,levels} from '../../src/levels/catalog';
import {levelTiers} from '../../src/levels/progression';
import {referenceSolutions} from '../fixtures/referenceSolutions';
import {auditSolution} from '../../src/levels/qa';
import {levelSupports} from '../../src/levels/supports';
import {waitingCrewSlots} from '../../src/animations/waitingCrew';
import {parseCannonEquation,cannonEquationKey,isAdvanced} from '../../src/engine/equations/advanced';
import {isQuadratic,equationCoefficients} from '../../src/engine/equations/linear';
import {bankedGems} from '../../src/animations/gemTimeline';
import {modeObjective,learningModes} from '../../src/game/learningModes';
import type {CannonType} from '../../src/game/cannons';

export interface DifficultyAuditRow{
 readonly world:number;readonly number:number;readonly id:string;readonly title:string;
 readonly tier:string;readonly cannons:number;readonly families:readonly CannonType[];
 readonly distinctEquations:number;readonly fractionalPolynomialLegs:number;
 readonly nonIntegerAnchors:number;readonly leftwardLegs:number;readonly directionChanges:number;
 readonly interiorCriticalPoints:number;readonly terrainPieces:number;readonly routeLength:number;
 readonly minClearance:number;readonly gems:number;readonly supports:number;
 readonly xSpan:number;readonly ySpan:number;readonly review:readonly string[];
}
function require(condition:unknown,context:string):asserts condition{if(!condition)throw Error(context);}
export function auditDifficulty():readonly DifficultyAuditRow[]{
 const rows:DifficultyAuditRow[]=[];
 for(const [wi,w] of worlds.entries()){
  require(referenceSolutions[wi]?.length===w.levels.length,w.name+': mismatched fixture count');
  for(const {tier,entries} of levelTiers(w.levels))for(const {level:l,number} of entries){
   const ref=referenceSolutions[wi][number-1];
   require(Object.keys(ref).length===l.cannons.length&&l.cannons.every(c=>Object.hasOwn(ref,c.id)),l.id+': mismatched reference IDs');
   const {result,minimumClearance}=auditSolution(l,ref,l.cannons.map(c=>c.id));
   const supports=levelSupports(l),crew=waitingCrewSlots(l,l.creatures),gems=bankedGems(result).length;
   require(result.legs.length===tier.count,l.id+': incomplete route');
   require(supports.length===l.cannons.length+1,l.id+': unsupported target');
   require(crew.length===l.creatures,l.id+': insufficient crew staging');
   require(gems===(l.gems?.length??0),l.id+': unreachable reference gem');
   require(levelPosition(l.id)?.index===number,l.id+': numbering drift');
   require(nextLevel(l.id)===levels[rows.length+1],l.id+': progression navigation drift');
   if(l.exactCoordinateNote)for(const m of learningModes)require(modeObjective(m.id,l).includes(l.exactCoordinateNote),l.id+': missing exact note in '+m.id);
   const equations=l.cannons.map(c=>parseCannonEquation(ref[c.id],c.type));
   const distinctEquations=new Set(equations.map(cannonEquationKey)).size;
   const fractionalPolynomialLegs=equations.filter(e=>(isAdvanced(e)?e.coefficients:equationCoefficients(e))?.some(c=>c.denominator!=='1')).length;
   const interiorCriticalPoints=result.legs.reduce((n,leg,i)=>{
    const e=equations[i],lo=Math.min(leg.start.x,leg.end.x),hi=Math.max(leg.start.x,leg.end.x);
    if(isAdvanced(e))return n+e.criticalXs(lo,hi).length;
    if(!isQuadratic(e))return n;
    const x=-e.linear/(2*e.quadratic);return n+(x>lo&&x<hi?1:0);
   },0);
   const nonIntegerAnchors=[...l.cannons.map(c=>c.position),l.exit].filter(p=>!Number.isInteger(p.x)||!Number.isInteger(p.y)).length;
   const xSpan=l.bounds.maxX-l.bounds.minX,ySpan=l.bounds.maxY-l.bounds.minY;
   const directionChanges=l.cannons.filter((c,i)=>i>0&&c.direction!==l.cannons[i-1].direction).length;
   const review:string[]=[];
   if(minimumClearance<.06)review.push('tight clearance');
   if(xSpan>24||ySpan>18)review.push('large graph: check labels/zoom');
   if(distinctEquations<l.cannons.length)review.push('repeated reference equation');
   if(nonIntegerAnchors)review.push(l.exactCoordinateNote?'exact-coordinate note':'non-integer anchor: check readability');
   rows.push({world:w.number,number,id:l.id,title:l.title,tier:tier.name,cannons:tier.count,
    families:l.cannons.map(c=>c.type),distinctEquations,fractionalPolynomialLegs,nonIntegerAnchors,
    leftwardLegs:l.cannons.filter(c=>c.direction===-1).length,directionChanges,interiorCriticalPoints,
    terrainPieces:l.obstacles.length,routeLength:result.length,minClearance:minimumClearance,gems,supports:supports.length,xSpan,ySpan,review});
  }
 }
 return rows;
}
export function difficultyReport(rows:readonly DifficultyAuditRow[]):string{
 const n=(v:number)=>v.toFixed(3),min=Math.min(...rows.map(r=>r.minClearance));
 const out=['# Cannon Graphs! — difficulty progression audit','',
  'Generated from the actual catalogue and test-only reference routes. This is a structural and mathematical audit, not empirical student difficulty data. Clearance is additional distance beyond the Pip radius. Critical points and fractional polynomial legs describe the reference route, not a mandated answer. Review flags are advisory; actual visual/classroom assessment remains necessary.','',
  '**'+rows.length+' levels · '+rows.reduce((a,r)=>a+r.cannons,0)+' cannons · '+rows.reduce((a,r)=>a+r.supports,0)+' supported targets · '+rows.reduce((a,r)=>a+r.gems,0)+' collectible gems · minimum clearance '+n(min)+' units**','',
  '| World | 1 cannon | 2 cannons | 3 cannons | 4 cannons | Min clearance | Leftward legs | Direction changes |','|---|---:|---:|---:|---:|---:|---:|---:|'];
 for(const w of worlds){
  const group=rows.filter(r=>r.world===w.number);
  out.push('| '+w.name+' | '+[1,2,3,4].map(k=>group.filter(r=>r.cannons===k).length).join(' | ')+' | '+n(Math.min(...group.map(r=>r.minClearance)))+' | '+group.reduce((a,r)=>a+r.leftwardLegs,0)+' | '+group.reduce((a,r)=>a+r.directionChanges,0)+' |');
 }
 for(const w of worlds){
  out.push('','## '+w.name,'','| Level / ID | Tier | Families in flight order | Distinct equations | Fractional polynomial legs | Left / reversals | Critical points | Terrain | Grid span | Route length | Clearance | Gems | Review |','|---|---|---|---:|---:|---|---:|---:|---|---:|---:|---:|---|');
  for(const r of rows.filter(r=>r.world===w.number))out.push('| '+r.number+' · '+r.title+' ('+r.id+') | '+r.tier+' | '+r.families.join(' → ')+' | '+r.distinctEquations+' | '+r.fractionalPolynomialLegs+' | '+r.leftwardLegs+' / '+r.directionChanges+' | '+r.interiorCriticalPoints+' | '+r.terrainPieces+' | '+n(r.xSpan)+' × '+n(r.ySpan)+' | '+n(r.routeLength)+' | '+n(r.minClearance)+' | '+r.gems+' | '+(r.review.join('; ')||'—')+' |');
 }
 out.push('','Existing independent regression suites verify all 216 level/mode combinations, exact graph-family validation and direct forward shortcut exclusions. Neither the reference equations nor this audit module is imported into the game.');
 return out.join('\n')+'\n';
}
