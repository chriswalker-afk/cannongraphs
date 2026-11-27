import {test,expect,type Page} from '@playwright/test';
import {PROGRESS_KEY} from '../src/game/progressStore';
async function enter(page:Page,id:string,mode='Cadet'){
 await page.goto('/');await page.locator('#home-play').click();await page.getByRole('button',{name:'Broken cannons',exact:true}).click();
 await page.locator('[data-world-number="8"]').click();await page.getByRole('button',{name:new RegExp('^'+mode+'\\.')} ).click();
 await expect(page.locator('.level-number')).toHaveCount(12);
 await page.locator('[data-level-id="'+id+'"]').click();await page.locator('.selection-play').click();
}
const mount=(id:string)=>'[data-mount-id="'+id+'"]';
const part=(id:string)=>'[data-anchor-part="'+id+'"]';
async function place(page:Page,id:string,anchor:string){
 await page.locator(part(id)).click();await page.locator(mount(anchor)).focus();await page.keyboard.press('Enter');
 await expect(page.locator(mount(anchor))).toHaveAttribute('data-mount-occupied',id);
}
async function program(page:Page,id:string,text:string){
 await page.locator('[data-inspect="'+id+'"]').click();
 const toggle=page.locator('.parameter-toggle');if((await toggle.textContent())==='Free equation')await toggle.click();
 await page.locator('#equation-input').fill(text);await page.locator('#popup-done').click();
}
async function launch(page:Page){
 await expect(page.locator('#launch')).toBeEnabled();await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:30000});
}
test('linear-to-quadratic boundary, relocated arc constant, blocked decoy and next puzzle',async({page},info)=>{
 await page.setViewportSize({width:1366,height:768});await enter(page,'salvage-linear-6');
 await place(page,'B','R');await place(page,'C','V');await program(page,'A','4x/3+2');await program(page,'C','x-7');
 await page.getByRole('button',{name:'Use reduced motion'}).click();await launch(page);
 await page.locator('#next-level').click();await expect(page.locator('#world-label')).toContainText('7 / 12');
 await expect(page.locator('[data-salvage-area="sorting-station"]')).toHaveCount(1);
 await expect(page.locator('#plan-ready')).toHaveText('0 / 2 programmed');
 await place(page,'B','P');await expect(page.locator(part('B'))).toContainText('y = -1/2x^2 + 6x - 8');
 await place(page,'B','R');await expect(page.locator(part('B'))).toContainText('y = -1/2x^2 + 6x - 13');
 await program(page,'A','x/2+1');await page.locator('[data-inspect="B"]').click();await expect(page.locator('.anchor-equation')).toHaveText('y = -1/2x^2 + 6x - 13');
 await page.locator('#popup-done').click();await info.attach('sorting-station',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await launch(page);await page.locator('#next-level').click();await expect(page.locator('#world-label')).toContainText('8 / 12');
});
test('three locked parts fire in inferred order; finale has ten mounts, two arcs and one ordinary part',async({page},info)=>{
 await page.setViewportSize({width:1440,height:800});await enter(page,'salvage-quadratic-11','Pilot');
 await expect(page.locator('[data-salvage-area="reconstruction-plant"]')).toHaveCount(1);
 await expect(page.locator('[data-anchor-part]')).toHaveCount(3);await expect(page.locator('#graph-preview')).toBeHidden();
 await place(page,'B','R');await place(page,'C','P');await place(page,'D','T');
 await program(page,'A','2x/3+1');await expect(page.locator('#plan-ready')).toHaveText('4 / 4 programmed');
 await page.getByRole('button',{name:'Use reduced motion'}).click();await launch(page);await page.locator('#next-level').click();
 await expect(page.locator('#world-label')).toContainText('12 / 12');await expect(page.locator('[data-mount-id]')).toHaveCount(10);
 await place(page,'B','P');await place(page,'C','Q');await place(page,'D','R');await expect(page.locator('#plan-ready')).toHaveText('2 / 4 programmed');
 await program(page,'A','2x/3+2');await program(page,'C','-x/2+15/2');await info.attach('salvage-finale',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await launch(page);await expect(page.locator('#next-level')).toBeHidden();
 const progress=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)??'{}'),PROGRESS_KEY);expect(progress.records['salvage-quadratic-11'].pilot.bestAttempts).toBe(1);expect(progress.records['salvage-quadratic-12'].pilot.bestAttempts).toBe(1);
 await page.locator('#level-menu').click();await expect(page.locator('[data-level-id="salvage-quadratic-12"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-level-id="salvage-quadratic-12"] .level-progress-mark')).toHaveText('★★★');
 await page.reload();await page.locator('#home-play').click();await page.getByRole('button',{name:'Broken cannons',exact:true}).click();await expect(page.locator('[data-world-number="8"]')).toContainText('2 / 12 completed');
});
test('finale phone layout keeps three inventory cards, exact coordinates and the entire graph accessible',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await enter(page,'salvage-quadratic-12','Ace');
 await expect(page.locator('#graph-preview')).toBeHidden();await expect(page.locator('[data-anchor-part]')).toHaveCount(3);
 await expect(page.locator('#level-objective')).toContainText('use every cannon');
 await place(page,'B','P');await place(page,'C','Q');await place(page,'D','R');
 const rects=await page.locator('[data-anchor-part]').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width};}));
 expect(rects.every(r=>r.x>=0&&r.x+r.w<=391&&r.w>75)).toBeTruthy();
 expect(Math.max(...rects.map(r=>r.y))-Math.min(...rects.map(r=>r.y))).toBeLessThan(3);
 const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));expect(metrics.scroll).toBeLessThanOrEqual(metrics.width+2);
 await info.attach('salvage-finale-phone',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await page.locator('#restart-level').click();await expect(page.locator('#plan-ready')).toHaveText('0 / 4 programmed');
});

test('Foundry finale advances into official Salvage Yard and retains the selected mode',async({page})=>{
 await page.setViewportSize({width:1366,height:768});await page.goto('/');await page.locator('#home-play').click();await page.getByRole('button',{name:'Broken cannons',exact:true}).click();
 await page.locator('[data-world-number="7"]').click();await page.locator('.mode-card').nth(1).click();await page.locator('[data-level-id="foundry-quadratic-12"]').click();await page.locator('.selection-play').click();
 for(const [id,target] of [['B',4],['D',2]] as const){const h=page.locator('[data-lift-handle="'+id+'"]');await h.focus();const y=Number(await h.getAttribute('aria-valuenow'));for(let i=0;i<Math.abs(y-target);i++)await page.keyboard.press(y<target?'ArrowUp':'ArrowDown');}
 await program(page,'A','2x/3+2');await program(page,'C','15/2-x/2');
 await page.getByRole('button',{name:'Use reduced motion'}).click();await launch(page);
 await expect(page.locator('#next-level')).toContainText('Next world');await page.locator('#next-level').click();
 await expect(page.locator('main[data-world="8"][data-mode="pilot"]')).toBeVisible();await expect(page.locator('#world-label')).toContainText('1 / 12');await expect(page.locator('#plan-ready')).toHaveText('1 / 2 programmed');
});
