import {test,expect,type Page} from '@playwright/test';
import {TUTORIAL_KEY} from '../src/game/firstFlightTutorial';
import {PROGRESS_KEY} from '../src/game/progressStore';
async function selectFirst(page:Page,mode=1){
 await page.goto('/');await page.locator('#home-play').click();await page.locator('.world-card').first().click();
 await page.locator('.mode-card').nth(mode).click();await page.locator('.level-number').first().click();await page.locator('.selection-play').click();
}
const coach=(page:Page)=>page.locator('#tutorial-coach');
const field=(page:Page,id:string)=>page.locator('#parameter-boxes [data-parameter="'+id+'"]');
async function activate(page:Page,id:string){await page.locator('.cannon-target[data-inspect="'+id+'"]').focus();await page.keyboard.press('Enter');}
test('first entry teaches coordinates, a worked line, next cannon, an actual splat, correction and scored-level handoff',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1366,height:768});await selectFirst(page,1);
 await expect(coach(page)).toHaveAttribute('data-step','aim');await expect(page.locator('.cannon-target')).toHaveCount(2);
 await expect(page.locator('#world-label')).toContainText('Free practice');
 await page.getByRole('button',{name:'Use reduced motion'}).click();
 await page.locator('#tutorial-continue').click();await expect(coach(page)).toHaveAttribute('data-step','coordinates');
 await expect(page.locator('#tutorial-text')).toContainText('exit is (8, 2)');
 await expect(page.locator('[data-layer="tutorial-coordinates"] text')).toHaveCount(3);
 await expect(page.locator('[data-layer="tutorial-coordinates"]')).toContainText('A (1, 3)');
 await page.locator('.stage [data-inspect="exit"]').focus();await expect(page.locator('#inspect-info')).toContainText('(8, 2)');
 await page.locator('#tutorial-continue').click();await expect(coach(page)).toHaveAttribute('data-step','first');
 await expect(page.locator('#tutorial-maths')).toContainText('(6 − 3)/(4 − 1) = 1');await expect(page.locator('#tutorial-maths')).toContainText('c = 2');
 await info.attach('coordinate-worked-example',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await activate(page,'A');await expect(page.locator('#cannon-popup')).toBeVisible();
 await field(page,'m').press('ArrowUp');await field(page,'c').fill('2');
 await expect(coach(page)).toHaveAttribute('data-step','next');await expect(page.locator('#next-cannon')).toHaveAttribute('data-tutorial-target','true');
 await page.locator('#next-cannon').click();await expect(coach(page)).toHaveAttribute('data-step','splat');
 await field(page,'m').fill('-2');await field(page,'c').fill('14');await expect(coach(page)).toHaveAttribute('data-step','launch');
 await page.locator('#popup-done').click();await page.locator('#launch').click();
 await expect(coach(page)).toHaveAttribute('data-step','recover',{timeout:15000});await expect(page.locator('#flight-result')).toContainText('Splat!');
 await expect(page.locator('.cannon-target[data-inspect="A"]')).toHaveAttribute('data-status','tested');await expect(page.locator('.cannon-target[data-inspect="B"]')).toHaveAttribute('data-status','revise');
 await expect(page.locator('#tutorial-maths')).toContainText('(2 − 6)/(8 − 4) = -1');await expect(page.locator('#tutorial-maths')).toContainText('c = 10');
 await expect(page.locator('#pip-queue')).toContainText('∞');
 await info.attach('exit-worked-example',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await activate(page,'B');await field(page,'m').fill('-1');await field(page,'c').fill('10');
 await expect(coach(page)).toHaveAttribute('data-step','retry');await page.locator('#popup-done').click();await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Tutorial complete!',{timeout:20000});await expect(coach(page)).toHaveAttribute('data-step','finish');
 await expect(page.locator('#resolution-record')).toBeHidden();await expect(page.locator('#resolution-stars')).toBeHidden();
 const records=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'{"records":{}}').records,PROGRESS_KEY);expect(records).toEqual({});
 await page.locator('#next-level').click();await expect(coach(page)).toHaveCount(0);await expect(page.locator('.cannon-target')).toHaveCount(1);
 await expect(page.locator('#world-label')).toContainText('Pilot');await expect(page.locator('#pip-queue')).toContainText('5 waiting');
 await expect(page.locator('#launch')).toBeDisabled();await expect(page.locator('#tutorial-help')).toBeVisible();expect(errors).toEqual([]);
});
test('skip is saved, tutorial can be reopened, and Ace receives a fresh scored run without tutorial hints',async({page})=>{
 await selectFirst(page,2);await expect(coach(page)).toBeVisible();await page.locator('#tutorial-skip').click();
 await expect(coach(page)).toHaveCount(0);await expect(page.locator('#world-label')).toContainText('Ace');await expect(page.locator('#pip-queue')).toContainText('3 waiting');
 expect(await page.evaluate(key=>localStorage.getItem(key),TUTORIAL_KEY)).toBe('seen');
 await selectFirst(page,2);await expect(coach(page)).toHaveCount(0);await page.locator('#tutorial-help').click();await expect(coach(page)).toHaveAttribute('data-step','aim');
 await page.locator('#tutorial-skip').click();await expect(page.locator('#graph-preview')).toBeHidden();
 await activate(page,'A');await expect(page.locator('.cadet-guide')).toBeHidden();
});
test('mobile coordinate lesson and pop-up remain readable and usable when resized',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await selectFirst(page,0);
 await page.locator('#tutorial-continue').click();await page.locator('#tutorial-continue').click();await activate(page,'A');
 await expect(field(page,'m')).toBeFocused();await field(page,'m').fill('1');await field(page,'c').fill('2');await page.locator('#next-cannon').click();
 await page.setViewportSize({width:844,height:390});
 await expect.poll(async()=>{const b=await page.locator('#cannon-popup').boundingBox();return !!b&&b.x>=0&&b.y>=0&&b.x+b.width<=845&&b.y+b.height<=391;}).toBe(true);
 await expect(page.locator('#tutorial-popup-tip')).toContainText('intentionally NOT');await info.attach('landscape-tutorial-editor',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await page.locator('#popup-done').click();await page.locator('#tutorial-skip').click();await expect(coach(page)).toHaveCount(0);
});
