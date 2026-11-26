import {coordinateSystem} from '../engine/coordinates';
import {cannonTypes} from '../game/cannons';
import type {Level} from '../levels/schema';
export function renderScene(level:Level):SVGSVGElement{
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 960 620');svg.setAttribute('role','img');svg.setAttribute('aria-label','Prototype coordinate playground');
 const transform=coordinateSystem(level.bounds,{width:960,height:620,padding:42});
 const node=(tag:string,attrs:Record<string,string|number>,content?:string,parent:Element=svg)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(content!==undefined)e.textContent=content;parent.append(e);return e;};
 const b=level.bounds, p=transform.toScreen;
 node('rect',{width:960,height:620,fill:'#d9effb'});
 for(let x=Math.ceil(b.minX);x<=b.maxX;x++){const a=p({x,y:b.minY}),z=p({x,y:b.maxY});node('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#7695aa','stroke-opacity':x===0?1:0.3});node('text',{x:a.x,y:a.y+20,'text-anchor':'middle',fill:'#29495d'},String(x));}
 for(let y=Math.ceil(b.minY);y<=b.maxY;y++){const a=p({x:b.minX,y}),z=p({x:b.maxX,y});node('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#7695aa','stroke-opacity':y===0?1:0.3});if(y!==0)node('text',{x:a.x-12,y:a.y+5,'text-anchor':'end',fill:'#29495d'},String(y));}
 for(const o of level.obstacles){const a=p({x:o.bounds.minX,y:o.bounds.maxY}),z=p({x:o.bounds.maxX,y:o.bounds.minY});node('rect',{x:a.x,y:a.y,width:z.x-a.x,height:z.y-a.y,fill:'#789758'});}
 for(const c of level.cannons){const a=p(c.position),g=node('g',{transform:'translate('+a.x+' '+a.y+')'});node('title',{},c.id+' ('+c.position.x+', '+c.position.y+')',g);node('rect',{x:-40,y:4,width:48,height:12,rx:5,fill:'#92643f'},undefined,g);node('rect',{x:-38,y:-9,width:38,height:18,rx:6,fill:cannonTypes[c.type].color,transform:'rotate(-35)'},undefined,g);node('circle',{r:5,fill:'#fff',stroke:'#29495d'},undefined,g);node('text',{x:0,y:-28,'text-anchor':'middle',fill:'#29495d','font-weight':'bold'},c.id,g);}
 const e=p(level.exit),g=node('g',{transform:'translate('+e.x+' '+e.y+')'});node('title',{},'Exit ('+level.exit.x+', '+level.exit.y+')',g);node('circle',{r:18,fill:'#ffe087',stroke:'#b07a22','stroke-width':3},undefined,g);node('circle',{r:4,fill:'#fff'},undefined,g);node('text',{y:-27,'text-anchor':'middle',fill:'#29495d','font-weight':'bold'},'EXIT',g);
 return svg;
}
