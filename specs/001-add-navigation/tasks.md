# Tasks — add-navigation

## Phase 1 — Nav component + anchor links

### S1.1 — Extend Header.astro with nav links

- **Files**: `src/components/Header.astro` (edit), `src/layouts/BaseLayout.astro` (verify included)
- **Files (do NOT edit)**: `src/content/*.yaml`, `infra/`
- **Acceptance**:
  - [ ] When a user visits any route, the system shall display a sticky nav with 4 links
  - [ ] The nav links shall be: Identity → `#identity`, Practice Areas → `#practice-areas`, Career → `#career`, Contact → `#contact`
  - [ ] The nav shall not obscure content when scrolled (section `scroll-margin-top` or equivalent)
  - [ ] `npm run build` passes
- [ ] Complete

### S1.2 — Add section IDs to anchor targets

- **Files**: `src/components/Hero.astro`, `src/components/PracticeAreas.astro`, `src/components/CareerLog.astro`, `src/components/Contact.astro`
- **Files (do NOT edit)**: `src/content/*.yaml`
- **Acceptance**:
  - [ ] `Hero.astro` root has `id="identity"`
  - [ ] `PracticeAreas.astro` root has `id="practice-areas"`
  - [ ] `CareerLog.astro` root has `id="career"`
  - [ ] `Contact.astro` root has `id="contact"`
  - [ ] Clicking each nav link scrolls to the correct section
  - [ ] `npm run build` passes
- [ ] Complete

## Phase 2 — Mobile / responsive

### S2.1 — Mobile hamburger collapse

- **Files**: `src/components/MobileMenu.tsx` (new), `src/components/Header.astro` (edit)
- **Acceptance**:
  - [ ] If viewport width < 768px, then the system shall hide nav links and show a hamburger icon
  - [ ] When hamburger is activated, the system shall expand the nav drawer
  - [ ] When a nav link is tapped on mobile, the menu shall close
  - [ ] `prefers-reduced-motion` is respected (no transition animation)
  - [ ] `npm run build` passes
- [ ] Complete

## Phase 3 — Active-section highlighting

### S3.1 — Scroll-spy

- **Files**: `src/components/Header.astro` (add inline script or import ScrollSpy island)
- **Acceptance**:
  - [ ] While user scrolls, the system shall add `.active` (or `data-active`) to the nav link for the section in view
  - [ ] While `prefers-reduced-motion` is set, the system shall skip scroll animations
  - [ ] If ScrollSpy errors, the system shall not surface a console exception to users
  - [ ] `npm run build` passes
- [ ] Complete

## Done when

- [ ] All Phase 1–3 tasks checked
- [ ] `npm run build` green
- [ ] No open blockers in `TASK_STATE.md` §3
