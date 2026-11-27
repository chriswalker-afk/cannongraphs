import {test,expect,type Page} from '@playwright/test';
import {foundryLevels} from '../src/levels/foundry';
async function widthFits(page:Page){const metrics=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));expect(metrics.s).toBeLessThanOrEqual(metrics.w+2);}
for(const viewport of [{width:1366,height:768},{width:1440,height:800},{width:844,height:390},{width:390,height:844},{width:320,height:568}]){
 test('category switch and Foundry layout at '+viewport.width+' x '+viewport.height,async({page},info)=>{
  await page.setViewportSize(viewport);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('#home-lift-demos')).toHaveCount(0);await page.locator('#home-play').click();
  const normal=page.getByRole('button',{name:'Normal cannons',exact:true}),broken=page.getByRole('button',{name:'Broken cannons',exact:true});
  await expect(normal).toHaveAttribute('aria-pressed','true');await expect(page.locator('.world-card')).toHaveCount(6);
  await expect(page.locator('.selection-heading p')).toHaveText('6 worlds · 72 levels');
  if(viewport.width>=801)expect(await page.locator('.world-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(3);
  await widthFits(page);await info.attach('normal-worlds',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  await broken.click();await expect(broken).toHaveAttribute('aria-pressed','true');await expect(page.locator('.world-card')).toHaveCount(2);
  await expect(page.locator('.selection-heading p')).toHaveText('2 worlds · 24 levels');await expect(page.locator('.world-card [data-scenery="broken-foundry"]')).toHaveCount(1);
  await expect(page.locator('.world-card [data-lift-deck]')).toHaveCount(2);await expect(page.locator('[data-world-number="8"] [data-salvage-postcard]')).toHaveCount(1);await expect(page.locator('[data-world-number="8"] [data-postcard-mount]')).toHaveCount(3);await widthFits(page);
  await info.attach('broken-worlds',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  await broken.focus();await page.keyboard.press('ArrowLeft');await expect(normal).toBeFocused();await expect(page.locator('.world-card')).toHaveCount(6);
  await page.keyboard.press('ArrowRight');await expect(broken).toBeFocused();await page.locator('[data-world-number="7"]').click();
  await page.locator('.mode-card').first().click();await expect(page.locator('.level-number')).toHaveCount(12);await widthFits(page);
  await page.locator('[data-level-id="foundry-quadratic-12"]').click();await expect(page.locator('.level-facts')).toContainText('2 movable platforms');
  await info.attach('foundry-levels',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  await page.locator('.selection-play').click();await expect(page.locator('main[data-world="7"]')).toBeVisible();
  await expect(page.locator('.stage [data-scenery="broken-foundry"]')).toHaveCount(1);await expect(page.locator('.stage [data-lift-deck]')).toHaveCount(2);
  await expect(page.locator('.stage [data-broken-lock]')).toHaveCount(2);
  await expect(page.locator('.stage [data-lift-handle]')).toHaveCount(2);await widthFits(page);
  expect(await page.locator('.stage').evaluate(el=>el.clientHeight)).toBeGreaterThanOrEqual(210);
  await info.attach('foundry-game',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  await page.locator('#level-menu').click();await expect(page.locator('[data-level-id="foundry-quadratic-12"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('.selection-back').click();await page.locator('.selection-back').click();
  await expect(broken).toHaveAttribute('aria-pressed','true');await expect(page.locator('.world-card')).toHaveCount(2);
  await normal.click();await expect(page.locator('.world-card')).toHaveCount(6);expect(errors).toEqual([]);
 });
}
test('every Foundry level uses the same world artwork system and its own original graph anchors',async({page})=>{
 await page.goto('/');await page.locator('#home-play').click();await page.getByRole('button',{name:'Broken cannons',exact:true}).click();
 await page.locator('[data-world-number="7"]').click();await page.locator('.mode-card').first().click();
 for(const level of foundryLevels){
  await page.locator('[data-level-id="'+level.id+'"]').click();await page.locator('.selection-play').click();
  const scene=page.locator('.stage');await expect(scene.locator('[data-scenery="broken-foundry"]')).toHaveCount(1);
  await expect(scene.locator('[data-lift-for]')).toHaveCount(level.cannons.filter(c=>c.lift).length);
  await expect(scene.locator('[data-lift-handle]')).toHaveCount(level.cannons.filter(c=>c.lift).length);
  await expect(scene.locator('.cannon-target')).toHaveCount(level.cannons.length);
  await expect(scene.locator('[data-inspect="exit"]')).toHaveCount(1);
  await page.locator('#level-menu').click();
 }
});
