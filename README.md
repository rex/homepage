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
- **Cloudflare Workers (Static Assets)** for hosting — config in [wrangler.jsonc](wrangler.jsonc); a tiny [src/worker.ts](src/worker.ts) handles vanity-domain redirects and the `/api/ask` 501 stub, everything else is served by the `ASSETS` binding
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
- `src/worker.ts` — Cloudflare Worker entry: 301-redirects `piercemoore.cv` → `/cv` and `piercemoore.dev` → `/writing`, returns 501 on `POST /api/ask`, falls through to the `ASSETS` binding for everything else
- `wrangler.jsonc` — Workers config: build output dir, asset binding, `not_found_handling: "404-page"`

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

## Deploying to Cloudflare Workers

Cloudflare consolidated Pages into **Workers Builds** + **Static Assets**. Almost all configuration is in-repo (`wrangler.jsonc`, `package.json`, `src/worker.ts`); the dashboard is just where you connect the repo and add the custom domains.

### One-time setup

1. Create the GitHub repo and push:
   ```sh
   git remote add origin git@github.com:rex/homepage.git
   git push -u origin main
   ```
2. In the Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository** → select the repo.
3. Cloudflare auto-detects the framework from `wrangler.jsonc` + `package.json`. The defaults are correct: build runs `npm run build`, deploy runs `npx wrangler deploy`. No need to set output dir or Node version in the dashboard — they live in [wrangler.jsonc](wrangler.jsonc) and `.nvmrc`.
4. Click **Deploy**. First build takes ~1 min.
5. After the first deploy, add the three custom domains under the Worker → **Settings** → **Domains & Routes** → **Add**:
   - `piercemoore.com` (canonical)
   - `piercemoore.cv` (vanity → /cv)
   - `piercemoore.dev` (vanity → /writing)

   Cloudflare gives you a CNAME target per domain (e.g. `piercemoore-com.<account>.workers.dev`). Add a corresponding `CNAME` record in Route 53 for each.

   The 301 redirects for `.cv` and `.dev` are baked into [src/worker.ts](src/worker.ts) — no Bulk Redirects rule needed.

6. Cloudflare Web Analytics: **Workers** → **your Worker** → **Settings** → **Observability** is already on (`observability.enabled: true` in `wrangler.jsonc`). For the visitor-side analytics beacon, enable **Web Analytics** and paste its `<script>` snippet into [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) near the closing `</body>`.

### Local deploy

If you want to deploy from your laptop instead of waiting on the GitHub-triggered build:

```sh
npm run cf:deploy   # builds astro, then wrangler deploy
```

Authenticate first with `npx wrangler login`. The build env injects `VITE_BUILD_COMMIT` from your local `git rev-parse --short HEAD`.

### Local Worker runtime

To run the Worker (with redirects + /api/ask) end-to-end against the built site:

```sh
npm run cf:preview   # builds astro, then wrangler dev --local
```

Plain `npm run dev` is faster for content/style iteration but doesn't run the Worker layer.

### Node version on Cloudflare Builds

`.nvmrc` is **not** auto-respected by Workers Builds the way it was by Pages. To pin Node, add a build environment variable in the dashboard:

- Worker → **Settings** → **Build** → **Variables and Secrets** → add `NODE_VERSION` = `22`

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
