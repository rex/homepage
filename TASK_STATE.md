# TASK_STATE — add-navigation

> Source of truth for in-flight work. Humans and agents both write here.
> This file is **committed** to the repo. It survives sessions, machines,
> and context compactions.
>
> Spec: `specs/001-add-navigation/spec.md` · Plan: `specs/001-add-navigation/plan.md`
> Branch: `codex/implement-projects-page` · Owner (human): @pierce · Last update: 2026-07-12

## 0. TL;DR for a fresh agent session

Navigation and the production portfolio catalogue are complete. The fixed Corner Index
links Home, Writing, Projects, and CV on every route, with a compact mobile disclosure
and keyboard shortcuts. `/portfolio` now presents 34 curated case studies plus 65 public
archive projects using the site's existing tokens, typography, and light/dark themes.

## Standing user directives

- Agent has broad authority over the homepage workspace (2026-05-11). Changes must be in version
  control and revertible. Ask Pierce before: destructive operations he can't undo from Git,
  spending money (new AWS resources beyond trivial, new SaaS subscriptions), DNS/cert changes,
  removing user-facing features, breaking URL changes, security-sensitive code (auth, secrets,
  edge-function changes that block traffic), or anything where "obviously should require approval"
  is even a question — when in doubt, ask.
- Prefer Serena's symbolic tools (find_symbol, replace_symbol_body, search_for_pattern,
  replace_content) for code work — they're better than built-in Read/Edit for this codebase.
  Built-ins are fine when they're the right tool (file deletion, simple markdown, shell ops).

## 1. Phases

| # | Phase | Status | Exit criteria |
|---|---|---|---|
| 1 | Site-wide Corner Index navigation | ✅ done | Nav renders on all routes and links canonical destinations |
| 2 | Mobile / responsive | ✅ done | Nav uses an accessible compact disclosure on small screens |
| 3 | Active-route highlighting | ✅ done | Current route is identified visually and with `aria-current` |
| 4 | Production portfolio catalogue | ✅ done | Real curated and archive projects replace all placeholders |

## 2. Slices

### Slice 1.1 — Site-wide Corner Index navigation

- Status: ✅ done
- Files: `src/components/Header.astro`, `src/layouts/BaseLayout.astro`,
  `src/content/navigation.yaml`, `src/lib/navigation-content.ts`
- Acceptance:
  - [x] Navigation renders on every route
  - [x] All links resolve to canonical public pages
  - [x] Current route is exposed with `aria-current`
  - [x] `g` + destination-key shortcuts work outside editable controls

### Slice 2.1 — Responsive navigation

- Status: ✅ done
- Acceptance:
  - [x] Desktop navigation remains visible without interaction
  - [x] Mobile navigation uses a keyboard-accessible native disclosure
  - [x] Disclosure closes after route selection

### Slice 3.1 — Real portfolio catalogue

- Status: ✅ done
- Files: `src/pages/portfolio.astro`, `src/content/portfolio*.yaml`,
  `src/lib/portfolio-content.ts`, `src/styles/portfolio.css`
- Acceptance:
  - [x] 34 ranked projects use curated production copy and public links
  - [x] 65 older public projects remain available in a collapsed archive
  - [x] Search, type filters, project selection, and deep-link hashes work
  - [x] Page follows the shared token system in light and dark modes

## 3. Blockers / open questions

_(none)_

## 4. Recent decisions (append-only, newest first)

- 2026-07-12 — Adopted the handoff's Corner Index as a site-wide route navigator rather
  than an in-page scroll spy; this fits the site's growing multi-page structure.
- 2026-07-12 — Published the 34 curated projects and the 65-item public archive; excluded
  uncurated and sensitivity-flagged long-tail inventory from the public site.
- 2026-05-11 — Pierce lifted the workspace fences: agent can manage the homepage end-to-end
  as long as changes are in version control and revertible; explicit approval still required
  for destructive / DNS / money / security-sensitive operations.
- 2026-05-11 — `/resume.pdf` retired (commit `ca70edd`); `/cv` is canonical résumé route,
  `/resume` is a redirect alias.
- 2026-05-11 — Email obfuscation landed (commit `9bd39cd`): MailLink component +
  `hello@piercemoore.com` alias replaces primary email everywhere.

## 5. Next actions (ordered)

1. Replace generated project artifact previews with project-specific media as assets become available.
2. Write `detail:` blocks (longform/shortform) for more projects — exemplars exist on
   `outageforge` (longform) and `firefox-archiver` (shortform).
3. Pierce: recategorize/promote the 22 reconciled tier-3 additions; decide on the
   commented-out repos at the bottom of `portfolio-tier-3.yaml` (openclaw-*, invoice-war,
   elitebabes sibling, .zsh).

## 6. Handoff note (fill when ending a session)

2026-07-16 (v1.5.1, branch `codex/implement-projects-page` @ 8a403a1 — clean, pushed) —
**⛔ DO NOT MERGE to `main` until Pierce explicitly approves.** Portfolio + nav were
built by a prior agent (`c45c8cc`); this session reviewed them adversarially, then
iterated: v1.2.0 generative plate art (`src/lib/plate-art.ts`), v1.3.0–v1.5.1 the
screenshot-harvest pipeline.

- **Harvest pipeline** — `npm run harvest` (`scripts/harvest-screenshots.mjs` +
  `scripts/screenshot-targets.json`). Full capability/gotcha notes in memory
  `project_screenshot_harvest.md`. Renders live apps AND local Claude design-kit
  mockups (via a throwaway HTTP server — Babel/JSX can't use `file://`), does
  1Password login (`op` CLI → cached storageState in gitignored `.harvest-auth/`),
  click-through, and de-identification (`replace`/`mutate`). `public/projects/` is
  **gitignored** — publish curated shots with `git add -f`.
- **Galleries wired so far:** wideframe, piercemoore-com, specimen, outageforge,
  doombox (live captures) + cheddar (3 design-concept screens) + anchor (2). All in
  their `detail.gallery` in the tier YAML.
- **⚠️ The agent CANNOT reach the LAN from its session** — macOS 26.5.1 Local Network
  privacy blocks Homebrew node/chromium (`EHOSTUNREACH`) while system `curl` works.
  **Pierce runs `npm run harvest -- --lan` from HIS terminal** (it has the permission),
  pastes output, agent wires the good ones. Design kits + public URLs work agent-side.
- **⚠️ PII:** cheddar `ui_kits/mobile/tiff-data.js` has a real name + real numbers —
  EXCLUDED. Desktop kit is a fictional persona (safe). Live Cheddar/Pennywise show
  real finances → only publish de-identified (Pennywise `replace` = absurd numbers).

**NEXT (waiting on Pierce):**
1. Pierce runs `npm run harvest -- --lan --only=pennywise,reaper,lattice` from his
   terminal → pastes output → agent wires good captures (exercises 1Password login,
   the Reaper `networkidle`→`domcontentloaded` fix, and Pennywise absurd-number de-id).
2. Palantir — architecture diagram, NOT a screenshot (separate effort; Arda MCP can
   derive the homelab arch).
3. Version note: site is legitimately **v1.x** — Pierce bumped 0.1.0→1.0.0 himself
   (`b3e335f`, May 3). Agent is forbidden from major bumps; all this session's were
   minor/patch. Stale `v0.1.0` doc refs already reconciled (v1.3.0).

Curation artifacts (outside the public repo, at `~/Code/portfolio-curation/`):
INVENTORY.md, PORTFOLIO.md, THE-REST.md, CURATION-NOTES.md, capsules-all.json,
transcripts/. Tiering (8 T1 / 14 T2 / 12 T3 / 65 archive) + decisions in memory
`project_portfolio_curation.md`.

2026-07-15 — Two more portfolio passes on branch `codex/implement-projects-page`:
- **v1.2.0 — generative plate art** (`src/lib/plate-art.ts`): deterministic
  (FNV-1a → mulberry32, no `Math.random`), token-classed inline SVG that flips
  with the theme automatically. A shape grammar keyed off each project's `art:`
  value replaces the placeholder signal bars; minimal cards get a sigil; exactly
  one amber accent per plate. Verified in both themes.
- **v1.3.0 — screenshot harvest** (`npm run harvest`): `scripts/harvest-screenshots.mjs`
  + `scripts/screenshot-targets.json` (Playwright) capture live-app JPEGs into
  `public/projects/<id>/` and write wiring hints. Public targets
  (wideframe.studio, piercemoore.com) captured + wired into their case-page
  `detail.gallery`. **Homelab (`thelab.host`) targets are best-guess URLs marked
  `reachable:lan` — VERIFY them and run `npm run harvest -- --lan` on the LAN/VPN**
  to fill the rest, then paste the `gallery:` blocks from `scripts/gallery-suggestions.json`.
- Also reconciled the stale `v0.1.0` refs in `docs/design-system.md` (site has
  been v1.x since Pierce's May-3 `b3e335f` "Version 1.0.0 :D" bump on main).

2026-07-13 (v1.1.0, branch `codex/implement-projects-page`) — Post-review revision pass:
portfolio CSS fully tokenized (light mode fixed — artifacts were hardcoded dark), Fraunces
variable axes + ss02 applied, `.page-gutter` adopted, `shipped` status color split from
`archived`, archive sorted newest→oldest, search-attr collision fixed
(`data-project-haystack`). All 14 tier-2 hooks + all tier-3 hooks/metrics/stacks
backfilled from the deep-dive capsules; wrong-owner repo links fixed (piercemoore→rex).
Full-inventory reconciliation added 22 new tier-3 entries (56 curated + 65 archive = 121
accounted; exclusion ledger in tier-3 YAML comments). New: minimal-card artifact variant
(all tier-3), `/portfolio/[slug]` case pages for every project (longform + shortform
forms), open-case links from the index. Build green; dark/light/search/case pages
browser-verified.

2026-07-12 — Implemented the site-wide Corner Index navigation and rebuilt `/portfolio`
around the production catalogue: 34 curated projects plus 65 public archive entries.
Navigation, filtering, selection, deep links, responsive behavior, and both color themes
were browser-checked. `/projects` redirects to the canonical `/portfolio` route.
