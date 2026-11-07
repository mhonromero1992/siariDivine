// Screenshot helper: node tests/shoot.mjs <path> <out.png> <w> <h> [full] [wait-ms] [--reduce]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , path = '/', out = 'tests/shots/x.png', w = '1440', h = '900', full = '', wait = '2500', ...flags] = process.argv;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: flags.includes('--reduce') ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
await page.goto('http://127.0.0.1:4321' + path, { waitUntil: 'load' });
if (full === 'full') {
  /* scroll like a visitor so lazy photographs load and scroll moments complete, then go back up */
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += Math.round(+h * 0.7)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(140);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(600);
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r))))));
  await page.evaluate(() => {
    document.querySelectorAll('[data-moment]').forEach((m) => m.style.setProperty('--fan', '1'));
    document.querySelectorAll('.grounds__frame').forEach((f) => f.style.setProperty('--route', '1'));
    window.scrollTo(0, 0);
  });
}
await page.waitForTimeout(+wait);
await page.screenshot({ path: out, fullPage: full === 'full' });
const uniq = [...new Set(logs.map((l) => l.slice(0, 300)))];
console.log(out, uniq.length ? uniq.join('\n') : 'no console errors');
await browser.close();
