/**
 * Photographs of the shrine.
 *
 * Put each photograph in src/assets/shrine/ under the slot's file name (any of .jpg, .jpeg, .png,
 * .webp). A slot appears on the site as soon as its file exists; until then the drawing stands in.
 * Astro resizes and converts every photograph at build time (AVIF and WebP, several widths).
 *
 * Only photographs the shrine owns, or has written permission to use, belong in that folder.
 * Credit them in CREDITS below.
 *
 * src/assets/shrine-preview/ is for private layout previews and is never committed (.gitignore).
 */
const committed = import.meta.glob('../assets/shrine/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
const preview = import.meta.glob('../assets/shrine-preview/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
const previewCredits = import.meta.glob('../assets/shrine-preview/credits.json', { eager: true, import: 'default' });

export const PHOTO_SLOTS = {
  chapel: { file: 'chapel', alt: 'The whitewashed chapel on Siari Hills, the statue of the Divine Mercy on its roof deck and the words “Jesus, I trust in You” across the front.' },
  'chapel-dusk': { file: 'chapel-dusk', alt: 'The chapel at dusk, the statue of the Divine Mercy lit white against a deep blue sky.' },
  interior: { file: 'interior', alt: 'Inside the chapel: white columns, a polished floor and the altar before glass walls that open onto the sea.' },
  'interior-dusk': { file: 'interior-dusk', alt: 'The chapel at sunset, the sea glowing orange through the glass walls behind the altar.' },
  entrance: { file: 'entrance', alt: 'Pilgrims entering the chapel through its glass doors.' },
  statue: { file: 'statue', alt: 'The statue of the Divine Mercy on the roof deck, its right hand raised, a red and a pale ray falling from its heart.' },
  'our-lady': { file: 'our-lady', alt: 'The white statue of Our Lady on the lower hill, standing on a blue cloud with a rosary in her hand.' },
  tower: { file: 'tower', alt: 'The white tower beside the chapel, its octagonal storeys under a dark pointed roof and a cross.' },
  'walk-of-faith': { file: 'walk-of-faith', alt: 'The Walk of Faith: stairs climbing the hill between rails painted in the pink and blue of the two rays.' },
  arch: { file: 'arch', alt: 'The lit entrance arch on the highway at night, its sign welcoming visitors in the name of the Señor Santo Niño.' },
  petitions: { file: 'petitions', alt: 'An outdoor petition shrine: the image of the Divine Mercy in a stone niche above a box for written prayers.' },
  faustina: { file: 'faustina', alt: 'The outdoor shrine of St. Faustina, her portrait in a stone niche above a box for written prayers.' },
  saints: { file: 'saints', alt: 'Statues of saints in white alcoves along the Healing Walk.' },
  gethsemane: { file: 'gethsemane', alt: 'The statue of Christ kneeling in prayer on a rock in the Garden of Gethsemane.' },
  view: { file: 'view', alt: 'The view from the roof deck: green lowlands and coconut palms running down to the blue sea.' },
  'view-coast': { file: 'view-coast', alt: 'The coast of Sindangan seen from the shrine, the sea curving away under a wide sky.' },
};

/** Credits for committed photographs: { slot: 'Photographer, year' }. */
export const CREDITS = {};

const byName = (globbed) =>
  Object.fromEntries(Object.entries(globbed).map(([path, img]) => [path.split('/').pop().replace(/\.\w+$/, ''), img]));
const files = { ...byName(preview), ...byName(committed) };
const committedNames = new Set(Object.keys(byName(committed)));
const previewCredit = Object.values(previewCredits)[0] || {};

export function shrinePhoto(id) {
  const slot = PHOTO_SLOTS[id];
  const img = slot && files[slot.file];
  if (!img) return null;
  const isPreview = !committedNames.has(slot.file);
  return { id, ...slot, img, credit: isPreview ? previewCredit[slot.file] || '' : CREDITS[id] || '', preview: isPreview };
}

export const SHRINE_PHOTOS = Object.keys(PHOTO_SLOTS).map(shrinePhoto).filter(Boolean);
export const HAS_PREVIEW_PHOTOS = SHRINE_PHOTOS.some((p) => p.preview);

/** Which photograph illustrates each station of the grounds. */
export const STATION_PHOTO = {
  arch: 'arch',
  'walk-of-faith': 'walk-of-faith',
  'our-lady': 'our-lady',
  chapel: 'interior',
  tower: 'tower',
  'roof-deck': 'statue',
  petitions: 'petitions',
  'healing-walk': 'saints',
};
