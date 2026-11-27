import {test} from 'node:test';
import assert from 'node:assert/strict';
import {levels,worlds} from '../src/levels/catalog';
import {emptyProgress,recordCompletion,getRecord,recordStars,decodeProgress,parseProgress,mergeProgress,summarizeProgress,type Progress} from '../src/game/progress';
import {achievements,achievementDefinitions,earnedAchievementIds,newlyEarned} from '../src/game/achievements';
import {createProgressStore,PROGRESS_KEY,LEGACY_PROGRESS_KEY,type ProgressStorage} from '../src/game/progressStore';
import {modeBudget,type LearningMode} from '../src/game/learningModes';
import {createLevelState,beginAttempt,finishAttempt,advanceCelebration,finishCelebration,restartLevel,type LevelState} from '../src/game/levelState';
import {parseCannonEquation} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import type {Level} from '../src/levels/schema';
import {originalCurriculum} from '../src/game/originalCurriculum';
const l=levels[0],l2=levels[1],plan=(expression:string)=>new Map([['A',parseCannonEquation(expression,'linear')]]);
const win=simulateRoute(l,plan('x')),fail=simulateRoute(l,plan('x+1')),win2=simulateRoute(l2,plan('2x'));
function attempt(s:LevelState,r=fail){const launched=beginAttempt(s,r);return finishAttempt(launched,launched.active!.id);}
function completed(mode:LearningMode,failures=0,level=l,result=win){
 let s=createLevelState(modeBudget(mode,level),1,mode==='cadet');
 for(let i=0;i<failures;i++)s=attempt(s);
 s=attempt(s,result);
 if(s.celebration){const {id,count}=s.celebration;s=advanceCelebration(s,id,count,count);s=finishCelebration(s,id);}
 assert.equal(s.phase,'success');return s;
}
function save(p:Progress,mode:LearningMode,failures=0){return recordCompletion(p,l,mode,completed(mode,failures));}
const fixture=(rows:Record<string,unknown>)=>decodeProgress({version:1,records:rows});
const memoryStorage=()=>{
 const data=new Map<string,string>();let writes=0;
 return {data,storage:{getItem:key=>data.get(key)??null,setItem(key,value){writes++;data.set(key,value);}} satisfies ProgressStorage,writes:()=>writes};
};
test('empty progress is genuinely empty and contains no earned achievements',()=>{
 const p=emptyProgress(),s=summarizeProgress(p);
 assert.equal(s.total,72);assert.equal(s.completed,0);assert.equal(s.gems,0);assert.ok(s.gemTotal>30);
 assert.equal(earnedAchievementIds(p).size,0);assert.equal(achievementDefinitions.length,15);
 assert.equal(new Set(achievementDefinitions.map(a=>a.id)).size,15);
});
test('planning, launch, retry, game over, provisional gems and incomplete celebrations never award progress',()=>{
 const p=emptyProgress(),fresh=createLevelState(5);
 const flying=beginAttempt(fresh,win),celebrating=finishAttempt(flying,flying.active!.id);
 assert.equal(celebrating.phase,'celebrating');
 let exhausted=fresh;for(let i=0;i<5;i++)exhausted=attempt(exhausted);
 assert.equal(exhausted.phase,'gameOver');
 for(const s of [fresh,flying,attempt(fresh),exhausted,celebrating,advanceCelebration(celebrating,celebrating.celebration!.id,4,3),restartLevel(exhausted)]){
  assert.equal(recordCompletion(p,l,'pilot',s),p);
 }
 assert.equal(recordCompletion(p,l,'pilot',completed('ace')),p);
 assert.equal(recordCompletion(p,l,'pilot',completed('cadet')),p);
 assert.equal(recordCompletion(p,l2,'pilot',completed('pilot')),p);
 assert.equal(recordCompletion(p,{...l,id:'not-playable'},'pilot',completed('pilot')),p);
});
test('completed successful routes persist independent mode records and derive the correct best stars',()=>{
 let p=save(emptyProgress(),'cadet',9);p=save(p,'pilot',2);p=save(p,'ace',2);
 assert.equal(getRecord(p,l.id,'cadet')!.bestAttempts,10);
 assert.equal(recordStars(getRecord(p,l.id,'cadet'),l,'cadet'),null);
 assert.equal(recordStars(getRecord(p,l.id,'pilot'),l,'pilot'),2);
 assert.equal(recordStars(getRecord(p,l.id,'ace'),l,'ace'),1);
 const s=summarizeProgress(p);assert.equal(s.completed,1);assert.equal(s.gems,l.gems!.length);
 for(const mode of ['cadet','pilot','ace'] as const){assert.equal(s.modes[mode].completed,1);assert.equal(s.modes[mode].gems,l.gems!.length);}
 assert.equal(s.modes.cadet.stars,0);assert.equal(s.modes.pilot.stars,2);assert.equal(s.modes.ace.stars,1);
});
test('better replays improve records, identical/worse replays preserve object identity and cannot multiply stars or gems',()=>{
 const first=save(emptyProgress(),'pilot',3),better=save(first,'pilot',0);
 assert.notEqual(first,better);assert.equal(recordStars(getRecord(first,l.id,'pilot'),l,'pilot'),1);
 assert.equal(getRecord(better,l.id,'pilot')!.bestAttempts,1);
 assert.equal(recordStars(getRecord(better,l.id,'pilot'),l,'pilot'),3);
 assert.equal(save(better,'pilot',0),better);assert.equal(save(better,'pilot',4),better);
 assert.equal(summarizeProgress(better).gems,l.gems!.length);
});
test('cumulative unique gem IDs merge independently of the best flight rating, without cross-mode double counting',()=>{
 const [g1,g2]=l.gems!.map(g=>g.id);
 const a=fixture({[l.id]:{pilot:{bestAttempts:1,gems:[g1]}}});
 const b=fixture({[l.id]:{pilot:{bestAttempts:4,gems:[g2]},ace:{bestAttempts:1,gems:[g1]}}});
 const merged=mergeProgress(a,b);
 assert.deepEqual(getRecord(merged,l.id,'pilot'),{bestAttempts:1,gems:[g1,g2]});
 assert.deepEqual(getRecord(merged,l.id,'ace'),{bestAttempts:1,gems:[g1]});
 assert.equal(summarizeProgress(merged).gems,2);assert.equal(summarizeProgress(merged).modes.pilot.gems,2);
 assert.equal(mergeProgress(merged,a),merged);assert.deepEqual(mergeProgress(b,a),merged);
 const actual=save(a,'pilot',2);assert.deepEqual(getRecord(actual,l.id,'pilot'),{bestAttempts:1,gems:[g1,g2]});
});
test('achievement unlocks are derived, stable and announced only once per newly satisfied condition',()=>{
 const before=emptyProgress(),after=save(before,'pilot'),unlocked=newlyEarned(before,after).map(a=>a.id);
 assert.deepEqual(new Set(unlocked),new Set(['first-flight','perfect-pilot','first-gem','treasure-map']));
 assert.deepEqual(newlyEarned(after,save(after,'pilot')),[]);
 assert.ok(!earnedAchievementIds(after).has('perfect-ace'));
 const ace=save(after,'ace');assert.deepEqual(newlyEarned(after,ace).map(a=>a.id),['perfect-ace']);
 assert.equal(achievements(ace).find(a=>a.id==='gem-collector')!.current,l.gems!.length);
});
test('world achievements require twelve distinct completions in a single mode, not mixed mode totals',()=>{
 const rows=Object.fromEntries(worlds[0].levels.map((level,i)=>[level.id,{[i%2?'pilot':'ace']:{bestAttempts:1,gems:[]}}]));
 const mixed=fixture(rows),s=summarizeProgress(mixed,worlds[0].levels);
 assert.equal(s.completed,12);assert.equal(s.modes.pilot.completed,6);assert.equal(s.modes.ace.completed,6);
 assert.ok(!earnedAchievementIds(mixed).has('world-explorer'));
 const full=fixture(Object.fromEntries(worlds[0].levels.map(level=>[level.id,{ace:{bestAttempts:1,gems:[]}}])));
 assert.ok(earnedAchievementIds(full).has('world-explorer'));assert.ok(earnedAchievementIds(full).has('ace-world'));
 assert.ok(!earnedAchievementIds(full).has('graphiverse-explorer'));
});
test('all-catalog progress and thresholds use distinct levels and level-scoped unique gems',()=>{
 const p=fixture(Object.fromEntries(levels.map((level,i)=>[level.id,{[i%2?'pilot':'ace']:{bestAttempts:1,gems:(level.gems??[]).map(g=>g.id)}}])));
 const s=summarizeProgress(p),earned=earnedAchievementIds(p);
 assert.equal(s.completed,72);assert.equal(s.gems,s.gemTotal);assert.equal(s.modes.pilot.stars+s.modes.ace.stars,216);
 for(const id of ['first-flight','pilot-wings','ace-wings','star-collector','gem-collector','gem-explorer','relay-runner','graphiverse-explorer'])assert.ok(earned.has(id),id);
 assert.ok(!earned.has('cadet-wings'));assert.ok(!earned.has('world-explorer'));
});
test('storage decoding rejects malformed versions, unknown ids, invalid attempt counts and bogus gems',()=>{
 for(const raw of [null,'','{','null','[]','{"version":2,"records":{}}','{"version":1,"records":[]}'])assert.deepEqual(parseProgress(raw),emptyProgress());
 const [g1,g2]=l.gems!.map(g=>g.id);
 const p=fixture({[l.id]:{pilot:{bestAttempts:0,gems:[g1]},ace:{bestAttempts:4,gems:[g1]},cadet:{bestAttempts:12,gems:[g2,g2,10,'wrong',g1]},unknown:{bestAttempts:1,gems:[g1]}},[l2.id]:{pilot:{bestAttempts:1.5,gems:[]}},'unknown-level':{ace:{bestAttempts:1,gems:[]}}});
 assert.deepEqual(p.records,{[l.id]:{cadet:{bestAttempts:12,gems:[g1,g2]}}});
 assert.deepEqual(parseProgress(JSON.stringify(p)),p);
});
test('persistent store writes only meaningful improvements and survives reload',()=>{
 const mem=memoryStorage(),store=createProgressStore(mem.storage);
 assert.equal(mem.writes(),0);assert.equal(store.complete(l,'pilot',createLevelState(5)).improved,false);assert.equal(mem.writes(),0);
 const a=store.complete(l,'pilot',completed('pilot',1));
 assert.ok(a.persisted&&a.improved);assert.ok(a.unlocked.some(b=>b.id==='first-flight'));assert.equal(mem.writes(),1);
 assert.deepEqual(createProgressStore(mem.storage).read(),a.after);
 const replay=store.complete(l,'pilot',completed('pilot',3));assert.ok(!replay.improved);assert.equal(mem.writes(),1);assert.deepEqual(replay.unlocked,[]);
 assert.equal(JSON.parse(mem.data.get(PROGRESS_KEY)!).version,1);
});
test('storage denial and quota failure preserve in-memory progress and retry dirty records on the next completion',()=>{
 const noStorage=createProgressStore();assert.equal(noStorage.persisted(),false);
 assert.equal(noStorage.complete(l,'ace',completed('ace')).persisted,false);
 assert.ok(getRecord(noStorage.read(),l.id,'ace'));
 const mem=memoryStorage();let blocked=true;
 const flaky=createProgressStore({getItem:key=>mem.storage.getItem(key),setItem(key,value){if(blocked)throw new Error('quota');mem.storage.setItem(key,value);}});
 const first=flaky.complete(l,'pilot',completed('pilot'));assert.equal(first.persisted,false);assert.ok(getRecord(flaky.read(),l.id,'pilot'));assert.equal(flaky.persisted(),false);
 blocked=false;const retry=flaky.complete(l,'pilot',completed('pilot'));assert.ok(retry.persisted);assert.ok(!retry.improved);assert.deepEqual(retry.unlocked,[]);
 assert.deepEqual(createProgressStore(mem.storage).read(),retry.after);
 const denied=createProgressStore({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});
 assert.equal(denied.persisted(),false);assert.ok(!denied.complete(l,'cadet',completed('cadet')).persisted);
});
test('sequential tabs merge new levels and retain stronger records without overwriting each other',()=>{
 const mem=memoryStorage(),a=createProgressStore(mem.storage),b=createProgressStore(mem.storage);
 a.complete(l,'pilot',completed('pilot'));
 b.complete(l2,'ace',completed('ace',0,l2,win2));
 a.complete(l,'pilot',completed('pilot',2));
 const latest=createProgressStore(mem.storage).read();
 assert.equal(getRecord(latest,l.id,'pilot')!.bestAttempts,1);assert.equal(getRecord(latest,l2.id,'ace')!.bestAttempts,1);
 assert.deepEqual(b.read(),latest);assert.equal(summarizeProgress(latest).completed,2);
});

test('legacy curriculum migration preserves existing earned cosmetics, not redesigned puzzle completions',()=>{
 const mem=memoryStorage();
 const old=Object.fromEntries(originalCurriculum.filter(l=>l.world===1).map(l=>[l.id,{ace:{bestAttempts:1,gems:(l.gems??[]).map(g=>g.id)}}]));
 const raw=JSON.stringify({version:1,records:old});
 mem.data.set(LEGACY_PROGRESS_KEY,raw);
 const p=createProgressStore(mem.storage).read();
 assert.equal(summarizeProgress(p,worlds[0].levels).completed,6);
 assert.ok(!getRecord(p,'1-r05','ace'));
 assert.ok(getRecord(p,'1-10','ace'));assert.equal(getRecord(p,'1-01','ace')!.gems.length,2);
 assert.ok(earnedAchievementIds(p).has('ace-world'));assert.ok(earnedAchievementIds(p).has('world-explorer'));assert.ok(earnedAchievementIds(p).has('star-collector'));
 assert.equal(mem.data.get(LEGACY_PROGRESS_KEY),raw);assert.ok(mem.data.get(PROGRESS_KEY));
 assert.deepEqual(createProgressStore(mem.storage).read(),p);
});
test('stored historic achievement IDs are whitelisted and survive merging without changing level records',()=>{
 const a=fixture({'1-01':{pilot:{bestAttempts:1,gems:[]}}});
 const b=decodeProgress({version:1,records:{},retainedAchievements:['ace-world','fake','ace-world']});
 const merged=mergeProgress(a,b);assert.deepEqual(merged.records,a.records);assert.deepEqual(merged.retainedAchievements,['ace-world']);
 assert.ok(earnedAchievementIds(merged).has('ace-world'));
 assert.equal(summarizeProgress(merged).completed,1);assert.equal(mergeProgress(merged,b),merged);
});

test('quadratic curriculum update retains completed unchanged puzzles and earned badges but not retired completion credit',()=>{
 const mem=memoryStorage();
 const historic=originalCurriculum.filter(l=>l.world===3||l.world===4);
 const old=Object.fromEntries(historic.map(l=>[l.id,{ace:{bestAttempts:1,gems:(l.gems??[]).map(g=>g.id)}}]));
 mem.data.set(PROGRESS_KEY,JSON.stringify({version:1,records:old,retainedAchievements:['ace-world','world-explorer','star-collector','gem-collector']}));
 const p=createProgressStore(mem.storage).read();
 for(const w of worlds.slice(2,4)){
  assert.equal(summarizeProgress(p,w.levels).completed,5);
  for(const l of w.levels)assert.equal(!!getRecord(p,l.id,'ace'),!l.id.includes('-r'),l.id);
 }
 assert.equal(getRecord(p,'3-01','ace')!.gems.length,2);
 assert.ok(!getRecord(p,'3-r04','ace'));assert.ok(!getRecord(p,'4-r12','ace'));
 for(const id of ['ace-world','world-explorer','star-collector','gem-collector'])assert.ok(earnedAchievementIds(p).has(id));
});
