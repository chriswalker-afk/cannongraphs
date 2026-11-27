import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {worlds} from '../src/levels/catalog';
import {levelSupports} from '../src/levels/supports';
import {enterFree} from './helpers/programming';
const scenarios=[
 {w:1,l:3,width:1366,height:768,name:'skyward'},
 {w:1,l:1,width:390,height:844,name:'grounded'},
 {w:2,l:6,width:768,height:1024,name:'reverse'},
 {w:3,l:10,width:1366,height:768,name:'peaks-relay'},
 {w:4,l:10,width:1366,height:768,name:'wall-bracket'},
 {w:5,l:1,width:390,height:844,name:'suspended-exit'},
 {w:6,l:12,width:844,height:390,name:'seven-cannons'}
] as const;
async function enter(page:Page,w:number,l:number){
 await page.goto('/');await page.locator('#home-play').click();await page.locator('.world-card').nth(w-1).click();
 await page.locator('.mode-card').nth(1).click();await page.locator('.level-number').nth(l-1).click();await page.locator('.selection-play').click();
 await expect(page.locator('main.game-screen')).toBeVisible();
}
async function capture(page:Page,info:TestInfo,name:string){
 const path=info.outputPath(name+'.png');await page.screenshot({path,fullPage:true,animations:'disabled'});await info.attach(name,{path,contentType:'image/png'});
}
async function verify(page:Page,w:number,l:number){
 const level=worlds[w-1].levels[l-1],plans=levelSupports(level),layer=page.locator('.stage [data-layer="anchor-supports"]');
 await expect(layer.locator('[data-support-for]')).toHaveCount(level.cannons.length+1);
 for(const plan of plans){
  const mount=layer.locator('[data-support-for="'+plan.id+'"]');
  await expect(mount).toHaveAttribute('data-support-kind',plan.kind);await expect(mount).toHaveAttribute('data-support-terrain',plan.terrainId??'background-roof');
  await expect(mount).toHaveAttribute('aria-hidden','true');
  const result=await mount.evaluate((node,{id,x,y,drop})=>{
   const target=document.querySelector<SVGGraphicsElement>('.stage [data-inspect="'+id+'"]')!;
   const m=node as unknown as SVGGraphicsElement,grid=document.querySelector('.stage [data-grid-x]')!;
   const point=new DOMPoint(x,y).matrixTransform(m.getCTM()!);
   const artwork=new DOMPoint(0,drop).matrixTransform(target.getCTM()!);
   return {delta:Math.hypot(point.x-artwork.x,point.y-artwork.y),behindGrid:!!(m.compareDocumentPosition(grid)&Node.DOCUMENT_POSITION_FOLLOWING),behindTarget:!!(m.compareDocumentPosition(target)&Node.DOCUMENT_POSITION_FOLLOWING),pointer:getComputedStyle(m).pointerEvents,inspectable:!!m.querySelector('[data-inspect]')};
  },{id:plan.id,x:plan.anchor.x,y:plan.deck.y,drop:plan.anchor.y-plan.deck.y});
  expect(result.delta).toBeLessThan(.05);expect(result.behindGrid).toBe(true);expect(result.behindTarget).toBe(true);expect(result.pointer).toBe('none');expect(result.inspectable).toBe(false);
 }
}
for(const s of scenarios)test('connected scene mounts: '+s.name,async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:s.width,height:s.height});await enter(page,s.w,s.l);
 await verify(page,s.w,s.l);await capture(page,info,s.name);
 await page.locator('#zoom-in').click();await expect(page.locator('#zoom-readout')).toHaveText('125%');await verify(page,s.w,s.l);
 await page.locator('#zoom-reset').click();await page.setViewportSize({width:Math.max(320,s.width-30),height:s.height+35});await verify(page,s.w,s.l);
 expect(errors).toEqual([]);
});
test('support remains fixed to the original coordinates during loading, flight and celebration',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page,1,3);
 await enterFree(page,'3x','A');await expect(page.locator('#launch')).toBeEnabled();await page.locator('#launch').click();
 await expect(page.locator('[data-launch-visual][display="inline"][data-launch-phase="flying"] [data-flight-pip]')).toBeVisible();
 await verify(page,1,3);await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:15000});
 await verify(page,1,3);expect(errors).toEqual([]);
});
