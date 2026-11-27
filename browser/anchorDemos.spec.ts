import {test,expect,type Page} from '@playwright/test';
import {PROGRESS_KEY} from '../src/game/progressStore';

async function enter(page:Page,id='anchor-demo-linear',mode='Cadet'){
 await page.goto('/?flight-tests=1');
 await page.locator('#home-play').click();
 await page.getByRole('button',{name:'Broken cannons',exact:true}).click();
 await page.getByRole('button',{name:'Salvage Yard · flight tests ↗',exact:true}).click();
 await page.locator('[data-anchor-demo="'+id+'"]').getByRole('button',{name:mode,exact:true}).click();
 await expect(page.locator('#anchor-tray')).toBeVisible();
}
async function centre(page:Page,selector:string){
 const r=await page.locator(selector).first().boundingBox();if(!r)throw Error('Missing target '+selector);
 return {x:r.x+r.width/2,y:r.y+r.height/2};
}
async function drag(page:Page,from:string,to:string){
 await page.locator(from).first().scrollIntoViewIfNeeded();
 const a=await centre(page,from),b=await centre(page,to);
 await page.mouse.move(a.x,a.y);await page.mouse.down();
 await page.mouse.move(b.x,b.y,{steps:14});await page.mouse.up();
}
const part='[data-anchor-part="B"]',dot=(id:string)=>'[data-mount-id="'+id+'"] [data-anchor-dot]';
const mount=(id:string)=>'[data-mount-id="'+id+'"]';

test('linear prototype: drag from tray, remount via grip, inspect locked equation, test and replay',async({page},info)=>{
 await page.setViewportSize({width:1366,height:768});await enter(page);
 await expect(page.locator('#launch')).toBeDisabled();
 await expect(page.locator('#plan-ready')).toHaveText('1 / 2 programmed');
 await expect(page.locator('[data-mount-id]')).toHaveCount(4);
 await expect(page.locator('[data-inspect="B"]')).toHaveCount(0);
 await expect(page.locator(part)).toContainText('y = -x + c');
 await expect(page.locator('[data-scenery="salvage-yard"]')).toHaveCount(1);
 await drag(page,part,dot('P'));
 await expect(page.locator(mount('P'))).toHaveAttribute('data-mount-occupied','B');
 await expect(page.locator(part)).toContainText('y = -x + 5');
 await expect(page.locator('#launch')).toBeEnabled();
 // Neither the correct nor the incorrect legal mount is indicated as a solution.
 await expect(page.locator(mount('Q'))).toHaveAttribute('data-drop-ready','true');
 await expect(page.locator(mount('R'))).toHaveAttribute('data-drop-ready','true');
 await drag(page,'[data-anchor-move="B"] [data-anchor-grip-hit]',dot('Q'));
 await expect(page.locator(mount('P'))).toHaveAttribute('data-mount-occupied','');
 await expect(page.locator(mount('Q'))).toHaveAttribute('data-mount-occupied','B');
 await expect(page.locator(part)).toContainText('y = -x + 9');
 await page.locator('[data-inspect="B"]').click();
 await expect(page.locator('.anchor-equation')).toHaveText('y = -x + 9');
 await expect(page.locator('#popup-editor input')).toHaveCount(0);
 await page.locator('#graph-preview').click();await expect(page.locator('[data-layer="cadet-graph-preview"] path').first()).toBeVisible();
 await page.locator('#popup-done').click();
 await info.attach('salvage-mounted',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await page.getByRole('button',{name:'Use reduced motion'}).click();
 await page.locator('#launch').click();await expect(page.locator(part)).toBeDisabled();
 await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:30000});
 const progress=await page.evaluate(k=>localStorage.getItem(k),PROGRESS_KEY);expect(progress??'').not.toContain('anchor-demo-linear');
 await page.locator('#replay-level').click();await expect(page.locator(mount('Q'))).toHaveAttribute('data-mount-occupied','B');
 await page.locator(part).click();await page.getByRole('button',{name:'Return to tray',exact:true}).click();
 await expect(page.locator('[data-inspect="B"]')).toHaveCount(0);await expect(page.locator('#launch')).toBeDisabled();
 await page.locator(part).click();await page.locator(mount('Q')).focus();await page.keyboard.press('Enter');
 await expect(page.locator(mount('Q'))).toHaveAttribute('data-mount-occupied','B');
 await page.locator('#restart-level').click();await expect(page.locator('[data-inspect="B"]')).toHaveCount(0);
 await expect(page.locator('#launch')).toBeDisabled();await expect(page.locator('#plan-ready')).toHaveText('1 / 2 programmed');
 await page.locator('#level-menu').click();await expect(page.locator('.salvage-demo-menu')).toBeVisible();
 await page.locator('#anchor-demo-back').click();await expect(page.getByRole('button',{name:'Broken cannons',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('quadratic prototype: keyboard placement, failed decoy and correct arc in Pilot mode',async({page})=>{
 await page.setViewportSize({width:1366,height:768});await enter(page,'anchor-demo-arc','Pilot');
 await expect(page.locator('#graph-preview')).toBeHidden();
 await page.locator(part).focus();await page.keyboard.press('Enter');
 await page.locator(mount('P')).focus();await page.keyboard.press('Enter');
 await expect(page.locator(part)).toContainText('y = -1/2x^2 + 6x - 8');
 await page.getByRole('button',{name:'Use reduced motion'}).click();await page.locator('#launch').click();
 await expect(page.locator('#phase-label')).toHaveText('Adjust and retry',{timeout:30000});
 await expect(page.locator('#flight-result')).toBeVisible();
 await page.locator(part).click();await page.locator(mount('Q')).focus();await page.keyboard.press('Enter');
 await expect(page.locator(part)).toContainText('y = -1/2x^2 + 6x - 13');
 await expect(page.locator('[data-inspect="B"] [data-broken-lock]')).toHaveCount(1);
 await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:30000});
});

test('phone: real touch drag and tap placement, zoom, return and reset',async({browser},info)=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const page=await context.newPage();
 try{
  await enter(page,'anchor-demo-arc','Ace');await expect(page.locator('#graph-preview')).toBeHidden();
  await expect(page.locator('#level-objective')).toContainText('use every cannon');
  await page.locator(part).scrollIntoViewIfNeeded();
  const a=await centre(page,part),b=await centre(page,dot('Q'));
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x,y:a.y}]});
  for(let i=1;i<=16;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(b.x-a.x)*i/16,y:a.y+(b.y-a.y)*i/16}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator(mount('Q'))).toHaveAttribute('data-mount-occupied','B');
  const trayWidth=await page.locator('#anchor-tray').evaluate(el=>el.getBoundingClientRect().width);expect(trayWidth).toBeGreaterThan(300);
  const tap=async(selector:string)=>{
   await page.locator(selector).first().scrollIntoViewIfNeeded();
   // Chromium suppresses a synthetic click immediately after a drag.
   // Use a realistic inter-gesture gap and touch dwell; all input still
   // goes through native touch dispatch, never an artificial DOM click.
   await page.waitForTimeout(250);
   const p=await centre(page,selector);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});
   await page.waitForTimeout(50);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };
  await tap('#zoom-in');await expect(page.locator('#zoom-readout')).toHaveText('125%');
  await tap('#zoom-reset');await expect(page.locator('#zoom-readout')).toHaveText('100%');
  await expect(page.locator(mount('Q'))).toHaveAttribute('data-mount-occupied','B');
  await tap(part);
  await tap('.anchor-return');
  await expect(page.locator(mount('Q'))).toHaveAttribute('data-mount-occupied','');
  await tap(part);await tap(mount('P')+' rect[fill="transparent"]');
  await expect(page.locator(mount('P'))).toHaveAttribute('data-mount-occupied','B');
  const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));expect(metrics.scroll).toBeLessThanOrEqual(metrics.width+2);
  await info.attach('salvage-phone',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  await tap('#restart-level');await expect(page.locator('#launch')).toBeDisabled();
 }finally{await context.close();}
});
