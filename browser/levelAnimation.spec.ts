import {test,expect,type Page} from '@playwright/test';
async function level(page:Page,mode=1){
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#home-play').click();await page.locator('.world-card').first().click();await page.locator('.mode-card').nth(mode).click();await page.locator('.level-number').first().click();await page.locator('.selection-play').click();
 await expect(page.locator('main.game-screen')).toBeVisible();return errors;
}
const waiting=(page:Page)=>page.locator('.stage [data-waiting-pip][display="inline"]');
test('full motion shows a living waiting crew, moving test Pip and multi-Pip celebration',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});const errors=await level(page);
 await expect(page.locator('#motion-mode')).toHaveText('Motion: full');await expect(waiting(page)).toHaveCount(5);
 const bob=waiting(page).first().locator('.pip-bob');
 await expect.poll(()=>bob.evaluate(el=>getComputedStyle(el).animationName)).toBe('pip-bounce');
 await expect(page.locator('[data-flight-trail]')).toHaveAttribute('display','none');
 await page.locator('#equation-input').fill('x');await page.locator('#launch').click();
 await expect(waiting(page)).toHaveCount(4);await expect(page.locator('#motion-mode')).toBeDisabled();
 const flying=page.locator('[data-launch-visual][display="inline"][data-launch-phase="flying"] [data-flight-pip]');
 await expect(flying).toBeVisible();
 const first=await flying.getAttribute('transform');
 await expect.poll(async()=>flying.getAttribute('transform'),{intervals:[25,40,60],timeout:650}).not.toBe(first);
 await expect(page.locator('[data-flight-trail]')).toHaveAttribute('display','inline');
 await expect.poll(async()=>page.locator('[data-rapid-visual] [data-rapid-pip][display="inline"][data-pip-phase="flying"]').count(),{timeout:6000,intervals:[40,80,100]}).toBeGreaterThanOrEqual(2);
 await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:15000});
 await expect(waiting(page)).toHaveCount(0);await expect(page.locator('#resolution-stars')).toHaveAttribute('aria-label','3 out of 3 stars');expect(errors).toEqual([]);
});
test('misfire animation rolls and walks away, then reduced/full motion selection remains explicit',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const errors=await level(page);
 await expect(page.locator('#motion-mode')).toHaveText('Motion: reduced');await expect(waiting(page)).toHaveCount(5);
 await expect.poll(()=>waiting(page).first().locator('.pip-bob').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await page.getByRole('button',{name:'Enable full flight animations'}).click();
 await expect(page.locator('#motion-mode')).toHaveText('Motion: full');
 await page.locator('#equation-input').fill('x+1');await page.locator('#launch').click();
 await expect(page.locator('[data-launch-visual][display="inline"][data-launch-phase="rolling"]')).toBeVisible();
 await expect(page.locator('[data-flight-trail]')).toHaveAttribute('display','none');
 await expect(page.locator('[data-launch-visual][display="inline"][data-launch-phase="walking"]')).toBeVisible();
 await expect(page.locator('#phase-label')).toHaveText('Adjust and retry');
 await expect(waiting(page)).toHaveCount(4);
 await page.getByRole('button',{name:'Use reduced motion'}).click();
 await expect(page.locator('#motion-mode')).toHaveText('Motion: reduced');
 await page.locator('#equation-input').fill('x');await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:15000});
 await expect(waiting(page)).toHaveCount(0);expect(errors).toEqual([]);
});
