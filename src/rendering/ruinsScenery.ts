import {svgNode as el} from './pip';
// Decorative, distant temple architecture. It never participates in collisions.
export function renderRuinsScenery(parent:Element,w:number,h:number){
 const g=el('g',{'pointer-events':'none','aria-hidden':'true','data-scenery':'lost-arches'},parent);
 el('circle',{cx:w*.78,cy:h*.17,r:Math.min(w,h)*.11,fill:'#ffe4a5',opacity:.63},g);
 el('path',{d:'M0 '+h*.63+' Q'+w*.14+' '+h*.35+' '+w*.31+' '+h*.61+' T'+w*.62+' '+h*.51+' T'+w+' '+h*.55+' V'+h+' H0Z',fill:'#78998b',opacity:.24},g);
 const unit=Math.min(w,h)/400;
 for(const [x,y,s,opacity] of [[.13,.83,1.2,.29],[.4,.76,.9,.23],[.68,.84,1.25,.33],[.92,.7,.82,.21]]){
  const temple=el('g',{transform:'translate('+w*x+' '+h*y+') scale('+unit*s+')',opacity},g);
  // Filled arch with an actual open cutout via even-odd path winding.
  el('path',{d:'M-76 10 V-72 Q-76 -133 0 -140 Q76 -133 76 -72 V10 Z M-47 10 V-70 Q-47 -111 0 -115 Q47 -111 47 -70 V10 Z','fill-rule':'evenodd',fill:'#9a8567',stroke:'#746d55','stroke-width':2},temple);
  for(const side of [-1,1]){
   const column=el('g',{transform:'translate('+(side*63)+' 0)'},temple);
   for(let y=-70;y<10;y+=15)el('path',{d:'M-12 '+y+' h24',stroke:'#655d4b','stroke-width':1.5},column);
   el('rect',{x:-17,y:1,width:34,height:11,fill:'#827359'},column);
  }
  for(const angle of [-120,-95,-70,-45,-20,5]){
   const a=angle*Math.PI/180;
   el('path',{d:'M'+(48*Math.cos(a))+' '+(-73+48*Math.sin(a))+' L'+(73*Math.cos(a))+' '+(-73+73*Math.sin(a)),stroke:'#72654f','stroke-width':1.8},temple);
  }
  el('path',{d:'M-67 -112 Q-83 -80 -69 -61 T-76 -27 M71 -114 Q84 -89 65 -62 T72 -38',stroke:'#4f815c','stroke-width':5,fill:'none','stroke-linecap':'round'},temple);
  for(const [x,y] of [[-76,-83],[-64,-69],[-77,-43],[74,-91],[67,-59],[74,-45]]){
   el('ellipse',{cx:x,cy:y,rx:7,ry:3.5,fill:'#548963',transform:'rotate(-35 '+x+' '+y+')'},temple);
  }
  el('path',{d:'M-90 13 H91 M-98 21 H99',stroke:'#8b7c64','stroke-width':7,'stroke-linecap':'round'},temple);
 }
 el('path',{d:'M0 '+h*.94+' Q'+w*.18+' '+h*.85+' '+w*.4+' '+h*.94+' T'+w+' '+h*.9+' V'+h+' H0Z',fill:'#718d78',opacity:.23},g);
}
