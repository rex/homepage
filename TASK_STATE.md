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
2. Add dedicated case-study routes for the highest-ranked projects when their narratives are ready.

## 6. Handoff note (fill when ending a session)

2026-07-12 — Implemented the site-wide Corner Index navigation and rebuilt `/portfolio`
around the production catalogue: 34 curated projects plus 65 public archive entries.
Navigation, filtering, selection, deep links, responsive behavior, and both color themes
were browser-checked. `/projects` redirects to the canonical `/portfolio` route.
