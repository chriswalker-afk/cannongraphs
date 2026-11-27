import type {Bounds} from '../engine/coordinates';
import {CANNON_FOOTPRINT} from '../game/anchorArtGeometry';

// Fit the entire playable domain with equal unit scales. Reduce the inset
// on small stages while retaining enough room for tick labels.
export function foundryPadding(bounds:Bounds,width:number,height:number):number{
 const aspect=(bounds.maxX-bounds.minX)/(bounds.maxY-bounds.minY);
 const limiting=width/height<aspect?width:height;
 return Math.min(30,Math.max(18,Math.floor(limiting*.052)));
}
export interface LiftGrip {readonly dx:number;readonly dy:number;readonly width:number;readonly height:number;readonly glyphWidth:number;readonly glyphHeight:number}
// The grab zone starts on the deck, extending below the muzzle. Visible
// artwork scales with the platform; hit area remains generous.
export function liftGrip(scale:number,direction:1|-1):LiftGrip{
 return {dx:-direction*.36*scale,dy:CANNON_FOOTPRINT.drop*scale,width:Math.max(44,1.04*scale),height:Math.max(44,.27*scale),glyphWidth:Math.min(20,Math.max(8,.36*scale)),glyphHeight:Math.min(13,Math.max(6,.20*scale))};
}
