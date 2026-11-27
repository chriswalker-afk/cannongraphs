import {test,expect,type Page} from '@playwright/test';
import {CUSTOM_KEY} from '../src/game/customLevels';
import {PROGRESS_KEY} from '../src/game/progressStore';
import {enterFree} from './helpers/programming';
import type {Bounds,Point} from '../src/engine/coordinates';
async function open(page:Page){await page.goto('/');await page.locator('#home-level-workshop').click();await expect(page.locator('main.custom-workshop')).toBeVisible();}
async function location(page:Page,p:Point,b:Bounds={minX:0,maxX:12,minY:0,maxY:9}){
 const svg=page.locator('#custom-grid');await svg.scrollIntoViewIfNeeded();
 return svg.evaluate((s,{point,bounds})=>{
  const v=(s as unknown as SVGSVGElement).viewBox.baseVal,m=(s as unknown as SVGSVGElement).getScreenCTM()!;
  const scale=Math.min((v.width-60)/(bounds.maxX-bounds.minX),(v.height-60)/(bounds.maxY-bounds.minY));
  const x=(v.width-(bounds.maxX-bounds.minX)*scale)/2+(point.x-bounds.minX)*scale;
  const y=(v.height-(bounds.maxY-bounds.minY)*scale)/2+(bounds.maxY-point.y)*scale;
  const q=new DOMPoint(x,y).matrixTransform(m);return {x:q.x,y:q.y};
 },{point:p,bounds:b});
}
async function place(page:Page,tool:string,p:Point){
 await page.locator('[data-tool="'+tool+'"]').click();const q=await location(page,p);await page.mouse.click(q.x,q.y);
}
async function dragFromPalette(page:Page,tool:string,p:Point){
 const button=page.locator('[data-tool="'+tool+'"]');await button.scrollIntoViewIfNeeded();const q=await location(page,p),r=(await button.boundingBox())!;
 await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(q.x,q.y,{steps:12});await page.mouse.up();
}
test('drag, edit, fail and finish a real custom flight; confirm, download, reload and upload without transferring the proof',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1366,height:768});await open(page);
 await expect(page.locator('#custom-test')).toBeDisabled();await expect(page.locator('#custom-confirm')).toBeDisabled();await expect(page.locator('#custom-download')).toBeDisabled();
 await dragFromPalette(page,'linear',{x:1,y:3});
 await expect(page.locator('[data-custom-object="A"]')).toHaveCount(1);
 await place(page,'linear',{x:4,y:6});await place(page,'exit',{x:8,y:3});
 const a=await location(page,{x:8,y:3}),b=await location(page,{x:8,y:2});
 await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:7});await page.mouse.up();
 await expect(page.locator('[data-object-id="exit"]')).toContainText('(8, 2)');
 await page.locator('[data-tool="wall"]').click();await page.locator('#custom-snap').selectOption('0.25');
 const from=await location(page,{x:2.5,y:.5}),to=await location(page,{x:2.75,y:3.25});
 await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:12});await page.mouse.up();
 await expect(page.locator('[data-custom-object="t1"]')).toHaveCount(1);
 await expect(page.getByRole('spinbutton',{name:'Height',exact:true})).toHaveValue('2.75');
 await page.locator('#custom-title').fill('My relay');await page.locator('#custom-title').press('Tab');
 await expect(page.locator('#custom-test')).toBeEnabled();await expect(page.locator('#custom-confirm')).toBeDisabled();
 await info.attach('custom-editor',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await page.locator('#custom-test').click();await expect(page.locator('#world-label')).toContainText('Playtest · My relay');
 await page.getByRole('button',{name:'Use reduced motion'}).click();
 await enterFree(page,'x+2','A');await enterFree(page,'-2x+14','B');await page.locator('#launch').click();
 await expect(page.locator('#phase-label')).toHaveText('Adjust and retry',{timeout:20000});
 await page.locator('#level-menu').click();await expect(page.locator('#custom-confirm')).toBeDisabled();
 await page.locator('#custom-test').click();await enterFree(page,'x+2','A');await enterFree(page,'10-x','B');await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Playtest complete!',{timeout:20000});
 await expect(page.locator('#resolution-record')).toBeHidden();await page.locator('#next-level').click();
 await expect(page.locator('#custom-state')).toContainText('Playtest passed');await expect(page.locator('#custom-confirm')).toBeEnabled();await expect(page.locator('#custom-download')).toBeDisabled();
 await page.locator('#custom-confirm').click();await expect(page.locator('#custom-state')).toContainText('Confirmed');await expect(page.locator('#custom-download')).toBeEnabled();
 const downloaded=page.waitForEvent('download');await page.locator('#custom-download').click();const file=await downloaded;expect(file.suggestedFilename()).toBe('my-relay.cannon.json');
 const path=await file.path();expect(path).toBeTruthy();
 const progress=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'{"records":{}}').records,PROGRESS_KEY);expect(progress).toEqual({});
 await open(page);await expect(page.locator('#custom-state')).toContainText('Confirmed');await expect(page.locator('#custom-title')).toHaveValue('My relay');
 await page.locator('[data-object-id="exit"]').click();await page.getByRole('spinbutton',{name:'x',exact:true}).fill('9');await page.getByRole('spinbutton',{name:'x',exact:true}).press('Tab');
 await expect(page.locator('#custom-state')).toContainText('Draft');await expect(page.locator('#custom-download')).toBeDisabled();
 page.once('dialog',dialog=>dialog.accept());await page.locator('#custom-file').setInputFiles(path!);
 await expect(page.locator('[data-object-id="exit"]')).toContainText('(8, 2)');await expect(page.locator('#custom-test')).toBeEnabled();await expect(page.locator('#custom-confirm')).toBeDisabled();
 expect(errors).toEqual([]);
});
test('phone placement, exact properties, leftward firing and keyboard placement work without horizontal overflow',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await open(page);
 await place(page,'quadratic',{x:8,y:5});await expect(page.locator('[data-object-id="A"]')).toContainText('Quadratic');
 await page.getByLabel('Firing direction').selectOption('-1');await expect(page.locator('[data-custom-object="A"]')).toContainText('←');
 await page.locator('[data-tool="exit"]').click();await page.locator('#custom-grid').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');
 await expect(page.locator('[data-custom-object="exit"]')).toHaveCount(1);
 await page.getByRole('spinbutton',{name:'x',exact:true}).fill('2');await page.getByRole('spinbutton',{name:'x',exact:true}).press('Tab');
 await page.getByRole('spinbutton',{name:'y',exact:true}).fill('3');await page.getByRole('spinbutton',{name:'y',exact:true}).press('Tab');
 await expect(page.locator('[data-object-id="exit"]')).toContainText('(2, 3)');
 await expect(page.locator('#custom-test')).toBeEnabled();
 const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));expect(metrics.scroll).toBeLessThanOrEqual(metrics.width+2);
 await info.attach('phone-workshop',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)??'{}'),CUSTOM_KEY);expect(saved.design.cannons[0].direction).toBe(-1);
});
