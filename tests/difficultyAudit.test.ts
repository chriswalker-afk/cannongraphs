import {test} from 'node:test';
import assert from 'node:assert/strict';
import {worlds,levels} from '../src/levels/catalog';
import {difficultyTiers,levelTiers,tierForCount} from '../src/levels/progression';
import {summarizeLevel} from '../src/game/levelSelection';
import {auditDifficulty,difficultyReport} from './helpers/difficultyAudit';
test('tier metadata and catalog order agree across all six worlds; incorrect counts fail instead of silently reordering',()=>{
 assert.deepEqual(difficultyTiers.map(t=>t.name),['Introduction','Development','Challenge','Mastery']);
 assert.equal(new Set(difficultyTiers.map(t=>t.accent)).size,4);
 for(const w of worlds){
  const groups=levelTiers(w.levels);
  assert.deepEqual(groups.flatMap(g=>g.entries.map(e=>e.level)),w.levels);
  for(const [i,g] of groups.entries()){
   assert.equal(g.tier,tierForCount(i+1));assert.equal(g.entries.length,3);
   assert.deepEqual(g.entries.map(e=>e.number),[3*i+1,3*i+2,3*i+3]);
   for(const e of g.entries){assert.equal(summarizeLevel(e.level).tier,g.tier);assert.equal(summarizeLevel(e.level).index,e.number);}
  }
 }
 const w=worlds[0];assert.throws(()=>levelTiers(w.levels.slice(0,11)),/12 regular levels/);
 const wrong=[...w.levels];[wrong[2],wrong[3]]=[wrong[3],wrong[2]];
 assert.throws(()=>levelTiers(wrong),/must have 1 cannon/);
 assert.throws(()=>tierForCount(5),/Unsupported/);
});
test('complete curriculum audit measures reference difficulty factors and all supports, gems and navigation',()=>{
 const rows=auditDifficulty();assert.equal(rows.length,72);assert.deepEqual(rows.map(r=>r.id),levels.map(l=>l.id));
 assert.equal(rows.reduce((n,r)=>n+r.cannons,0),180);
 assert.equal(rows.reduce((n,r)=>n+r.supports,0),252);
 assert.equal(rows.reduce((n,r)=>n+r.gems,0),levels.reduce((n,l)=>n+(l.gems?.length??0),0));
 assert.ok(rows.every(r=>Number.isFinite(r.minClearance)&&r.minClearance>0&&r.routeLength>0&&r.distinctEquations>=1));
 assert.ok(rows.filter(r=>r.world===1).every(r=>r.fractionalPolynomialLegs===0));
 assert.ok(rows.some(r=>r.world===2&&r.fractionalPolynomialLegs>0));
 assert.ok(rows.some(r=>r.world===2&&r.directionChanges>0));
 assert.ok(rows.some(r=>r.world===4&&r.fractionalPolynomialLegs>0&&r.nonIntegerAnchors>0));
 assert.ok(rows.some(r=>r.world===5&&r.interiorCriticalPoints>=2));
 assert.ok(rows.some(r=>r.world===6&&r.review.includes('exact-coordinate note')));
 const report=difficultyReport(rows);assert.match(report,/72 levels · 180 cannons · 252 supported targets/);
 assert.ok(rows.every(r=>report.includes(r.id)));
 console.log('Progression audit: '+rows.length+' levels, 180 cannons, 252 supported targets, '+rows.reduce((n,r)=>n+r.gems,0)+' gems, minimum extra clearance '+Math.min(...rows.map(r=>r.minClearance)).toFixed(3)+' units.');
 console.log('Progression advisory review flags: '+rows.filter(r=>r.review.length).length+' levels; '+rows.filter(r=>r.review.includes('tight clearance')).length+' tight, '+rows.filter(r=>r.review.includes('large graph: check labels/zoom')).length+' large graphs, '+rows.filter(r=>r.review.includes('repeated reference equation')).length+' repeated equations.');
});
