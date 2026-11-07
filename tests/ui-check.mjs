/**
 * UI self-test: layout, accessibility and interaction checks in a real browser.
 * Run with the preview server up (`npm run preview`), then `npm run test:ui`.
 */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4321';
const PAGES = ['/', '/shrine', '/devotion', '/visit', '/sacraments', '/contact', '/404'];
const WIDTHS = [1440, 1024, 768, 390, 320];
const results = [];
const fail = (where, msg) => results.push({ ok: false, where, msg });
const pass = (where, msg) => results.push({ ok: true, where, msg });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

/* ── static checks at every width ── */
for (const path of PAGES) {
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 800 ? 844 : 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !/404 \(Not Found\)/.test(m.text()) && errors.push(m.text()));
    const res = await page.goto(BASE + path, { waitUntil: 'load' });
    // walk the page so lazy content loads
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(400);
    const where = `${path} @${width}`;
    if (path !== '/404' && res.status() !== 200) fail(where, `HTTP ${res.status()}`);
    const r = await page.evaluate((w) => {
      const out = {};
      const de = document.documentElement;
      out.overflowX = de.scrollWidth - de.clientWidth;
      const vis = (el) => {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      out.offRight = [...document.querySelectorAll('main *, footer *, header *')]
        .filter((el) => vis(el) && !el.closest('svg') && !el.closest('[hidden]') && !el.closest('.hero__stage') && !el.closest('.chapters__bleed') && !el.closest('.grounds__frame') && !el.closest('.closing__ridges') && !el.closest('dialog'))
        .filter((el) => el.getBoundingClientRect().right > w + 1)
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} right=${Math.round(el.getBoundingClientRect().right)}`);
      out.brokenImgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map((i) => i.getAttribute('src'));
      out.noAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).length;
      out.h1 = document.querySelectorAll('h1').length;
      const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((e) => +e.tagName[1]);
      out.headingJumps = levels.filter((l, i) => i > 0 && l - levels[i - 1] > 1).length;
      out.emDash = (document.body.innerText.match(/—/g) || []).length;
      out.unnamed = [...document.querySelectorAll('a[href], button')]
        .filter((el) => vis(el) && !(el.getAttribute('aria-label') || el.textContent.trim() || el.querySelector('img[alt]:not([alt=""]), svg title')))
        .map((el) => el.outerHTML.slice(0, 80));
      if (w <= 390) {
        out.smallTargets = [...document.querySelectorAll('a[href], button, summary, select, input:not([type=hidden]), textarea')]
          .filter((el) => vis(el) && !el.closest('p, li p, dd, .prose, .qa__body, .lead, blockquote') && !el.closest('[hidden]') && !el.closest('.spot') && !el.closest('dialog'))
          .filter((el) => {
            const b = el.getBoundingClientRect();
            return b.height < 44 && !(el.matches('input[type=checkbox], input[type=radio]'));
          })
          .slice(0, 6)
          .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 30)}" h=${Math.round(el.getBoundingClientRect().height)}`);
      }
      out.internalLinks = [...new Set([...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href').split('#')[0]))];
      out.anchors = [...new Set([...document.querySelectorAll('a[href*="#"]')].map((a) => a.getAttribute('href')))];
      return out;
    }, width);
    if (r.overflowX > 0) fail(where, `horizontal overflow ${r.overflowX}px`);
    if (r.offRight.length) fail(where, `content past the right edge: ${r.offRight.join('; ')}`);
    if (r.brokenImgs.length) fail(where, `broken images: ${r.brokenImgs.join(', ')}`);
    if (r.noAlt) fail(where, `${r.noAlt} images without alt`);
    if (r.h1 !== 1) fail(where, `${r.h1} h1 elements`);
    if (r.headingJumps) fail(where, `${r.headingJumps} skipped heading levels`);
    if (r.emDash) fail(where, `${r.emDash} em dashes in text`);
    if (r.unnamed.length) fail(where, `controls without a name: ${r.unnamed.join(' | ')}`);
    if (r.smallTargets?.length) fail(where, `tap targets under 44px: ${r.smallTargets.join('; ')}`);
    if (errors.length) fail(where, `console: ${[...new Set(errors)].join(' | ').slice(0, 300)}`);
    if (width === 1440) {
      for (const link of r.internalLinks) {
        const lr = await page.request.get(BASE + link);
        if (lr.status() !== 200) fail(where, `link ${link} -> ${lr.status()}`);
      }
      for (const a of r.anchors) {
        const [p, id] = a.split('#');
        if (!id) continue;
        if (p && p !== path && !(p === '/' && path === '/')) {
          const html = await (await page.request.get(BASE + p)).text();
          if (!html.includes(`id="${id}"`)) fail(where, `anchor ${a} has no target`);
        } else if (!(await page.$(`#${id}`))) fail(where, `anchor ${a} has no target`);
      }
    }
    if (!results.some((x) => !x.ok && x.where === where)) pass(where, 'layout, a11y and links');
    await ctx.close();
  }
}

/* ── interactions ── */
async function interact(name, width, fn, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 800 ? 844 : 900 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await fn(page);
    if (errors.length) fail(name, `page errors: ${errors.join(' | ')}`);
    else pass(name, 'ok');
  } catch (e) {
    fail(name, e.message.split('\n')[0]);
  }
  await ctx.close();
}
const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

await interact('keyboard: skip link first, visible on focus', 1440, async (page) => {
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(350);
  const s = await page.evaluate(() => ({ cls: document.activeElement.className, top: document.activeElement.getBoundingClientRect().top }));
  expect(s.cls.includes('skip-link'), `first Tab focused ${s.cls}`);
  expect(s.top >= 0, `skip link not visible when focused (top ${s.top})`);
  await page.keyboard.press('Enter');
  const id = await page.evaluate(() => location.hash);
  expect(id === '#main', `skip link went to ${id}`);
});

await interact('menu sheet opens, traps focus, closes on Escape', 390, async (page) => {
  await page.goto(BASE + '/visit', { waitUntil: 'load' });
  await page.click('[data-menu-open]');
  expect(await page.isVisible('[data-menu]'), 'menu did not open');
  expect((await page.getAttribute('[data-menu-open]', 'aria-expanded')) === 'true', 'aria-expanded not true');
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement.closest('[data-menu]')), 'focus escaped the menu');
  await page.keyboard.press('Escape');
  expect(!(await page.isVisible('[data-menu]')), 'menu did not close');
  expect(await page.evaluate(() => document.activeElement.matches('[data-menu-open]')), 'focus not returned to Menu');
  await page.click('[data-menu-open]');
  await page.click('[data-menu] a[href="/devotion"]');
  await page.waitForURL('**/devotion');
});

await interact('grounds: stations change the panel', 1440, async (page) => {
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.click('.spot[data-station="our-lady"]');
  expect((await page.textContent('[data-panel-name]')).includes('Our Lady'), 'station 3 not shown');
  await page.click('[data-step="1"]');
  expect((await page.textContent('[data-panel-name]')).includes('chapel'), 'next station not shown');
  expect((await page.getAttribute('.spot[data-station="chapel"]', 'aria-pressed')) === 'true', 'marker not pressed');
});

await interact('grounds on a phone: the list drives the panel', 390, async (page) => {
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.click('.grounds__list [data-station="healing-walk"]');
  expect((await page.textContent('[data-panel-name]')).includes('Healing Walk'), 'list did not select');
});

await interact('chaplet: beads advance, go back, and remember', 1440, async (page) => {
  await page.goto(BASE + '/devotion', { waitUntil: 'load' });
  await page.click('[data-restart]');
  for (let i = 0; i < 5; i++) await page.click('[data-next]');
  expect((await page.textContent('[data-count]')) === '6', `count ${await page.textContent('[data-count]')}`);
  expect((await page.textContent('[data-title]')).includes('For the sake'), 'wrong prayer at step 6');
  await page.click('[data-prev]');
  expect((await page.textContent('[data-title]')).includes('Eternal Father'), 'previous did not go back');
  await page.reload({ waitUntil: 'load' });
  expect((await page.textContent('[data-count]')) === '5', 'progress not remembered');
  await page.focus('[data-next]');
  await page.keyboard.press('ArrowRight');
  expect((await page.textContent('[data-count]')) === '6', 'arrow key did not advance');
  await page.click('[data-bead="medal"]');
  expect((await page.textContent('[data-title]')).includes('Holy God'), 'bead click did not jump');
});

await interact('forms: empty submit shows errors; filled submit prepares the message', 1440, async (page) => {
  await page.goto(BASE + '/sacraments', { waitUntil: 'load' });
  expect(!(await page.isVisible('#intention-form ~ [data-ready], .compose [data-ready]')), 'ready panel visible before submit');
  await page.click('#intention-form [type=submit]');
  const errs = await page.$$eval('#intention-form .field__error', (n) => n.filter((x) => x.textContent.trim()).length);
  expect(errs >= 4, `expected field errors, got ${errs}`);
  expect((await page.getAttribute('#i-name', 'aria-invalid')) === 'true', 'aria-invalid missing');
  await page.fill('#i-name', 'Maria Santos');
  await page.fill('#i-contact', '0917 000 0000');
  await page.click('label.choice:has(input[value="Thanksgiving"])');
  expect(await page.isChecked('input[name="kind"][value="Thanksgiving"]'), 'choice chip did not select');
  await page.fill('#i-for', 'The Santos family');
  await page.click('#intention-form [type=submit]');
  await page.waitForSelector('#intention-form + [data-ready]:not([hidden]), .compose [data-ready]:not([hidden])', { timeout: 5000 });
  const text = await page.inputValue('#intention-form-text');
  expect(text.includes('Mass intention request') && text.includes('The Santos family') && text.includes('Thanksgiving'), 'message not composed');
  const href = await page.getAttribute('.compose [data-ready] a.btn', 'href');
  expect(href.startsWith('https://m.me/'), 'Messenger link missing');
}, { permissions: ['clipboard-read', 'clipboard-write'] });

await interact('gallery: lightbox opens, steps, closes', 1440, async (page) => {
  await page.goto(BASE + '/shrine', { waitUntil: 'load' });
  const any = await page.$('[data-gallery] [data-index="0"]');
  if (!any) return; // no photographs in this build
  await any.click();
  expect(await page.isVisible('[data-lightbox]'), 'lightbox did not open');
  const first = await page.getAttribute('[data-lightbox-img]', 'src');
  await page.keyboard.press('ArrowRight');
  expect((await page.getAttribute('[data-lightbox-img]', 'src')) !== first, 'arrow did not step');
  await page.keyboard.press('Escape');
  expect(!(await page.isVisible('[data-lightbox]')), 'Escape did not close');
});

await interact('credits dialog opens and closes', 1440, async (page) => {
  await page.goto(BASE + '/contact', { waitUntil: 'load' });
  await page.click('[data-credits-open]');
  expect(await page.isVisible('[data-credits]'), 'credits did not open');
  await page.click('[data-credits-close]');
  expect(!(await page.isVisible('[data-credits]')), 'credits did not close');
});

await interact('hero: scene starts, pause toggles', 1440, async (page) => {
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('[data-hero]').dataset.gl === 'on', null, { timeout: 20000 });
  await page.click('[data-hero-pause]');
  expect((await page.getAttribute('[data-hero-pause]', 'aria-pressed')) === 'true', 'pause not pressed');
  await page.click('[data-hero-pause]');
  expect((await page.getAttribute('[data-hero-pause]', 'aria-pressed')) === 'false', 'play not restored');
});

await interact('reduced motion: everything visible, nothing waits on animation', 390, async (page) => {
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const hidden = await page.$$eval('[data-rise]', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
  expect(hidden === 0, `${hidden} hero elements not visible`);
  expect(!(await page.isVisible('[data-hero-pause]')), 'pause control shown although nothing moves');
}, { reducedMotion: 'reduce' });

await browser.close();

const bad = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.where}  ${r.msg}`);
console.log(`\n${results.length - bad.length} passed, ${bad.length} failed`);
process.exit(bad.length ? 1 : 0);
