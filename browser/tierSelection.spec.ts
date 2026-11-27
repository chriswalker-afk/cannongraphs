import {test,expect,type Page} from '@playwright/test';
import {worlds} from '../src/levels/catalog';
import {difficultyTiers,levelTiers} from '../src/levels/progression';
import {PROGRESS_KEY} from '../src/game/progressStore';

async function choose(page:Page,world:number,mode=1){
 await page.goto('/');await page.locator('#home-play').click();
 if(world===7)await page.getByRole('button',{name:'Broken cannons',exact:true}).click();await page.locator('[data-world-number="'+world+'"]').click();await page.locator('.mode-card').nth(mode).click();
 await expect(page.locator('.level-tier')).toHaveCount(4);
}
for(const w of worlds)test('all twelve '+w.name+' levels appear in the correct labelled tiers',async({page},info)=>{
 await page.setViewportSize(w.number%2?{width:1366,height:768}:{width:390,height:844});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await choose(page,w.number);
 const rows=page.locator('.level-tier'),buttons=page.locator('.level-number');
 await expect(buttons).toHaveCount(12);await expect(page.locator('.selection-play')).toBeDisabled();
 for(const [i,tier] of difficultyTiers.entries()){
  const row=rows.nth(i);await expect(row).toHaveAttribute('data-cannons',String(tier.count));await expect(row.getByRole('heading')).toHaveText(tier.name);
  const count=levelTiers(w.levels)[i].label;await expect(row.locator('.level-tier-count')).toHaveText(count);
  const tiles=row.locator('.level-number');await expect(tiles).toHaveCount(3);
  for(let j=0;j<3;j++){
   const n=i*3+j,l=w.levels[n],tile=tiles.nth(j);
   await expect(tile).toHaveText(String(n+1));await expect(tile).toHaveAttribute('data-level-id',l.id);
   await expect(tile).toHaveAccessibleName(new RegExp('Level '+(n+1)+', '+tier.name+', '+count));
   await expect(tile).toBeEnabled();await tile.click();
   await expect(page.locator('.level-number[aria-pressed=true]')).toHaveCount(1);
   await expect(page.locator('.level-tier[data-selected=true]')).toHaveAttribute('data-cannons',String(tier.count));
   await expect(page.locator('.level-details-title')).toHaveText(l.title);await expect(page.locator('.level-details-tier')).toHaveText(tier.name.toUpperCase());
   await expect(page.locator('.level-facts')).toContainText(l.cannons.length+' '+(l.cannons.length===1?'cannon':'cannons'));await expect(page.locator('.selection-play')).toBeEnabled();
  }
 }
 const metrics=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
 expect(metrics.scroll).toBeLessThanOrEqual(metrics.viewport+2);
 await info.attach('tier-menu',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});expect(errors).toEqual([]);
});
test('keyboard selection, mode-specific records and return from gameplay preserve the real puzzle ID',async({page})=>{
 await page.addInitScript(({key})=>{
  localStorage.setItem(key,JSON.stringify({version:1,records:{'1-01':{cadet:{bestAttempts:1,gems:[]},pilot:{bestAttempts:2,gems:[]}},'1-r05':{pilot:{bestAttempts:1,gems:[]}}}}));
 },{key:PROGRESS_KEY});
 await choose(page,1);
 const first=page.locator('[data-level-number="1"]'),fifth=page.locator('[data-level-number="5"]');
 await expect(first.locator('.level-progress-mark')).toHaveText('★★');
 await expect(fifth.locator('.level-progress-mark')).toHaveText('★★★');
 await fifth.focus();await page.keyboard.press('Enter');await expect(fifth).toHaveAttribute('aria-pressed','true');await expect(page.locator('.selection-play')).toHaveText('Replay level 5 ▶');
 await page.locator('.selection-play').click();await expect(page.locator('.cannon-target')).toHaveCount(2);
 await page.locator('#level-menu').click();await expect(page.locator('[data-level-number="5"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.level-tier[data-selected=true]')).toHaveAttribute('data-cannons','2');
 await page.locator('.selection-back').click();await page.locator('.mode-card').first().click();
 await expect(first.locator('.level-progress-mark')).toHaveText('✓');await expect(fifth.locator('.level-progress-mark')).toHaveCount(0);
 await expect(fifth).toHaveAttribute('aria-pressed','true');await expect(page.locator('.selection-play')).toHaveText('Play level 5 ▶');
 await page.locator('.selection-back').click();await page.locator('.mode-card').nth(2).click();
 await expect(first.locator('.level-progress-mark')).toHaveCount(0);await expect(fifth).toHaveAttribute('aria-pressed','true');
});
