import type {Note} from './music';
export type SoundEffect='load'|'fire'|'catch'|'exit'|'misfire'|'splat'|'lost'|'gem'|'complete'|'achievement'|'gameover';
export interface EffectNote extends Note {readonly at:number}
const tone=(midi:number,length:number,volume:number,wave:OscillatorType='triangle',at=0,endMidi?:number):EffectNote=>({midi,length,volume,wave,at,endMidi});
export const soundEffects:Readonly<Record<SoundEffect,readonly EffectNote[]>>={
 load:[tone(57,.07,.065,'triangle',0,64),tone(69,.065,.035,'sine',.07,72)],
 fire:[tone(45,.14,.14,'triangle',0,31),tone(76,.09,.065,'triangle',.015,59),tone(84,.08,.035,'sine',.045,96)],
 catch:[tone(67,.09,.07,'sine',0,74),tone(79,.10,.045,'triangle',.055)],
 exit:[tone(72,.13,.085,'triangle'),tone(76,.13,.075,'triangle',.075),tone(84,.16,.065,'sine',.15)],
 misfire:[tone(59,.13,.09,'triangle',0,46),tone(52,.20,.055,'sine',.15,43)],
 splat:[tone(48,.13,.13,'triangle',0,29),tone(64,.08,.065,'triangle',.03,40)],
 lost:[tone(67,.20,.055,'sine',0,55),tone(55,.18,.05,'triangle',.13,47)],
 gem:[tone(84,.095,.07,'sine'),tone(91,.13,.06,'triangle',.055),tone(96,.15,.035,'sine',.12)],
 complete:[tone(72,.16,.09,'triangle'),tone(76,.16,.09,'triangle',.12),tone(79,.16,.08,'triangle',.24),tone(84,.34,.08,'triangle',.36),tone(60,.30,.045,'sine',.36),tone(67,.30,.04,'sine',.36)],
 achievement:[tone(79,.11,.08,'triangle'),tone(83,.11,.08,'triangle',.10),tone(86,.15,.08,'triangle',.20),tone(91,.30,.07,'triangle',.32),tone(79,.30,.05,'sine',.32),tone(67,.30,.045,'sine',.32)],
 gameover:[tone(64,.18,.065,'triangle'),tone(60,.18,.055,'triangle',.16),tone(55,.26,.05,'sine',.32)]
};
