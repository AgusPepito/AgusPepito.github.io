// Nonvisual menu/input/runtime checks only; no screenshots or gameplay review.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const recipe = createRequire(new URL('../../recipe/package.json', import.meta.url));
const puppeteer = (await import(pathToFileURL(recipe.resolve('puppeteer')).href)).default;
const browser = await puppeteer.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(process.argv[2] || 'http://127.0.0.1:4173/');
  await page.waitForFunction(() => window.__READY__);
  assert.equal(await page.$$eval('input[name="encounter"]', es => es.length), 5);
  await page.click('#tune-toggle'); await page.click('#invincible'); await page.click('#tune-close');
  for (const type of ['darts', 'interceptors', 'mines', 'convoy']) {
    await page.click(`input[name="encounter"][value="${type}"]`);
    await page.click('#startb');
    await page.waitForFunction(type => window.__GAME__.encounter?.type === type && (window.__GAME__.encounter.age > 5 || window.__GAME__.status === 'complete'), {}, type);
    const state = await page.evaluate(() => window.__GAME__);
    assert.equal(state.vehicles, 0);
    assert.ok(state.encounter.members.length >= 1);
    assert.ok(state.encounter.members.some(e => e.kind === 'scout'), 'normal red enemies reinforce every encounter');
    assert.ok(state.encounter.members.every(e => Number.isFinite(e.s) && Number.isFinite(e.lateral)));
    assert.ok(state.draws > 0);
    if (state.status === 'complete') await page.click('#restart');
    else {
      await page.keyboard.press('p');
      await page.waitForFunction(() => window.__GAME__.status === 'paused');
      await page.click('#restart-paused');
    }
    await page.waitForFunction(type => window.__GAME__.status === 'playing' && window.__GAME__.encounter.type === type && window.__GAME__.encounter.age < 1, {}, type);
    if (type !== 'interceptors') {
      if (type === 'convoy') {
        await page.keyboard.down('d');
        await page.waitForFunction(() => window.__GAME__.lateral > 11);
        await page.keyboard.up('d');
      }
      await page.keyboard.down('Space');
      await page.keyboard.down('ShiftLeft');
      await page.waitForFunction(() => window.__GAME__.status === 'complete', { timeout: 45000 });
      await page.keyboard.up('Space'); await page.keyboard.up('ShiftLeft');
      assert.equal(await page.$eval('#results', e => e.hidden), false);
      assert.notEqual(await page.evaluate(() => window.__GAME__.encounter.outcome), 'cleared', 'bypassing targets is not a clear');
      await page.click('#choose-result');
    } else {
      await page.keyboard.press('p'); await page.click('#choose-paused');
    }
    await page.waitForFunction(() => window.__GAME__.status === 'ready');
    assert.equal(await page.evaluate(() => window.__GAME__.encounter.age), 0);
    console.log(`PASS: ${type} starts, runs, retries and returns to selection.`);
  }
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.reload(); await page.waitForFunction(() => window.__READY__);
  const tap = async selector => {
    await page.$eval(selector, e => e.scrollIntoView({ block: 'center' }));
    const p = await page.$eval(selector, e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await page.touchscreen.tap(p.x, p.y);
  };
  await tap('input[value="convoy"]'); await tap('#startb');
  await page.waitForFunction(() => window.__GAME__.status === 'playing' && window.__GAME__.encounter.type === 'convoy');
  await tap('#encounter-menu');
  await page.waitForFunction(() => window.__GAME__.status === 'ready');
  assert.deepEqual(errors, []);
  console.log('PASS: mobile touch selection/start/return and no browser runtime errors. No visual testing performed.');
} finally { await browser.close(); }
