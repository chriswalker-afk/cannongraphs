import {musicStep,type MusicTheme,type Note} from './music';
import {soundEffects,type SoundEffect} from './effects';
import type {AudioSettings,createAudioSettingsStore} from './settings';
export type AudioChannel='music'|'effects';
export interface AudioBackend {
 start():Promise<boolean>;running():boolean;now():number;
 volumes(settings:AudioSettings):void;schedule(note:Note,at:number,channel:AudioChannel):void;
 stop(channel?:AudioChannel):void;
}
export interface AudioTicker{start(fn:()=>void):()=>void}
export type AudioStatus='muted'|'ready'|'gesture'|'unavailable';
export function createAudioPlayback(store:ReturnType<typeof createAudioSettingsStore>,makeBackend:()=>AudioBackend,ticker:AudioTicker){
 let settings=store.read(),backend:AudioBackend|undefined,starting:Promise<void>|undefined,unavailable=false,hidden=false;
 let theme:MusicTheme='menu',stopTick:(()=>void)|undefined,nextAt=0,step=0;
 const listeners=new Set<()=>void>(),recent=new Map<SoundEffect,number>();
 const notify=()=>listeners.forEach(fn=>fn());
 const ready=()=>!settings.muted&&!hidden&&!!backend?.running();
 function status():AudioStatus{return settings.muted?'muted':unavailable?'unavailable':ready()?'ready':'gesture';}
 function stopMusic(){stopTick?.();stopTick=undefined;backend?.stop('music');nextAt=0;step=0;}
 function silence(){stopMusic();backend?.stop('effects');recent.clear();}
 function tick(){
  if(!ready()||settings.music===0){stopMusic();return;}
  const b=backend!,now=b.now();
  // A delayed timer starts a fresh beat, never a queue of missed music.
  if(nextAt<now)nextAt=now+.015;
  for(let i=0;i<4&&nextAt<now+.12;i++){
   const part=musicStep(theme,step++);for(const note of part.notes)b.schedule(note,nextAt,'music');nextAt+=part.seconds;
  }
 }
 function sync(){
  if(!ready()){silence();return;}
  backend!.volumes(settings);
  if(settings.effects===0){backend!.stop('effects');recent.clear();}
  if(settings.music===0){stopMusic();return;}
  if(!stopTick){nextAt=backend!.now()+.02;step=0;stopTick=ticker.start(tick);tick();}
 }
 // Only callers responding to a real gesture may invoke activate. Never
 // construct an AudioContext during a page load, timer or visibility event.
 function activate():Promise<void>{
  if(settings.muted||hidden||unavailable)return Promise.resolve();
  if(ready()){sync();return Promise.resolve();}
  if(starting)return starting;
  try{backend??=makeBackend();const candidate=backend;
   starting=candidate.start().then(ok=>{
    if(ok){unavailable=false;sync();}
    else{silence();}
   }).catch(()=>{silence();}).finally(()=>{starting=undefined;notify();});
   return starting;
  }catch{unavailable=true;notify();return Promise.resolve();}
 }
 function set(update:Partial<AudioSettings>){
  settings=store.save(update);sync();notify();
 }
 function setTheme(next:MusicTheme){
  // Even same-theme navigation ends the old screen's effect voices.
  backend?.stop('effects');recent.clear();
  if(theme!==next){stopMusic();theme=next;}sync();
 }
 function setHidden(value:boolean){hidden=value;sync();notify();}
 function play(sound:SoundEffect){
  if(!ready()||settings.effects===0)return;
  const b=backend!,now=b.now(),last=recent.get(sound)??-Infinity;
  // Limit repeated pickups and overlapping relay shots without changing
  // animation timing or gameplay accounting.
  if(now-last<.09)return;
  if(sound==='complete'||sound==='achievement'||sound==='gameover'){b.stop('effects');recent.clear();}
  recent.set(sound,now);
  for(const note of soundEffects[sound])b.schedule(note,now+.008+note.at,'effects');
 }
 return {activate,set,setTheme,setHidden,play,status,settings:()=>settings,persisted:store.persisted,
  subscribe(fn:()=>void){listeners.add(fn);return ()=>{listeners.delete(fn);};},
  dispose(){hidden=true;silence();listeners.clear();}
 };
}
export type AudioPlayback=ReturnType<typeof createAudioPlayback>;
