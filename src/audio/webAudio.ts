import {midiHz,type Note} from './music';
import {createAudioPlayback,type AudioBackend,type AudioChannel} from './playback';
import {browserAudioSettingsStore,type AudioSettings} from './settings';
export function createWebAudioBackend():AudioBackend{
 const AudioCtor=window.AudioContext??(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
 if(!AudioCtor)throw Error('Audio is unavailable');
 const ctx=new AudioCtor(),master=ctx.createGain(),music=ctx.createGain(),effects=ctx.createGain();
 const limiter=ctx.createDynamicsCompressor();
 limiter.threshold.value=-17;limiter.knee.value=18;limiter.ratio.value=8;
 master.gain.value=.65;music.gain.value=0;effects.gain.value=0;
 music.connect(master);effects.connect(master);master.connect(limiter);limiter.connect(ctx.destination);
 interface Voice{osc:OscillatorNode;gain:GainNode;channel:AudioChannel}
 const voices=new Set<Voice>();
 function retire(v:Voice){
  if(!voices.delete(v))return;
  try{v.gain.gain.cancelScheduledValues(ctx.currentTime);v.gain.gain.setValueAtTime(0,ctx.currentTime);v.osc.stop();}catch{/* already ended */}
  try{v.osc.disconnect();v.gain.disconnect();}catch{/* disconnected */}
 }
 function stop(channel?:AudioChannel){for(const v of voices)if(!channel||v.channel===channel)retire(v);}
 function volumes(s:AudioSettings){
  const now=ctx.currentTime;
  for(const [node,value] of [[music,s.muted?0:s.music],[effects,s.muted?0:s.effects]] as const){
   node.gain.cancelScheduledValues(now);node.gain.setValueAtTime(value,now);
  }
 }
 function schedule(note:Note,at:number,channel:AudioChannel){
  if(ctx.state!=='running'||!Number.isFinite(at)||at<ctx.currentTime-.05)return;
  // Fixed maximum active/scheduled voices; oldest voice of same channel
  // is discarded first, so rapid-fire cannot overwhelm the music bus.
  const cap=channel==='music'?12:24,same=[...voices].filter(v=>v.channel===channel);
  if(same.length>=cap)retire(same[0]);
  let voice:Voice|undefined;
  try{
   const osc=ctx.createOscillator(),gain=ctx.createGain(),start=Math.max(ctx.currentTime,at),end=start+note.length;
   voice={osc,gain,channel};voices.add(voice);const v=voice;
   osc.type=note.wave;osc.frequency.setValueAtTime(midiHz(note.midi),start);
   if(note.endMidi!==undefined)osc.frequency.exponentialRampToValueAtTime(midiHz(note.endMidi),end);
   const peak=Math.max(.0002,note.volume),attack=Math.min(.025,note.length*.25);
   gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(peak,start+attack);gain.gain.exponentialRampToValueAtTime(.0001,end);
   osc.connect(gain);gain.connect(channel==='music'?music:effects);
   osc.onended=()=>{if(voices.delete(v)){try{osc.disconnect();gain.disconnect();}catch{/* disconnected */}}};
   osc.start(start);osc.stop(end+.01);
  }catch{if(voice)retire(voice);}
 }
 return {start:async()=>{if(ctx.state!=='running')await ctx.resume();return ctx.state==='running';},running:()=>ctx.state==='running',now:()=>ctx.currentTime,volumes,schedule,stop};
}
export function browserAudioPlayback(){
 const audio=createAudioPlayback(browserAudioSettingsStore(),createWebAudioBackend,{start(fn){const id=window.setInterval(fn,65);return ()=>window.clearInterval(id);}});
 audio.setHidden(document.hidden);
 document.addEventListener('visibilitychange',()=>audio.setHidden(document.hidden));
 // Capture a genuine input gesture before navigation handlers destroy DOM.
 document.addEventListener('click',event=>{if(event.isTrusted&&!audio.settings().muted)void audio.activate();},true);
 document.addEventListener('keydown',event=>{if(event.isTrusted&&(event.key==='Enter'||event.key===' ')&&!audio.settings().muted)void audio.activate();},true);
 return audio;
}
