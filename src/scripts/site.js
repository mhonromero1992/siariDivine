/**
 * Site-wide behaviour: nav tone and visibility, the menu sheet, the light that follows the
 * pointer on buttons and glass, the phone dock, the Hour of Mercy text, the credits dialog.
 */
import { hourOfMercy, describeWait } from './liturgical.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

/* ── Nav: take the tone of whatever section sits under it ───────────────── */
const nav = document.querySelector('[data-nav]');
const navBar = document.querySelector('[data-nav-bar]');

function watchTone() {
  if (!navBar) return;
  const toned = [...document.querySelectorAll('main [data-tone], footer[data-tone]')];
  if (!toned.length) return;
  let io;
  const build = () => {
    io?.disconnect();
    const line = 12 + 32; // the nav's vertical centre
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) navBar.dataset.tone = e.target.dataset.tone;
        }
      },
      { rootMargin: `-${line}px 0px -${Math.max(0, window.innerHeight - line - 2)}px 0px` },
    );
    toned.forEach((el) => io.observe(el));
  };
  build();
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(build, 200);
  });
}

/* ── Nav: step aside while reading down, come back when scrolling up ────── */
function watchScrollDirection() {
  if (!nav) return;
  let last = window.scrollY;
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        const holdsFocus = nav.contains(document.activeElement);
        if (y < 240 || delta < -6 || holdsFocus) nav.dataset.hidden = 'false';
        else if (delta > 6) nav.dataset.hidden = 'true';
        last = y;
        ticking = false;
      });
    },
    { passive: true },
  );
  nav.addEventListener('focusin', () => (nav.dataset.hidden = 'false'));
}

/* ── Menu sheet ─────────────────────────────────────────────────────────── */
function menu() {
  const sheet = document.querySelector('[data-menu]');
  const openBtn = document.querySelector('[data-menu-open]');
  if (!sheet || !openBtn) return;
  const closeBtn = sheet.querySelector('[data-menu-close]');
  const focusables = () => [...sheet.querySelectorAll('a[href], button:not([disabled])')];

  const open = () => {
    sheet.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => closeBtn?.focus());
  };
  const close = (restore = true) => {
    sheet.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    if (restore) openBtn.focus();
  };
  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', () => close());
  sheet.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
    if (e.key === 'Tab') {
      const f = focusables();
      const first = f[0];
      const lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  sheet.querySelectorAll('a[href]').forEach((a) => a.addEventListener('click', () => close(false)));
  window.matchMedia('(min-width: 1061px)').addEventListener('change', (m) => m.matches && !sheet.hidden && close(false));
}

/* ── Light that follows the pointer (buttons, glass) and the magnetic pull ─ */
function pointerLight() {
  if (!finePointer.matches) return;
  document.addEventListener(
    'pointermove',
    (e) => {
      const btn = e.target.closest?.('.btn');
      if (btn) {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', `${e.clientX - r.left}px`);
        btn.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      const glass = e.target.closest?.('.glass');
      if (glass) {
        const r = glass.getBoundingClientRect();
        glass.style.setProperty('--gx', `${e.clientX - r.left}px`);
      }
    },
    { passive: true },
  );

  if (reduceMotion.matches) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = 6;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      el.style.translate = `${x * strength}px ${y * strength * 0.6}px`;
    });
    el.addEventListener('pointerleave', () => (el.style.translate = ''));
  });
}

/* ── The Hour of Mercy: live text, Manila time ──────────────────────────── */
function hourText() {
  const nodes = document.querySelectorAll('[data-hour-text]');
  const flags = document.querySelectorAll('[data-hour-flag]');
  const update = () => {
    const h = hourOfMercy();
    const long = h.inHour ? 'It is the Hour of Mercy now' : `Next Hour of Mercy in ${describeWait(h.minutesUntil)}`;
    const short = h.inHour ? 'Now, until four o’clock' : `3:00 pm, in ${describeWait(h.minutesUntil)}`;
    nodes.forEach((n) => {
      const text = n.dataset.hourText === 'short' ? short : long;
      if (n.textContent !== text) n.textContent = text;
    });
    flags.forEach((n) => (n.dataset.hourNow = String(h.inHour)));
    document.documentElement.dataset.hourOfMercy = String(h.inHour);
  };
  update();
  setInterval(update, 30000);
}

/* ── Phone dock: away while the page already shows its action ──────────── */
function dock() {
  const el = document.querySelector('[data-dock]');
  if (!el) return;
  const blockers = [...document.querySelectorAll('[data-dock-hide], [data-closing]')];
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
    el.dataset.away = String(visible.size > 0);
  });
  blockers.forEach((b) => io.observe(b));
  if (!blockers.length) el.dataset.away = 'false';
}

/* ── Credits dialog ─────────────────────────────────────────────────────── */
function credits() {
  const dialog = document.querySelector('[data-credits]');
  if (!dialog) return;
  document.querySelectorAll('[data-credits-open]').forEach((b) => b.addEventListener('click', () => dialog.showModal()));
  dialog.querySelector('[data-credits-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}

/* ── Footer: ridges lean with the pointer; light moves across the words ── */
function closing() {
  const footer = document.querySelector('[data-closing]');
  if (!footer || !finePointer.matches || reduceMotion.matches) return;
  const text = footer.querySelector('[data-light-text]');
  footer.addEventListener(
    'pointermove',
    (e) => {
      const px = (e.clientX / window.innerWidth - 0.5) * 2;
      footer.style.setProperty('--px', px.toFixed(3));
      if (text) {
        const r = text.getBoundingClientRect();
        text.style.setProperty('--lx', `${e.clientX - r.left}px`);
      }
    },
    { passive: true },
  );
}

watchTone();
watchScrollDirection();
menu();
pointerLight();
hourText();
dock();
credits();
closing();
