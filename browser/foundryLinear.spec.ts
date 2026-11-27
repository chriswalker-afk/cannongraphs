import {test,expect} from '@playwright/test';
test('linear progression starts with a ready incoming equation and later requires programming',async({page})=>{
 await page.goto('./');await page.locator('#home-lift-demos').click();
 await expect(page.locator('.foundry-linear-choices section')).toHaveCount(6);
 await page.locator('[data-foundry-level="foundry-linear-1"]').getByRole('button',{name:'Cadet'}).click();
 await expect(page.locator('#launch')).toBeEnabled();
 const handle=page.locator('[data-lift-handle="B"]');
 await handle.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');
 await expect(handle).toHaveAttribute('aria-valuenow','2');
 await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:30000});
 await page.locator('#next-level').click();
 await expect(page.locator('#world-label')).toContainText('Downhill lift');
 await page.locator('#level-menu').click();
 await page.locator('[data-foundry-level="foundry-linear-5"]').getByRole('button',{name:'Pilot'}).click();
 await expect(page.locator('#launch')).toBeDisabled();
 await expect(page.locator('#plan-ready')).toHaveText('1 / 2 programmed');
});
