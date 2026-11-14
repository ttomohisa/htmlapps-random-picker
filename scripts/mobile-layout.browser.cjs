'use strict';
// Native Chromium runs only in the existing unprivileged PR build job.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const cfg = {"slug": "random-picker", "phone": 620, "badge": "[data-i18n=\"localBadge\"]", "ja": "完全ローカル処理", "en": "Fully local processing", "hide": 0, "build": true, "details": false, "end": "#builtAt", "close": "#helpCloseButton"};
const evidence = path.resolve('test-results/mobile-layout');

async function assertHeaderVersionFits(page, width, height, label) {
  const expected = 'v' + JSON.parse(fs.readFileSync(path.resolve('app.config.json'), 'utf8')).version;
  const version = page.locator('.app-header .version-badge, .app-header .version');
  assert.equal(await version.count(), 1, label + ': one header version');
  assert.equal((await version.textContent()).trim(), expected, label + ': current version');
  assert.equal(await version.isVisible(), true, label + ': header version visible');
  const box = await version.evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el); const r = range.getBoundingClientRect();
    let left = 0, right = innerWidth, top = 0, bottom = innerHeight;
    for (let p = el; p; p = p.parentElement) {
      const style = getComputedStyle(p), b = p.getBoundingClientRect();
      if (/hidden|clip|auto|scroll/.test(style.overflowX)) { left = Math.max(left, b.left); right = Math.min(right, b.right); }
      if (/hidden|clip|auto|scroll/.test(style.overflowY)) { top = Math.max(top, b.top); bottom = Math.min(bottom, b.bottom); }
    }
    const actions = document.querySelector('.header-actions').getBoundingClientRect();
    return { x:r.left, y:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height, left, clipRight:right, top, clipBottom:bottom,
      overlapsActions: r.left < actions.right && r.right > actions.left && r.top < actions.bottom && r.bottom > actions.top };
  });
  assert.ok(box.width > 0 && box.height > 0 && box.x >= box.left - .5 && box.right <= box.clipRight + .5 && box.y >= box.top - .5 && box.bottom <= box.clipBottom + .5 && !box.overlapsActions, label + ': full version glyphs fit viewport/ancestor clips without action overlap ' + JSON.stringify(box));
}

async function bounds(locator, width, height, label, vertical = true) {
  const r = await locator.boundingBox();
  assert.ok(r && r.x >= -1 && r.x + r.width <= width + 1 && (!vertical || (r.y >= -1 && r.y + r.height <= height + 1)), label + ': controls fit viewport');
}
async function layoutMetrics(page) {
  return page.evaluate(() => {
    const x=scrollX,y=scrollY;
    scrollTo({left:1000,top:y,behavior:'instant'});
    const canScrollX=scrollX;
    scrollTo({left:x,top:y,behavior:'instant'});
    return {
      width:innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      canScrollX,
      visibleOverflow:[...document.querySelectorAll('body *')].filter(el=>el.getClientRects().length)
        .map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,id:el.id,left:r.left,right:r.right};})
        .filter(r=>r.right>innerWidth+.5||r.left<-.5).slice(0,12)
    };
  });
}
async function controls(page, width, height, label) {
  if (cfg.slug === 'developer-toolbox') {
    assert.equal(await page.locator('#mobileToolsButton').isVisible(), width <= cfg.phone, label + ': tool picker breakpoint');
    if (width <= cfg.phone) {
      await page.locator('#mobileToolsButton').click();
      await page.locator('#pickerSearch').fill('base64');
      await page.locator('#pickerSearch').press('Enter');
      assert.equal(await page.locator('#toolPickerDialog').isVisible(), false);
    }
    await page.locator('#base64Input').fill('synthetic');
    await page.locator('#base64Encode').click();
    assert.equal(await page.locator('#base64Output').textContent(), 'c3ludGhldGlj');
  } else if (cfg.slug === 'random-picker') {
    await page.locator('#candidateInput').fill('Alpha\nBeta\nGamma');
    const run = page.locator('#runButton');
    assert.equal(await run.isEnabled(), true, label + ': Run enabled');
    await run.scrollIntoViewIfNeeded();
    await bounds(run, width, height, label);
    assert.equal(await run.evaluate(el => getComputedStyle(el).position), width <= cfg.phone ? 'sticky' : 'static');
    await run.click();
    await page.locator('.winner-name').waitFor();
    assert.ok(['Alpha','Beta','Gamma'].includes((await page.locator('.winner-name').textContent()).trim()));
    // Validate the show style using reduced motion, with no audio or device permissions.
    await page.locator('[data-mode="wheel"]').click();
    await page.locator('[data-wheel-style="deluxe"]').click();
    assert.equal(await page.locator('#wheelSound').isChecked(),false,label + ': sound opt-in defaults off');
    await run.click();
    assert.equal(await page.locator('#presentationDialog').isVisible(),true,label + ': show opens fullscreen');
    await page.locator('#presentationDialog.revealed .presentation-label').waitFor();
    assert.ok(['Alpha','Beta','Gamma'].includes((await page.locator('#presentationDialog .presentation-label').textContent()).trim()),label + ': show selects one candidate');
    await page.locator('#presentationCloseButton').click();
    assert.equal(await page.locator('#presentationDialog').isVisible(),false,label + ': show closes');
  } else {
    // Do not request sensors or permissions. Exercise the ordinary waiting-state UI.
    assert.equal(await page.locator('.control-dock button').count(), 4);
    assert.equal(await page.locator('#zeroButton').isDisabled(), true);
    assert.equal(await page.locator('#holdButton').isDisabled(), true);
    await page.locator('#edgeModeButton').click();
    assert.equal(await page.locator('#edgeModeButton').getAttribute('aria-selected'), 'true');
    await page.locator('#flatModeButton').click();
    await page.locator('#settingsButton').click();
    assert.equal(await page.locator('#settingsDialog').isVisible(), true);
    await page.keyboard.press('Escape');
    if (width <= cfg.phone) await bounds(page.locator('.control-dock'), width, height, label);
  }
}
async function main() {
  fs.mkdirSync(evidence, {recursive:true});
  const browser = await chromium.launch();
  try {
    const cases = [];
    for (const language of ['ja','en']) for (const [width,height] of [[1360,900],[cfg.phone+1,568],[cfg.phone,568],[320,568],[360,640],[390,844],[393,252]]) cases.push({file:'dist/index.html',language,width,height});
    cases.push({file:'dist/index.self-extract.html',language:'en',width:360,height:640});
    cases.push({file:cfg.slug+'.html',language:'ja',width:1360,height:900});
    for (const {file,language,width,height} of cases) {
      const context = await browser.newContext({viewport:{width,height},locale:language,reducedMotion:'reduce'});
      const page = await context.newPage(), errors = [], requests = [];
      const label = `${file} ${language} ${width}x${height}`;
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
      try {
        await page.goto(pathToFileURL(path.resolve(file)).href + (cfg.slug === 'developer-toolbox' ? '#base64' : ''));
        await page.locator('#helpButton').waitFor();
        if (await page.locator('html').getAttribute('lang') !== language) await page.locator('#languageButton').click();
        await assertHeaderVersionFits(page, width, height, label);
        const badge = page.locator('.local-badge');
        assert.equal(await badge.count(), 1, label + ': one privacy badge');
        assert.equal(await badge.isVisible(), width > cfg.phone, label + ': privacy badge hidden on phone');
        assert.equal((await badge.textContent()).trim(), language === 'ja' ? cfg.ja : cfg.en);
        assert.equal(await badge.locator('svg[aria-hidden="true"]').count(), 1);
        assert.match(await badge.locator('svg path').first().getAttribute('d'), /^M12 3 /);
        if (width > cfg.phone) await bounds(badge, width, height, label, false);
        assert.equal(await page.locator('body > footer').isVisible(), width > cfg.phone, label + ': informational footer');
        const initialLayout = await layoutMetrics(page);
        await controls(page, width, height, label);
        for (const w of [cfg.phone+1,cfg.phone,width]) {
          await page.setViewportSize({width:w,height});
          assert.equal(await page.locator('body > footer').isVisible(), w > cfg.phone, label + ': footer resize');
        }
        await page.evaluate(() => scrollTo(0,0));
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const finalLayout = await layoutMetrics(page);
        for (const [phase,layout] of [['initial',initialLayout],['final',finalLayout]]) {
          assert.ok(layout.scrollWidth <= width, label + ': '+phase+' no horizontal document overflow '+JSON.stringify(layout));
          assert.equal(layout.canScrollX,0,label + ': '+phase+' no horizontal page scrolling');
          assert.deepEqual(layout.visibleOverflow,[],label + ': '+phase+' visible elements fit width');
        }
        if (cfg.slug === 'pocket-level' && width <= cfg.phone) await bounds(page.locator('.control-dock'),width,height,label);
        if (file === 'dist/index.html' && [1360,320].includes(width)) await page.screenshot({path:path.join(evidence,`${language}-${width}.png`)});
        await page.locator('#helpButton').click();
        const body = page.locator('#helpDialog .dialog-body');
        if (cfg.build) {
          assert.equal(await page.locator('main #buildVersion, footer #buildVersion').count(),0, label + ': build metadata left main/footer');
          assert.match(await page.locator('#buildVersion').textContent(),/\d/);
          assert.notEqual((await page.locator('#builtAt').textContent()).trim(),'—');
          if (cfg.details) {
            const summary = page.locator('#helpDialog .build-details summary');
            await summary.focus();
            await summary.press('Enter');
            assert.equal(await page.locator('#helpDialog').isVisible(),true,label + ': keyboard disclosure keeps Help open');
            assert.equal(await page.locator('#helpDialog .build-details').getAttribute('open'),'');
          }
        }
        await body.evaluate(el => { el.scrollTop = el.scrollHeight; });
        const end = await page.locator(cfg.end).evaluate(el => {
          const r=el.getBoundingClientRect(); let top=0,bottom=innerHeight;
          for(let p=el.parentElement;p;p=p.parentElement) { const s=getComputedStyle(p);if(/auto|scroll|hidden|clip/.test(s.overflowY)){const b=p.getBoundingClientRect();top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);} }
          return {top:r.top,bottom:r.bottom,clipTop:top,clipBottom:bottom};
        });
        assert.ok(end.top >= end.clipTop-1 && end.bottom <= end.clipBottom+1,label + ': final Help content reachable '+JSON.stringify(end));
        assert.ok(await body.evaluate(el => el.scrollWidth <= el.clientWidth+1),label + ': Help width');
        await bounds(page.locator('#helpDialog .dialog-header'),width,height,label);
        const modal = await page.locator('#helpDialog').boundingBox();
        const backdrop = [[1,1],[width-1,1],[1,height-1],[width-1,height-1]].find(([x,y]) => x < modal.x || x > modal.x+modal.width || y < modal.y || y > modal.y+modal.height);
        assert.ok(backdrop, label + ': genuine backdrop point available');
        const y=await page.evaluate(() => scrollY);
        await page.mouse.move(...backdrop);await page.mouse.wheel(0,400);await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => scrollY),y,label + ': modal background locked');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#helpDialog').isVisible(),false,label + ': Escape');
        await page.locator('#helpButton').click();await page.locator(cfg.close).click();
        assert.equal(await page.locator('#helpDialog').isVisible(),false,label + ': close after reopen');
        assert.deepEqual(errors,[],label + ': console errors');assert.deepEqual(requests,[],label + ': external runtime requests');
        console.log('PASS '+label);
      } catch(error) { await page.screenshot({path:path.join(evidence,'failure.png')}).catch(()=>{});throw new Error(label+': '+error.message,{cause:error}); }
      finally { await context.close(); }
    }

    // One complete non-reduced-motion performance path, kept separate from the fast
    // reduced-motion matrix above. This catches timing, spotlight, and cancellation.
    {
      const context=await browser.newContext({viewport:{width:390,height:844},locale:'ja',reducedMotion:'no-preference'});
      const page=await context.newPage();
      const errors=[], requests=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
      page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
      try {
        await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
        await page.locator('#candidateInput').fill('ラーメン\nカレー\n寿司\n焼肉');
        await page.locator('[data-mode="wheel"]').click();
        await page.locator('[data-wheel-style="deluxe"]').click();
        assert.equal(await page.locator('#wheelSound').isChecked(),false,'Show sound defaults to off');
        await page.locator('#runButton').click();
        await page.locator('#presentationDialog.deluxe-wheel').waitFor();
        assert.equal(await page.locator('#presentationDialog .show-marquee > span').count(),32,'32 chasing marquee lamps');
        await page.locator('#presentationDialog.final-stretch').waitFor({timeout:14000});
        await page.locator('#presentationDialog.suspense').waitFor({timeout:8000});
        await page.locator('#presentationDialog.revealed .show-result .presentation-label').waitFor({timeout:6000});
        const selected=(await page.locator('#presentationDialog .show-result .presentation-label').textContent()).trim();
        assert.ok(['ラーメン','カレー','寿司','焼肉'].includes(selected),'Show winner is a real candidate');
        assert.equal(await page.locator('#historyList .history-item').count(),1,'one recorded draw');
        await page.screenshot({path:path.join(evidence,'show-ja-390.png')});
        await page.locator('#presentationAgainButton').click();
        await page.locator('#presentationDialog .show-marquee > span').first().waitFor();
        await page.locator('#presentationCloseButton').click();
        assert.equal(await page.locator('#presentationDialog').isVisible(),false,'closing Show cancels a pending draw');
        await page.waitForFunction(() => !document.querySelector('#runButton').disabled,{},{timeout:3000});
        assert.equal(await page.locator('#runButton').isEnabled(),true,'Run re-enabled after cancelling Show');
        assert.equal(await page.locator('#historyList .history-item').count(),1,'cancelled draw was not recorded');
        assert.deepEqual(errors,[],'Show did not cause console errors');
        assert.deepEqual(requests,[],'Show made no network requests');
        console.log('PASS full-speed Show ja 390x844: countdown, suspense, winner and cancellation');
      } catch(error) {
        await page.screenshot({path:path.join(evidence,'show-failure.png')}).catch(()=>{});
        throw error;
      } finally {await context.close();}
    }
  } finally { await browser.close(); }
}
main().catch(error => {console.error(error);process.exitCode=1;});
