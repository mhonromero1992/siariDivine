/**
 * The grounds: choose a station on the drawing or in the list; the panel reads it out and the
 * drawing lights it. The pilgrim's route draws itself as the section passes (moment 2).
 */
import { scrollProgress } from './scroll-progress.js';

document.querySelectorAll('[data-grounds]').forEach((root) => {
  const stations = JSON.parse(root.querySelector('[data-stations]').textContent);
  const frame = root.querySelector('.grounds__frame');
  const num = root.querySelector('[data-panel-num]');
  const name = root.querySelector('[data-panel-name]');
  const text = root.querySelector('[data-panel-text]');
  const controls = [...root.querySelectorAll('[data-station]')];
  const spots = [...root.querySelectorAll('.spot')];
  const photoBox = root.querySelector('[data-panel-photo]');
  const img = root.querySelector('[data-panel-img]');
  let index = 0;

  const select = (i, { focusList = false } = {}) => {
    index = (i + stations.length) % stations.length;
    const s = stations[index];
    num.textContent = `Station ${s.n} of ${stations.length}`;
    name.textContent = s.name;
    text.textContent = s.text;
    if (photoBox && img) {
      if (s.photo) {
        photoBox.hidden = false;
        if (img.getAttribute('src') !== s.photo.src) {
          img.srcset = s.photo.srcset;
          img.src = s.photo.src;
          img.width = s.photo.w;
          img.height = s.photo.h;
          img.alt = s.photo.alt;
          img.style.objectPosition = s.photo.pos || 'center';
          img.style.animation = 'none';
          void img.offsetWidth;
          img.style.animation = '';
        }
      } else {
        photoBox.hidden = true;
      }
    }
    controls.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.station === s.id)));
    frame.dataset.active = s.id;
    frame.querySelectorAll('[data-st]').forEach((g) => g.classList.toggle('is-active', g.dataset.st === s.id));
    if (focusList) root.querySelector(`.grounds__list [data-station="${s.id}"]`)?.focus();
  };

  controls.forEach((c) =>
    c.addEventListener('click', () => select(stations.findIndex((s) => s.id === c.dataset.station))),
  );
  root.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => select(index + Number(b.dataset.step))));

  /* phones: the markers are a key, the list is the control */
  const narrow = window.matchMedia('(max-width: 760px)');
  const syncSpots = () =>
    spots.forEach((s) => {
      if (narrow.matches) {
        s.setAttribute('tabindex', '-1');
        s.setAttribute('aria-hidden', 'true');
      } else {
        s.removeAttribute('tabindex');
        s.removeAttribute('aria-hidden');
      }
    });
  syncSpots();
  narrow.addEventListener('change', syncSpots);

  /* the route a pilgrim walks */
  const route = root.querySelector('[data-route]');
  if (route) {
    const len = Math.ceil(route.getTotalLength());
    frame.style.setProperty('--route-len', String(len));
    scrollProgress(root.querySelector('[data-moment="route"]'), (p) => {
      frame.style.setProperty('--route', (Math.min(1, p * 1.35)).toFixed(3));
    });
  }

  select(0);
});
