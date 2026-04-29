# piercemoore.com — design system

The site is built typography-first on three families and one accent color. This doc describes the system as it stands at v0.1.0 (alpha launch). Tokens live in [design-tokens.json](design-tokens.json) in W3C DTCG format, importable by Figma's Tokens Studio plugin, Penpot, Style Dictionary, etc.

## Principles

1. **Typography does the heavy lifting.** Scale, weight, italic, optical size — not color, not backgrounds, not decoration.
2. **Color is information, never decoration.** Amber is the only accent. It signals: "operational" status, "this is the section you're in" (sidebar number), "this rule matters" (hero hairline). Nothing else gets amber.
3. **No section dividers.** Whitespace and typography separate sections. Horizontal rules are reserved for typographic accents (hero hairline, tile-internal hairlines).
4. **Restraint is the design.** A 12px monospace label at the right scale matters more than a hero band. The mantra at 96px italic Fraunces lands because everything around it is quiet.

---

## Color

Two themes (`data-theme="dark"` default; `data-theme="light"` opt-in or via `prefers-color-scheme: light`). Every text-on-bg combination passes WCAG AA contrast.

### Dark (default)

| Token | Value | Role |
|---|---|---|
| `bg` | `#0d0d10` | Page background — warm near-black, never pure black |
| `bg-elevated` | `rgba(242,237,228,0.012)` | Subtle elevation overlay |
| `ink` | `#f2ede4` | Primary text — warm off-white |
| `ink-muted` | `#a8a095` | Secondary text, taglines |
| `ink-dim` | `#8d877f` | Timestamps, mono labels, sidebar text |
| `ink-faint` | `#5a5a5a` | Borders, rules, decorative em-dashes |
| `hairline` | `rgba(242,237,228,0.07)` | Section dividers when used (rare) |
| `accent` | `#ffb000` | Amber — signal only |
| `accent-dim` | `rgba(255,176,0,0.28)` | Pill border, glow |
| `status-op` | `#4ade80` | Operational green |
| `status-maint` | `#ffb000` | Maintenance — same amber |
| `status-archived` | `#6b6b6b` | Archived gray |

### Light

| Token | Value | Role |
|---|---|---|
| `bg` | `#f4f1ea` | Warm off-white |
| `ink` | `#1a1a1a` | |
| `ink-muted` | `#4a4a4a` | |
| `ink-dim` | `#5e5852` | |
| `ink-faint` | `#a0a0a0` | |
| `accent` | `#8a5d0c` | Amber, darkened for contrast on cream |
| `accent-dim` | `rgba(138,93,12,0.32)` | |
| `status-op` | `#16a34a` | |

(Spec the light versions of `bg-elevated`, `hairline`, `status-maint`, `status-archived` from the JSON if you need them in Figma styles.)

### When to use which color

- **`accent` (amber)** is precious. Use only for: status indicator dots, the section number in the vertical sidebar mark, the hero hairline rule, hover states for links/tiles. **Never for body text, body backgrounds, or decorative accents.**
- **`ink-faint`** is for *visible* hairlines (the hero rule under "SENIOR DEVOPS ENGINEER"). For *barely-visible* section separators, use `hairline`. The current site doesn't actually use `hairline` anywhere — section breaks are whitespace.
- **`status-op` green** appears only on the small status dot inside practice tiles where status === 'operational'. Never larger.

---

## Type

Three families, one variable, one with an italic variable counterpart, two with static cuts.

| Family | Used for | File(s) |
|---|---|---|
| **Fraunces** (display) | Hero wordmark, all italic display, all serif h2/h3, hero tagline, bio prose, mantra, FAQ questions | `Fraunces.woff2` (roman variable) + `Fraunces-Italic.woff2` (italic variable). Both have `opsz`, `SOFT`, `WONK`, `wght` axes. |
| **Supreme** (body) | Default sans body wherever Fraunces isn't used (currently almost nowhere — italic Fraunces serif is the body voice) | `Supreme-Regular.woff2`, `Supreme-Medium.woff2` |
| **Cascadia Code** (mono) | Section labels, sidebar marks, status pill, career-log columns, tile metadata, tools list, footer build line | `CascadiaCode.woff2` (variable weight) + `CascadiaCodeItalic.woff2` |

### Fraunces variable axes

| Axis | Range | What it does | Site values |
|---|---|---|---|
| `opsz` (optical size) | 9 → 144 | Stroke contrast, x-height, letter spacing tuned to the rendered size | 144 hero, 72 tile titles, 36 body |
| `SOFT` | 0 → 100 | Sharpness of stroke endings | 50 hero, 30 tile titles, 50 body |
| `WONK` | 0 → 1 | Quirky-glyph alternates (off on this site) | 0 |
| `wght` | 100 → 900 | Stroke weight | 900 hero, 400 everything else |

**`ss02`** is on globally for `.display-italic` and `.display-roman`. That's the swashy alternate ampersand — the curly italic `&` glyph that looks like a flowing handwritten form. It's the difference between a generic ampersand and the one Pierce fell in love with. Only present in the *italic* variable file (the upright file uses a different default `&`); browser-synthesized italic from the upright file does NOT pull this glyph.

### Type scale

| Token | Size | Used for |
|---|---|---|
| `xs` | 11px | Mono labels, sidebar marks, status pill |
| `sm` | 14px | Small body, mono captions |
| `base` | 16px | Default body |
| `lg` | 18px | Emphasized body, signal sentence |
| `xl` | 24px | Hero tagline (md+) |
| `2xl` | 32px | Tile titles, hero bio paragraph |
| `3xl` | 48px | Section headlines |
| `hero` | `clamp(4rem, 14vw, 14rem)` (64–224px) | Hero wordmark only |
| `mantra` | `clamp(3rem, 9vw, 7rem)` (48–112px) | "start where you are." pre-footer band |

### Composite type styles (the named ones)

These are the recipes that get reused. Use these in Figma as text styles.

- **Hero**: Fraunces italic, `wght:900`, `opsz:144`, `SOFT:50`, `ss02:1`, hero size, line-height 0.85, letter-spacing -0.04em
- **Section headline**: Fraunces roman, `wght:400`, `opsz:72`, 3xl, line-height 1.1
- **Tile title**: Fraunces italic, `wght:400`, `opsz:72`, `SOFT:30`, 2xl, line-height 1.1
- **Tagline**: Fraunces italic, `wght:400`, `opsz:72`, xl-3xl
- **Body prose**: Fraunces italic, `wght:400`, `opsz:36`, `SOFT:50`, 2xl, line-height 1.4
- **Body signal**: Fraunces italic, `wght:400`, `opsz:36`, `SOFT:50`, lg, line-height 1.6, color `ink-muted`
- **Mono label**: Cascadia Code, 11px, letter-spacing 0.16em, uppercase
- **Sidebar label**: Cascadia Code, 11px, letter-spacing 0.18em, uppercase, `writing-mode: vertical-rl` + `transform: rotate(180deg)`. Section number wrapped in `<span>` with `color: accent`; rest is `ink-dim`.
- **Mantra**: Fraunces italic, `wght:400`, `opsz:144`, `SOFT:50`, mantra size, line-height 1.05, letter-spacing -0.02em, max-width 18ch

---

## Layout

### Page gutters (responsive)

| Breakpoint | Gutter |
|---|---|
| Mobile (< 768px) | 24px |
| Tablet (≥ 768px) | 64px |
| Desktop (≥ 1024px) | 96px |
| Wide (≥ 1536px) | 144px |

Apply via `.page-gutter` (left + right padding). The hero `<h1>` *is* page-gutter padded but its content (the inline-block letter spans) intentionally bleeds past the right edge at large viewports — that's a typographic feature, not a bug.

### Vertical rhythm

Section spacing is generous: `pt-24 pb-16` on most sections (96px top, 64px bottom). The mantra band uses `pt-32 pb-24` (128px / 96px) to feel like a deliberate breath before the footer.

### Grid

Practice areas: 3-column grid on `lg+`, 2-column on `md+`, single column on mobile. Each tile is a top-hairline + content; no boxed borders.

---

## Components

These are the named patterns. Build them as Figma components matching the names.

### `Hero`
- Vertical sidebar mark, top: 120px, color split: number in `accent`, rest in `ink-dim`
- `<h1>` with letter-wrapped spans (each letter in its own `inline-block`); `aria-label="Pierce Moore"` for screen readers
- Beneath wordmark: mono SDE label (text-base), then 320px amber rule (1px), then italic Fraunces tagline (xl–3xl), then status pill, then italic Fraunces bio (2xl), then italic Fraunces signal sentence (base–lg, ink-muted)

### `StatusPill`
- Inline-flex, gap 0.5rem, padding 0.375rem × 0.75rem, border 1px `accent-dim`, color `accent`, mono 11px caps with 0.08em letter-spacing, `border-radius: 999px`
- `::before` pseudo: 6px circle, `accent` background, glow via `box-shadow: 0 0 7px accent at 40% alpha`

### `StatusDot`
- 6px circle. Color by status:
  - operational → `status-op` with subtle glow
  - maintenance → `status-maint` with glow
  - archived → `status-archived` no glow
- Always paired with `aria-label` of the status name.

### `Sparkline`
- SVG, 220×30 viewBox, polyline `stroke: accent`, `stroke-width: 1.25`, rounded line cap + join
- Last point: 2px filled circle in `accent`
- `aria-label` describes trend (compute from data: last-5 avg vs first-5 avg → "trending up" / "down" / "stable")

### `PracticeTile`
- Top hairline only, no other borders
- Status row (`flex justify-between`): status dot + label on left, years right-aligned (mono, tabular-nums)
- Italic Fraunces tile title (2xl)
- Sparkline
- Tools list: mono 11px caps, letter-spaced 0.12em, `ink-dim`
- Recent line: `↳ ` (in accent) + mono small + ink-dim. Wrap entire tile in `<a>` if `recent_link` is present; hover bumps the tile title to `accent`

### `CareerEntry`
- Border-top hairline
- `<details>` element. Summary is a 5ch + 18ch + flex grid:
  - col 1: version (mono tabular-nums, `accent`)
  - col 2: period (mono tabular-nums, `ink-dim`)
  - col 3: role (`ink`)
  - col 4: employer + location (`ink-muted`) — visible at `lg+`
  - col 5: + / × toggle (`ink-faint`, rotates on `[open]`)
- Expanded body: italic Fraunces summary, padded to align with col 3+

### `MarginMark` (sidebar)
- Position absolute, `left: 24px`, `top: 120px`
- `writing-mode: vertical-rl` + `transform: rotate(180deg)` so text reads bottom-to-top with section number near the top
- Mono 11px, letter-spacing 0.18em, uppercase
- Text content: `§ <span class="num">NN</span> — IDENTITY`. The `.num` span is `accent`; everything else is `ink-dim`

### `MantraBand`
- Full width, `pt-32 pb-24`
- Italic Fraunces, mantra size, `ink` color, max-width 18ch, slight negative letter-spacing
- One sentence: "start where you are." — never anything else

### `Footer`
- Single mono caps line: `piercemoore.com @ v0.1.0 · build <hash> · YYYY-MM-DD HH:MM CDT`
- All `ink-muted` except the domain itself which is `ink`
- No mantra (lives in MantraBand above)

### `ThemeToggle`
- Fixed top-right (z-50) on `md+`, hidden on mobile
- Two text labels `[dark]` and `[light]`. Active label in `ink`, inactive in `ink-faint`. On click, characters fade between colors left-to-right with 40ms stagger and 180ms per-character transition

---

## Bringing this into Figma

The fastest path:

1. **Create a new Figma file.** Name it something like "piercemoore.com — design system".
2. **Install the [Tokens Studio for Figma](https://tokens.studio/) plugin** (free).
3. In Figma: `Plugins → Tokens Studio for Figma → Tools → Load tokens → JSON file`. Paste the contents of [design-tokens.json](design-tokens.json).
4. **Generate text styles + color styles.** In Tokens Studio: `Settings → Apply changes` → check "Create styles" for both colors and typography. Tokens Studio writes Figma styles for every color and every typography composite token. Done.
5. **Build component frames.** This part is manual — open the live site (https://piercemoore.com) in one window, build matching frames in Figma using the styles you just generated. Start with the simplest (StatusDot, MarginMark) and work up to Hero. The component spec section above is your build list.
6. **Save the file as a Library.** `Assets → Publish library`. Now any future Figma file in the same workspace can pull these tokens + components.

If Figma feels heavy, **Penpot** is the open-source equivalent. Same DTCG JSON imports cleanly via `Tokens` panel. UI is similar enough that the steps above translate.

A faster cheat for the component-build step is `html.to.design` (third-party Figma plugin) — it imports a live URL into a Figma file as editable layers. Not perfect (vector treatment varies), but a useful starting point for the components instead of building them from scratch.

---

## What's *not* in this system yet (parked)

- **HeroNudge cursor-pull motion** — exists in code but disabled. Pierce wants a better motion idea before re-enabling.
- **Boot sequence** — the per-letter fade-in on first session is documented in [`src/styles/boot.css`](../src/styles/boot.css) but isn't reflected in the Figma component model. Capture as a Figma prototype interaction once the components exist.
- **Print styles for `/cv`** — separate stack via [`PrintLayout.astro`](../src/layouts/PrintLayout.astro). Not reflected in tokens.
