# src/content

Typed YAML content for every section of the site. This is the single source of truth for all page copy.

## Status

🟢 Production · Owner: Pierce Moore

## Why this exists

Keeps all copy out of `.astro` components so non-code edits don't require touching component markup.

## Public API

Loaded via `src/lib/content.ts` using raw Vite imports. Consumers call typed accessor functions — do not import YAML directly in components.

## Files

- `hero.yaml` — name, title, subtitle, availability badge
- `practice-areas.yaml` — nine practice tiles with status, years, tools, sparkline, recent work
- `career-log.yaml` — chronological work history
- `faq.yaml` — Q&A section
- `contact.yaml` — contact links and copy
- `error-pages.yaml` — 404 / 5xx content served by CloudFront edge function
- `postmortems/*.mdx` — incident write-ups; the one Astro content collection (schema in
  `src/content.config.ts`). `draft: true` renders under `astro dev` only. Scrub people, places,
  hosts, IPs and exact dates before anything lands here.

## Invariants

- All YAML must parse without error (`npm run build` enforces via `astro check`)
- Never hardcode copy in `.astro` files — it goes here

## Gotchas

- The YAML files are loaded via `?raw` Vite import, not Astro content collections — schema validation is manual in `src/lib/content.ts`. Only `postmortems/` is a collection.
