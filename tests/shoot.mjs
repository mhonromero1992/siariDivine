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
await page.waitForTimeout(+wait);
await page.screenshot({ path: out, fullPage: full === 'full' });
const uniq = [...new Set(logs.map((l) => l.slice(0, 300)))];
console.log(out, uniq.length ? uniq.join('\n') : 'no console errors');
await browser.close();
