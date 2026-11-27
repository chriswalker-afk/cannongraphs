import type {ProgressStorage} from '../game/progressStore';
export interface AudioSettings {readonly muted:boolean;readonly music:number;readonly effects:number}
export const DEFAULT_AUDIO:Readonly<AudioSettings>=Object.freeze({muted:true,music:.28,effects:.55});
export const AUDIO_KEY='cannon-graphs:audio:v1';
function volume(value:unknown,fallback:number){return typeof value==='number'&&Number.isFinite(value)?Math.min(1,Math.max(0,value)):fallback;}
export function normalizeAudioSettings(value:unknown):AudioSettings{
 const v=value&&typeof value==='object'&&!Array.isArray(value)?value as Partial<AudioSettings>:{};
 return {muted:typeof v.muted==='boolean'?v.muted:DEFAULT_AUDIO.muted,music:volume(v.music,DEFAULT_AUDIO.music),effects:volume(v.effects,DEFAULT_AUDIO.effects)};
}
export function parseAudioSettings(raw:string|null):AudioSettings{
 try{const v=raw?JSON.parse(raw):null;return v?.version===1?normalizeAudioSettings(v.settings):{...DEFAULT_AUDIO};}catch{return {...DEFAULT_AUDIO};}
}
export function createAudioSettingsStore(storage?:ProgressStorage){
 let settings={...DEFAULT_AUDIO},persisted=!!storage;
 if(storage)try{settings=parseAudioSettings(storage.getItem(AUDIO_KEY));}catch{persisted=false;}
 return {read:()=>settings,persisted:()=>persisted,save(update:Partial<AudioSettings>){
  settings=normalizeAudioSettings({...settings,...update});
  if(storage)try{storage.setItem(AUDIO_KEY,JSON.stringify({version:1,settings}));persisted=true;}catch{persisted=false;}
  return settings;
 }};
}
export function browserAudioSettingsStore(){
 let storage:ProgressStorage|undefined;try{storage=window.localStorage;}catch{/* unavailable */}
 return createAudioSettingsStore(storage);
}
