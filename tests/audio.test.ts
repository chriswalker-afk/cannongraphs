import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_AUDIO,AUDIO_KEY,normalizeAudioSettings,parseAudioSettings,createAudioSettingsStore,type AudioSettings} from '../src/audio/settings';
import {createAudioPlayback,type AudioBackend,type AudioChannel,type AudioTicker} from '../src/audio/playback';
import {musicScores,musicStep,midiHz,type MusicTheme,type Note} from '../src/audio/music';
import {soundEffects,type SoundEffect} from '../src/audio/effects';
import {attemptSounds,rapidSounds,createSoundCursor} from '../src/audio/timeline';
import {FIRE_MS} from '../src/animations/launch';
import {flightDuration,attemptDuration} from '../src/animations/attempt';
import {routeDuration} from '../src/animations/routeAttempt';
import {gemTimeline} from '../src/animations/gemTimeline';
import {makeRapidSchedule} from '../src/animations/rapidFire';
import {levels} from '../src/levels/catalog';
import {parseCannonEquation} from '../src/engine/equations/advanced';
import {simulateRoute} from '../src/engine/simulation/linearRoute';
import type {ProgressStorage} from '../src/game/progressStore';
const l=levels[0],plan=(text:string)=>new Map([['A',parseCannonEquation(text,'linear')]]);
const win=simulateRoute(l,plan('x')),misfire=simulateRoute(l,plan('x+1'));
const relay=simulateRoute(levels.find(l=>l.id==='1-10')!,new Map([['A',parseCannonEquation('x+1','linear')],['B',parseCannonEquation('11-x','linear')]]));
const memory=()=>{
 const data=new Map<string,string>();let writes=0;
 const storage:ProgressStorage={getItem:key=>data.get(key)??null,setItem(key,value){data.set(key,value);writes++;}};
 return {data,storage,writes:()=>writes};
};
test('audio starts muted, validates/clamps preferences and saves independently of game progress',()=>{
 for(const raw of [null,'','{','null','[]','{"version":2,"settings":{}}'])assert.deepEqual(parseAudioSettings(raw),DEFAULT_AUDIO);
 assert.deepEqual(normalizeAudioSettings({muted:'false',music:Infinity,effects:-1}),{...DEFAULT_AUDIO,effects:0});
 assert.deepEqual(normalizeAudioSettings({muted:false,music:2,effects:.3}),{muted:false,music:1,effects:.3});
 const mem=memory();mem.data.set('cannon-graphs:progress:v1','untouched');
 const store=createAudioSettingsStore(mem.storage);assert.deepEqual(store.read(),DEFAULT_AUDIO);assert.equal(mem.writes(),0);
 store.save({muted:false,music:.2,effects:0});assert.deepEqual(createAudioSettingsStore(mem.storage).read(),{muted:false,music:.2,effects:0});
 assert.equal(JSON.parse(mem.data.get(AUDIO_KEY)!).version,1);assert.equal(mem.data.get('cannon-graphs:progress:v1'),'untouched');
});
test('blocked storage keeps session preferences and does not prevent play',()=>{
 const store=createAudioSettingsStore({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});
 assert.equal(store.persisted(),false);assert.deepEqual(store.read(),DEFAULT_AUDIO);
 assert.deepEqual(store.save({muted:false,effects:.4}),{...DEFAULT_AUDIO,muted:false,effects:.4});assert.equal(store.persisted(),false);
 const noStorage=createAudioSettingsStore();noStorage.save({music:0});assert.equal(noStorage.read().music,0);assert.equal(noStorage.persisted(),false);
});
test('all nine original themes loop deterministically with distinct motifs and bounded notes',()=>{
 const themes=['menu',1,2,3,4,5,6,7,8] as const;
 assert.equal(Object.keys(musicScores).length,9);
 assert.equal(new Set(themes.map(t=>musicScores[t].melody.join(','))).size,9);
 for(const theme of themes){
  const score=musicScores[theme],n=score.melody.length;
  assert.equal(n,16);assert.equal(score.bass.length,8);
  for(let i=0;i<n;i++){
   const step=musicStep(theme,i);assert.deepEqual(step,musicStep(theme,i+n));assert.ok(step.seconds>.2&&step.seconds<.5);
   assert.ok(step.notes.length<=3);
   for(const note of step.notes){assert.ok(midiHz(note.midi)>20&&midiHz(note.midi)<4000);assert.ok(note.volume>0&&note.volume<.1&&note.length>0&&note.length<1.2);}
  }
 }
 for(const notes of Object.values(soundEffects))for(const note of notes){assert.ok(note.at>=0&&note.at+note.length<1);assert.ok(note.volume>0&&note.volume<=.15);}
});
test('test-flight cues follow actual load, fire, gem contacts and terminal outcome in both motion modes',()=>{
 assert.equal(win.event.kind,'exit');assert.equal(relay.event.kind,'exit');assert.equal(relay.legs.length,2);
 for(const reduced of [false,true])for(const route of [win,relay]){
  const events=attemptSounds(route,reduced);let offset=0;
  assert.equal(events.filter(e=>e.sound==='fire').length,route.legs.length);
  for(const leg of route.legs){
   assert.ok(events.some(e=>e.sound==='load'&&e.at===offset));
   assert.ok(events.some(e=>e.sound==='fire'&&e.at===offset+FIRE_MS));
   assert.ok(events.some(e=>e.sound===(leg.event.kind==='exit'?'exit':'catch')&&e.at===offset+FIRE_MS+flightDuration(leg,reduced)));
   offset+=attemptDuration(leg,reduced);
  }
  assert.deepEqual(events.filter(e=>e.sound==='gem').map(e=>e.at),gemTimeline(route,reduced).map(e=>e.at).sort((a,b)=>a-b));
  assert.ok(events.every(e=>e.at>=0&&e.at<=routeDuration(route,reduced)));
 }
});
test('misfire never fires, impacts or earns a gem; obstacle and missed domain cues differ',()=>{
 for(const reduced of [false,true])assert.deepEqual(attemptSounds(misfire,reduced),[{at:0,sound:'load'},{at:FIRE_MS,sound:'misfire'}]);
 const splat=simulateRoute(l,plan('1-(x-1)'));assert.equal(splat.event.kind,'obstacle');
 assert.ok(attemptSounds(splat).some(e=>e.sound==='splat'));assert.ok(!attemptSounds(splat).some(e=>e.sound==='exit'));
});
test('rapid-fire sounds follow each individual launch and handoff without re-awarding gems',()=>{
 for(const reduced of [false,true]){
  const s=makeRapidSchedule(relay,4,reduced),events=rapidSounds(relay,s);
  assert.equal(events.length,2*s.count*s.legs.length);
  assert.equal(events.filter(e=>e.sound==='fire').length,8);assert.equal(events.filter(e=>e.sound==='exit').length,4);
  assert.equal(events.filter(e=>e.sound==='catch').length,4);
  assert.ok(!events.some(e=>e.sound==='gem'));
  for(let i=0;i<s.count;i++)for(const [j,leg] of s.legs.entries()){
   const t=s.lead+i*s.interval+leg.offset+leg.load;
   assert.ok(events.some(e=>e.sound==='fire'&&e.at===t));
   assert.ok(events.some(e=>e.sound===(j===s.legs.length-1?'exit':'catch')&&e.at===t+leg.flight));
  }
  assert.ok(events.every(e=>e.at<s.duration));assert.deepEqual(rapidSounds(misfire,s),[]);
 }
});
test('timeline cursor consumes events only once, skips hidden and stale cues, and rejects rewind',()=>{
 const sounds:SoundEffect[]=[],c=createSoundCursor([{at:0,sound:'load'},{at:100,sound:'fire'},{at:200,sound:'gem'},{at:700,sound:'catch'},{at:1000,sound:'exit'}],s=>sounds.push(s));
 c.advance(0);c.advance(0);c.advance(110);c.advance(110);c.advance(200,false);c.advance(220);c.advance(100);
 c.advance(1000);c.advance(1001);assert.deepEqual(sounds,['load','fire','exit']);
});
function harness(options:{deferred?:boolean;reject?:boolean;unavailable?:boolean}={}){
 const mem=memory(),store=createAudioSettingsStore(mem.storage),events:{note:Note;at:number;channel:AudioChannel}[]=[],stops:(AudioChannel|undefined)[]=[],mixes:AudioSettings[]=[];
 let time=0,started=false,created=0,starts=0,resolve:((value:boolean)=>void)|undefined;
 const ticks=new Set<()=>void>();
 const backend:AudioBackend={start(){starts++;if(options.reject)return Promise.reject(Error('blocked'));if(options.deferred)return new Promise(r=>{resolve=value=>{started=value;r(value);};});started=true;return Promise.resolve(true);},
  running:()=>started,now:()=>time,volumes:s=>mixes.push({...s}),schedule:(note,at,channel)=>events.push({note,at,channel}),stop:channel=>stops.push(channel)};
 const ticker:AudioTicker={start(fn){ticks.add(fn);return ()=>ticks.delete(fn);}};
 const audio=createAudioPlayback(store,()=>{created++;if(options.unavailable)throw Error('unsupported');return backend;},ticker);
 return {audio,events,stops,mixes,ticks,created:()=>created,starts:()=>starts,resolve:(ok:boolean)=>resolve?.(ok),advance(t:number){time=t;for(const tick of [...ticks])tick();}};
}
test('no context, effects or timers before explicit activation, including restored enabled settings',async()=>{
 const h=harness();h.audio.setTheme(5);h.audio.play('fire');await h.audio.activate();assert.equal(h.created(),0);assert.equal(h.audio.status(),'muted');
 h.audio.set({muted:false});h.audio.play('fire');assert.equal(h.created(),0);assert.equal(h.ticks.size,0);assert.equal(h.audio.status(),'gesture');
 await h.audio.activate();assert.equal(h.created(),1);assert.equal(h.starts(),1);assert.equal(h.ticks.size,1);assert.equal(h.audio.status(),'ready');
 assert.equal(h.events[0].note.midi,musicScores[5].melody[0]);await h.audio.activate();assert.equal(h.ticks.size,1);assert.equal(h.starts(),1);
 h.audio.dispose();assert.equal(h.ticks.size,0);
});
test('music and effects volumes are independent, mute and visibility stop all scheduled voices',async()=>{
 const h=harness();h.audio.set({muted:false});await h.audio.activate();assert.equal(h.ticks.size,1);
 h.audio.set({music:0});assert.equal(h.ticks.size,0);assert.ok(h.stops.includes('music'));
 const n=h.events.length;h.audio.play('fire');assert.ok(h.events.slice(n).every(e=>e.channel==='effects'));assert.ok(h.events.length>n);
 h.audio.set({music:.4,effects:0});assert.equal(h.ticks.size,1);const m=h.events.length;h.audio.play('gem');assert.equal(h.events.length,m);
 h.audio.set({effects:.5});assert.deepEqual(h.mixes.at(-1),{muted:false,music:.4,effects:.5});
 h.audio.setHidden(true);assert.equal(h.ticks.size,0);const k=h.events.length;h.audio.play('fire');h.advance(100);assert.equal(h.events.length,k);
 h.audio.setHidden(false);assert.equal(h.ticks.size,1);assert.ok(h.events.slice(k).every(e=>e.at>=100));
 h.audio.set({muted:true});assert.equal(h.ticks.size,0);assert.deepEqual(h.stops.slice(-2),['music','effects']);const z=h.events.length;h.audio.play('achievement');assert.equal(h.events.length,z);
});
test('navigation changes themes without duplicate timers or queued old sounds, rapid effects are throttled',async()=>{
 const h=harness();h.audio.set({muted:false});await h.audio.activate();
 h.audio.setTheme(2);assert.equal(h.ticks.size,1);assert.equal(h.events.filter(e=>e.channel==='music').at(-3)!.note.midi,musicScores[2].melody[0]);
 const n=h.events.length;h.audio.play('fire');h.audio.play('fire');assert.equal(h.events.length-n,soundEffects.fire.length);
 h.advance(.2);h.audio.play('fire');assert.equal(h.events.filter(e=>e.channel==='effects').length,2*soundEffects.fire.length);
 h.audio.setTheme(2);assert.equal(h.ticks.size,1);assert.equal(h.stops.at(-1),'effects');
 h.audio.setTheme(6);assert.equal(h.ticks.size,1);
 const m=h.events.length;h.advance(1000);assert.ok(h.events.length-m<=3);assert.ok(h.events.slice(m).every(e=>e.at>=1000));
 h.audio.play('achievement');assert.equal(h.stops.at(-1),'effects');h.audio.dispose();assert.equal(h.ticks.size,0);
});
test('asynchronous activation respects a mute or hidden state selected while the context starts',async()=>{
 const h=harness({deferred:true});h.audio.set({muted:false});
 const a=h.audio.activate(),b=h.audio.activate();assert.equal(h.starts(),1);
 h.audio.set({muted:true});h.resolve(true);await Promise.all([a,b]);assert.equal(h.ticks.size,0);assert.equal(h.events.length,0);
 h.audio.set({muted:false});h.audio.setHidden(true);await h.audio.activate();assert.equal(h.ticks.size,0);h.audio.setHidden(false);assert.equal(h.ticks.size,1);
});
test('unsupported or browser-blocked audio remains silent without rejecting activation',async()=>{
 for(const options of [{unavailable:true},{reject:true}]){
  const h=harness(options);h.audio.set({muted:false});await h.audio.activate();h.audio.play('fire');assert.equal(h.events.length,0);assert.equal(h.ticks.size,0);assert.notEqual(h.audio.status(),'ready');
 }
});
