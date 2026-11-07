// Private preview renders (with the uncommitted preview photographs), for review only.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const go = async (path) => {
  await page.goto('http://127.0.0.1:4321' + path, { waitUntil: 'load' });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(120); }
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r))))));
};
const shotAt = async (selector, out, pad = 0) => {
  const el = await page.$(selector);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const box = await el.boundingBox();
  await page.screenshot({ path: out, clip: { x: 0, y: Math.max(0, box.y - pad), width: 1440, height: Math.min(box.height + pad * 2, 1600) } });
};
await go('/');
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(6000);
await page.screenshot({ path: 'tests/shots/preview-1-hero.png' });
await shotAt('#visit', 'tests/shots/preview-2-visit.png');
await page.click('.spot[data-station="roof-deck"]');
await shotAt('[data-grounds]', 'tests/shots/preview-3-grounds.png');
await shotAt('.chapters', 'tests/shots/preview-4-photos.png');
await go('/shrine');
await shotAt('#gallery', 'tests/shots/preview-5-gallery.png');
await browser.close();
console.log('done');
