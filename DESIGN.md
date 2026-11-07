# DESIGN.md · Diocesan Shrine of the Divine Mercy, Siari Hills

The art direction for every page of this site. Read it before touching any page, component or
token. Each decision carries its reason in one line (anti-slop R-31).

> **Design Read.** Reading this as: a pilgrimage *place* site for Catholic families, parish groups and
> travellers on the Dipolog–Sindangan highway (mostly on Android phones, often on mobile data), in a
> **whitewash-and-dusk** devotional language taken from the shrine itself.
> **Dial: ENERGY 2 / RHYTHM 3 / MOTION 3** (motion is concentrated in the hero and two moments; the
> rest of each page is still).

---

## 1. What the site is for

| | |
|---|---|
| What it is | The Diocesan Shrine of the Divine Mercy, a whitewashed hilltop chapel with a roof-deck statue of the Divine Mercy, on Siari Hills, Barangay Siari, Sindangan, Zamboanga del Norte. Diocese of Dipolog, Vicariate of St. Joseph the Worker. |
| Who comes | Devotees of the Divine Mercy, families, parish and school groups, Jubilee pilgrims, bus and van passengers on the Regional Highway, Sindanganons abroad who want to offer a Mass intention from far away. |
| The one main action | **Get directions** (a place with no booking). Second: pray the Chaplet, offer an intention, plan a group visit. |
| Content model | Adapted from manilacathedral.com.ph (reviewed 2026-11-07): About (history, architecture), Masses, sacraments with requirements and FAQ, news and gallery, tour request, a contact matrix by concern. Here it becomes: The Shrine (story and grounds), Divine Mercy (devotion, Chaplet, Hour of Mercy, feasts), Visit (getting here, dress code, group visits, questions), Masses & Sacraments (Mass times source, intentions, requirements, feasts), Contact (office, Messenger, support). |

### Verified facts only (C-5, R-17, R-38)

Every fact on the site comes from `src/data/site.js`, which lists its source. Nothing is invented:
no Mass times, phone numbers, emails, bank details, rector names, founding dates, visitor counts or
testimonials. Where the shrine has not published something, the page sends people to the shrine's
own channel instead of guessing. Liturgical dates (Divine Mercy Sunday, the Novena, Good Friday) are
computed from the date of Easter, so they never go stale.

---

## 2. Colour: the shrine's own paint

The palette is lifted from photographs of the actual shrine (2016 and 2019 visitor photos, used
only as reference): whitewashed walls, the statue's two painted rays, the pink-and-blue painted stair
rails, the dark tower roof, the Sulu Sea at the blue hour.

| Token | Hex | Where it comes from | Use |
|---|---|---|---|
| `--limewash` | `#F4F1EA` | the whitewashed chapel walls | page ground |
| `--limewash-2` | `#EAE4D8` | shaded limewash under the canopy | panels, inputs, the visit panel |
| `--night` | `#101A29` | the sky over the sea at 6 pm | ink on light, ground of the dusk band, hero, footer |
| `--sea` | `#1D4A6E` | the Sulu Sea from the roof deck | core colour 1: links on light, the dusk band's lift |
| `--pale` | `#A9D4EE` | the pale ray (Water) | core colour 2: highlights on dark grounds only |
| `--mercy` | `#A61E36` | the red ray (Blood) | **the one accent**: the primary button, focus halo, one detail a screen |
| `--muted` | `#545F6E` | limewash in shadow | secondary text on light (5.75:1 on limewash) |

R-29: two core colours (sea, pale) + one accent (mercy) + neutrals (limewash, night). Green and
ember appear only inside artwork and photographs, never as UI colour.

Contrast (WCAG AA, computed with the WCAG 2 formula): night on limewash 15.5:1 · muted on
limewash 5.75:1 (on limewash-2 5.1:1) · mercy on limewash 6.5:1 · limewash on mercy 6.5:1 ·
pale on night 11.1:1 · sea on limewash 8.25:1.

**Theme (R-21).** One fixed theme, light grounds with three planned dusk grounds (hero, the Hour of
Mercy band, footer). Reason: it is the shrine's own look (a white chapel against a blue-hour sea),
and a light ground reads best on phones in Mindanao daylight. No toggle, so no half-tested mode.

---

## 3. Type

| Role | Face | Why |
|---|---|---|
| Display, prayers, numerals | **EB Garamond** (variable, with italic) | the face family of missals and prayer cards; its italic carries the inscription "Jesus, I trust in You" with warmth; covers Cebuano (ñ) and Polish. Taste-skill library pairing `garamond` (place, serif). |
| Interface and body | **Jost** (variable) | geometric sans in the line of mid-century devotional print; clear on low-end Android screens at 16px. Same library pairing. |

- Scale (fluid): display `clamp(2.75rem, 1.6rem + 5.2vw, 6.25rem)` · h2 `clamp(2rem, 1.4rem + 2.6vw, 3.5rem)` · h3 `1.375rem` · body `1.0625rem/1.6` · small `0.875rem`.
- Display tracking `-0.02em`; italics for one emphasised phrase per heading at most.
- No all-caps labels, no wide tracking (R-06). Small labels are sentence case in Jost 500.
- Old-style figures in running text, lining tabular figures in dates and times.

---

## 4. The identity motif: two rays from one point

The whole site repeats one gesture: **two lines leaving one point**, a red one and a pale one, as
in the image of the Divine Mercy and on the statue that stands on the roof deck.

- Hero: two volumetric rays fan from the statue's heart over the sea (WebGL).
- Link underline: draws as two strokes, red then pale.
- Section dividers: a hairline that splits into two rays from a small point.
- The Chaplet: the current bead glows with the two colours.
- Page transition: the new page is revealed by a widening wedge of light.

It is used once per component, never as wallpaper.

---

## 5. Material: limewash and glass

- **Limewash texture**: a faint SVG turbulence (3% opacity) on light grounds, because the real walls
  are brushed lime, not flat paint. It is the only texture on the site (R-07 purpose: material identity).
- **Liquid glass (R-10 cap: two elements)**: the floating navigation bar and the phone action dock.
  Layers: a blurred, saturated backdrop, a 1px inner highlight on the top edge, a soft drop shadow
  for elevation, and a light spot that follows the pointer. Fallbacks: no `backdrop-filter` or
  `prefers-reduced-transparency: reduce` turns both into solid limewash or solid night.
- No card borders. Hierarchy comes from space, the limewash-2 step, and one shadow level (elevation
  reason: only things that float above the page, the nav, the dock and open dialogs, cast a shadow).

Radius scale: `2px` photographs and artwork frames · `12px` buttons and inputs · `22px` the glass nav
and dock · `50%` beads. Nothing else is pill-shaped (R-11).

---

## 6. Buttons

One family, three variants, the same interaction language everywhere.

| Variant | Rest | Hover | Press | Focus-visible | Loading | Disabled |
|---|---|---|---|---|---|---|
| Primary (mercy) | mercy fill, limewash label | a soft light spot follows the pointer, the fill deepens, the shadow widens; 280ms ease | scale 0.98, fill darker | a two-step halo: limewash 3px then mercy at 45% to 7px | two arcs (red, pale) turn; label kept for width | 45% saturation, `not-allowed` |
| Tonal | translucent limewash on dark / sea at 8% on light | tint rises, light spot | scale 0.98 | same halo, sea instead of mercy | same | same |
| Text link | ink, no underline | the two-ray underline draws left to right | colour darkens | halo around the text box | n/a | n/a |

No `translateY` on hover, no abrupt changes, no arrow on every button (R-08: arrows only where the
link leaves the site). Primary has a 6px magnetic pull towards the pointer on fine pointers only.

---

## 7. Motion (MOTION 3, with reasons)

| Where | What | Why |
|---|---|---|
| Hero, on load | sky fades up from night, the rays bloom, the headline rises line by line (60ms stagger), the inscription turns through English, Cebuano and Polish | the first screen says "this is the shrine at dusk" before any word is read |
| Hero, pointer | the camera leans 2–3°, the rays brighten slightly | the place answers you, quietly |
| Hero, scroll | the scene dims and the camera lifts as you leave it | a soft exit instead of a hard edge |
| Hero, 3:00–3:59 pm (Manila) | the rays burn brighter, the hero line reads "It is the Hour of Mercy" | the devotion's own hour, made visible |
| Moment 1: The two rays | two strokes draw from one point as the section crosses the viewport | explains the image in one gesture |
| Moment 2: Walk the grounds | the pilgrim path draws up the hill; stations light as it passes | the climb is the experience of the place |
| Hover layer | the underline draws, photographs zoom 1.03 in their frame, buttons light up | every control answers the pointer |
| Pages | a cross-document View Transition: the old page dims, the new one opens in a wedge of light | continuity between chapters |

Never: fade-up on every block, floating loops, parallax on text, scroll-jacking, snapping. Anything
running longer than 5 seconds (the hero scene, the inscription) has a pause control.
`prefers-reduced-motion: reduce`: one still frame of the scene, no reveals, instant transitions,
nothing left hidden.

---

## 8. Section treatments (RHYTHM 3)

| Section | Ground | Visual | Composition |
|---|---|---|---|
| Hero | night | WebGL: blue-hour sea, ridges, the chapel and tower, the statue and its rays, Our Lady below, lamps on the stairs | text left on desktop, top on phone; scene right / below |
| Visit | limewash + texture | the address set large (type moment) and a line drawing of the highway arch | split 7/5, panel on limewash-2 |
| The two rays | limewash | the 1934 image detail or drawn rays, drawing on scroll | asymmetric, image bleeding right |
| Walk the grounds | sky-to-limewash wash | an illustrated cross-section of Siari Hills with seven stations | full-bleed artwork, station panel overlapping |
| The Hour of Mercy | night (the one brand band) | a dial whose 3 o'clock hand is a ray | centred clock, text right |
| Feasts | limewash | dates set large in Garamond numerals | a ledger, no cards |
| Footer | night | layered ridges over the sea, the inscription in three languages | final action, address, pages, credits |

---

## 9. How the two required skills were applied

**Taste Skill (tasteskill 2.5.1).** Kind: `place` (people come to it). Taken: plain copy with the
h1 naming the place; visit on screen two; one main action, Get directions; a type moment for the
address; photograph compositions (pair, strip, bleed) where licensed photographs exist; no captions,
credits in one footer line; hover micro-interactions; no carousels, tilt or fade-in on every section;
the `garamond` pairing and a palette dealt from the client's own colours (the "brand" route).
**Where the owner's brief overrides it, on purpose:** the skill forbids WebGL, glass and gradients on
a place; the brief explicitly asks for a 3D hero, Liquid Glass and atmospheric light. Resolution:
one WebGL context (hero only), glass on two elements, gradients only inside artwork. The skill's own
scripts were not run in this environment (executing third-party code was blocked); its checks were
re-implemented as Playwright tests in `tests/`.

**Anti-Slop, DURING mode.** No em dashes in page text (R-02). No statistics, testimonials or claims
without a source (R-17, R-18, R-36). FAQ only from questions pilgrims really ask, answered from
documented facts (R-28). Every nav item is a real page (R-24); every control does something (R-26):
forms compose a real message to the shrine's Messenger. Dials declared above. Delivery Gate in the
README.

---

## 10. Imagery rules

- **Real photographs of the shrine lead wherever they exist**, as on manilacathedral.com.ph: the
  chapel beside "Before you come", a photograph for each of the eight stations, the shrine's own
  statue for "The two rays", a full-bleed chapter of the chapel at sunset, a gallery with a lightbox.
- Photographs are slots (`src/data/photos.js`): a slot appears as soon as its file is in
  `src/assets/shrine/`; until then the drawing or the 3D scene stands in, so no frame is ever empty.
  Astro converts every file to AVIF and WebP at several widths.
- **Only photographs the shrine owns, or has written permission to use, go in that folder.** The
  photographs of the shrine found online (Benjie Layug, 2019; JP Anthony D. Cuñada, 2016) are marked
  "All rights reserved" and "no duplication without written permission"; they were used only as
  drawing reference and in a private, uncommitted layout preview (`src/assets/shrine-preview/`).
- Public-domain and CC photographs (the 1934 Divine Mercy, St. Faustina in 1931) come from
  Wikimedia Commons with `npm run fetch:photos` and are credited automatically.
- Photographs are never captioned on the page, filtered, tilted or set behind text; credits sit in
  the footer's "Sources and credits" dialog and in the gallery lightbox.
