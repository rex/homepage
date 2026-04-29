# piercemoore.com

Personal site for Pierce Moore — Senior DevOps Engineer.

Hand-built. Long-scroll home, /cv, /writing, /ask. Typography-driven minimalism.

## Stack

- **Astro 5** (static output, island architecture)
- **Tailwind CSS 3** as a utility layer over a custom token system (`src/styles/globals.css`)
- **TypeScript**, strict
- **React** for `ThemeToggle` (the hero cursor-pull island is parked); everything else is static `.astro`
- **MDX** integration installed for postmortems (no content ships in v0.1.0)
- **@astrojs/sitemap** for `sitemap-index.xml`
- **AWS Cloudfront + S3 + CloudFront Functions + Route 53** for hosting — see [`infra/`](infra/) for the CDK app
- **Self-hosted fonts**: Fraunces (display + italic, variable), Supreme (body), Cascadia Code (mono)

No framework beyond Astro, no analytics SDK, no client-side router. Total client JS is **~47KB gzipped**, total CSS is **~5KB gzipped**.

## Local development

```sh
nvm use            # Node 22+
npm install
npm run dev        # http://localhost:4321
npm run build      # astro check + astro build → dist/
npm run preview    # serve dist/
```

`npm run build` runs `astro check` first; CI fails on type errors.

## Repo structure

- `src/pages/` — routes (one .astro per route, `[slug].astro` for dynamic)
- `src/components/` — Hero, PracticeAreas, CareerLog, FAQ, Contact, Footer, ThemeToggle, Sparkline, StatusDot, SkipToContent, Mantra
- `src/layouts/` — `BaseLayout.astro`, `PrintLayout.astro` (CV)
- `src/content/*.yaml` — typed content (hero, practice-areas, career-log, faq, contact, error-pages); loaded via `src/lib/content.ts` using Vite raw imports
- `src/styles/` — `globals.css` (tokens + base + utilities), `fonts.css` (`@font-face`), `boot.css` (boot-sequence keyframes)
- `src/lib/` — `build-info.ts`, `sparkline.ts`, `content.ts`
- `public/` — fonts, favicons, OG image, monogram, wordmark, robots.txt, site.webmanifest
- `infra/` — CDK app (TypeScript) provisioning S3 + CloudFront + Route 53. Edge logic in [`infra/functions/edge.js`](infra/functions/edge.js)
- `.github/workflows/deploy.yml` — content-deploy pipeline (build Astro, sync to S3, invalidate CloudFront)

## Fonts

Self-hosted in `public/fonts/`. If a file is absent at build time, the stack falls back to system fonts and the build continues; no error.

| Font | Files | Source |
|------|-------|--------|
| Fraunces (variable, roman + italic) | `Fraunces.woff2`, `Fraunces-Italic.woff2` | https://fonts.google.com/specimen/Fraunces |
| Supreme | `Supreme-Regular.woff2`, `Supreme-Medium.woff2` | https://www.fontshare.com/fonts/supreme |
| Cascadia Code | `CascadiaCode.woff2`, `CascadiaCodeItalic.woff2` | https://github.com/microsoft/cascadia-code/releases |

The italic variable file is required for the swashy alternate ampersand (Fraunces' italic glyph cut differs from the upright; synthetic italic loses the alternates).

## Environment variables

Build-time only:

- `VITE_BUILD_COMMIT` — short git commit hash, injected by `astro.config.mjs` from `git rev-parse --short HEAD`
- `VITE_BUILD_DATE` — ISO 8601 build timestamp

Both surface in the page footer, `<meta name="build-commit">`, `humans.txt` last-updated line, and the security.txt `Expires:` field (build-date + 1 year).

No runtime env vars.

## Deploying to AWS

Hosting is **CloudFront + S3 + CloudFront Functions + Route 53**, provisioned by a CDK app in [`infra/`](infra/). DNS is on Route 53 already, which is what made this path the right one (Cloudflare Pages requires apex-CNAME flattening, which means moving nameservers or paying Business+).

### One-time bootstrap (admin AWS creds in your shell)

```sh
cd infra
npm install
npx cdk bootstrap aws://<ACCOUNT_ID>/us-east-1
npm run deploy
```

First deploy takes 20–40 minutes (ACM DNS validation + CloudFront propagation). It's hands-off after the bootstrap step.

CDK prints three outputs you'll need to add as GitHub Actions secrets:

- `AWS_SITE_BUCKET` ← `PiercemooreSiteStack.SiteBucketName`
- `AWS_DISTRIBUTION_ID` ← `PiercemooreSiteStack.DistributionId`
- `AWS_DEPLOY_ROLE_ARN` ← `PiercemooreCiStack.DeployRoleArn`

In `github.com/rex/homepage` → **Settings → Secrets and variables → Actions → New repository secret**.

### Day-to-day

- **Content / code change** → push to `main` → GitHub Actions runs the build, syncs to S3 with proper cache headers, invalidates CloudFront. No CDK or admin creds involved. The deploy role can only touch the site bucket and one specific distribution.
- **Infra change** → edit a stack in [`infra/lib/`](infra/lib/), `npm run diff` to preview, `npm run deploy` to apply (admin creds locally).

Full details: [`infra/README.md`](infra/README.md).

## Content updates

Content lives entirely in `src/content/*.yaml`. Edit, commit, push — GitHub Actions deploys.

The CV route is pure-derived from the same content; you don't maintain a separate résumé doc.

A printable PDF version belongs at `public/resume.pdf` — referenced by `/cv` and the contact section. Drop the file in and re-deploy.

## Accessibility

Every route passes axe-core (WCAG 2 AA, both light and dark themes) at zero violations. The hero name is a wrapped-letter `<h1>` with `aria-label="Pierce Moore"` so screen readers announce the name, not 12 letters. Status dots and sparklines have descriptive labels. Boot animations respect `prefers-reduced-motion`.

## License

- **Code**: MIT
- **Content** (text, images, sparkline data): CC BY-NC 4.0

---

built by pierce moore, with claude opus 4.7 as pair.
