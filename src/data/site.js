/**
 * Every fact the site prints lives here, with where it came from.
 * Nothing on the pages may state a fact that is not in this file.
 * Last researched: 2026-11-07.
 */

export const SOURCES = {
  layug2019: {
    label: 'Benjie Layug, "Diocesan Shrine of the Divine Mercy (Sindangan, Zamboanga del Norte)", 22 July 2019',
    url: 'https://benjielayug.com/2019/07/diocesan-shrine-of-the-divine-mercy-sindangan-zamboanga-del-norte.html',
  },
  cunada2016: {
    label: 'JP Anthony D. Cuñada, "For the Devotee: The Divine Mercy Shrine overlooking the sea on Siare Hills", 20 January 2016',
    url: 'https://pilarcapiz.com/2016/01/20/for-the-devotee-the-divine-mercy-shrine-overlooking-the-sea-on-siare-hills-sindangan-zambaonga-del-norte/',
  },
  gcatholic: {
    label: 'GCatholic.org, Shrine of Divine Mercy, Siari (Diocese of Dipolog)',
    url: 'https://gcatholic.org/churches/asia-east/64125.htm',
  },
  gcatholicJubilee: {
    label: 'GCatholic.org, Jubilee Churches in the Diocese of Dipolog (2025)',
    url: 'https://gcatholic.org/churches/list/jubilee2025/Dipolog',
  },
  philatlas: {
    label: 'PhilAtlas, Sindangan, Province of Zamboanga del Norte',
    url: 'https://www.philatlas.com/mindanao/r09/zamboanga-del-norte/sindangan.html',
  },
};

export const SHRINE = {
  name: 'Diocesan Shrine of the Divine Mercy',
  shortName: 'Divine Mercy Shrine',
  place: 'Siari Hills, Sindangan',
  hill: 'Siari Hills',
  barangay: 'Barangay Siari',
  barangayAlt: 'Siare',
  town: 'Sindangan',
  province: 'Zamboanga del Norte',
  road: 'Regional Highway, Dipolog–Sindangan',
  postcode: '7112',
  diocese: 'Diocese of Dipolog',
  vicariate: 'Vicariate of St. Joseph the Worker',
  sea: 'Sulu Sea',
  parish: { name: 'Santo Niño Parish, Siari', established: 1980, source: 'gcatholic' },
  admission: 'free', // layug2019
  designations: [
    { year: '2015–2016', text: 'Pilgrim church for the Extraordinary Jubilee of Mercy', source: 'layug2019' },
    { year: '2025', text: 'Jubilee church of the Diocese of Dipolog for the Holy Year', source: 'gcatholicJubilee' },
  ],
  inscription: [
    { lang: 'en', label: 'English', text: 'Jesus, I trust in You' },
    { lang: 'ceb', label: 'Cebuano', text: 'Jesus, misalig ako Kanimo' },
    { lang: 'pl', label: 'Polish', text: 'Jezu, ufam Tobie' },
  ],
};

/** Links. The Facebook page is the shrine's public channel found by search; confirm before launch. */
export const LINKS = {
  facebook: 'https://www.facebook.com/profile.php?id=274728832698753',
  messenger: 'https://m.me/274728832698753',
  maps: 'https://www.google.com/maps/search/?api=1&query=Divine+Mercy+Shrine+Siari+Hills+Sindangan+Zamboanga+del+Norte',
  mapsEmbedQuery: 'Divine Mercy Shrine, Siari, Sindangan, Zamboanga del Norte',
};

/**
 * Optional: a form endpoint (Formspree, Getform, Basin...). When empty, forms compose the
 * message, copy it, and open the shrine's Messenger, so they always deliver somewhere real.
 */
export const FORM_ENDPOINT = '';

/** The grounds, station by station, as described by visitors in 2016 and 2019. */
export const STATIONS = [
  {
    id: 'arch',
    n: 1,
    name: 'The arch on the highway',
    text: 'A white arch on the Regional Highway marks the way in. Habal-habal drivers wait under it to take visitors up the hill; cars can drive up too.',
    source: ['layug2019', 'cunada2016'],
  },
  {
    id: 'walk-of-faith',
    n: 2,
    name: 'The Walk of Faith',
    text: 'Stairs climb from the road, their rails painted in the pink and blue of the two rays and their steps marked with footprints.',
    source: ['cunada2016'],
  },
  {
    id: 'our-lady',
    n: 3,
    name: 'Our Lady on the lower hill',
    text: 'A white statue of the Virgin Mary stands on its own hill below the shrine, facing the sea. You can see it from the highway.',
    source: ['layug2019', 'cunada2016'],
  },
  {
    id: 'chapel',
    n: 4,
    name: 'The chapel of glass',
    text: 'A whitewashed chapel with clear glass walls, so the Sulu Sea lies behind the altar. Stained glass runs above. Its façade reads "Jesus, I trust in You" in English, Cebuano and Polish.',
    source: ['layug2019', 'cunada2016'],
  },
  {
    id: 'tower',
    n: 5,
    name: 'The tower',
    text: 'To the left of the chapel: a square base, octagonal upper storeys and a pointed roof with a cross.',
    source: ['layug2019'],
  },
  {
    id: 'roof-deck',
    n: 6,
    name: 'The Divine Mercy on the roof deck',
    text: 'Stairs lead onto the chapel roof, where the great statue of the Divine Mercy stands inside a railing. Mountains rise behind; lowlands and the open sea spread in front.',
    source: ['layug2019', 'cunada2016'],
  },
  {
    id: 'petitions',
    n: 7,
    name: 'Petition shrines',
    text: 'On the chapel flanks, two outdoor shrines, one to the Divine Mercy and one to St. Faustina, hold boxes for written prayers. Statues of St. Michael the Archangel and of Mary in a boat stand nearby.',
    source: ['layug2019'],
  },
  {
    id: 'healing-walk',
    n: 8,
    name: 'The Healing Walk',
    text: 'A path leads down from the shrine past alcoves with more than thirty statues of saints to the Garden of Gethsemane and its kneeling Christ. Walk it in silence, with your footwear off.',
    source: ['layug2019'],
  },
];

export const FACILITIES = [
  { name: 'Candle gallery', text: 'Light a candle for your intention.' },
  { name: 'Shrine office', text: 'Mass intentions, offerings, questions about sacraments.' },
  { name: 'Souvenir shop', text: 'Keepsakes of your visit.' },
  { name: 'Public toilets', text: 'On the shrine grounds.' },
];
// Facilities: layug2019.

export const DRESS_CODE = {
  rule: 'No shorts and no sleeveless shirts or blouses. Women are asked to wear a skirt or dress rather than pants.',
  source: 'layug2019',
};

export const HEALING_WALK_SIGN = {
  ref: 'Exodus 3:5',
  text: '“Do not come any closer,” God said. “Take off your sandals, for the place where you are standing is holy ground.”',
  source: 'layug2019',
};

export const GETTING_HERE = [
  {
    from: 'By bus or van',
    text: 'Buses and vans between Dipolog and Ipil or Zamboanga City run along the Regional Highway past the shrine. Ask to be dropped at the Divine Mercy arch in Siari.',
    source: 'layug2019',
  },
  {
    from: 'From the arch',
    text: 'Climb the Walk of Faith, or take a habal-habal from under the arch up to the shrine. Agree the fare before you ride.',
    source: 'cunada2016',
  },
  {
    from: 'By car',
    text: 'A road climbs the hill from the highway to the shrine grounds.',
    source: 'layug2019',
  },
  {
    from: 'By air',
    text: 'Fly into Dipolog, then follow the Regional Highway south towards Sindangan.',
    source: 'layug2019',
  },
];

export const NAV = [
  { href: '/shrine', label: 'The Shrine' },
  { href: '/devotion', label: 'Divine Mercy' },
  { href: '/visit', label: 'Visit' },
  { href: '/sacraments', label: 'Masses & Sacraments' },
  { href: '/contact', label: 'Contact' },
];
