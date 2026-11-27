import {test,expect,type Page} from '@playwright/test';
import {CUSTOM_LIBRARY_KEY} from '../src/game/customLevels';
import {enterFree} from './helpers/programming';
async function location(page:Page,x:number,y:number){
 const svg=page.locator('#custom-grid');await svg.scrollIntoViewIfNeeded();
 return svg.evaluate((s,{x,y})=>{const svg=s as unknown as SVGSVGElement,v=svg.viewBox.baseVal,scale=Math.min((v.width-60)/12,(v.height-60)/9);
 const q=new DOMPoint((v.width-12*scale)/2+x*scale,(v.height-9*scale)/2+(9-y)*scale).matrixTransform(svg.getScreenCTM()!);return {x:q.x,y:q.y};},{x,y});
}
async function place(page:Page,tool:string,x:number,y:number){
 await page.locator('[data-tool="'+tool+'"]').click();const p=await location(page,x,y);await page.mouse.click(p.x,p.y);
}
async function mount(page:Page,id:string,anchor:string){
 await page.locator('[data-anchor-part="'+id+'"]').click();await page.locator('[data-mount-id="'+anchor+'"]').focus();await page.keyboard.press('Enter');
 await expect(page.locator('[data-mount-id="'+anchor+'"]')).toHaveAttribute('data-mount-occupied',id);
}
test('author anchor puzzle, drag a mount, edit locked part, playtest, confirm and share without solution',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1366,height:768});await page.goto('/');await page.locator('#home-level-workshop').click();
 await expect(page.locator('[data-tool="anchor"]')).toBeHidden();
 await page.getByLabel('Anchor placement puzzle').check();await expect(page.locator('#custom-world')).toHaveValue('8');
 await place(page,'linear',1,2);await place(page,'exit',9,2);
 await place(page,'anchor',3,4);await place(page,'anchor',5,6);await place(page,'anchor',7,3);
 const a=await location(page,7,3),b=await location(page,7,4);
 await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up();
 await expect(page.locator('[data-object-id="m3"]')).toContainText('(7, 4)');
 await page.locator('#custom-add-linear-part').click();await expect(page.locator('[data-object-id="B"]')).toContainText('Tray');
 await page.getByLabel('Broken cannon · locked coefficients').check();
 await page.getByLabel('Locked shape (no constant)').fill('-x');await page.locator('#custom-apply-anchor-shape').click();
 await expect(page.locator('[data-object-id="B"]')).toContainText('Locked');
 await expect(page.locator('[data-custom-object="B"]')).toHaveCount(0);
 await expect(page.locator('[data-custom-anchor]')).toHaveCount(3);
 await expect(page.locator('#custom-test')).toBeEnabled();await expect(page.locator('#custom-confirm')).toBeDisabled();
 await info.attach('anchor-workshop',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await page.locator('#custom-test').click();await expect(page.locator('main[data-has-anchors="true"]')).toBeVisible();
 await expect(page.locator('#launch')).toBeDisabled();await mount(page,'B','m2');
 await expect(page.locator('[data-anchor-part="B"]')).toContainText('y = -x + 11');
 await enterFree(page,'x+1','A');await page.getByRole('button',{name:'Use reduced motion'}).click();await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Playtest complete!',{timeout:30000});await page.locator('#next-level').click();
 await expect(page.locator('#custom-confirm')).toBeEnabled();await page.locator('#custom-confirm').click();
 const downloaded=page.waitForEvent('download');await page.locator('#custom-download').click();const file=await downloaded,path=await file.path();expect(path).toBeTruthy();
 const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)??'{}'),CUSTOM_LIBRARY_KEY),entry=saved.entries.find((e:{id:string})=>e.id===saved.activeId);
 expect(entry.design.cannons).toHaveLength(1);expect(entry.design.anchorPuzzle.inventory).toEqual([{id:'B',type:'linear',direction:1,lockedShape:'-x'}]);
 await page.locator('#custom-file').setInputFiles(path!);await expect(page.locator('#custom-anchor-mode')).toBeChecked();
 await expect(page.locator('[data-custom-anchor]')).toHaveCount(3);await expect(page.locator('#custom-confirm')).toBeDisabled();
 await page.locator('#custom-library').click();await expect(page.locator('[data-library-anchor]')).toHaveCount(6);
 await page.locator('#library-search').fill('anchor placement');await expect(page.locator('.library-card')).toHaveCount(2);
 await expect(page.locator('#library-detail')).toContainText('3 mounts');expect(errors).toEqual([]);
});
test('phone anchor workshop can edit ordinary and locked quadratic parts and exact mount coordinates',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#home-level-workshop').click();
 await page.getByLabel('Anchor placement puzzle').check();await place(page,'linear',1,2);await place(page,'exit',9,6);
 await place(page,'anchor',5,5);await page.getByRole('spinbutton',{name:'y',exact:true}).fill('6');await page.getByRole('spinbutton',{name:'y',exact:true}).press('Tab');
 await expect(page.locator('[data-object-id="m1"]')).toContainText('(5, 6)');
 await page.locator('#custom-add-quadratic-part').click();await page.getByLabel('Broken cannon · locked coefficients').check();
 await page.getByLabel('Locked shape (no constant)').fill('-x^2/2+7x');await page.locator('#custom-apply-anchor-shape').click();
 await expect(page.locator('#custom-test')).toBeEnabled();await page.locator('#custom-add-linear-part').click();
 await expect(page.locator('#custom-test')).toBeDisabled();await expect(page.locator('#custom-message')).toContainText('enough candidate mounts');
 await page.getByRole('button',{name:'Delete object',exact:true}).click();await expect(page.locator('#custom-test')).toBeEnabled();
 const size=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));expect(size.s).toBeLessThanOrEqual(size.w+2);
 await info.attach('anchor-workshop-phone',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});
