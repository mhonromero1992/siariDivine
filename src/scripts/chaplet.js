/**
 * The Chaplet guide: one prayer per bead, remembered between visits on this device.
 */
const KEY = 'siari-chaplet-step';

document.querySelectorAll('[data-chaplet]').forEach((root) => {
  const steps = JSON.parse(root.querySelector('[data-steps]').textContent);
  const tool = root.querySelector('[data-chaplet-tool]');
  const where = root.querySelector('[data-where]');
  const title = root.querySelector('[data-title]');
  const text = root.querySelector('[data-text]');
  const count = root.querySelector('[data-count]');
  const next = root.querySelector('[data-next]');
  const prev = root.querySelector('[data-prev]');
  const restart = root.querySelector('[data-restart]');
  const beads = [...root.querySelectorAll('[data-bead]')];
  const order = steps.map((s) => s.bead);

  let i = 0;
  try {
    const saved = Number(localStorage.getItem(KEY));
    if (Number.isInteger(saved) && saved > 0 && saved < steps.length) i = saved;
  } catch {
    /* storage may be unavailable; start at the beginning */
  }

  const render = () => {
    const s = steps[i];
    where.textContent = s.where;
    title.textContent = s.title;
    text.textContent = s.text;
    count.textContent = String(i + 1);
    const doneBeads = new Set(order.slice(0, i));
    beads.forEach((b) => {
      const id = b.dataset.bead;
      b.classList.toggle('is-now', id === s.bead);
      b.classList.toggle('is-done', doneBeads.has(id) && id !== s.bead);
    });
    prev.disabled = i === 0;
    const last = i === steps.length - 1;
    next.textContent = last ? 'The Chaplet is complete' : 'Next prayer';
    next.disabled = last;
    try {
      localStorage.setItem(KEY, String(i));
    } catch {
      /* ignore */
    }
  };

  const go = (n) => {
    i = Math.max(0, Math.min(steps.length - 1, n));
    render();
  };

  next.addEventListener('click', () => go(i + 1));
  prev.addEventListener('click', () => go(i - 1));
  restart.addEventListener('click', () => {
    go(0);
    next.focus();
  });
  beads.forEach((b) =>
    b.addEventListener('click', () => {
      const n = order.indexOf(b.dataset.bead);
      if (n >= 0) go(n);
    }),
  );
  tool.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(i + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(i - 1);
    }
  });

  render();
});
