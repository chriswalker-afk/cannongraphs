import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {referenceSolutions} from '../tests/fixtures/referenceSolutions';
import {openCannon,openFree,enterFree} from './helpers/programming';
const modeIndex={cadet:0,pilot:1,ace:2};
type Mode=keyof typeof modeIndex;
async function start(page:Page){
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.locator('#home-play')).toBeVisible();
 return errors;
}
async function pick(page:Page,world:number,mode:Mode,level:number,launch=true){
 await page.locator('#home-play').click();
 await expect(page.locator('.world-card')).toHaveCount(6);
 await page.locator('.world-card').nth(world-1).click();
 await expect(page.locator('.mode-card')).toHaveCount(3);
 await page.locator('.mode-card').nth(modeIndex[mode]).click();
 await expect(page.locator('.level-number')).toHaveCount(12);
 await page.locator('.level-number').nth(level-1).click();
 await expect(page.locator('.level-number').nth(level-1)).toHaveAttribute('aria-pressed','true');
 if(launch){await page.locator('.selection-play').click();await expect(page.locator('main.game-screen')).toBeVisible();await chooseReduced(page);}
}
async function chooseReduced(page:Page){
 const motion=page.locator('#motion-mode');
 if(await motion.textContent()==='Motion: full')await motion.click();
 await expect(motion).toHaveText('Motion: reduced');
}
async function capture(page:Page,info:TestInfo,name:string){
 const file=info.outputPath(name+'.png');
 await page.screenshot({path:file,fullPage:true,animations:'disabled'});
 await info.attach(name,{path:file,contentType:'image/png'});
}
async function fits(page:Page){
 const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 expect(metrics.scroll).toBeLessThanOrEqual(metrics.width+2);
}
async function program(page:Page,world:number,level:number){
 const equations=referenceSolutions[world-1][level-1];
 for(const [id,equation] of Object.entries(equations)){
  await openFree(page,id);
  await page.locator('#equation-input').fill(equation);
  await expect(page.locator('#equation-editor')).toHaveAttribute('data-state','ready');await page.locator('#popup-done').click();
 }
}
async function complete(page:Page){
 await expect(page.locator('#launch')).toBeEnabled();
 await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:35000});
 await expect(page.locator('#resolution-record')).toContainText('Saved');
}
for(const viewport of [{width:1366,height:768},{width:768,height:1024},{width:390,height:844},{width:844,height:390},{width:320,height:568}]){
 test('classroom viewport '+viewport.width+' × '+viewport.height,async({page},info)=>{
  await page.setViewportSize(viewport);const errors=await start(page);
  await fits(page);await capture(page,info,'home');
  await page.locator('#home-play').click();await expect(page.locator('.world-card')).toHaveCount(6);await fits(page);await capture(page,info,'worlds');
  await page.locator('.world-card').nth(5).click();await expect(page.locator('.mode-card')).toHaveCount(3);await fits(page);await capture(page,info,'modes');
  await page.locator('.mode-card').nth(2).click();await expect(page.locator('.selection-play')).toBeDisabled();await page.locator('.level-number').nth(11).click();await fits(page);await capture(page,info,'levels');
  await page.locator('.selection-play').click();await expect(page.locator('main.game-screen')).toBeVisible();
  await expect(page.locator('#motion-mode')).toHaveText('Motion: full');await chooseReduced(page);
  await expect.poll(async()=>Math.round((await page.locator('.stage').boundingBox())?.height??0)).toBeGreaterThanOrEqual(210);
  await fits(page);await expect(page.locator('.cannon-target')).toHaveCount(4);await expect(page.locator('#cannon-popup')).toBeHidden();
  await openCannon(page,'A');await expect(page.locator('[data-parameter="m"]')).toBeEditable();await expect(page.locator('#graph-preview')).toBeHidden();await page.locator('#popup-done').click();
  await expect(page.locator('[data-grid-x="1"]')).toHaveCount(1);await expect(page.locator('[data-grid-x="2"]')).toHaveCount(1);
  await capture(page,info,'finale-planning');
  await page.locator('#zoom-in').click();await expect(page.locator('#zoom-readout')).toHaveText('125%');await page.locator('#zoom-reset').click();
  await expect(page.locator('#zoom-readout')).toHaveText('100%');
  expect(errors).toEqual([]);
 });
}
test('keyboard navigation, invalid equation, misfire, retry and successful reload persistence',async({page},info)=>{
 const errors=await start(page);
 await page.locator('#home-play').focus();await page.keyboard.press('Enter');
 await page.locator('.world-card').first().focus();await page.keyboard.press('Enter');
 await page.locator('.mode-card').nth(1).focus();await page.keyboard.press('Enter');
 await page.locator('.level-number').first().focus();await page.keyboard.press('Enter');
 await page.locator('.selection-play').focus();await page.keyboard.press('Enter');
 await expect(page.locator('main.game-screen')).toBeVisible();await chooseReduced(page);
 await openFree(page,'A');const input=page.locator('#equation-input');await input.fill('x²');
 await expect(input).toHaveAttribute('aria-invalid','true');await expect(page.locator('#launch')).toBeDisabled();
 await input.fill('x+1');await expect(page.locator('#launch')).toBeEnabled();await page.locator('#popup-done').click();await page.locator('#launch').click();
 await expect(page.locator('#phase-label')).toHaveText('Adjust and retry');
 await expect(page.locator('#pip-queue')).toContainText('4 waiting');await expect(page.locator('#flight-hint')).toBeVisible();
 await capture(page,info,'retry-feedback');
 await enterFree(page,'x','A');await complete(page);
 await expect(page.locator('#resolution-stars')).toHaveAttribute('aria-label','2 out of 3 stars');
 await expect(page.locator('#resolution-achievements')).toContainText('First flight');
 await capture(page,info,'completion');
 await page.reload();await expect(page.getByRole('button',{name:/Flight log: 1 of 72/})).toBeVisible();
 await page.getByRole('button',{name:/Flight log: 1 of 72/}).click();
 await expect(page.locator('.log-stat').nth(1)).toContainText('2');await expect(page.locator('.log-achievement[data-earned=true]')).not.toHaveCount(0);
 await capture(page,info,'flight-log');
 expect(errors).toEqual([]);
});
test('Cadet preview is optional and edit invalidates it; Ace has no preview or mathematical hints',async({page},info)=>{
 const errors=await start(page);await pick(page,1,'cadet',1);await openFree(page,'A');
 await page.locator('#equation-template').click();
 await expect(page.locator('#equation-input')).toHaveValue('?x+?');await expect(page.locator('#launch')).toBeDisabled();
 await page.locator('#equation-input').fill('x+1');await expect(page.locator('#cadet-guide')).toContainText('needs y');await page.locator('#popup-done').click();
 await page.locator('#graph-preview').click();await expect(page.locator('[data-layer="cadet-graph-preview"] path')).not.toHaveCount(0);
 await capture(page,info,'cadet-preview');
 await openFree(page,'A');await page.locator('#equation-input').fill('x+2');await expect(page.locator('[data-layer="cadet-graph-preview"] path')).toHaveCount(0);await page.locator('#popup-done').click();
 for(let i=0;i<2;i++){await page.locator('#launch').click();await expect(page.locator('#phase-label')).toHaveText('Adjust and retry');}
 await expect(page.locator('#pip-queue')).toContainText('2 tried');await expect(page.locator('#pip-queue')).toContainText('∞');
 await enterFree(page,'x','A');await complete(page);await expect(page.locator('#resolution-stars')).toBeHidden();
 await page.locator('#home-return').click();await pick(page,1,'ace',1);
 await expect(page.locator('#equation-template')).toHaveCount(0);await expect(page.locator('#cadet-guide')).toHaveCount(0);
 await expect(page.locator('#graph-preview')).toBeHidden();await expect(page.locator('#pip-queue')).toContainText('3 waiting');
 await enterFree(page,'x+1','A');await page.locator('#launch').click();
 await expect(page.locator('#phase-label')).toHaveText('Adjust and retry');await expect(page.locator('#flight-hint')).toBeHidden();
 await expect(page.locator('#pip-queue')).toContainText('2 waiting');expect(errors).toEqual([]);
});
test('all seven cannon families can be programmed and flown across the final relays',async({page},info)=>{
 const errors=await start(page);await pick(page,6,'ace',10);
 await expect(page.locator('#launch')).toBeDisabled();await program(page,6,10);await complete(page);
 await expect(page.locator('#resolution-stars')).toHaveAttribute('aria-label','3 out of 3 stars');
 await expect(page.locator('#resolution-gems')).toContainText('6 / 6');await capture(page,info,'orbital-transfer-completion');
 await page.locator('#home-return').click();await pick(page,6,'ace',12);
 await expect(page.locator('#launch')).toBeDisabled();
 await program(page,6,12);await complete(page);
 await expect(page.locator('#resolution-stars')).toHaveAttribute('aria-label','3 out of 3 stars');
 await expect(page.locator('#resolution-gems')).toContainText('7 / 7');
 await expect(page.locator('#next-level')).toBeHidden();await capture(page,info,'graphiverse-completion');expect(errors).toEqual([]);
});
test('focus on an inspected cannon survives scene resize and controls remain keyboard accessible',async({page})=>{
 const errors=await start(page);await pick(page,1,'pilot',1);
 await page.locator('.stage [data-inspect="A"]').focus();
 await expect(page.locator('.stage [data-inspect="A"]')).toBeFocused();
 await page.setViewportSize({width:1100,height:700});
 await expect.poll(async()=>page.locator('.stage>svg').getAttribute('viewBox')).not.toBe('0 0 960 620');
 await expect(page.locator('.stage [data-inspect="A"]')).toBeFocused();
 await page.keyboard.press('Enter');await expect(page.locator('[data-parameter="m"]')).toBeFocused();
 await page.locator('[data-parameter="m"]').fill('1');await page.locator('[data-parameter="c"]').fill('0');await expect(page.locator('#launch')).toBeEnabled();
 expect(errors).toEqual([]);
});
test('workshops preview locked items, equip free styles and persist them into the actual game',async({page},info)=>{
 const errors=await start(page);await page.locator('#home-workshop').click();
 await page.locator('.workshop-option').filter({hasText:'Lavender'}).click();await expect(page.getByRole('button',{name:'Locked parts'})).toBeDisabled();
 await page.locator('.workshop-option').filter({hasText:'Meadow mint'}).click();await page.getByRole('button',{name:'Equip look'}).click();
 await expect(page.locator('.workshop-status')).toContainText('saved');await capture(page,info,'creature-workshop');
 await page.getByRole('button',{name:'← Home'}).click();await page.locator('#home-cannon-workshop').click();
 await page.locator('.workshop-option').filter({hasText:'Orbital barrel'}).click();await expect(page.getByRole('button',{name:'Locked parts'})).toBeDisabled();
 await page.locator('.workshop-option').filter({hasText:'Riveted barrel'}).click();await page.getByRole('button',{name:'Equip style'}).click();
 await expect(page.locator('.workshop-status')).toContainText('saved');
 await page.getByRole('button',{name:'Test fire'}).click();await capture(page,info,'cannon-workshop');
 await page.reload();await pick(page,1,'pilot',1);
 await expect(page.locator('.pip-queue [data-pip-fur="mint"]')).toHaveCount(5);
 await expect(page.locator('.stage [data-cannon-barrel="riveted"]')).toHaveCount(1);
 expect(errors).toEqual([]);
});
test('audio settings are keyboard-dismissable, independently saved and initially silent',async({page})=>{
 const errors=await start(page);const sound=page.locator('#sound-settings');await expect(sound).toContainText('Off');
 await sound.click();const dialog=page.getByRole('dialog',{name:'Sound & music'});
 await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Enable audio'})).toBeFocused();
 await dialog.locator('#music-volume').fill('12');await dialog.locator('#effects-volume').fill('34');
 await dialog.getByRole('button',{name:'Enable audio'}).click();await expect(dialog.getByRole('button',{name:'Mute all audio'})).toBeVisible();
 await dialog.getByRole('button',{name:'Mute all audio'}).click();await page.keyboard.press('Escape');
 await expect(dialog).toBeHidden();await expect(sound).toBeFocused();
 await page.reload();await page.locator('#sound-settings').click();
 await expect(dialog.locator('#music-volume')).toHaveValue('12');await expect(dialog.locator('#effects-volume')).toHaveValue('34');await expect(dialog.getByRole('button',{name:'Enable audio'})).toBeVisible();
 expect(errors).toEqual([]);
});
