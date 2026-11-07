/**
 * Calls `fn(progress)` with 0..1 as `el` travels through the viewport (0 when its top meets the
 * bottom of the screen, 1 when `end` of its height has passed the top). Native scrolling only:
 * nothing is pinned, nothing is hijacked. Under reduced motion it reports 1 once.
 */
export function scrollProgress(el, fn, { end = 0.6 } = {}) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fn(1);
    return () => {};
  }
  let ticking = false;
  let active = false;
  const measure = () => {
    ticking = false;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = vh + r.height * end;
    const p = Math.min(1, Math.max(0, (vh - r.top) / total));
    fn(p);
  };
  const onScroll = () => {
    if (!active || ticking) return;
    ticking = true;
    requestAnimationFrame(measure);
  };
  const io = new IntersectionObserver(([e]) => {
    active = e.isIntersecting;
    if (active) measure();
  });
  io.observe(el);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  measure();
  return () => {
    io.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}
