# piercemoore.com

Personal site for Pierce Moore — Senior DevOps Engineer.

Hand-built. Long-scroll home, /cv, /writing, /ask. Typography-driven minimalism.

## Stack

- **Astro 5** (static output, island architecture)
- **Tailwind CSS 3** as a utility layer over a custom token system (`src/styles/globals.css`)
- **TypeScript**, strict
- **React** for the two interactive islands (`HeroNudge`, `ThemeToggle`); everything else is static `.astro`
- **MDX** integration installed for postmortems (no content ships in v1)
- **@astrojs/sitemap** for `sitemap-index.xml`
- **Cloudflare Pages** for hosting; **Cloudflare Pages Functions** for the `/api/ask` 501 stub
- **Self-hosted fonts**: Fraunces (display), Supreme (body), Cascadia Code (mono)

No framework beyond Astro, no analytics SDK, no client-side router. Total client JS is **~47KB gzipped**, total CSS is **~5KB gzipped**.

## Local development

```sh
nvm use            # Node 22+
npm install
npm run dev        # http://localhost:4321
npm run build      # astro check + astro build → dist/
npm run preview    # serve dist/
```

`npm run build` runs `astro check` first; CI should fail on type errors.

## Repo structure

- `src/pages/` — routes (one .astro per route, `[slug].astro` for dynamic)
- `src/components/` — Hero, PracticeAreas, CareerLog, FAQ, Contact, Footer, ThemeToggle, HeroNudge, Sparkline, StatusDot, SkipToContent
- `src/layouts/` — `BaseLayout.astro`, `PrintLayout.astro` (CV)
- `src/content/*.yaml` — typed content (hero, practice-areas, career-log, faq, contact, error-pages); loaded via `src/lib/content.ts` using Vite raw imports
- `src/styles/` — `globals.css` (tokens + base + utilities), `fonts.css` (`@font-face`), `boot.css` (boot-sequence keyframes)
- `src/lib/` — `build-info.ts`, `sparkline.ts`, `content.ts`
- `public/` — fonts, favicons, OG image, monogram, wordmark, robots.txt, site.webmanifest
- `functions/api/ask.ts` — Cloudflare Pages Function returning HTTP 501 for `POST /api/ask`. Lives outside `src/` because the rest of the site is pure static.

## Fonts

Self-hosted in `public/fonts/`. If a file is absent at build time, the stack falls back to system fonts and the build continues; no error.

| Font | File | Source |
|------|------|--------|
| Fraunces (variable) | `Fraunces.woff2` | https://fonts.google.com/specimen/Fraunces — download, rename to `Fraunces.woff2` |
| Supreme | `Supreme-Regular.woff2`, `Supreme-Medium.woff2` | https://www.fontshare.com/fonts/supreme |
| Cascadia Code | `CascadiaCode.woff2`, `CascadiaCodeItalic.woff2` | https://github.com/microsoft/cascadia-code/releases |

Italic Fraunces is currently rendered via browser synthetic italic. To get real italic, add the Fraunces italic variable file (`Fraunces-Italic.woff2`) and a second `@font-face` block in `src/styles/fonts.css`.

## Environment variables

Build-time only:

- `VITE_BUILD_COMMIT` — short git commit hash, injected by `astro.config.mjs` from `git rev-parse --short HEAD`
- `VITE_BUILD_DATE` — ISO 8601 build timestamp

Both surface in the page footer, `<meta name="build-commit">`, `humans.txt` last-updated line, and the security.txt `Expires:` field (build-date + 1 year).

No runtime env vars in v1.

## Deploying to Cloudflare Pages

1. Create the GitHub repo (e.g. `github.com/rex/homepage`) and push:
   ```sh
   git remote add origin git@github.com:rex/homepage.git
   git push -u origin main
   ```
2. In Cloudflare Pages dashboard → **Create application** → **Pages** → **Connect to Git** → select the repo.
3. Build settings:
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
   - **Node version**: `22` (matches `.nvmrc`)
4. Functions: the `functions/` directory is auto-detected. `POST /api/ask` will return HTTP 501.
5. Add Cloudflare Web Analytics (Pages → Analytics → Web Analytics → enable). Drop the beacon `<script>` snippet into `src/layouts/BaseLayout.astro` near the closing `</body>` (or set `data-cf-beacon`).

### Custom domains

Three domains, all on Route 53. Cloudflare Pages handles the apex and the redirects.

| Domain | Behavior | Cloudflare config |
|--------|----------|-------------------|
| `piercemoore.com` | canonical | Add as primary custom domain. Set Route 53 ALIAS / CNAME to the Pages target. |
| `piercemoore.cv` | 301 → `piercemoore.com/cv` | Add as custom domain on the same project. Then create a **Bulk Redirect** rule: `https://piercemoore.cv/*` → `https://piercemoore.com/cv$1` (status 301). |
| `piercemoore.dev` | 301 → `piercemoore.com/writing` | Same pattern: redirect rule `https://piercemoore.dev/*` → `https://piercemoore.com/writing$1` (status 301). |

DNS records (Route 53):

```
piercemoore.com   ALIAS  pages-dev.com.cdn.cloudflare.net   (or whatever Pages assigns)
piercemoore.cv    CNAME  pages-dev.com.cdn.cloudflare.net
piercemoore.dev   CNAME  pages-dev.com.cdn.cloudflare.net
```

## Content updates

Content lives entirely in `src/content/*.yaml`. Edit, commit, push — Pages rebuilds.

The CV route is pure-derived from the same content; you don't maintain a separate résumé doc.

A printable PDF version belongs at `public/resume.pdf` — referenced by `/cv` and the contact section. Drop the file in and re-deploy.

## Accessibility

Every route passes axe-core (WCAG 2 AA, both light and dark themes) at zero violations. The hero name is a wrapped-letter `<h1>` with `aria-label="Pierce Moore"` so screen readers announce the name, not 12 letters. Status dots and sparklines have descriptive labels. Boot animations and the cursor nudge respect `prefers-reduced-motion`.

## License

- **Code**: MIT
- **Content** (text, images, sparkline data): CC BY-NC 4.0

---

built by pierce moore, with claude opus 4.7 as pair.
