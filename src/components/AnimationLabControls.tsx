import { useEffect, useMemo, useState } from 'react';
import type { AnimationLabContent, AnimationLabOptionKey } from '../lib/content';

interface Props {
  content: AnimationLabContent;
}

type EnabledMap = Record<AnimationLabOptionKey, boolean>;

const CLASS_BY_KEY: Record<AnimationLabOptionKey, string> = {
  ambient: 'motion-lab--ambient',
  scroll: 'motion-lab--scroll',
  signal: 'motion-lab--signal',
  hover: 'motion-lab--hover',
  type: 'motion-lab--type',
  traces: 'motion-lab--traces',
};

function initialEnabled(content: AnimationLabContent): EnabledMap {
  return content.options.reduce(
    (map, option) => ({ ...map, [option.key]: option.default_enabled }),
    {} as EnabledMap,
  );
}

export default function AnimationLabControls({ content }: Props) {
  const defaults = useMemo(() => initialEnabled(content), [content]);
  const [enabled, setEnabled] = useState<EnabledMap>(defaults);

  useEffect(() => {
    const root = document.body;

    for (const option of content.options) {
      root.classList.toggle(CLASS_BY_KEY[option.key], enabled[option.key]);
    }

    root.dataset.motionLab = 'ready';

    return () => {
      for (const option of content.options) {
        root.classList.remove(CLASS_BY_KEY[option.key]);
      }
      delete root.dataset.motionLab;
    };
  }, [content.options, enabled]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.toggle('motion-lab--reduce', reduce);

    let frame = 0;
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      document.body.style.setProperty('--motion-scroll', progress.toFixed(4));
      document.body.style.setProperty('--motion-scroll-shift', `${(-progress * 18).toFixed(2)}px`);
      document.body.style.setProperty('--motion-hero-shift', `${(-Math.min(16, window.scrollY * 0.018)).toFixed(2)}px`);
      frame = 0;
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let pointerX = 0.5;
    let pointerY = 0.5;

    const commit = () => {
      document.body.style.setProperty('--motion-pointer-x', pointerX.toFixed(4));
      document.body.style.setProperty('--motion-pointer-y', pointerY.toFixed(4));
      document.body.style.setProperty('--motion-pointer-x-shift', `${((pointerX - 0.5) * 8).toFixed(2)}px`);
      document.body.style.setProperty('--motion-pointer-y-shift', `${((pointerY - 0.5) * 8).toFixed(2)}px`);
      frame = 0;
    };
    const onPointerMove = (event: PointerEvent) => {
      pointerX = Math.min(1, Math.max(0, event.clientX / window.innerWidth));
      pointerY = Math.min(1, Math.max(0, event.clientY / window.innerHeight));
      if (!frame) frame = window.requestAnimationFrame(commit);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        'main > section, .tile, .career-row, .faq-grid > *, .otc-list > *, .contact-list > *',
      ),
    );

    if (!('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('motion-lab-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle('motion-lab-visible', entry.isIntersecting);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      targets.forEach((target) => target.classList.remove('motion-lab-visible'));
    };
  }, []);

  return (
    <div className="animation-lab-controls" role="group" aria-label={content.controls_label}>
      <span className="animation-lab-controls__label">{content.controls_label}</span>
      <div className="animation-lab-controls__options">
        {content.options.map((option) => (
          <button
            key={option.key}
            type="button"
            className="animation-lab-controls__button"
            aria-pressed={enabled[option.key]}
            aria-label={`${enabled[option.key] ? 'disable' : 'enable'} ${option.description}`}
            title={option.description}
            onClick={() => setEnabled((current) => ({ ...current, [option.key]: !current[option.key] }))}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
