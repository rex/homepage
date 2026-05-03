# Spec — add-navigation

> Requirements in EARS notation (Easy Approach to Requirements Syntax).
> This file is the canonical source of truth. `plan.md` and `tasks.md`
> derive from it. When they drift, fix the plan, not the spec.

## Summary

Add a sticky navigation bar to piercemoore.com. The site is currently a single long-scroll page with no nav; users must scroll manually to find sections. The nav should link to all major sections, collapse on mobile, and highlight the active section on scroll.

## Goals

- Users can jump to any section without scrolling
- Nav is accessible (keyboard nav, focus ring, skip-link compatible)
- Nav works on mobile (hamburger collapse)
- Active section is visually highlighted as user scrolls

## Non-goals

- No client-side routing (site is static, anchor links only)
- No sub-menus or dropdowns
- No external links in nav (those belong in contact section)

## Acceptance criteria (EARS notation)

### Ubiquitous requirements

- The system shall display a navigation bar on all routes.
- The system shall render nav links for: Identity, Practice Areas, Career, Contact.

### Event-driven (`when`)

- When a user clicks a nav link, the system shall scroll to the corresponding section.
- When a user visits the page via keyboard, the system shall allow tab navigation through nav links.
- When the hamburger icon is activated on mobile, the system shall expand the nav menu.
- When a nav link is activated on mobile, the system shall close the menu after navigating.

### State-driven (`while`)

- While the user scrolls, the system shall highlight the nav link for the section currently in view.
- While the page is scrolled past the hero, the system shall keep the nav visible (sticky).
- While `prefers-reduced-motion` is set, the system shall skip scroll animations.

### Unwanted-behavior (`if`/`then`)

- If viewport width is less than 768px, then the system shall hide nav links and show a hamburger icon.
- If a nav link target section does not exist, then the system shall not throw a JS error.

## Success metrics

- All section anchors reachable by keyboard in ≤3 tab stops from nav
- Lighthouse accessibility score remains ≥ current score after nav lands
- `npm run build` passes with zero TypeScript errors

## Open questions

- Final set of section IDs (confirm before Slice 1.1 starts)
- Preferred mobile breakpoint (768px assumed; confirm with Pierce)

## References

- Ticket: (none — verbal directive 2026-05-03)
