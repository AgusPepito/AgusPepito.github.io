// Nonvisual integration check. No screenshots, video, or gameplay appearance review.
// Uses the browser dependency installed with the sibling official recipe checkout.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const requireRecipe = createRequire(new URL('../../recipe/package.json', import.meta.url));
const puppeteer = (await import(pathToFileURL(requireRecipe.resolve('puppeteer')).href)).default;
const browser = await puppeteer.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(process.argv[2] || 'http://127.0.0.1:4173/');
  await page.waitForFunction(() => window.__READY__);
  await page.click('#startb');
  await page.keyboard.down('Space');
  await page.waitForFunction(() => window.__GAME__.racingHeld && window.__GAME__.speed > 65);
  await page.keyboard.up('Space');
  await page.waitForFunction(() => !window.__GAME__.racingHeld && window.__GAME__.speed < 30);
  await page.keyboard.down('ShiftLeft');
  await page.waitForFunction(() => window.__GAME__.racingHeld);
  await page.keyboard.press('p');
  await page.waitForFunction(() => window.__GAME__.status === 'paused');
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.press('p');
  await page.waitForFunction(() => window.__GAME__.status === 'playing' && !window.__GAME__.racingHeld);

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.reload(); await page.waitForFunction(() => window.__READY__);
  const center = selector => page.$eval(selector, e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const start = await center('#startb'); await page.touchscreen.tap(start.x, start.y);
  const stick = await center('#stick'), boost = await center('#race-hold');
  const cdp = await page.createCDPSession();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...stick, id: 1 }, { ...boost, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: stick.x + 20, y: stick.y, id: 1 }, { ...boost, id: 2 }] });
  await page.waitForFunction(() => window.__GAME__.racingHeld && window.__GAME__.pos[0] > 1);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: stick.x + 20, y: stick.y, id: 1 }] });
  await page.waitForFunction(() => window.__GAME__.speed > 65);
  assert.equal(await page.evaluate(() => window.__GAME__.racingHeld), true, 'lifting steering finger preserves overdrive');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction(() => !window.__GAME__.racingHeld && window.__GAME__.speed < 30);
  // Exercise ramp and armored render paths without observing gameplay images.
  await page.setViewport({ width: 1280, height: 800, isMobile: false, hasTouch: false });
  await page.reload(); await page.waitForFunction(() => window.__READY__);
  await page.click('#tune-toggle'); await page.click('#invincible'); await page.click('#tune-close');
  await page.click('#startb'); await page.keyboard.down('Space');
  await page.waitForFunction(() => window.__GAME__.armored > 0 && window.__GAME__.distance > 550, { timeout: 30000 });
  await page.keyboard.up('Space');
  await page.click('#tune-toggle');
  await page.$eval('#shake', e => { e.value = 0; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('#wind', e => { e.value = 0; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForFunction(() => window.__GAME__.options.shake === 0 && window.__GAME__.options.wind === 0);
  await page.click('#tune-close');
  await page.waitForFunction(() => window.__GAME__.status === 'playing');
  assert.deepEqual(errors, []);
  console.log('PASS: keyboard hold/release, Shift, pause/reset of held input, simultaneous touch steering + racing, independent finger release, ramp and armored runtime paths, adjustable effects, and no runtime errors. No visual testing performed.');
} finally { await browser.close(); }
