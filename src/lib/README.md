# src/lib

Shared utility modules. Small surface area — three files.

## Status

🟢 Production · Owner: Pierce Moore

## Files

- `build-info.ts` — exports `PACKAGE_VERSION`, `BUILD_COMMIT`, `BUILD_DATE`, and date-formatting helpers; `PACKAGE_VERSION` is imported directly from `package.json`
- `content.ts` — loads and validates all `src/content/*.yaml` files; exposes typed accessors
- `sparkline.ts` — pure math for rendering the 24-month activity sparklines on practice tiles

## Invariants

- `build-info.ts` must not import any Astro-specific APIs (used in both Astro and PrintLayout contexts)
- `content.ts` is the only file allowed to import raw YAML — components call its accessors

## Common tasks

- **Update version source**: version comes from `package.json` via `import { version } from '../../package.json'` in `build-info.ts` — bump `package.json` only
- **Add a content type**: add loader + types to `content.ts`, add corresponding YAML to `src/content/`
