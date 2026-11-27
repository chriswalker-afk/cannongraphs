import {test,expect,type Page} from '@playwright/test';
import {salvageLevels} from '../src/levels/salvage';

async function enter(page:Page,id:string,mode=0){
 await page.goto('/');await page.locator('#home-play').click();await page.getByRole('button',{name:'Broken cannons',exact:true}).click();
 await expect(page.locator('.broken-world-extras')).toHaveCount(0);
 await page.locator('[data-world-number="8"]').click();await page.locator('.mode-card').nth(mode).click();
 await page.locator('[data-level-id="'+id+'"]').click();await page.locator('.selection-play').click();
}
const mount=(id:string)=>'[data-mount-id="'+id+'"]';
const part=(id:string)=>'[data-anchor-part="'+id+'"]';
test('all twelve Salvage levels retain every authored anchor and four distinctive scenery areas',async({page},info)=>{
 test.setTimeout(60000);
 await page.setViewportSize({width:1366,height:768});await enter(page,salvageLevels[0].id);
 const areas=['salvage-depot','dismantling-yard','sorting-station','reconstruction-plant'];
 const landmarks=['parts-rack','steel-offcuts','sorting-bins','finished-assemblies'];
 for(const [i,l] of salvageLevels.entries()){
  if(i){await page.locator('[data-level-id="'+l.id+'"]').click();await page.locator('.selection-play').click();}
  await expect(page.locator('.stage [data-salvage-area="'+areas[Math.floor(i/3)]+'"]')).toHaveCount(1);
  await expect(page.locator('.stage [data-salvage-landmark="'+landmarks[Math.floor(i/3)]+'"]').first()).toBeVisible();
  await expect(page.locator('[data-mount-id]')).toHaveCount(l.anchorPuzzle!.anchors.length);
  await expect(page.locator('[data-anchor-part]')).toHaveCount(l.anchorPuzzle!.inventory.length);
  await expect(page.locator('[data-mount-id] .mount-ring')).toHaveCount(l.anchorPuzzle!.anchors.length);
  await expect(page.locator('.stage .cannon-target')).toHaveCount(l.cannons.length);
  if(i%3===0)await info.attach(areas[Math.floor(i/3)],{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  await page.locator('#level-menu').click();
 }
});
for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
 test('responsive finale keeps controls accessible and exact Ace coordinates expandable at '+viewport.width+'x'+viewport.height,async({page},info)=>{
  await page.setViewportSize(viewport);await enter(page,'salvage-quadratic-12',2);
  await expect(page.locator('.salvage-objective')).not.toHaveAttribute('open','');
  await expect(page.locator('#level-objective')).toBeHidden();
  await page.locator('.salvage-objective summary').click();
  await expect(page.locator('#level-objective')).toBeVisible();await expect(page.locator('#level-objective')).toContainText('Exact non-integer points');
  await page.locator('.salvage-objective summary').click();
  await expect(page.locator('.salvage-status-key .halo-legend')).toBeHidden();
  await page.locator('.salvage-status-key summary').click();await expect(page.locator('.salvage-status-key .halo-legend')).toBeVisible();
  await page.locator('.salvage-status-key summary').click();
  await expect(page.locator('#pan-left')).toBeHidden();await page.locator('#zoom-in').click();await expect(page.locator('#pan-left')).toBeVisible();await page.locator('#zoom-reset').click();await expect(page.locator('#pan-left')).toBeHidden();
  const layout=await page.evaluate(()=>{const stage=document.querySelector('.stage')!.getBoundingClientRect(),tray=document.querySelector('#anchor-tray')!.getBoundingClientRect();return {w:innerWidth,h:innerHeight,scroll:document.documentElement.scrollWidth,stage:stage.height,tray:tray.height};});
  expect(layout.scroll).toBeLessThanOrEqual(layout.w+2);
  expect(layout.stage).toBeGreaterThanOrEqual(viewport.width<=650?260:210);
  if(viewport.width===390){expect(layout.stage).toBeGreaterThanOrEqual(380);expect(layout.tray).toBeLessThan(195);}
  await page.locator(part('B')).click();
  await expect(page.locator('[data-mount-id][data-drop-ready=true]')).toHaveCount(10);
  // Every legal free mount has the same readiness state; no correctness leak.
  await page.locator(mount('P')).focus();await page.keyboard.press('Enter');
  await expect(page.locator(mount('P'))).toHaveAttribute('data-mount-occupied','B');
  await expect(page.locator('[data-mount-id][data-drop-ready=true]')).toHaveCount(9);
  await expect(page.locator(part('B'))).toHaveAccessibleName(/Cannon B.*Locked.*Mount P/);
  await expect(page.locator('#launch')).toBeDisabled();
  await info.attach('compact-finale-'+viewport.width,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 });
}
test('inspection is readable outside the coordinate plane, retains keyboard focus and hides coordinates in Ace',async({page})=>{
 await page.setViewportSize({width:1366,height:768});await enter(page,'salvage-linear-3');
 await page.locator(mount('P')).focus();
 await expect(page.locator('#inspect-info')).toContainText('Mount P');await expect(page.locator('#inspect-info')).toContainText('(2, 3.5)');
 await expect(page.locator('[data-inspection-tooltip]')).toBeEmpty();
 await page.locator('#level-menu').click();await page.locator('.selection-back').click();
 await page.locator('.mode-card').nth(2).click();await page.locator('[data-level-id="salvage-linear-3"]').click();await page.locator('.selection-play').click();
 await page.locator(mount('P')).focus();await expect(page.locator('#inspect-info')).toHaveText('Mount P');await expect(page.locator('[data-inspection-tooltip]')).toBeEmpty();
});
