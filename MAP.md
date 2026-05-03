# MAP

## Domains

| Domain | Purpose | Entry point | Owner |
|---|---|---|---|
| Pages | Route definitions (one .astro per URL) | `src/pages/index.astro` | Pierce |
| Components | Reusable UI sections | `src/components/` | Pierce |
| Content | Typed YAML copy for all sections | `src/content/*.yaml` | Pierce |
| Styles | Token system + Tailwind layer + boot animations | `src/styles/globals.css` | Pierce |
| Lib | Build metadata, sparkline math, content loader | `src/lib/` | Pierce |
| Infra | AWS CDK app — S3 + CloudFront + Route 53 | `infra/bin/homepage.ts` | Pierce |

## Extension points

- **New page**: add `.astro` to `src/pages/`; it auto-routes
- **New content type**: add `src/content/<name>.yaml` + schema + loader in `src/lib/content.ts`
- **New component**: add to `src/components/`; import where needed
- **New design token**: add CSS custom property to `src/styles/globals.css`

## Where bodies are buried

- Footer version is `PACKAGE_VERSION` imported from `package.json` via `src/lib/build-info.ts` — not hardcoded
- Boot animation is CSS-only: `data-boot` attribute on an element + `--boot-delay` CSS var sets timing
- `VITE_BUILD_COMMIT` and `VITE_BUILD_DATE` are injected at build time by `astro.config.mjs` via `git rev-parse`
- `src/content/*.yaml` is loaded via raw Vite import (`?raw`) then parsed — not using Astro content collections

## Do not edit without an ADR

- `infra/` — any change here affects live DNS / CloudFront / S3; test with `cdk diff` first
- `src/styles/globals.css` — token renames cascade to every component

## Hot paths

- `src/pages/index.astro` — assembles all sections; touches most components
- `src/styles/globals.css` — every component depends on these tokens

## Cold paths

- `infra/` — only when hosting config changes
- `public/fonts/` — only when typeface files change
- `.github/workflows/deploy.yml` — only when deploy pipeline changes

## Cross-cutting concerns

- Build metadata: `src/lib/build-info.ts` (version, commit hash, build date)
- Content loading: `src/lib/content.ts` (loads + validates all YAML content)
- Theming: `data-theme` attr on `<html>` toggled by `ThemeToggle.tsx`
- Accessibility: `SkipToContent.astro`, `aria-label` on wrapped-letter h1
- Error pages: `src/content/error-pages.yaml` + CloudFront Function in `infra/functions/edge.js`

## External dependencies

| System | What we call | When | Failure mode |
|---|---|---|---|
| AWS CloudFront | CDN + edge routing | Every request | Static fallback via S3 origin |
| AWS S3 | Static asset store | Deploy only | Blocked deploy; site keeps serving cached |
| AWS Route 53 | DNS | Always | Site unreachable |
| GitHub Actions | Build + deploy pipeline | Push to `main` | Manual `aws s3 sync` + `invalidate` |
