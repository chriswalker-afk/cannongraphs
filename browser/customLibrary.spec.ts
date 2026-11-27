import {test,expect,type Page} from '@playwright/test';
import {emptyDesign,placeObject,encodeCustomFile,CUSTOM_KEY,CUSTOM_LIBRARY_KEY,designKey} from '../src/game/customLevels';
import {PROGRESS_KEY} from '../src/game/progressStore';
import {enterFree} from './helpers/programming';
function design(title:string){
 let d=placeObject(emptyDesign(),'linear',{x:1,y:3}).design;
 d=placeObject(d,'exit',{x:8,y:3}).design;
 return {...d,title};
}
const file=(name:string,title:string)=>({name,mimeType:'application/json',buffer:Buffer.from(encodeCustomFile(design(title)))});
async function open(page:Page){await page.goto('/');await page.locator('#home-custom-library').click();await expect(page.locator('main.custom-library')).toBeVisible();}
async function card(page:Page,title:string){await page.locator('.library-card').filter({has:page.getByText(title,{exact:true})}).click();}
test('local library imports several levels, keeps independent records, and returns to the selected challenge',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1366,height:768});await open(page);
 await expect(page.locator('#library-list')).toContainText('Your library is empty');
 await page.locator('#library-file').setInputFiles([file('first.cannon.json','Horizontal flight'),file('second.cannon.json','Sky station'),{name:'bad.json',mimeType:'application/json',buffer:Buffer.from('bad')}]);
 await expect(page.locator('.library-card')).toHaveCount(2);
 await expect(page.locator('#library-message')).toContainText('2 levels added');await expect(page.locator('#library-message')).toContainText('bad.json');
 await card(page,'Horizontal flight');await expect(page.locator('#library-download')).toBeDisabled();
 await expect(page.locator('#library-play')).toBeEnabled();
 await page.locator('#library-search').fill('sky');await expect(page.locator('.library-card')).toHaveCount(1);await page.locator('#library-search').fill('');
 await page.locator('#library-filter').selectOption('confirmed');await expect(page.locator('.library-card')).toHaveCount(0);await page.locator('#library-filter').selectOption('imported');
 await card(page,'Horizontal flight');
 for(const mode of ['cadet','pilot','ace']){
  await page.locator('.library-mode[data-mode="'+mode+'"]').click();await page.locator('#library-play').click();
  await expect(page.locator('#world-label')).toContainText('Custom level · Horizontal flight');
  await expect(page.locator('main.game-screen')).toHaveAttribute('data-mode',mode);
  if(mode==='cadet')await page.getByRole('button',{name:'Use reduced motion'}).click();
  await enterFree(page,'3','A');await page.locator('#launch').click();
  await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:20000});
  await expect(page.locator('#resolution-record')).toContainText('New custom record!');
  await page.locator('#next-level').click();
  await expect(page.locator('.library-card[aria-pressed=true]')).toContainText('Horizontal flight');
  await expect(page.locator('.library-mode[data-mode="'+mode+'"]')).toContainText('1 attempt');
  await expect(page.locator('.library-mode[data-mode="'+mode+'"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#library-download')).toBeDisabled();
 }
 await info.attach('custom-mode-records',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 const official=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'{"records":{}}').records,PROGRESS_KEY);expect(official).toEqual({});
 await page.locator('#library-edit').click();await expect(page.locator('#custom-confirm')).toBeDisabled();
 await page.locator('#custom-test').click();await enterFree(page,'3','A');await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Playtest complete!',{timeout:20000});await page.locator('#next-level').click();
 await page.locator('#custom-confirm').click();await page.locator('#custom-library').click();
 await expect(page.locator('.library-card[aria-pressed=true]')).toContainText('Confirmed');
 await expect(page.locator('#library-download')).toBeEnabled();
 const download=page.waitForEvent('download');await page.locator('#library-download').click();expect((await download).suggestedFilename()).toBe('horizontal-flight.cannon.json');
 await page.locator('#library-duplicate').click();await expect(page.locator('.library-card')).toHaveCount(3);
 await expect(page.locator('.library-card[aria-pressed=true]')).toContainText('Horizontal flight (copy)');await expect(page.locator('#library-download')).toBeDisabled();
 await expect(page.locator('.library-mode[data-mode=pilot]')).toContainText('Not completed');
 page.once('dialog',dialog=>dialog.accept());await page.locator('#library-delete').click();await expect(page.locator('.library-card')).toHaveCount(2);
 await open(page);await card(page,'Horizontal flight');await expect(page.locator('#library-download')).toBeEnabled();
 await expect(page.locator('.library-mode[data-mode=ace]')).toContainText('1 attempt');
 await card(page,'Sky station');await expect(page.locator('.library-mode[data-mode=ace]')).toContainText('Not completed');
 await page.locator('#library-new').click();await expect(page.locator('#custom-title')).toHaveValue('Untitled level');await page.locator('#custom-library').click();
 await expect(page.locator('.library-card')).toHaveCount(3);expect(errors).toEqual([]);
});
test('legacy confirmed draft migrates and a new workshop draft does not replace it on a phone',async({page},info)=>{
 const d=design('Earlier design'),key=designKey(d),legacy=JSON.stringify({version:1,design:d,tested:key,confirmed:key});
 await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:CUSTOM_KEY,raw:legacy});
 await page.setViewportSize({width:390,height:844});await open(page);
 await expect(page.locator('.library-card')).toHaveCount(1);await expect(page.locator('#library-download')).toBeEnabled();
 await expect(page.locator('#library-message')).toContainText('previous workshop draft');
 await page.locator('#library-edit').click();await page.locator('#custom-new').click();
 await expect(page.locator('#custom-title')).toHaveValue('Untitled level');await page.locator('#custom-library').click();
 await expect(page.locator('.library-card')).toHaveCount(2);await card(page,'Earlier design');await expect(page.locator('#library-download')).toBeEnabled();
 const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));expect(metrics.scroll).toBeLessThanOrEqual(metrics.width+2);
 await info.attach('phone-custom-library',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 const stored=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)??'{}'),CUSTOM_LIBRARY_KEY);expect(stored.entries.length).toBe(2);
 expect(await page.evaluate(k=>localStorage.getItem(k),CUSTOM_KEY)).toBe(legacy);
});
