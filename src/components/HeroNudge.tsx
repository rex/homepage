import { useEffect } from 'react';

const PULL = 10;
const MAX_DIST = 200;

export default function HeroNudge() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const letters = Array.from(
      document.querySelectorAll<HTMLElement>('.hero-letter'),
    );
    if (!letters.length) return;

    let frame = 0;
    let pendingX = 0;
    let pendingY = 0;

    function apply() {
      frame = 0;
      const cx = pendingX;
      const cy = pendingY;
      for (const el of letters) {
        const rect = el.getBoundingClientRect();
        const ex = rect.left + rect.width / 2;
        const ey = rect.top + rect.height / 2;
        const dx = cx - ex;
        const dy = cy - ey;
        const dist = Math.hypot(dx, dy);
        if (dist > MAX_DIST) {
          el.style.transform = 'translate(0, 0)';
          continue;
        }
        const norm = dist / MAX_DIST;
        const strength = (1 - norm) ** 2;
        const tx = (dx / Math.max(dist, 1)) * PULL * strength;
        const ty = (dy / Math.max(dist, 1)) * PULL * strength;
        el.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
      }
    }

    function onMove(e: MouseEvent) {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    }

    function reset() {
      for (const el of letters) {
        el.style.transform = 'translate(0, 0)';
      }
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', reset);
    document.addEventListener('mouseleave', reset);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', reset);
      document.removeEventListener('mouseleave', reset);
      if (frame) cancelAnimationFrame(frame);
      reset();
    };
  }, []);

  return null;
}
