/**
 * Licensed photographs the site can show. A photograph appears on the site (and in the credits)
 * only when its file exists in public/images/commons/. Run `npm run fetch:photos` on a machine
 * with normal internet access to download them from Wikimedia Commons.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PHOTO_MANIFEST = [
  {
    id: 'divine-mercy-1934',
    file: 'divine-mercy-1934.jpg',
    title: 'Divine Mercy, Eugeniusz Kazimirowski, 1934 (the first image, painted under St. Faustina’s direction)',
    artist: 'Eugeniusz Kazimirowski',
    license: 'Public domain',
    commons: 'Divina Misericordia (Eugeniusz Kazimirowski, 1934).jpg',
    width: 1280,
    alt: 'The first painting of the Divine Mercy: Christ in a white robe, right hand raised in blessing, a red and a pale ray streaming from His heart.',
  },
  {
    id: 'faustina-1931',
    file: 'faustina-1931.jpg',
    title: 'Sister Faustina Kowalska, Płock, 1931',
    artist: 'Unknown photographer',
    license: 'Public domain',
    commons: 'Siostra Faustyna Kowalska - Płock (1931).jpg',
    width: 960,
    alt: 'Portrait photograph of Sister Faustina Kowalska in her religious habit, 1931.',
  },
];

const dir = fileURLToPath(new URL('../../public/images/commons/', import.meta.url));

export const PHOTOS = Object.fromEntries(
  PHOTO_MANIFEST.filter((p) => existsSync(dir + p.file)).map((p) => [
    p.id,
    { ...p, src: `/images/commons/${p.file}`, page: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.commons.replaceAll(' ', '_'))}` },
  ]),
);

export const PHOTO_CREDITS = Object.values(PHOTOS);
