# Cyberpunk DevOps Homepage Overview

This document outlines the major building blocks of the single-page application. Follow these notes when extending the experience
or integrating production content.

## Application Flow

1. `src/main.js` bootstraps the Vue application, imports global styles, and wires the display/body font CSS variables. Update the
   variable assignments if you swap fonts in Tailwind.
2. `src/App.vue` renders the full page layout. The component is organized into sections that mirror the navigation anchors:
   - **Hero:** Animated glitch heading, background scanline SVG, and feature callouts.
   - **About:** Narrative copy and supporting bullet list.
   - **Skills:** Grid of neon cards populated from the `skills` array.
   - **Projects:** Three-card layout with hover effects and case-study links.
   - **Contact:** Styled form and social handles ready for integration.
3. `src/components/SectionHeading.vue` centralizes the glitch-styled section headings to maintain consistent animation.

## Styling System

- `src/main.css` combines Tailwind directives with custom utility classes (`glitch`, `btn-neon`, `card-neon`, etc.). Tailwind's JIT
  compiler consumes this file; keep custom classes in sync with `tailwind.config.cjs` if you adjust tokens.
- `tailwind.config.cjs` defines the neon color palette, animations, and font variables. Update documentation if you rename or add
  theme keys.

## Assets

- SVG placeholders live under `src/assets/`. Replace them with branded art files of similar dimensions to preserve layout.
- The hero portrait uses `profile-glitch.svg`; swap this when you have photography or illustration ready.
- Skill and project icons follow a consistent 64px/600px canvas for even spacing.

## Accessibility & UX Notes

- All interactive controls (links, buttons, form fields) include focusable elements and descriptive text.
- Smooth scrolling is enabled via the `scroll-smooth` class on `<html>`.
- Hover states rely on the `.btn-neon` and `.card-neon` helper classes; maintain contrast ratios when updating colors.

## Deployment Checklist

1. Run `npm run build` and inspect the `dist/` output locally.
2. Configure your hosting provider (Netlify, Vercel, etc.) to run `npm install` followed by `npm run build`.
3. Enable asset caching and compression on the hosting platform for optimal load times.
