import {test,expect} from '@playwright/test';
test('quadratic progression opens a locked arc, updates its constant, and advances after flight',async({page})=>{
 await page.goto('./');await page.locator('#home-play').click();await page.getByRole('button',{name:'Broken cannons',exact:true}).click();await page.locator('[data-world-number="7"]').click();await page.locator('.mode-card').first().click();
 await expect(page.locator('.level-number')).toHaveCount(12);
 await page.locator('[data-level-id="foundry-quadratic-7"]').click();await page.locator('.selection-play').click();
 await expect(page.locator('#launch')).toBeEnabled();
 const handle=page.locator('[data-lift-handle="B"]');
 await handle.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');
 await expect(handle).toHaveAttribute('aria-valuenow','3');
 await page.locator('[data-inspect="B"]').click();
 await expect(page.locator('.lift-equation')).toHaveText('y = -1/4x^2 + 3x - 5');
 await page.locator('#popup-done').click();
 await page.locator('#launch').click();
 await expect(page.locator('#resolution-heading')).toHaveText('Level complete!',{timeout:30000});
 await page.locator('#next-level').click();
 await expect(page.locator('#world-label')).toContainText('Under the press');
 await page.locator('#level-menu').click();
 await page.locator('.selection-back').click();await page.locator('.mode-card').nth(1).click();await page.locator('[data-level-id="foundry-quadratic-12"]').click();await page.locator('.selection-play').click();
 await expect(page.locator('#launch')).toBeDisabled();
 await expect(page.locator('#plan-ready')).toHaveText('2 / 4 programmed');
 await expect(page.locator('[data-lift-handle]')).toHaveCount(2);
 await expect(page.locator('#graph-preview')).toBeHidden();
});

// Chromium touch input exercises pointer capture rather than simulating a mouse.
test('Foundry lift is touch draggable at phone width and remains usable after zoom/reset',async({browser},info)=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const page=await context.newPage();
 try{
  await page.goto('/');await page.locator('#home-play').tap();await page.getByRole('button',{name:'Broken cannons',exact:true}).tap();await page.locator('[data-world-number="7"]').tap();await page.locator('.mode-card').first().tap();
  await page.locator('[data-level-id="foundry-quadratic-7"]').tap();await page.locator('.selection-play').tap();
  const handle=page.locator('[data-lift-handle="B"]');await expect(handle).toHaveAttribute('aria-valuenow','6');await handle.scrollIntoViewIfNeeded();
  const box=await page.locator('[data-inspect="B"] [data-lift-deck] rect').first().boundingBox(),rail=await page.locator('[data-layer="lift-rail"] line').first().boundingBox();if(!box||!rail)throw Error('Lift not visible');
  const x=box.x+box.width/2,y=box.y+box.height/2,delta=3*rail.height/6.47;
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+delta*i/6}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(handle).toHaveAttribute('aria-valuenow','3');
  await page.locator('#zoom-in').tap();await page.locator('#zoom-reset').tap();
  await expect(handle).toHaveAttribute('aria-valuenow','3');
  const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));expect(metrics.scroll).toBeLessThanOrEqual(metrics.width+2);
  await info.attach('foundry-phone',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 }finally{await context.close();}
});
