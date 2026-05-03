# Design — add-navigation

## Architecture overview

```
BaseLayout.astro
  └── Header.astro  (sticky nav — new or extended)
        ├── nav links (desktop)
        └── MobileMenu.tsx (React island — hamburger + drawer)

Section components (Hero, PracticeAreas, CareerLog, Contact)
  └── id="<section-id>" on their root element (new)

ScrollSpy island (optional React — Slice 3.1)
  └── IntersectionObserver → adds .active class to matching nav link
```

## Components

### Header.astro (extend existing)

- **Responsibility**: Renders the sticky top nav bar
- **Inputs**: current pathname (from `Astro.url`)
- **Outputs**: `<header>` with `<nav>` and nav links
- **Dependencies**: None (static)
- **Satisfies**: spec.md Ubiquitous + Event-driven

### MobileMenu.tsx (new React island, Slice 2.1)

- **Responsibility**: Hamburger toggle + drawer for mobile
- **Inputs**: `links: { label: string; href: string }[]`
- **Outputs**: Toggled `<nav>` drawer
- **Dependencies**: React, Tailwind
- **Satisfies**: spec.md If/then (viewport < 768px)

### ScrollSpy (inline script or React island, Slice 3.1)

- **Responsibility**: IntersectionObserver watching section roots; sets `data-active` on nav links
- **Inputs**: section IDs from DOM
- **Outputs**: CSS class toggle on nav `<a>` elements
- **Satisfies**: spec.md While (user scrolls)

## Section IDs (to freeze in Phase 1)

| Section | Component | Proposed ID |
|---|---|---|
| Identity / Hero | `Hero.astro` | `identity` |
| Practice Areas | `PracticeAreas.astro` | `practice-areas` |
| Career | `CareerLog.astro` | `career` |
| Contact | `Contact.astro` | `contact` |

## Contracts (freeze in Phase 1)

Nav link shape (used in Header.astro and MobileMenu.tsx):
```ts
type NavLink = { label: string; href: string };
const NAV_LINKS: NavLink[] = [
  { label: "Identity",       href: "#identity" },
  { label: "Practice Areas", href: "#practice-areas" },
  { label: "Career",         href: "#career" },
  { label: "Contact",        href: "#contact" },
];
```

## Error handling

- Missing section IDs: nav links are plain `<a href="#">` — no JS error possible
- ScrollSpy: wrapped in `try/catch`; failure is silent (nav still works, just no highlight)

## Security considerations

- No user input, no auth, no secrets — not applicable

## Performance considerations

- Nav is static Astro (zero JS for Phases 1–2)
- ScrollSpy (Phase 3) uses IntersectionObserver — no scroll-event listeners, no jank
- MobileMenu (Phase 2) is a small React island loaded client:idle

## Alternatives considered

### Pure CSS nav (no React)
- **Why considered**: Zero JS, simpler
- **Why rejected**: Hamburger toggle requires JS or CSS-only hack (checkbox trick) which is harder to maintain
- **Trade-off**: Minor JS bundle increase (~2KB) for MobileMenu island

### Astro content collection for nav links
- **Why considered**: Consistent with content-in-yaml pattern
- **Why rejected**: Nav links are structural, not content — they map 1:1 to component IDs which are code concerns
