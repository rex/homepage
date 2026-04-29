import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx,yaml,yml}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-elevated': 'var(--bg-elevated)',
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        'ink-dim': 'var(--ink-dim)',
        'ink-faint': 'var(--ink-faint)',
        hairline: 'var(--hairline)',
        accent: 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        'status-op': 'var(--status-op)',
        'status-maint': 'var(--status-maint)',
        'status-archived': 'var(--status-archived)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Supreme', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['Cascadia Code', 'Cascadia Mono', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['0.6875rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.4' }],
        base: ['1rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.6' }],
        xl: ['1.5rem', { lineHeight: '1.4' }],
        '2xl': ['2rem', { lineHeight: '1.2' }],
        '3xl': ['3rem', { lineHeight: '1.1' }],
        hero: ['clamp(4rem, 14vw, 14rem)', { lineHeight: '0.85' }],
      },
      maxWidth: {
        prose: '60ch',
      },
      letterSpacing: {
        tightish: '-0.035em',
        tighter2: '-0.045em',
      },
    },
  },
  plugins: [],
} satisfies Config;
