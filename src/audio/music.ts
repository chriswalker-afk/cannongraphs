// Original short, looping compositions. No recordings, network requests or
// third-party music. Eight-beat phrases have distinct instrumentation and rhythm.
export type MusicTheme='menu'|1|2|3|4|5|6|7|8;
export interface Note {readonly midi:number;readonly length:number;readonly volume:number;readonly wave:OscillatorType;readonly endMidi?:number}
export interface MusicScore {readonly name:string;readonly bpm:number;readonly melody:readonly (number|null)[];readonly bass:readonly number[];readonly wave:OscillatorType;readonly bassWave:OscillatorType;readonly chord:number}
export const musicScores:Readonly<Record<MusicTheme,MusicScore>>={
 menu:{name:'Ready for flight',bpm:100,melody:[72,null,76,79,74,76,null,72,69,null,72,76,67,69,71,null],bass:[48,48,50,50,45,45,43,43],wave:'triangle',bassWave:'sine',chord:7},
 1:{name:'Meadow march',bpm:112,melody:[72,76,79,null,77,76,74,null,69,72,76,72,67,71,74,null],bass:[48,48,53,53,45,45,43,43],wave:'triangle',bassWave:'triangle',chord:7},
 2:{name:'Island breeze',bpm:90,melody:[74,null,81,null,79,76,74,null,71,null,78,null,76,74,71,null],bass:[50,50,47,47,43,43,45,45],wave:'sine',bassWave:'sine',chord:7},
 3:{name:'Peak ascent',bpm:106,melody:[67,71,74,79,76,null,74,71,69,72,76,81,79,null,76,74],bass:[43,43,48,48,45,45,50,50],wave:'triangle',bassWave:'sine',chord:7},
 4:{name:'Temple echoes',bpm:84,melody:[69,null,72,76,77,null,76,72,67,null,70,74,72,70,67,null],bass:[45,45,41,41,43,43,40,40],wave:'sine',bassWave:'triangle',chord:7},
 5:{name:'Gear rhythm',bpm:120,melody:[64,64,67,71,69,null,67,64,62,65,69,72,71,67,65,null],bass:[40,40,45,45,38,38,43,43],wave:'triangle',bassWave:'square',chord:7},
 6:{name:'Orbit drift',bpm:76,melody:[76,null,83,null,81,79,null,76,74,null,81,null,78,76,74,null],bass:[48,48,45,45,50,50,47,47],wave:'sine',bassWave:'sine',chord:12},
 7:{name:'Lift and lower',bpm:108,melody:[62,65,69,null,65,62,60,null,64,67,71,67,65,64,62,null],bass:[38,38,43,43,40,40,45,45],wave:'triangle',bassWave:'square',chord:7},
 8:{name:'Salvage shuffle',bpm:96,melody:[60,67,null,64,65,69,72,null,67,65,62,null,64,67,60,null],bass:[36,36,41,41,43,43,40,36],wave:'triangle',bassWave:'triangle',chord:7}
};
export const midiHz=(n:number)=>440*2**((n-69)/12);
export function musicStep(theme:MusicTheme,step:number):{seconds:number;notes:readonly Note[]}{
 const s=musicScores[theme],seconds=30/s.bpm,i=((Math.floor(step)%s.melody.length)+s.melody.length)%s.melody.length,notes:Note[]=[];
 const melody=s.melody[i];
 if(melody!==null)notes.push({midi:melody,length:seconds*(theme===2||theme===6?1.65:.78),volume:.075,wave:s.wave});
 if(i%2===0){
  const bass=s.bass[Math.floor(i/2)%s.bass.length];
  notes.push({midi:bass,length:seconds*1.65,volume:s.bassWave==='square'?.018:.055,wave:s.bassWave});
  if(i%4===0)notes.push({midi:bass+s.chord,length:seconds*2.7,volume:.026,wave:'sine'});
 }
 return {seconds,notes};
}
