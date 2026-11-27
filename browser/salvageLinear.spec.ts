import {test,expect,type Page} from '@playwright/test';
async function enter(page:Page,id:string,mode='Cadet'){
 await page.goto('/');await page.locator('#home-play').click();await page.getByRole('button',{name:'Broken cannons',exact:true}).click();
 await page.getByRole('button',{name:'Salvage Yard · flight tests ↗',exact:true}).click();
 await expect(page.locator('.salvage-linear-choices section')).toHaveCount(6);await expect(page.locator('.salvage-flight-tests section')).toHaveCount(2);
 await page.locator('[data-salvage-level="'+id+'"]').getByRole('button',{name:mode,exact:true}).click();
}
const mount=(id:string)=>'[data-mount-id="'+id+'"]';
async function place(page:Page,part:string,anchor:string){
 await page.locator('[data-anchor-part="'+part+'"]').click();
 await page.locator(mount(anchor)).focus();await page.keyboard.press('Enter');
 await expect(page.locator(mount(anchor))).toHaveAttribute('data-mount-occupied',part);
}
async function program(page:Page,id:string,text:string){
 await page.locator('[data-inspect="'+id+'"]').click();
 const toggle=page.locator('.parameter-toggle');
 if((await toggle.textContent())==='Free equation')await toggle.click();
 await page.locator('#equation-input').fill(text);
 await page.locator('#popup-done').click();
}
test('six-level practice sequence provides first two incoming lines, advances and removes the scaffold',async({page},info)=>{
 await page.setViewportSize({width:1366,height:768});await enter(page,'salvage-linear-1');
 await expect(page.locator('#plan-ready')).toHaveText('1 / 2 programmed');
 await place(page,'B','Q');
 await page.getByRole('button',{name:'Use reduced motion'}).click();
 await page.locator('#launch').click();await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:30000});
 await page.locator('#next-level').click();await expect(page.locator('#world-label')).toContainText('2 / 6');
 await expect(page.locator('#plan-ready')).toHaveText('1 / 2 programmed');
 await place(page,'B','R');await page.locator('#launch').click();await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:30000});
 await page.locator('#next-level').click();await expect(page.locator('#world-label')).toContainText('3 / 6');
 await expect(page.locator('#plan-ready')).toHaveText('0 / 2 programmed');
 await place(page,'B','T');await expect(page.locator('#launch')).toBeDisabled();
 await program(page,'A','3x/4+2');await expect(page.locator('#launch')).toBeEnabled();
 await info.attach('fractional-mounts',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});
test('mixed puzzle: two inventory parts, occupied mount rejection, ordinary equation and success',async({page},info)=>{
 await page.setViewportSize({width:1366,height:768});await enter(page,'salvage-linear-5','Pilot');
 await expect(page.locator('[data-salvage-area="dismantling-yard"]')).toHaveCount(1);
 await expect(page.locator('[data-anchor-part]')).toHaveCount(2);
 await place(page,'B','U');
 await page.locator('[data-anchor-part="C"]').click();
 const q=await page.locator(mount('U')+' [data-anchor-dot]').boundingBox(),card=await page.locator('[data-anchor-part="C"]').boundingBox();if(!q||!card)throw Error('Missing drag coordinates');
 await page.mouse.move(card.x+card.width/2,card.y+card.height/2);await page.mouse.down();await page.mouse.move(q.x+q.width/2,q.y+q.height/2,{steps:10});await page.mouse.up();
 await expect(page.locator(mount('U'))).toHaveAttribute('data-mount-occupied','B');
 await expect(page.locator('.anchor-instructions')).toContainText('occupied');
 await place(page,'C','R');
 await expect(page.locator('#launch')).toBeDisabled();
 await program(page,'A','x+2');await program(page,'B','-x/5+28/5');
 await expect(page.locator('#plan-ready')).toHaveText('3 / 3 programmed');
 await expect(page.locator('#launch')).toBeEnabled();
 await info.attach('mixed-placement',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await page.getByRole('button',{name:'Use reduced motion'}).click();await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:30000});
 await page.locator('#next-level').click();await expect(page.locator('#world-label')).toContainText('6 / 6');
 await expect(page.locator('[data-mount-id]')).toHaveCount(7);
});
