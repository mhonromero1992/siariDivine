# Diocesan Shrine of the Divine Mercy · Siari Hills, Sindangan

The website of the Divine Mercy Shrine on Siari Hills, Barangay Siari, Sindangan, Zamboanga del
Norte (Diocese of Dipolog). A static Astro site: seven pages, a WebGL hero of the shrine at the blue
hour, an illustrated walk through the grounds, a bead-by-bead Chaplet guide, live Hour of Mercy
times, feast dates computed from Easter, and forms that deliver to the shrine's Messenger.

Art direction, palette, type and every design decision with its reason: [DESIGN.md](DESIGN.md).

## Run it

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static site in dist/
npm run preview      # serve dist/ at http://127.0.0.1:4321
```

Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages). Pages are
built as folders (`shrine/index.html`, `visit/index.html`…), which every host serves at `/shrine`,
`/visit`. The live site is https://siari-divine.vercel.app; if the domain changes, update `site:` in
`astro.config.mjs` so canonical and share links follow it.

## Pages

| Page | What is on it |
|---|---|
| `/` | Hero scene, finding the shrine, the image and its two rays, the grounds in eight stations, the shrine in photographs, the Hour of Mercy, coming feasts |
| `/shrine` | The shrine at a glance, the three-language façade, the grounds, the Healing Walk sign, the photo gallery, a call for early photographs |
| `/devotion` | The image, St. Faustina, the Chaplet bead guide, the Novena and Divine Mercy Sunday (dates computed) |
| `/visit` | Getting here, etiquette on holy ground, the group pilgrimage form, questions pilgrims ask |
| `/sacraments` | Mass times, the Mass intention form, preparing for Baptism and Holy Matrimony, feasts |
| `/contact` | Who to write to for what, the message form, the shrine office |

## Before launch: what the shrine has to supply

Nothing on the site is invented. Where the shrine has not published something, the site points to
the shrine's own channel instead of guessing. Fill these in and rebuild:

1. **More photographs of the shrine, if you like** (see below). Sixteen are already published.
2. **The Facebook page.** `src/data/site.js` → `LINKS.facebook` and `LINKS.messenger` use the page
   found by search (`profile.php?id=274728832698753`). Confirm it is the shrine's official page.
3. **Mass and confession times.** `src/data/schedule.js`. While empty, the Masses page sends people to
   Facebook for the week's schedule; once filled, it shows a table.
4. **A form inbox (optional).** `src/data/site.js` → `FORM_ENDPOINT` (Formspree, Getform, Basin…). While
   empty, every form writes the message, copies it and opens the shrine's Messenger.
5. **Corrections.** Facts come from visitor accounts (2016, 2019) and GCatholic; each has its source
   in `src/data/site.js`. The shrine office should read the pages once.

## Photographs of the shrine

Photographs are slots. Put a file in `src/assets/shrine/` with the slot's name and it appears in
the visit block, the eight stations, "The two rays", the photo chapter on the home page, the page
headers and the gallery. Astro converts each to AVIF and WebP at several widths during the build.

| File name | Where it shows |
|---|---|
| `chapel.jpg` | Home, beside "Before you come"; gallery |
| `chapel-dusk.jpg` | Header of The Shrine and Divine Mercy pages |
| `interior.jpg` | Station 4; header of Masses & Sacraments |
| `interior-dusk.jpg` | Home, the full-width photograph "The chapel, open to the sea" |
| `entrance.jpg`, `view.jpg`, `view-coast.jpg` | Gallery |
| `statue.jpg` | "The two rays" (home and Divine Mercy); station 6 |
| `our-lady.jpg`, `tower.jpg`, `faustina.jpg`, `gethsemane.jpg` | Home photo strip; stations; Divine Mercy page |
| `walk-of-faith.jpg` | Station 2; header of Visit |
| `arch.jpg` | Station 1 |
| `petitions.jpg`, `saints.jpg` | Stations 7 and 8 |

Credit each one in `src/data/photos.js`: add the photographer to `PHOTOGRAPHERS` and the slot to
`CREDITS`. The footer, the credits list and the gallery name them and link to their work.

**Published with permission.** The sixteen photographs now on the site are by Benjie Layug (2019)
and JP Anthony D. Cuñada (2016), published with their permission as confirmed by the site owner on
7 November 2026. Both blogs otherwise reserve all rights ("All rights reserved"; "Unauthorized use
and/or duplication … without express and written permission … is strictly prohibited"), so keep
their written permission on file, and keep the credits and links to their posts in place. Remove a
photograph by deleting its file from `src/assets/shrine/`; its spot falls back to the drawing.

Only add photographs the shrine owns or has written permission to use. The shrine's own photographs
(for example from its Facebook page, saved by someone the shrine authorises) can replace or join
these at any time.

**Public-domain photographs** (the first Divine Mercy painting, Vilnius 1934; St. Faustina in 1931)
are listed in `src/data/credits.js`. Run `npm run fetch:photos` on a normal connection to download
them from Wikimedia Commons; they then replace the drawn rays and join the Faustina section, credited
automatically. (Wikimedia refused downloads from the build machine, so this script has not been run
yet.)

## Generated images

`npm run assets` (with `npm run preview` running) renders the hero posters, the share image
`public/og.jpg`, `favicon.svg` and `apple-touch-icon.png` from the site itself. The poster is the
first paint of the hero (about 27 KB), and the live scene fades in over it.

## Tests

`npm run test:ui` (with `npm run preview` running) opens every page in Chromium at 1440, 1024, 768,
390 and 320 pixels and checks: no horizontal overflow or content past the edge, no broken images,
alt text, one `h1` and no skipped heading levels, no em dashes, named controls, 44 px tap targets on
phones, every internal link and anchor, no console errors. Then it clicks through the skip link,
the menu sheet (focus trap, Escape, focus return), the grounds stations on desktop and phone, the
Chaplet (advance, back, keyboard, bead click, remembered progress), the forms (errors when empty,
composed message when filled, Messenger hand-off), the gallery lightbox, the credits dialog, the
hero pause control, and reduced motion.

## Delivery gate (anti-slop, DURING mode)

Run on 7 November 2026 against the production build.

**Block 1, hard gate: all no.**
- R-02 no em dash in page text: the suite counts them on every page and width (0).
- R-03 mobile: no overflow at 320 to 1440; 44 px targets on phones; the dock and menu sheet tested.
- R-17, R-18, R-36, R-38: no statistics, testimonials, invented times, phones, emails or bank
  details. Every fact has a source in `src/data/site.js`; liturgical dates are computed.
- R-23 assets: no logo was invented; the wordmark is the shrine's name in type beside the two-ray
  motif. Photographs are slots for the shrine's own files.
- R-24, R-26: every nav item is a real page; every control acts (forms compose and hand off to
  Messenger, or post to `FORM_ENDPOINT`).
- R-25 contrast: palette pairs computed with the WCAG formula (DESIGN.md section 2), all AA or better.
- R-27 states: forms show empty-field errors, a busy state, a ready state, network errors (endpoint);
  the gallery renders nothing without photographs; the schedule falls back to the Facebook pointer.
- R-28 FAQ: eight questions answered only from documented facts.
- R-32 keyboard: skip link first and visible; menu trap and Escape; Chaplet arrow keys; dialogs close
  on Escape and return focus; a soft two-step focus halo everywhere.
- R-35 verified by running: the build, the 45-check browser suite (all passing), and screenshots
  reviewed at 1440 and 390.
- R-39 semantics: landmarks, `lang`, unique titles, labels on every field, `cursor: pointer`,
  reduced motion stills the scene and removes the pause control, the moving hero has a pause control.
- R-40: posters and photos carry dimensions; the hero poster is an eager `img` with
  `fetchpriority="high"`; no third-party script. Lighthouse and Web Vitals were not measured.

**Block 2, purpose gate.** Glass on two elements only (nav, phone dock). One accent (the red ray).
No icon set; the only glyph is the two rays. Gradients only inside artwork and the dusk grounds.
Every motion has a written reason (DESIGN.md section 7).

**Block 3, liveliness.** Dials ENERGY 2 / RHYTHM 3 / MOTION 3; one focal point a screen; the two-ray
motif repeated in the hero, links, beads, dial and footer.

**Block 4, craftsmanship.** No template layout, no card grid, no pricing, no logo bar; CTAs name the
action ("Get directions", "Pray the Chaplet", "Send a prayer intention"); one fixed theme with its
reason (DESIGN.md section 2).

**Not verified here:** real phones and Safari; Lighthouse scores; `npm run fetch:photos` (blocked on
the build machine); the Facebook page's ownership. Page-to-page transitions run on screens wider than
760 px; phones navigate instantly.

## How the two design skills were used

Taste Skill set the direction (a *place* site: plain copy, the address as a type moment, visit on
screen two, photographs leading where they exist, the `garamond` pairing, the client's own colours).
The owner's brief overrides it on purpose for the 3D hero, the glass and the atmospheric light; see
DESIGN.md section 9. The skill's own scripts were not run (executing third-party code was blocked in
this environment); its checks are re-implemented in `tests/ui-check.mjs`. Anti-Slop ran in DURING mode
throughout; its delivery gate is above.
