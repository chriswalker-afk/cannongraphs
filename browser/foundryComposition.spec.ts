import {test,expect,type Page} from '@playwright/test';
import {foundryLevels} from '../src/levels/foundry';
async function enter(page:Page,id:string){
 await page.goto('/');await page.locator('#home-play').click();await page.getByRole('button',{name:'Broken cannons',exact:true}).click();await page.locator('[data-world-number="7"]').click();await page.locator('.mode-card').first().click();await page.locator('[data-level-id="'+id+'"]').click();await page.locator('.selection-play').click();
}
for(const viewport of [{width:1440,height:800},{width:844,height:390},{width:390,height:844}]){
 test('deck drag, compact grip, equal axes and restart at '+viewport.width+'×'+viewport.height,async({page},info)=>{
  await page.setViewportSize(viewport);await enter(page,'foundry-linear-1');
  const handle=page.locator('[data-lift-handle="B"]'),deck=page.locator('[data-inspect="B"] [data-lift-deck] rect').first();
  await expect(handle).toHaveAttribute('aria-valuenow','5');
  const grip=handle.locator('[data-lift-grip]'),hit=handle.locator('[data-lift-hit]');
  await expect(grip).toBeVisible();expect(Number(await grip.getAttribute('width'))).toBeLessThanOrEqual(20);expect(Number(await hit.getAttribute('width'))).toBeGreaterThanOrEqual(44);
  await deck.scrollIntoViewIfNeeded();
  const box=await deck.boundingBox(),rail=await page.locator('[data-lift-for="B"] line').first().boundingBox();if(!box||!rail)throw Error('No platform geometry');
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+3*rail.height/6.47,{steps:8});await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-valuenow','2');
  await expect(page.locator('#cannon-popup')).toBeHidden();
  const geometry=await page.locator('.stage>svg').evaluate(svg=>{
   const x0=svg.querySelector('[data-grid-x="0"]'),x1=svg.querySelector('[data-grid-x="1"]'),y0=svg.querySelector('[data-grid-y="0"]'),y1=svg.querySelector('[data-grid-y="1"]');
   if(!x0||!x1||!y0||!y1)return null;
   return {dx:Math.abs(Number(x1.getAttribute('x1'))-Number(x0.getAttribute('x1'))),dy:Math.abs(Number(y1.getAttribute('y1'))-Number(y0.getAttribute('y1')))};
  });
  if(geometry)expect(Math.abs(geometry.dx-geometry.dy)).toBeLessThan(.001);
  await info.attach('integrated-platform',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  await handle.focus();await page.keyboard.press('ArrowUp');await expect(handle).toHaveAttribute('aria-valuenow','3');
  await page.locator('#restart-level').click();await expect(handle).toHaveAttribute('aria-valuenow','5');
 });
}
test('wide Foundry popup occupies unused stage margin; four halls have distinct machinery',async({page},info)=>{
 await page.setViewportSize({width:1440,height:800});await enter(page,'foundry-linear-1');
 await page.locator('[data-inspect="B"]').click();await expect(page.locator('.lift-equation')).toBeVisible();
 const graph=await page.locator('[data-graph-plane]').boundingBox(),popup=await page.locator('#cannon-popup').boundingBox();
 if(!graph||!popup)throw Error('Graph/popup missing');
 expect(popup.x+popup.width<=graph.x+1||popup.x>=graph.x+graph.width-1).toBeTruthy();
 await info.attach('editor-wing',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await page.locator('#popup-done').click();
 for(const [i,level] of foundryLevels.entries()){
  if(i%3!==0)continue;
  await page.locator('#level-menu').click();await page.locator('[data-level-id="'+level.id+'"]').click();await page.locator('.selection-play').click();
  const expected=['repair-bay','hydraulic-workshop','furnace-hall','assembly-line'][Math.floor(i/3)];
  await expect(page.locator('.stage [data-scenery="broken-foundry"]')).toHaveAttribute('data-foundry-hall',expected);
  await info.attach(expected,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 }
});
