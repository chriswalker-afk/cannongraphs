import {test,expect,type Page} from '@playwright/test';
import {enterFree} from './helpers/programming';
async function level(page:Page,mode=1){
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#home-play').click();await page.locator('.world-card').first().click();await page.locator('.mode-card').nth(mode).click();await page.locator('.level-number').first().click();await page.locator('.selection-play').click();
 await expect(page.locator('main.game-screen')).toBeVisible();return errors;
}
const waiting=(page:Page)=>page.locator('.stage [data-waiting-pip][display="inline"]');
test('full motion is the default even with OS reduced motion: living crew, moving test Pip and multi-Pip celebration',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const errors=await level(page);
 await expect(page.locator('#motion-mode')).toHaveText('Motion: full');await expect(waiting(page)).toHaveCount(5);
 const bob=waiting(page).first().locator('.pip-bob');
 await expect.poll(()=>bob.evaluate(el=>getComputedStyle(el).animationName)).toBe('pip-bounce');
 await expect(page.locator('[data-flight-trail]')).toHaveAttribute('display','none');
 await enterFree(page,'x','A');await page.locator('#launch').click();
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
 await expect(page.locator('#motion-mode')).toHaveText('Motion: full');await expect(waiting(page)).toHaveCount(5);
 await page.getByRole('button',{name:'Use reduced motion'}).click();
 await expect(page.locator('#motion-mode')).toHaveText('Motion: reduced');
 await expect.poll(()=>waiting(page).first().locator('.pip-bob').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await page.getByRole('button',{name:'Enable full flight animations'}).click();
 await expect(page.locator('#motion-mode')).toHaveText('Motion: full');
 await enterFree(page,'x+1','A');await page.locator('#launch').click();
 await expect(page.locator('[data-launch-visual][display="inline"][data-launch-phase="rolling"]')).toBeVisible();
 await expect(page.locator('[data-flight-trail]')).toHaveAttribute('display','none');
 await expect(page.locator('[data-launch-visual][display="inline"][data-launch-phase="walking"]')).toBeVisible();
 await expect(page.locator('#phase-label')).toHaveText('Adjust and retry');
 await expect(waiting(page)).toHaveCount(4);
 await page.getByRole('button',{name:'Use reduced motion'}).click();
 await expect(page.locator('#motion-mode')).toHaveText('Motion: reduced');
 await enterFree(page,'x','A');await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:15000});
 await expect(waiting(page)).toHaveCount(0);
 await page.locator('#home-return').click();await expect(page.locator('#home-motion')).toHaveText('Play animation');
 await page.locator('#home-play').click();await page.locator('.world-card').first().click();await page.locator('.mode-card').nth(1).click();await page.locator('.level-number').nth(1).click();await page.locator('.selection-play').click();
 await expect(page.locator('#motion-mode')).toHaveText('Motion: reduced');
 await page.emulateMedia({reducedMotion:'no-preference'});await expect(page.locator('#motion-mode')).toHaveText('Motion: reduced');
 expect(errors).toEqual([]);
});

for(const [name,viewport,preference] of [
 ['desktop',{width:1366,height:768},'no-preference'],
 ['phone',{width:390,height:844},'reduce']
] as const){
 test('home animates by default on '+name+' and can still be paused',async({page})=>{
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:preference});await page.goto('/');
  const button=page.locator('#home-motion'),pip=page.locator('.home-art [data-pip-fur]').first();
  await expect(button).toHaveText('Pause animation');
  const before=await pip.getAttribute('transform');
  await expect.poll(()=>pip.getAttribute('transform'),{timeout:4000}).not.toBe(before);
  await button.click();await expect(button).toHaveText('Play animation');
  const frozen=await pip.getAttribute('transform');
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  expect(await pip.getAttribute('transform')).toBe(frozen);
  await button.click();await expect(button).toHaveText('Pause animation');
 });
}
