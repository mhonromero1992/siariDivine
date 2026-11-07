/**
 * Downloads the freely licensed photographs listed in src/data/credits.js (PHOTO_MANIFEST) from
 * Wikimedia Commons into public/images/commons/. The site shows each one, with its credit, as soon
 * as its file exists. Run it on a normal internet connection: `npm run fetch:photos`.
 *
 * Wikimedia asks automated clients to identify themselves and to use standard thumbnail sizes.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { PHOTO_MANIFEST } from '../src/data/credits.js';

const UA = 'SiariShrineWebsite/1.0 (https://github.com/mhonromero1992/siaridivine) node-fetch';
const OUT = new URL('../public/images/commons/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = 'json') {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      await sleep((Number(res.headers.get('retry-after')) || 5) * 1000 + attempt * 2000);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} for ${url}`);
    return as === 'json' ? res.json() : Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`gave up on ${url}`);
}

for (const p of PHOTO_MANIFEST) {
  const target = new URL(p.file, OUT);
  if (existsSync(target)) {
    console.log(`have   ${p.file}`);
    continue;
  }
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.search = new URLSearchParams({
    action: 'query',
    titles: `File:${p.commons}`,
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: String(p.width),
    format: 'json',
  });
  const data = await get(api.href);
  const page = Object.values(data.query.pages)[0];
  const info = page.imageinfo?.[0];
  if (!info) {
    console.log(`missing ${p.commons}`);
    continue;
  }
  const bytes = await get(info.thumburl || info.url, 'buffer');
  writeFileSync(target, bytes);
  console.log(`saved  ${p.file} (${Math.round(bytes.length / 1024)} KB) from ${info.descriptionurl}`);
  await sleep(1500);
}
console.log('Done. Rebuild the site (npm run build) to include them.');
