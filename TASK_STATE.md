# TASK_STATE — add-navigation

> Source of truth for in-flight work. Humans and agents both write here.
> This file is **committed** to the repo. It survives sessions, machines,
> and context compactions.
>
> Spec: `specs/001-add-navigation/spec.md` · Plan: `specs/001-add-navigation/plan.md`
> Branch: `chore/add-navigation` · Owner (human): @pierce · Last update: 2026-06-06 (archived)

## 0. TL;DR for a fresh agent session

> ⭐ **TOP PRIORITY — Portfolio page** (completed 2026-07-11). The supplied
> reference is implemented at `/portfolio` as a dark, responsive, data-driven
> project index. Placeholder catalogue content lives in
> `src/content/portfolio.yaml`; replace it with real cases as they are prepared.
> Navigation remains the next parked feature below.

This file currently still tracks **add-navigation** (parked, not abandoned). No nav
exists today — the site is a single long-scroll page. All nav phases pending.
Pierce has granted broad workspace authority (2026-05-11); no approval gate before starting.

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
| 1 | Nav component + anchor links | ⏸ pending | Nav renders on all routes; all section anchors work |
| 2 | Mobile / responsive | ⏸ pending | Nav collapses to hamburger on small screens |
| 3 | Active-section highlighting | ⏸ pending | Scroll spy highlights current section in nav |

## 2. Slices

### Slice 1.1 — Add Header nav component with anchor links  ← NEXT

- Status: ⏸ pending
- Owner: agent
- Files (planned edits): `src/components/Header.astro`, `src/layouts/BaseLayout.astro`
- Files (do NOT edit): `src/content/*.yaml`, `infra/`
- Acceptance:
  - [ ] When a user visits any page, the system shall display a sticky top nav bar
  - [ ] The nav shall link to each major section (`#identity`, `#practice-areas`, `#career`, `#contact`)
  - [ ] The nav shall not obscure content (appropriate top-padding on sections)
  - [ ] `npm run build` passes with zero errors

### Slice 1.2 — Add section IDs to all anchor targets

- Status: ⏸ pending
- Files (planned edits): `src/components/Hero.astro`, `src/components/PracticeAreas.astro`, `src/components/CareerLog.astro`, `src/components/Contact.astro`
- Acceptance:
  - [ ] Each section has a stable `id` attribute matching the nav links
  - [ ] Keyboard tab to nav link + Enter scrolls to correct section

### Slice 2.1 — Mobile hamburger collapse

- Status: ⏸ pending
- Files (planned edits): `src/components/Header.astro` or new `src/components/MobileMenu.tsx`
- Acceptance:
  - [ ] While viewport width < 768px, the system shall show a hamburger icon instead of nav links
  - [ ] When hamburger is tapped, the system shall expand the nav menu
  - [ ] When a nav link is tapped on mobile, the menu shall close

### Slice 3.1 — Scroll-spy active section highlighting

- Status: ⏸ pending
- Files (planned edits): `src/components/Header.astro` or new React island
- Acceptance:
  - [ ] While the user scrolls, the system shall highlight the nav link for the section in view
  - [ ] Where `prefers-reduced-motion` is set, the system shall skip scroll animations

## 3. Blockers / open questions

_(none)_

## 4. Recent decisions (append-only, newest first)

- 2026-05-11 — Pierce lifted the workspace fences: agent can manage the homepage end-to-end
  as long as changes are in version control and revertible; explicit approval still required
  for destructive / DNS / money / security-sensitive operations.
- 2026-05-11 — `/resume.pdf` retired (commit `ca70edd`); `/cv` is canonical résumé route,
  `/resume` is a redirect alias.
- 2026-05-11 — Email obfuscation landed (commit `9bd39cd`): MailLink component +
  `hello@piercemoore.com` alias replaces primary email everywhere.

## 5. Next actions (ordered)

1. Open `chore/add-navigation` branch and begin Slice 1.1.

## 6. Handoff note (fill when ending a session)

2026-07-11 — Implemented `/portfolio` as a dark, data-driven project index from the supplied reference. Placeholder catalogue content is in `src/content/portfolio.yaml`; `npm run build` passes.
