/**
 * Hero behaviour: the inscription turning through three languages, the WebGL scene loaded after
 * first paint (skipped on Save-Data or very low-memory devices, where the poster stays), and the
 * pause control for everything that moves longer than five seconds.
 */
import { hourOfMercy } from './liturgical.js';

const hero = document.querySelector('[data-hero]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const posterMode = new URLSearchParams(location.search).has('poster');

requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));

if (hero) {
  const pauseBtn = hero.querySelector('[data-hero-pause]');
  const pauseLabel = hero.querySelector('[data-pause-label]');
  const words = [...hero.querySelectorAll('[data-inscription] > span')];
  let paused = false;
  let scene = null;
  let visible = true;

  /* the inscription: English, Cebuano, Polish, then round again */
  let wordIndex = 0;
  let wordTimer = 0;
  const showWord = (i) => {
    words.forEach((w, k) => {
      const on = k === i;
      w.classList.toggle('is-on', on);
      if (on) w.removeAttribute('aria-hidden');
      else w.setAttribute('aria-hidden', 'true');
    });
  };
  const startWords = () => {
    if (reduce || words.length < 2 || wordTimer) return;
    wordTimer = window.setInterval(() => {
      wordIndex = (wordIndex + 1) % words.length;
      showWord(wordIndex);
    }, 3600);
  };
  const stopWords = () => {
    clearInterval(wordTimer);
    wordTimer = 0;
  };

  const setPaused = (p) => {
    paused = p;
    pauseBtn?.setAttribute('aria-pressed', String(p));
    if (pauseLabel) pauseLabel.textContent = p ? 'Play the scene' : 'Pause the scene';
    if (p) {
      stopWords();
      scene?.stop();
    } else {
      startWords();
      if (visible && !document.hidden) scene?.start();
    }
  };

  if (!reduce && pauseBtn) {
    pauseBtn.hidden = false;
    pauseBtn.addEventListener('click', () => setPaused(!paused));
  }
  if (!posterMode) startWords();

  /* the scene: only where it will run well */
  const conn = navigator.connection;
  const lowPower = (conn && conn.saveData) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
  const canvas = hero.querySelector('[data-hero-canvas]');
  const canWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  })();

  const boot = async () => {
    if (!canvas || !canWebGL || (lowPower && !posterMode)) return;
    const { createHeroScene } = await import('./hero3d.js');
    scene = createHeroScene(canvas, {
      reducedMotion: reduce || posterMode,
      onFirstFrame: () => {
        hero.dataset.gl = 'on';
        if (posterMode) document.documentElement.dataset.posterReady = 'true';
      },
    });
    /* place the statue in the space the words leave free */
    const content = hero.querySelector('.hero__content');
    const placeFocus = () => {
      const hr = hero.getBoundingClientRect();
      const narrow = hr.width < 761 || hr.width / hr.height < 0.9;
      const kids = [...content.children].map((c) => c.getBoundingClientRect());
      if (narrow) {
        const bottom = Math.max(...kids.map((r) => r.bottom)) - hr.top;
        const room = hr.height - bottom;
        const yPx = bottom + Math.max(70, room * 0.34);
        scene.setFocus(0.3, 1 - (2 * yPx) / hr.height);
      } else {
        const right = Math.max(...kids.map((r) => r.right)) - hr.left;
        const xPx = right + (hr.width - right) * 0.52;
        scene.setFocus(Math.min(0.66, (2 * xPx) / hr.width - 1), 0.1);
      }
    };
    placeFocus();
    if (reduce || posterMode) {
      scene.renderOnce();
    } else {
      scene.setHourOfMercy(hourOfMercy().inHour);
      if (!paused) scene.start();
      setInterval(() => scene && scene.setHourOfMercy(hourOfMercy().inHour), 60000);
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!scene || reduce) return;
      if (visible && !paused && !document.hidden) scene.start();
      else scene.stop();
    });
    io.observe(hero);
    document.addEventListener('visibilitychange', () => {
      if (!scene || reduce) return;
      if (document.hidden) scene.stop();
      else if (visible && !paused) scene.start();
    });
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => scene && placeFocus(), 120);
    });
    window.addEventListener('pagehide', () => {
      scene?.dispose();
      scene = null;
    });
  };

  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  if (posterMode) boot();
  else window.addEventListener('load', () => idle(boot, { timeout: 1500 }), { once: true });
}
