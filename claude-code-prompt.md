# BUILD: piercemoore.com v2.0.0

You are building a senior DevOps engineer's personal website from scratch, end-to-end, in a single session. The owner is Pierce Moore — 20 years in infrastructure and front-end dev, currently Senior DevOps at Drive Shack / Puttery, actively job-hunting for a senior platform role. The site must help him land one.

This prompt is comprehensive and pre-decided. Every ambiguous choice has an answer below. When in doubt, re-read the relevant section. Do not ask the user clarifying questions for decisions already made here — execute.

---

## §0 — ROLE, SCOPE, POSTURE

You are the sole developer on this project. Your job is to build and ship a production-ready v1 of `piercemoore.com` in one session. The build includes: scaffolding, design system, all routes, content integration, asset pipeline, git hygiene, Cloudflare Pages deployment config, and a passing Lighthouse audit.

**Posture**:
- Be opinionated. Pierce has approved a specific aesthetic direction; execute it with precision.
- Ship working code, not stubs. Every route listed below must render real content.
- Prefer boring technology. This site must still work in 3 years.
- Match implementation quality to aesthetic ambition. Typography-driven minimalism demands *more* care than maximalist work, not less. Every margin, leading, and optical detail matters.
- Do not add features that aren't in this spec. If you think of a good feature, note it as a v2 candidate in a `V2-BACKLOG.md` and move on.
- When a skill applies (frontend-design, web-artifacts-builder), read it and follow its guidance. When it's time to create files, respect the repo structure defined here.

---

## §1 — STACK

Locked. Do not deviate.

- **Framework**: [Astro](https://astro.build/) (latest stable, v4+)
- **Styling**: Tailwind CSS + custom CSS variables for design tokens (see §5). Tailwind is a utility layer over a custom design system, not a component kit.
- **Content**: MDX for future postmortems, YAML/frontmatter for structured data.
- **TypeScript**: strict mode, used throughout.
- **Hosting**: Cloudflare Pages (config included; user deploys via dashboard connection to GitHub repo).
- **DNS**: Route 53 (external — user owns; you add CNAME instructions to the README).
- **Repo**: `github.com/rex/homepage` — push regularly with conventional commits.
- **Analytics**: Cloudflare Web Analytics (one-line snippet, user will add the beacon token post-deploy).
- **No JavaScript frameworks beyond Astro's island architecture.** Use React islands only where interactivity demands it (boot sequence controller, cursor nudge, theme toggle). Static HTML elsewhere.
- **No heavy dependencies.** No lodash, no moment, no date-fns unless absolutely necessary. Native `Intl` APIs for dates.

**Package management**: npm. Lock the lockfile.

---

## §2 — DOMAINS & ROUTING

Pierce owns three domains, all managed via Route 53:

- `piercemoore.com` — canonical site
- `piercemoore.cv` — 301 redirect to `piercemoore.com/cv`
- `piercemoore.dev` — 301 redirect to `piercemoore.com/writing`

For v1, both the `.cv` and `.dev` domains are configured as **301 redirects via Cloudflare Pages custom domain rules**. Document the required DNS records and Pages configuration in the README. Don't attempt to programmatically configure Cloudflare — just provide clear manual steps.

### Routes (v1)

| Path | Purpose | Notes |
|------|---------|-------|
| `/` | Single-page home | Hero, practice areas, career log, FAQ, contact. Long-scroll. |
| `/cv` | Résumé route | Renders the print-friendly HTML résumé + download link to `resume.pdf` |
| `/writing` | Postmortems index | v1: shows "coming soon" with no empty state shame. List stub. |
| `/postmortems/:slug` | Individual postmortem | v1: 404 unless a postmortem MDX exists. Template is built but no content ships. |
| `/ask` | Reserved for v2 chat | v1: renders a static page that says "query interface coming in v2. until then, see the FAQ on the home page." Links back to home FAQ section. |
| `/humans.txt` | Standard humans.txt | Static file at `/public/humans.txt` |
| `/.well-known/security.txt` | Standard security.txt | Static file at `/public/.well-known/security.txt` |
| `/resume.pdf` | Direct PDF download | Static file, `Content-Disposition: inline` |
| `/404` | Custom 404 page | See §7 for copy |
| `/500` | Custom 500 page | See §7 for copy |

### API stubs (v1)

- `POST /api/ask` → returns HTTP 501 with body `{"status":"not_implemented","note":"v2 — query interface"}`. Reserves the route for v2 without shipping it.

---

## §3 — INFORMATION ARCHITECTURE (home page, top to bottom)

The home page is a single long-scroll composition. No sticky nav. No hamburger menu. No scroll-jacking. Native browser scroll.

Sections, in order:

1. **Hero** — name (display italic serif, escapes the column on desktop), subtitle (mono, letter-spaced caps), tagline (italic serif), status pill (amber outline), primary bio paragraph, signal sentence.
2. **Practice Areas** — 3-column grid of 9 tiles. See §6 for tile anatomy.
3. **Career Log** — versioned changelog-style timeline, monospace formatting. See §6.
4. **FAQ** — 12 Q&A pairs. See §6.
5. **Contact** — email, GitHub, LinkedIn, resume download. Amber-accent links.
6. **Footer** — version string, build metadata, "start where you are." signature, theme toggle.

No nav between sections. The page is the navigation. Section anchors do exist (`#practice-areas`, `#career`, `#faq`, `#contact`) for external linking, but no visible nav menu.

---

## §4 — AESTHETIC DIRECTION: B / "Technical Manual"

Swiss-school, print-editorial, typography-driven. The dashboard metaphor is expressed through *typographic hierarchy and structured data*, not color or decoration. Every element that looks like a "dashboard" element (status indicators, sparklines, version numbers, timestamps) must convey real information, not cosplay.

### Core rules

- **The baseline is a rigid grid.** 12-column desktop, 6-column tablet, stacked mobile. Strict column adherence makes the intentional grid breaks land.
- **One big grid-break per page, two medium ones, unlimited small ones.** Discipline is the setup; deviation is the punchline.
- **Type does the heavy lifting.** Scale, weight, italic, optical size — not color, not backgrounds, not decoration.
- **Color is information, never decoration.** Amber means "signal." Green means "operational." Cream is background. Black is ink. Gray is shadow and timestamp.
- **Motion is surgical.** One orchestrated load, one ambient behavior. No parallax, no scroll-jacking, no typewriter effects.

---

## §5 — DESIGN TOKENS

Define these as CSS variables on `:root` (dark mode default) and override in `[data-theme="light"]`. Use Tailwind's `theme.extend` to make them Tailwind-accessible.

### Color (dark mode default)

```css
--bg: #0d0d10;              /* warm near-black, not pure black */
--bg-elevated: rgba(242, 237, 228, 0.012);  /* for tile backgrounds */
--ink: #f2ede4;             /* warm off-white primary text */
--ink-muted: #a8a095;       /* secondary text, taglines */
--ink-dim: #6b6b6b;         /* timestamps, metadata, labels */
--ink-faint: #5a5a5a;       /* borders, rules */
--hairline: rgba(242, 237, 228, 0.07);  /* borders between sections */
--accent: #ffb000;          /* amber — sparingly used */
--accent-dim: rgba(255, 176, 0, 0.28);   /* amber at low opacity */
--status-op: #4ade80;       /* green for operational status */
--status-maint: #ffb000;    /* amber for maintenance */
--status-archived: #6b6b6b; /* gray for archived */
```

### Color (light mode)

```css
--bg: #f4f1ea;              /* warm off-white */
--bg-elevated: rgba(13, 13, 16, 0.02);
--ink: #1a1a1a;
--ink-muted: #4a4a4a;
--ink-dim: #7a7a7a;
--ink-faint: #a0a0a0;
--hairline: rgba(13, 13, 16, 0.08);
--accent: #c8952c;          /* amber shifts slightly darker on cream for contrast */
--accent-dim: rgba(200, 149, 44, 0.35);
--status-op: #16a34a;
--status-maint: #c8952c;
--status-archived: #7a7a7a;
```

Every color combination must pass WCAG AA (4.5:1 for body, 3:1 for large). Test and adjust if any combo fails.

### Typography

Self-host all fonts. Subset to the characters actually used (a-z, A-Z, 0-9, common punctuation, em-dash, en-dash, arrows `→ ↳ ↑`, middle dot `·`, the monogram would live as SVG not font-glyph).

**Font stack**:

```css
--font-display: 'Fraunces', Georgia, serif;
--font-body: 'Supreme', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--font-mono: 'Cascadia Code', 'Cascadia Mono', 'SF Mono', Menlo, Consolas, monospace;
```

Fonts to obtain and place in `/public/fonts/`:

Fonts to obtain and place in `/public/fonts/`:

- **Fraunces** — display. Free, Google Fonts, OFL license. Variable font with `opsz`, `SOFT`, `WONK`, and `wght` axes. Single variable WOFF2 file covers display + italic + all weights. Download from [fonts.google.com/specimen/Fraunces](https://fonts.google.com/specimen/Fraunces).
- **Supreme** — body sans. Free, Fontshare. Geometric but warm. Download from [fontshare.com/fonts/supreme](https://www.fontshare.com/fonts/supreme).
- **Cascadia Code** — mono. Free, Microsoft (OFL). Includes programming ligatures and an italic cut. Download from [github.com/microsoft/cascadia-code](https://github.com/microsoft/cascadia-code/releases) — grab `CascadiaCode.woff2` and `CascadiaCodeItalic.woff2` from the latest release.

If any font file is missing from `/public/fonts/` at build time, fall back to the system fonts in the stack and continue the build. Do not fail. Log a console warning: `[fonts] <FontName> not found, using fallback.`

### Scale

```css
--text-xs: 0.6875rem;   /* 11px — mono labels */
--text-sm: 0.875rem;    /* 14px — small body */
--text-base: 1rem;      /* 16px — body */
--text-lg: 1.125rem;    /* 18px — emphasized body */
--text-xl: 1.5rem;      /* 24px — subheadings */
--text-2xl: 2rem;       /* 32px — tile titles */
--text-3xl: 3rem;       /* 48px — section headlines */
--text-hero: clamp(4.5rem, 17vw, 15rem);  /* hero name — intentionally bleeds */
```

### Spacing & grid

- Page gutter: 24px mobile, 64px tablet, 96px desktop, 144px large.
- Vertical rhythm: all elements snap to an 8px baseline grid.
- Section spacing: 96px between major sections, 48px between subsections.

### Typographic features (Tier 1 "free credibility" moves — implement ALL)

Apply globally via CSS:

```css
body {
  hanging-punctuation: first last;
  font-feature-settings: "kern", "liga", "calt";
  text-rendering: optimizeLegibility;
}

.numeric-tabular { font-variant-numeric: tabular-nums; }
.numeric-oldstyle { font-variant-numeric: oldstyle-nums; }
.small-caps { font-variant-caps: small-caps; }  /* only if font has real small caps */
```

Apply `.numeric-tabular` to: dates, version numbers, durations, sparkline axes.
Apply `.numeric-oldstyle` to: numbers in flowing prose (the bio paragraph, the "20 years" in signal sentence).

**Optical alignment on hero**: the hero name "pierce moore" starts with `p` which has a visible left edge. No optical correction needed there. But the `m` in "moore" must align *optically* with `p` — use negative letter-spacing and a slight left-margin adjustment on the whole wordmark (~`-0.045em`). Test and tune.

**Variable font optical sizing**: Fraunces has an `opsz` axis (9pt to 144pt). Use `font-variation-settings: "opsz" <matching-size>` automatically per text size. 144 for hero, 72 for tile titles, 36 for body, 14 for small text. Also use the `SOFT` axis (0-100) — set to ~30 for body text to soften corners slightly, 0 for display sizes to keep edges crisp.

---

## §6 — COMPONENT SPECS

### Hero

Structure:

```
[margin: § 01 — identity]  (vertical-reading, left margin, mono, dim)

[hero name]                (italic serif display, 17vw, bleeds off right edge on desktop)

[SENIOR DEVOPS ENGINEER] — [hairline] — [human-centric infrastructure & automation]
(mono, caps)                             (italic serif, muted)

[● seeking senior platform role · remote or dallas]    (amber pill)

[bio paragraph]                          (sans body, 18px, max-width ~60ch)

[signal sentence]                        (italic serif, slightly muted)
```

The hero name IS the design. Oversized italic serif, bleeds intentionally off the right edge on desktop (viewport-based clipping, not overflow-x scroll). On tablet/mobile, tight to the edge without bleed. `whitespace: nowrap`. Negative letter spacing (~`-0.035em`).

### Practice Area Tile

9 tiles total, 3-column grid on desktop. See content file for data.

```
[status row]                              [years]
[● operational]                           [7y]    (mono, right-aligned)

[tile name]                               (italic serif, 30px, color: --ink)

[sparkline]                               (amber line, 1.25px, draws on load)

[tool list]                               (mono, caps, letter-spaced, dim)
[↳ last incident/artifact]                (mono, small, ink-dim, amber arrow)
```

Tile is clickable if `recent_link` exists in data. Hover: hairline border shifts from `--hairline` to `--ink-muted`, cursor changes to pointer. No scale, no shadow, no fancy hover — just a border state change.

**Sparkline implementation**:
- SVG, 220×30 viewBox.
- Polyline, `stroke: --accent`, `stroke-width: 1.25`, rounded linecap and linejoin.
- Last point gets a 2px filled circle.
- `aria-label` describing the trend: e.g., "activity trending up over 24 months" (compute from data: if last-5 values average > first-5 values average, "trending up"; else "trending down"; else "stable").

**Status dot**:
- 6px circle, color by status.
- `operational`: `--status-op`, with subtle glow (`box-shadow: 0 0 7px currentColor at 40% opacity`).
- `archived`: `--status-archived`, no glow.
- Screen readers announce status via `aria-label`.

### Career Log

Monospace block, looks like a changelog. 9 entries.

```
v8.x   2020 — present   Senior DevOps Engineer   Drive Shack / Puttery
       <expanded summary on :target or click, italic serif, 1 line indent>
```

Columns:
- Version (tabular-nums, amber)
- Period (tabular-nums, ink-dim)
- Role (ink, weight 500)
- Employer (ink-muted)

Each row is keyboard-focusable. Enter/click reveals the summary underneath in italic serif. Default state: first 3 entries expanded, rest collapsed. Smooth height animation on expand (200ms).

Under the career log, a small italic caption:
> *git log --all --oneline --since="2007-01-01"*

### FAQ

12 Q&A pairs.

Layout: two-column on desktop — questions right-aligned in col 1 (italic serif, ink-muted), answers in col 2 (sans body, ink). On mobile, stacked.

Each Q ends with an em-dash instead of a question mark in the styled display (but the underlying HTML keeps the `?` for screen readers and SEO). Actually — scratch that, it's trying too hard. **Keep the question marks.** Style the questions in italic serif so they read as editorial prompts, not a FAQ form field.

No accordion collapsing. All answers visible by default. This is a read-through section.

### Contact

Four links, laid out as a definition list. Each link:
- Label (mono, caps, letter-spaced, ink-dim): `EMAIL`, `GITHUB`, `LINKEDIN`, `RESUME`
- Value (sans body, ink, underlined on hover with amber accent)

### Footer

Single row on desktop, stacked on mobile.

Left: `piercemoore.com @ v2.0.0 · build [SHORT-COMMIT-HASH] · [BUILD-DATE]`  
Right: `start where you are.` (italic serif)  
Far right: theme toggle (see below)

The build commit hash and date must be **real**, injected at build time via Astro's build config. Use `import.meta.env` or Vite's `define` to inject `VITE_BUILD_COMMIT` (short hash, from `git rev-parse --short HEAD`) and `VITE_BUILD_DATE` (ISO 8601). These values are baked into the bundle. The commit hash is also visible in the HTML source as a `<meta name="build-commit" content="...">` tag.

---

## §7 — CONTENT

Pierce has written the content. Place these files in `src/content/`:

- `hero.md` — frontmatter with all hero fields (name, title, tagline, bio, signal-sentence, meta-description, short-tagline)
- `practice-areas.yaml` — 9 tiles
- `career-log.yaml` — 9 entries
- `faq.yaml` — 12 Q&A pairs, intro paragraph
- `contact.yaml` — contact links, availability status, location
- `error-pages.yaml` — 404 and 500 copy

**Hero content**:

```
Name:       pierce moore
Title:      SENIOR DEVOPS ENGINEER
Tagline:    human-centric infrastructure & automation
Status:     SEEKING SENIOR PLATFORM ROLE · REMOTE OR DALLAS

Bio paragraph:
  Twenty years in and out of infrastructure. Currently running
  ten-plus RKE2 clusters across physical venues for Drive Shack /
  Puttery, and cleaning up etcd fires for fun. Spent the decade
  before this building real-time gameplay systems at Topgolf —
  which is why my mental model of "production" includes the
  guests, not just the pods.

Signal sentence:
  Before DevOps: five years on real-time gameplay systems at
  Topgolf, and a decade in front-end and interactive dev before
  that. I think in both directions — up the stack and down it.

Meta description (150 chars):
  Pierce Moore — Senior DevOps Engineer. Multi-venue Kubernetes,
  Terraform, AWS, observability. Based in Dallas. Open to senior
  platform roles.
```

**Practice Areas** — 9 tiles. Full data provided in a separate `practice-areas.yaml` the user will drop into `src/content/`. Each tile has: `slug`, `name`, `status` (operational/archived), `years`, `sparkline` (10-value array), `tools` (3-5 items), `recent` (date + one-line description), optional `recent_link`, `expanded` description.

The 9 areas:
1. kubernetes & orchestration (7y, operational, rke1/rke2 · rancher · helm · argocd, 2026-03 nyc etcd self-removal recovery)
2. infrastructure as code (8y, operational, terraform · ansible · packer · vagrant, 2026-02 venue provisioning pattern)
3. observability (6y, operational, prometheus · grafana · victoriametrics · icinga · pushover, 2026-01 full observability stack on helm's deep)
4. cloud & platforms (9y, operational, aws · route53 · cloudflare · vmware/proxmox, 2024 ~64% aws cost reduction)
5. ci/cd & delivery (8y, operational, jenkins · github actions · gitea actions · helm repos, 2025-12 internal helm repo + enforced release path)
6. devsecops & secrets (5y, operational, hashicorp vault · ansible vault · aws kms/secrets manager · rbac, 2025 least-privilege rbac rollout)
7. backend & languages (15y, operational, python · node.js · bash/zsh · ruby/rails · go (learning), 2026-03 rancher mcp server)
8. frontend & interfaces (10y, archived, vue/tailwind/vite · typescript · next.js · react, 2020 topgolf gameplay ui)
9. maker & hardware (8y, operational, esp32/arduino · 3d printing · home automation · pi cluster, 2026 nfc fossil dig station)

**Career log** — 9 entries, v0.x through v8.x, reverse chronological:

- v8.x · 2020–present · Senior DevOps Engineer · Drive Shack / Puttery · Dallas, TX
- v7.x · 2015–2020 · Software Engineer · Topgolf · Dallas, TX
- v6.x · 2014–2015 · Platform Engineer · Vinli · Dallas, TX
- v5.x · 2013–2014 · Developer Operations · YouToo
- v4.x · 2012–2013 · Web Developer · ZNGINE
- v3.x · 2011–2012 · Web Developer · 70kft
- v2.x · 2010–2011 · Interactive Developer → Web Developer → PHP Developer · SQ1
- v1.x · 2008–2010 · Angular.js Developer · Senior PHP Developer · Ristken / Latimundo
- v0.x · 2007–2008 · Sales Specialist · Limestone Networks

Full summaries provided in `career-log.yaml`.

**FAQ** — 12 Q&A pairs provided in `faq.yaml`. Intro: "Questions recruiters and hiring managers actually ask. This is the static version; a live query interface is planned for v2."

**Contact**:
- Email: `pierce@piercemoore.com`
- GitHub: `github.com/rex`
- LinkedIn: `linkedin.com/in/piercemoore`
- Resume: `/resume.pdf`
- Location: `Dallas / Fort Worth, TX`
- Availability: `seeking senior platform role · remote or dallas`

No phone number.

**Error pages**:
- 404: headline `404 — route not found in this cluster`, body `The page you requested didn't resolve. Either the URL is wrong, the page got moved during a refactor, or I haven't shipped it yet.` Actions: return home, view resume.
- 500: headline `500 — internal server error`, body `Something broke on my end. This would be where I'd show you the status page, but the status page is also my website.` Actions: return home, report via email.

---

## §8 — INTERACTIVITY

### Tier 3 signature moves (both ship)

**These are two halves of one idea: "this page behaves like a system, not a document."** Boot is the entrance, nudge is the ambient presence.

#### Boot sequence

On first load, staggered reveal of page elements, matching the pattern of services registering with a control plane. **One-time per session** (cached in `sessionStorage` with key `boot-played: true`). On return loads within the same session, skip the boot sequence — show everything instantly.

Timing (approximate):
- 0ms: page background visible, nothing else
- 180ms: hero letters begin fading in, 38ms stagger per letter
- 650ms: vertical margin label fades in
- 720ms: subtitle fades up
- 820ms: status pill fades up
- 900ms: first tile begins, 90ms stagger between tiles
- +120ms per tile: status dot pops in (dotGlow animation)
- +280ms per tile: sparkline draws (0.9s stroke-dashoffset animation)
- +800ms after draw: end-point circle fades in
- 1200ms: footer fades up
- Total boot ≈ 1.3s, perceptually faster due to staggered reveal

Implementation: single CSS file with `@keyframes`, opacity-only animations (don't touch transforms). Animation delays set via inline `style` attributes based on index. The nudge uses transform; they must not collide. Boot owns `opacity`, nudge owns `transform`. Enforce this separation rigidly.

Respect `@media (prefers-reduced-motion: reduce)` — set all animations to instant, opacity 1 at 0ms.

#### Cursor nudge (hero only)

Hero name letters are wrapped in individual `<span>` elements. A React island (`src/components/HeroNudge.tsx`) attaches a global `mousemove` listener and applies per-letter `transform: translate(x, y)` based on cursor proximity.

Parameters:
- `pull`: 10px maximum displacement
- `maxDist`: 200px radius of influence
- Falloff: quadratic (`strength = (1 - distance/maxDist)^2`)
- Direction: letters are pulled *toward* cursor (positive = attractive force)
- Transition: `transform 0.55s cubic-bezier(0.23, 1, 0.32, 1)` — physics-accurate settle
- `will-change: transform` on each letter
- rAF-throttled (one per frame max)

Disable when `prefers-reduced-motion: reduce` is set.

On component unmount or `mouseleave` from window: reset all transforms to `translate(0,0)`.

### Theme toggle

Position: top-right corner of viewport, fixed. Small, discrete.

Markup: `<button>` with two text labels, `[dark]` and `[light]`, monospace, 10px, letter-spaced. Active theme has `--ink` color; inactive has `--ink-faint`.

**Transition animation** (per Pierce's request): on toggle, the characters of the current theme label fade from `--ink` to `--ink-faint` sequentially left-to-right, while the target theme label fades from `--ink-faint` to `--ink` in the same rhythm. 40ms stagger per character, 180ms per-character transition. Total transition ~400ms. Subtle, not showy.

Persistence: `localStorage.setItem('theme', 'dark'|'light')`. On first load, respect `prefers-color-scheme` if no localStorage value. Apply theme via `document.documentElement.setAttribute('data-theme', 'light'|'dark')` before render to prevent FOUC — inline `<script>` in `<head>` does this synchronously.

---

## §9 — ACCESSIBILITY (NON-NEGOTIABLE)

This is a senior engineer's website. It must pass WCAG AA. Non-compliance is a ship-blocker.

Requirements:

1. **Semantic HTML**. `<main>`, `<section>`, `<article>`, `<nav>` used correctly. Landmarks labeled via `aria-label` or `aria-labelledby`.
2. **Heading hierarchy** — `<h1>` is the hero name, `<h2>` for section titles (Practice Areas, Career Log, etc.), `<h3>` for tile names and FAQ questions. Never skip levels.
3. **Hero name with wrapped letters**: the `<h1>` has an `aria-label="Pierce Moore"` so screen readers announce the name, not 12 individual letters.
4. **Sparklines**: each has `aria-label` describing the trend.
5. **Status dots**: each has `aria-label` with the status name (`aria-label="operational"`, etc.).
6. **Keyboard navigation**: every interactive element reachable via Tab. Visible focus states (2px amber outline, 2px offset). Never remove focus outlines with `outline: none` without a replacement.
7. **Skip-to-content link**: first focusable element, visually hidden until focused, jumps to `#main`.
8. **Color contrast**: every text-on-background combo passes 4.5:1 (or 3:1 for text ≥24px). Amber on near-black is borderline; test `#ffb000` on `#0d0d10` — should pass AA. If not, adjust amber brighter.
9. **Respect `prefers-reduced-motion`** for boot sequence, cursor nudge, theme toggle animation, and any other motion.
10. **Respect `prefers-color-scheme`** for initial theme selection.
11. **Form labels**: if any form exists (it shouldn't in v1), every input has a `<label>`.
12. **Image alt text**: every image has meaningful `alt` (empty string `alt=""` only for purely decorative images — there should be few).
13. **Lang attribute**: `<html lang="en">`.
14. **Keyboard traps**: none. Every component escapable via standard keys.

After build, run `npx @axe-core/cli` against the built site and report zero violations. If violations exist, fix them. Do not ship with a11y violations.

---

## §10 — PERFORMANCE TARGETS

Lighthouse scores (desktop, throttled):

- **Performance: 98+**
- **Accessibility: 100**
- **Best Practices: 100**
- **SEO: 100**

Core Web Vitals:
- **LCP: < 1.2s**
- **CLS: < 0.05**
- **INP: < 200ms**

Hard constraints:
- **Total JavaScript shipped: < 50KB gzipped** for the home route. Use Astro's island architecture — only hydrate the React islands (boot controller, nudge, theme toggle).
- **Total CSS shipped: < 30KB gzipped** for the home route. Use Tailwind's JIT mode and `content` configuration to tree-shake unused classes.
- **Font payload: < 120KB total** across all weights/styles. Subset to the characters actually used. Fraunces variable file is the largest single asset — subset aggressively (Latin Basic + Latin Supplement is enough; drop the cyrillic and extended ranges).
- **Zero render-blocking third-party requests.** No Google Fonts, no external analytics, no CDN fonts. Everything self-hosted.
- **Images**: if any are added later, use Astro's `<Image>` component with AVIF/WebP output and lazy loading. v1 has no raster images on the home page (the OG image is only referenced in meta tags).

### OG image

Pre-rendered 1200×630 PNG at `/public/og-image.png`. Matches the site aesthetic: cream-on-espresso (the "light" equivalent but for social previews it's dark-preferred since most social previews are viewed in mixed-mode UIs). The prompt author (Pierce) has generated this. If absent, render a fallback from the SVG template at `/public/og-image.svg`.

Meta tags on home:
```html
<meta property="og:title" content="Pierce Moore — Senior DevOps Engineer">
<meta property="og:description" content="[meta description]">
<meta property="og:image" content="https://piercemoore.com/og-image.png">
<meta property="og:url" content="https://piercemoore.com">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

---

## §11 — SEO & STRUCTURED DATA

- `<title>` on home: `Pierce Moore — Senior DevOps Engineer`
- `<title>` on `/cv`: `Pierce Moore — Résumé`
- `<title>` on `/writing`: `Pierce Moore — Writing`
- `<title>` on `/404`: `404 — Pierce Moore`

Every page has a unique `<meta name="description">`.

### JSON-LD Person schema (on home page only)

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Pierce Moore",
  "alternateName": "Anthony Pierce Moore",
  "jobTitle": "Senior DevOps Engineer",
  "url": "https://piercemoore.com",
  "sameAs": [
    "https://github.com/rex",
    "https://linkedin.com/in/piercemoore"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Dallas",
    "addressRegion": "TX",
    "addressCountry": "US"
  },
  "email": "pierce@piercemoore.com",
  "knowsAbout": [
    "Kubernetes", "Rancher", "Terraform", "Ansible",
    "AWS", "Prometheus", "Grafana", "DevOps",
    "Platform Engineering", "Site Reliability Engineering"
  ]
}
```

### Static files

- `robots.txt` at `/public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  Disallow: /api/
  Sitemap: https://piercemoore.com/sitemap-index.xml
  ```
- `sitemap.xml`: generated by `@astrojs/sitemap` integration.
- `humans.txt` at `/public/humans.txt`: content provided below.
- `security.txt` at `/public/.well-known/security.txt`: content below.

### humans.txt content

```
/* TEAM */

Engineer: Pierce Moore
Contact: pierce [at] piercemoore.com
GitHub: /rex
From: Dallas / Fort Worth, TX

/* CTO */

Linus — Orange American Shorthair, b. 2014
Responsibilities: Emotional support, rodent security,
keyboard warmth, unscheduled code review via paw intervention.

/* THANKS */

Tiffany Sharp — partner, sounding board, patience.
The late-night crew at Drive Shack / Puttery.
Every engineer whose postmortem I've learned from.

/* SITE */

Last-updated: [BUILD-DATE — injected at build]
Standards: HTML5, CSS3, ES2022
Components: Astro · MDX · Tailwind
Typography: Fraunces / Supreme / Cascadia Code
Hosting: Cloudflare Pages · Route 53 DNS
Source: https://github.com/rex/homepage

/* NOTES */

This site is hand-built, not templated. If you noticed the
typography, the margin-set metadata, or the boot sequence —
thank you. That's on purpose.
```

### security.txt content

```
Contact: mailto:pierce@piercemoore.com
Preferred-Languages: en
Canonical: https://piercemoore.com/.well-known/security.txt
Expires: [BUILD-DATE + 1 YEAR in ISO 8601 format]
```

Inject the expires date at build time, exactly 1 year from build. This must be auto-updated on each build.

---

## §12 — REPO STRUCTURE

```
/homepage
├── .github/
│   └── workflows/
│       └── ci.yml              # lint + build + a11y check on PR
├── public/
│   ├── fonts/                  # self-hosted fonts (user adds)
│   ├── og-image.png            # 1200×630 social preview
│   ├── og-image.svg            # source SVG
│   ├── favicon.ico             # 48x48 multi-res ICO
│   ├── favicon-16.png
│   ├── favicon-32.png
│   ├── favicon-48.png
│   ├── apple-touch-icon.png    # 180x180
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── pm-monogram.svg         # primary monogram, outline
│   ├── pm-monogram-filled.svg  # filled version for small sizes
│   ├── pierce-moore-wordmark.svg  # script logotype
│   ├── resume.pdf              # Pierce provides
│   ├── humans.txt
│   ├── robots.txt
│   ├── site.webmanifest
│   └── .well-known/
│       └── security.txt
├── src/
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── HeroNudge.tsx       # React island
│   │   ├── PracticeAreas.astro
│   │   ├── PracticeTile.astro
│   │   ├── Sparkline.astro
│   │   ├── StatusDot.astro
│   │   ├── CareerLog.astro
│   │   ├── FAQ.astro
│   │   ├── Contact.astro
│   │   ├── Footer.astro
│   │   ├── ThemeToggle.tsx     # React island
│   │   ├── BootController.tsx  # React island, orchestrates boot
│   │   └── SkipToContent.astro
│   ├── content/
│   │   ├── config.ts           # content collections config
│   │   ├── hero.md
│   │   ├── practice-areas.yaml
│   │   ├── career-log.yaml
│   │   ├── faq.yaml
│   │   ├── contact.yaml
│   │   └── error-pages.yaml
│   ├── layouts/
│   │   ├── BaseLayout.astro    # html, head, theme init script, footer
│   │   └── PrintLayout.astro   # for /cv route
│   ├── pages/
│   │   ├── index.astro
│   │   ├── cv.astro
│   │   ├── writing/
│   │   │   └── index.astro
│   │   ├── postmortems/
│   │   │   └── [slug].astro
│   │   ├── ask.astro
│   │   ├── 404.astro
│   │   └── api/
│   │       └── ask.ts          # 501 stub
│   ├── styles/
│   │   ├── globals.css         # CSS variables, resets, base styles
│   │   ├── fonts.css           # @font-face declarations
│   │   └── boot.css            # boot sequence keyframes
│   └── lib/
│       ├── build-info.ts       # commit hash, build date getters
│       └── sparkline.ts        # sparkline path computation
├── astro.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .gitignore
├── .nvmrc                      # pin Node version
├── README.md
└── V2-BACKLOG.md               # parked v2 ideas
```

---

## §13 — README

Write a README that's on-brand and useful. Include:

- One-line project description.
- Stack summary.
- Local dev: `npm install`, `npm run dev`, `npm run build`, `npm run preview`.
- Cloudflare Pages deployment setup: step-by-step on connecting the GitHub repo, setting build command (`npm run build`), output directory (`dist`), and adding the three custom domains with redirect rules.
- Font setup: where to drop Fraunces, Supreme, and Cascadia Code files in `public/fonts/`, with download links and what the fallback behavior is if files are missing.
- Environment variables: list any used (likely none in v1 besides build-time git commit hash).
- License note: code MIT, content CC-BY-NC-ND or similar — Pierce's call, use CC-BY-NC 4.0 as default.
- Credit line at bottom: "built by pierce moore, with claude opus 4.7 as pair"

---

## §14 — GIT HYGIENE

- Initialize git in the repo root.
- Use **conventional commits** throughout: `feat:`, `fix:`, `style:`, `refactor:`, `chore:`, `docs:`.
- Commit at logical checkpoints as you build:
  1. `chore: initial astro scaffold`
  2. `chore: add tailwind, typescript config`
  3. `style: define design tokens and base typography`
  4. `feat: hero section with bleeding display type`
  5. `feat: practice area tiles with sparklines and status dots`
  6. `feat: career log with expandable entries`
  7. `feat: FAQ section`
  8. `feat: contact and footer`
  9. `feat: cursor nudge react island`
  10. `feat: boot sequence orchestration`
  11. `feat: theme toggle with character transition`
  12. `feat: cv route with print styles`
  13. `feat: writing, postmortem, ask route stubs`
  14. `feat: custom 404 and 500 pages`
  15. `feat: humans.txt, security.txt, robots.txt, sitemap`
  16. `feat: OG image, favicons, webmanifest`
  17. `feat: JSON-LD person schema`
  18. `chore: a11y audit pass, fix violations`
  19. `chore: lighthouse audit pass, optimize`
  20. `docs: README with deploy instructions`

Push to `github.com/rex/homepage` after every few commits. If the repo doesn't exist yet, the user will create it — document this in your output at the end.

Commit messages are terse and factual. No AI-tell marketing prose.

**Code comments**: minimal. Comment the *why*, not the *what*. Don't leave "TODO" or "this component handles X" comments. If code isn't self-explanatory, the code is the problem.

---

## §15 — V1 SCOPE BOUNDARY

These are **out of scope** for v1. Park them in `V2-BACKLOG.md` and move on:

- Claude chat interface at `/ask` (stubbed only, returns 501)
- RSS feed
- Postmortem content (template built, no content ships)
- Knowledge section (technology-scoped runbooks)
- Tools/projects showcase
- Reaper migration to `eye/` org
- PWA / service worker
- Custom domain routing middleware (v1 uses 301 redirects)
- Analytics dashboard beyond Cloudflare Web Analytics
- Email newsletter / mailing list
- Comments on postmortems
- Search
- Any form of user authentication
- Dark-mode-only variants of the OG image

If Pierce explicitly asks you to add something, refer to this list and push back unless he overrides.

---

## §16 — FINAL QA CHECKLIST

Before declaring the build complete, verify every item:

### Build
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run preview` serves the site at localhost
- [ ] No console errors on any route in a Chromium-based browser
- [ ] No console warnings besides any unavoidable font-loading warnings

### Performance
- [ ] Lighthouse Performance ≥ 98 on home route
- [ ] Lighthouse Accessibility = 100 on home route
- [ ] Lighthouse SEO = 100 on home route
- [ ] Lighthouse Best Practices = 100 on home route
- [ ] Total home-route JS < 50KB gzipped
- [ ] Total home-route CSS < 30KB gzipped
- [ ] LCP < 1.2s, CLS < 0.05

### Accessibility
- [ ] `npx @axe-core/cli` reports zero violations on home
- [ ] Tab navigation reaches every interactive element with visible focus
- [ ] Screen reader (VoiceOver or NVDA) announces hero name as "Pierce Moore", not individual letters
- [ ] All status dots announce their status
- [ ] All sparklines announce their trend
- [ ] `prefers-reduced-motion` kills boot and nudge animations
- [ ] Theme toggle works via keyboard

### Routes
- [ ] `/` renders full home with all sections populated from content files
- [ ] `/cv` renders résumé view with PDF download link
- [ ] `/writing` renders index (even if empty) without a 404
- [ ] `/postmortems/anything` returns 404 (expected — no content yet)
- [ ] `/ask` renders v2-stub page
- [ ] `/404` custom page renders on bad routes
- [ ] `/api/ask` POST returns 501 JSON
- [ ] `/humans.txt`, `/robots.txt`, `/.well-known/security.txt`, `/sitemap-index.xml` all resolve

### Content
- [ ] Hero renders all fields from content file
- [ ] 9 practice area tiles render with real data
- [ ] Career log renders 9 entries
- [ ] FAQ renders 12 Q&A pairs
- [ ] Contact links all resolve correctly (mailto, github, linkedin, /resume.pdf)
- [ ] Footer shows real git commit hash and real build date
- [ ] `humans.txt` has build date injected
- [ ] `security.txt` has Expires date set to build date + 1 year

### Interactions
- [ ] Boot sequence plays on first load, skips on second load in same session
- [ ] Cursor nudge responds on hero letters with physics-accurate settle
- [ ] Theme toggle switches modes with character-by-character fade
- [ ] Theme persists across reloads via localStorage
- [ ] No FOUC on theme change or initial load

### Design
- [ ] Hero name bleeds off right edge on desktop viewport width
- [ ] Sparklines draw on load during boot, freeze after
- [ ] Status pills use amber accent only where specified in §5
- [ ] Typography matches §5 spec (font-variation-settings, tabular-nums, hanging-punctuation)
- [ ] No generic AI-slop signals: no purple gradients, no centered everything, no Inter font, no cookie-cutter shadcn cards

### Git & Docs
- [ ] `git log` shows granular conventional commits, not one massive commit
- [ ] README includes deploy instructions
- [ ] `V2-BACKLOG.md` captures anything deferred

---

## §17 — DELIVERABLES SUMMARY

At the end of the session, produce:

1. **Complete working codebase** at `./homepage/` (or wherever you scaffold).
2. **Git repo initialized and committed**, ready to push to `github.com/rex/homepage`.
3. **Build artifacts verified**: `dist/` output builds cleanly, serves via `npm run preview`.
4. **Summary report** in chat (not a file): brief bullet list of what was built, any deviations from spec (with reasoning), any known issues, and the **exact next steps** for Pierce to take the site live:
   - Create `github.com/rex/homepage` repo on GitHub
   - Push local repo
   - Connect Cloudflare Pages to the GitHub repo
   - Add three custom domains with redirect rules
   - Add DNS CNAME records in Route 53
   - Add Cloudflare Web Analytics beacon token
   - Place real font files in `public/fonts/`
   - Place `resume.pdf` in `public/`

---

## §18 — TONE REMINDERS

- This site must feel **hand-built by someone with taste**, not generated. Restraint is the design.
- Pierce is a peer, not a customer. Code like you're handing this to another senior engineer tomorrow.
- If you catch yourself reaching for generic patterns (centered hero, card-grid everything, lucide icons), stop. The spec above deliberately avoids those patterns.
- Every element should earn its place. Delete anything that doesn't.

Build the whole thing. Ship it well.
