import type {LevelState} from './levelState';
export type Stars=0|1|2|3;
// Five Pips: 5 = 3, 3–4 = 2, 1–2 = 1, 0 = 0.
// Other budgets retain the same proportional thresholds.
export function scoreStars(saved:number,total:number):Stars{
 if(!Number.isSafeInteger(saved)||!Number.isSafeInteger(total)||total<1||saved<0||saved>total)throw new RangeError('Invalid score');
 return saved===0?0:saved===total?3:saved>=Math.ceil(total*.6)?2:1;
}
export function levelStars(s:LevelState):Stars|null{
 return s.phase==='success'||s.phase==='gameOver'?scoreStars(s.saved,s.total):null;
}
