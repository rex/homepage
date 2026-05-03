# Plan — add-navigation

## Phases

### Phase 1 — Nav component + anchor links

**Exit criteria**: Nav renders on all routes; all section anchors reachable by keyboard.

Slices:
- [ ] S1.1 — Extend `Header.astro` with nav links (desktop)
- [ ] S1.2 — Add stable `id` attributes to each section's root element

### Phase 2 — Mobile / responsive

**Exit criteria**: Nav collapses to hamburger at < 768px; menu opens and closes correctly.

Slices:
- [ ] S2.1 — Add `MobileMenu.tsx` React island; wire into `Header.astro`

### Phase 3 — Active-section highlighting

**Exit criteria**: Correct nav link is highlighted as user scrolls; reduced-motion respected.

Slices:
- [ ] S3.1 — Add ScrollSpy (IntersectionObserver) as inline script or React island

## Slice discipline

- Each slice ≤150 LOC diff
- Each slice independently revertable
- `npm run build` must pass after each slice

## Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Header.astro already has placeholder structure that conflicts | low | low | Read file with Serena before editing |
| ScrollSpy fires during boot animation causing flicker | low | med | Initialize observer after `DOMContentLoaded` |

## Estimated effort

- Phase 1: 2 slices, ~1 hour
- Phase 2: 1 slice, ~1 hour
- Phase 3: 1 slice, ~30 min
- **Total**: ~2.5 hours

## Frozen decisions (after Phase 1 slice 1.2 merges)

- Section IDs: `identity`, `practice-areas`, `career`, `contact`
- `NAV_LINKS` array shape: `{ label: string; href: string }[]`
