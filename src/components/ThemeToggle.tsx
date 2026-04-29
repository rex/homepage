import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

const STAGGER_MS = 40;
const PER_CHAR_MS = 180;

interface AnimatedLabelProps {
  label: string;
  active: boolean;
  /** transition tick — bumping this triggers a fresh fade animation. */
  tick: number;
}

function AnimatedLabel({ label, active, tick }: AnimatedLabelProps) {
  return (
    <span aria-hidden="true">
      {[...label].map((ch, i) => (
        <span
          key={`${tick}-${i}`}
          style={{
            display: 'inline-block',
            transition: `color ${PER_CHAR_MS}ms ease-out`,
            transitionDelay: `${i * STAGGER_MS}ms`,
            color: active ? 'var(--ink)' : 'var(--ink-faint)',
          }}
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as Theme | null;
    if (current === 'light' || current === 'dark') {
      setTheme(current);
    }
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* no storage */
    }
    setTheme(next);
    setTick((t) => t + 1);
  }

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'Cascadia Code, monospace',
        fontSize: '0.6875rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '0',
        display: 'inline-flex',
        gap: '0.5rem',
      }}
    >
      <span>
        <AnimatedLabel label="[dark]" active={theme === 'dark'} tick={tick} />
      </span>
      <span>
        <AnimatedLabel label="[light]" active={theme === 'light'} tick={tick} />
      </span>
    </button>
  );
}
