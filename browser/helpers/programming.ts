import {expect,type Page} from '@playwright/test';
export async function openCannon(page:Page,id?:string){
 const popup=page.locator('#cannon-popup');
 if(id){
  if(await popup.isVisible())await page.locator('#popup-done').click();
  const target=page.locator('.cannon-target[data-inspect="'+id+'"]');
  await target.focus();await page.keyboard.press('Enter');
 }else if(!await popup.isVisible())await page.locator('#edit-cannons').click();
 await expect(popup).toBeVisible();
}
export async function openFree(page:Page,id?:string){
 await openCannon(page,id);
 if(await page.locator('#equation-editor').isHidden())await page.getByRole('button',{name:'Free equation',exact:true}).click();
 await expect(page.locator('#equation-input')).toBeVisible();
}
export async function enterFree(page:Page,equation:string,id?:string){
 await openFree(page,id);await page.locator('#equation-input').fill(equation);
 await page.locator('#popup-done').click();
}
