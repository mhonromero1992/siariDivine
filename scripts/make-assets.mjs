/**
 * Renders the site's own images from its own code, so nothing is hand-exported:
 *  - the hero posters (the WebGL scene captured with ?poster, no text), landscape and portrait
 *  - the share image (og.jpg), the favicon and the touch icon
 * Run after `npm run build` with the preview server up: `npm run preview` then `npm run assets`.
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4321';
const OUT = new URL('../public/', import.meta.url);
mkdirSync(new URL('images/', OUT), { recursive: true });

const HIDE = `.hero__content,.hero__scrim,.site-nav,.hero__pause,.dock,.hero__poster{visibility:hidden!important}`;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

async function capturePoster(name, viewport, scale) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: scale });
  await page.goto(`${BASE}/?poster`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.posterReady === 'true', null, { timeout: 60000 });
  await page.waitForTimeout(400);
  await page.addStyleTag({ content: HIDE });
  const canvas = page.locator('[data-hero-canvas]');
  const png = await canvas.screenshot({ type: 'png' });
  await page.close();
  const img = sharp(png);
  await img.clone().webp({ quality: 74, effort: 6 }).toFile(new URL(`images/hero-poster-${name}.webp`, OUT).pathname);
  await img.clone().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(new URL(`images/hero-poster-${name}.jpg`, OUT).pathname);
  const meta = await img.metadata();
  console.log(`poster ${name}: ${meta.width}x${meta.height}`);
}

await capturePoster('landscape', { width: 1920, height: 1080 }, 1);
await capturePoster('portrait', { width: 414, height: 896 }, 2);

/* share image: the hero itself, without the nav and controls */
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/?poster`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.posterReady === 'true', null, { timeout: 60000 });
  await page.addStyleTag({
    content: `.site-nav,.hero__pause,.dock,.hero__facts,.hero__actions,.hero__words-note{display:none!important}
      .hero{padding-block:56px!important;min-height:630px!important}
      .hero [data-rise]{opacity:1!important;translate:none!important;transition:none!important}`,
  });
  await page.waitForTimeout(500);
  const shot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await sharp(shot).jpeg({ quality: 82, mozjpeg: true }).toFile(new URL('og.jpg', OUT).pathname);
  await page.close();
  console.log('og.jpg');
}

await browser.close();

/* the two-ray mark as favicon and touch icon */
const mark = (bg, ink) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/>
  <g transform="translate(13 7) scale(1.46)">
    <path d="M13 1.2v7.6M9.6 4.3h6.8" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <path d="M13 13.4 2.4 29h6.9z" fill="#d8435b"/>
    <path d="M13 13.4 17 29h6.6z" fill="#a9d4ee"/>
    <circle cx="13" cy="13.2" r="1.8" fill="${ink}"/>
  </g></svg>`;
writeFileSync(new URL('favicon.svg', OUT), mark('#101a29', '#f4f1ea'));
await sharp(Buffer.from(mark('#101a29', '#f4f1ea'))).resize(180, 180).png().toFile(new URL('apple-touch-icon.png', OUT).pathname);
console.log('favicon.svg, apple-touch-icon.png');
