import {test,expect,type Page} from '@playwright/test';
import {CUSTOM_LIBRARY_KEY} from '../src/game/customLevels';
async function place(page:Page,tool:string,x:number,y:number){
 await page.locator('[data-tool="'+tool+'"]').click();
 const svg=page.locator('#custom-grid');await svg.scrollIntoViewIfNeeded();
 const p=await svg.evaluate((s,{x,y})=>{
  const svg=s as unknown as SVGSVGElement,v=svg.viewBox.baseVal,scale=Math.min((v.width-60)/12,(v.height-60)/9);
  const q=new DOMPoint((v.width-12*scale)/2+x*scale,(v.height-9*scale)/2+(9-y)*scale).matrixTransform(svg.getScreenCTM()!);
  return {x:q.x,y:q.y};
 },{x,y});
 await page.mouse.click(p.x,p.y);
}
test('design a broken starting cannon, playtest the moved height, confirm and share without the solution',async({page})=>{
 await page.setViewportSize({width:1366,height:768});await page.goto('/');
 await page.locator('#home-level-workshop').click();
 await place(page,'linear',1,2);
 await page.getByLabel('Broken cannon · movable platform').check();
 await page.getByLabel('Locked shape (no constant)').fill('x/2');
 await page.locator('#custom-apply-lift').click();
 await expect(page.locator('[data-custom-lift-rail="A"]')).toHaveCount(1);
 await expect(page.locator('.custom-lift-equation')).toHaveText('y = 1/2x + 3/2');
 await place(page,'exit',7,7);
 await expect(page.locator('#custom-test')).toBeEnabled();
 await page.locator('#custom-test').click();
 await page.getByRole('button',{name:'Use reduced motion'}).click();
 const handle=page.locator('[data-lift-handle="A"]');
 await expect(handle).toHaveAttribute('aria-valuenow','2');
 await handle.focus();await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');
 await expect(handle).toHaveAttribute('aria-valuenow','4');
 await expect(page.locator('#launch')).toBeEnabled();
 await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Playtest complete!',{timeout:30000});
 await page.locator('#next-level').click();
 await expect(page.locator('#custom-confirm')).toBeEnabled();
 await page.locator('#custom-confirm').click();
 const download=page.waitForEvent('download');await page.locator('#custom-download').click();const file=await download;const path=await file.path();expect(path).toBeTruthy();
 const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)??'{}'),CUSTOM_LIBRARY_KEY);
 const entry=saved.entries.find((e:{id:string})=>e.id===saved.activeId);
 expect(entry.design.cannons[0].position.y).toBe(2);expect(entry.design.cannons[0].lift.lockedShape).toBe('x/2');
 await page.locator('#custom-file').setInputFiles(path!);
 await expect(page.locator('[data-object-id="A"]')).toContainText('Lift');
 await expect(page.locator('#custom-confirm')).toBeDisabled();
 await page.locator('#custom-library').click();
 await expect(page.locator('[data-library-lift-rail="A"]')).toHaveCount(2);
 await page.locator('#library-search').fill('movable');
 await expect(page.locator('.library-card')).toHaveCount(2);
});
