import {test,expect,type Page} from '@playwright/test';
import {openCannon} from './helpers/programming';
async function enter(page:Page,w:number,l:number,mode=1){
 await page.goto('/');await page.locator('#home-play').click();await page.locator('.world-card').nth(w-1).click();await page.locator('.mode-card').nth(mode).click();await page.locator('.level-number').nth(l-1).click();await page.locator('.selection-play').click();
 await expect(page.locator('#cannon-popup')).toBeHidden();
 await page.getByRole('button',{name:'Use reduced motion'}).click();
}
const status=(page:Page,id:string)=>page.locator('.cannon-target[data-inspect="'+id+'"]');
const field=(page:Page,id:string)=>page.locator('#parameter-boxes [data-parameter="'+id+'"]');
test('click a cannon, enter exact coefficients, navigate, see failed/successful halos, and revise only the failed cannon',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page,1,10);
 const popup=page.locator('#cannon-popup'),a=status(page,'A'),b=status(page,'B');
 await expect(a).toHaveAttribute('data-status','empty');await expect(b).toHaveAttribute('data-status','empty');
 await a.click();await expect(popup).toBeVisible();await expect(field(page,'m')).toBeFocused();
 await expect(page.locator('#previous-cannon')).toBeDisabled();await field(page,'m').press('ArrowUp');await expect(field(page,'m')).toHaveValue('1');
 await expect(a).toHaveAttribute('data-status','invalid');await field(page,'c').fill('1');await expect(a).toHaveAttribute('data-status','ready');
 await page.locator('#next-cannon').click();await expect(page.locator('#popup-title')).toContainText('Cannon B');await expect(field(page,'m')).toHaveValue('');
 await field(page,'m').fill('1');await field(page,'c').fill('1');await expect(b).toHaveAttribute('data-status','ready');
 await page.locator('#previous-cannon').click();await expect(field(page,'m')).toHaveValue('1');await expect(field(page,'c')).toHaveValue('1');
 await page.keyboard.press('Escape');await expect(popup).toBeHidden();await expect(a).toBeFocused();
 await expect(page.locator('#plan-ready')).toHaveText('2 / 2 programmed');await page.locator('#launch').click();await expect(page.locator('#phase-label')).toHaveText('Adjust and retry',{timeout:20000});
 await expect(a).toHaveAttribute('data-status','tested');await expect(b).toHaveAttribute('data-status','revise');
 await openCannon(page,'B');await field(page,'m').fill('-1');await field(page,'c').fill('11');await expect(b).toHaveAttribute('data-status','ready');await expect(a).toHaveAttribute('data-status','tested');
 await page.locator('#popup-done').click();await page.locator('#launch').click();await expect(popup).toBeHidden();await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:25000});
 await expect(a).toHaveAttribute('data-status','tested');await expect(b).toHaveAttribute('data-status','tested');
 await info.attach('successful-halos',{body:await page.screenshot(),contentType:'image/png'});expect(errors).toEqual([]);
});
test('small-screen popup stays on screen, has accessible navigation, and keeps fractional drafts across redraws',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await enter(page,2,10);await openCannon(page,'A');
 await field(page,'m').fill('2/3');await field(page,'m').press('ArrowUp');await expect(field(page,'m')).toHaveValue('5/3');await field(page,'m').press('ArrowDown');await expect(field(page,'m')).toHaveValue('2/3');await field(page,'c').fill('10/3');
 await expect(status(page,'A')).toHaveAttribute('data-status','ready');
 await page.locator('#next-cannon').click();await page.locator('#previous-cannon').click();await expect(field(page,'m')).toHaveValue('2/3');
 await page.setViewportSize({width:844,height:390});
 await expect.poll(async()=>{const b=await page.locator('#cannon-popup').boundingBox();return !!b&&b.x>=0&&b.y>=0&&b.x+b.width<=845&&b.y+b.height<=391;}).toBe(true);
 await info.attach('landscape-popup',{body:await page.screenshot(),contentType:'image/png'});await page.locator('#popup-done').click();
 await expect(page.locator('#cannon-popup')).toBeHidden();await expect(page.locator('#launch')).toBeDisabled();
});
test('advanced box forms and free expressions use the same cannon validation',async({page})=>{
 await enter(page,3,5);await openCannon(page,'A');
 await page.locator('[data-form-id="vertex"]').click();await field(page,'a').fill('1');await field(page,'h').fill('3');await field(page,'k').fill('0');
 await expect(status(page,'A')).toHaveAttribute('data-status','ready');await page.getByRole('button',{name:'Free equation',exact:true}).click();
 await expect(page.locator('#equation-input')).toHaveValue('(1)*(x-(3))²+(0)');
 await page.locator('#equation-input').fill('(x-3)^2');await page.getByRole('button',{name:'Use boxes',exact:true}).click();
 await expect(field(page,'a')).toHaveValue('1');await expect(status(page,'A')).toHaveAttribute('data-status','ready');
});

test('quadratic formula buttons are visible, exact, and independently preserve drafts',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});await enter(page,3,7);await openCannon(page,'A');
 const choices=page.getByRole('group',{name:'Equation forms',exact:true});
 await expect(choices.getByRole('button')).toHaveCount(4);
 const expanded=choices.locator('[data-form-id="quadratic"]'),factorised=choices.locator('[data-form-id="factorised"]'),square=choices.locator('[data-form-id="vertex"]');
 await expect(expanded).toHaveText(/Expanded.*y = ax² \+ bx \+ c/);await expect(factorised).toContainText('y = (ax + b)(cx + d)');await expect(square).toContainText('Completed square');
 await expect(expanded).toHaveAttribute('aria-pressed','true');
 await field(page,'a').fill('1');await field(page,'b').fill('-6');await field(page,'c').fill('5');await expect(status(page,'A')).toHaveAttribute('data-status','ready');
 await factorised.click();await expect(factorised).toHaveAttribute('aria-pressed','true');await expect(status(page,'A')).toHaveAttribute('data-status','empty');
 await expect(field(page,'a')).toBeFocused();await expect(field(page,'a')).toHaveValue('');await expect(page.locator('#launch')).toBeDisabled();
 await field(page,'a').fill('2');await field(page,'b').fill('-2');await field(page,'c').fill('1/2');await field(page,'d').fill('-5/2');
 await expect(status(page,'A')).toHaveAttribute('data-status','ready');await expect(page.locator('#launch')).toBeEnabled();
 await square.click();await expect(field(page,'h')).toHaveValue('');await field(page,'a').fill('1');await field(page,'h').fill('3');await field(page,'k').fill('-4');
 await expanded.click();await expect(field(page,'b')).toHaveValue('-6');await expect(field(page,'c')).toHaveValue('5');
 await factorised.click();await expect(field(page,'a')).toHaveValue('2');await expect(field(page,'d')).toHaveValue('-5/2');
 await info.attach('quadratic-factorised-form',{body:await page.screenshot(),contentType:'image/png'});
 await page.locator('#popup-done').click();await openCannon(page,'A');await expect(factorised).toHaveAttribute('aria-pressed','true');await expect(field(page,'c')).toHaveValue('1/2');
 await page.locator('#popup-done').click();await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:20000});await expect(status(page,'A')).toHaveAttribute('data-status','tested');expect(errors).toEqual([]);
});
test('form drafts survive switching cannons and only the active equation counts as programmed',async({page})=>{
 await enter(page,3,10);await openCannon(page,'A');
 await page.locator('[data-form-id="factorised"]').click();await field(page,'a').fill('2');await field(page,'b').fill('-1');
 await page.locator('[data-form-id="vertex"]').click();await field(page,'a').fill('-1/2');await field(page,'h').fill('4');await field(page,'k').fill('13/2');
 await page.locator('#next-cannon').click();await expect(page.locator('#popup-title')).toContainText('Cannon B');
 await page.locator('[data-form-id="point-slope"]').click();await field(page,'m').fill('1/2');await field(page,'h').fill('3');await field(page,'k').fill('0');
 await page.locator('#previous-cannon').click();await expect(page.locator('[data-form-id="vertex"]')).toHaveAttribute('aria-pressed','true');await expect(field(page,'h')).toHaveValue('4');
 await page.locator('[data-form-id="factorised"]').click();await expect(field(page,'a')).toHaveValue('2');await expect(field(page,'b')).toHaveValue('-1');await expect(field(page,'c')).toHaveValue('');
 await expect(status(page,'A')).toHaveAttribute('data-status','invalid');await expect(page.locator('#plan-ready')).toHaveText('1 / 2 programmed');
 await page.locator('#next-cannon').click();await expect(page.locator('[data-form-id="point-slope"]')).toHaveAttribute('aria-pressed','true');await expect(field(page,'m')).toHaveValue('1/2');
});
