import {worlds} from '../src/levels/catalog';
import {levelSupports} from '../src/levels/supports';
const totals={platform:0,suspended:0,wall:0};
console.log('| Level | Mounting audit |');
console.log('|---|---|');
for(const world of worlds)for(const l of world.levels){
 const supports=levelSupports(l);
 for(const s of supports)totals[s.kind]++;
 console.log('| '+l.id+' · '+l.title+' | '+[...supports.map(s=>s.id+': '+s.kind+' → '+(s.terrainId??'background roof')),...l.cannons.filter(c=>c.lift).map(c=>c.id+': lift rail '+c.lift!.minY+'–'+c.lift!.maxY)].join('; ')+' |');
}
console.log('\n'+Object.values(totals).reduce((a,b)=>a+b,0)+' static supports; '+worlds.flatMap(w=>w.levels).reduce((n,l)=>n+l.cannons.filter(c=>c.lift).length,0)+' movable rails: '+JSON.stringify(totals));
