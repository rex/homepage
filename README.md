# Cyberpunk DevOps Homepage

A responsive, single-page personal/professional homepage for a Senior DevOps Engineer. The interface embraces a dark cyberpunk
glitch aesthetic with glowing neon accents, animated hero typography, and Tailwind-configurable design tokens.

## Features

- Hero banner with animated glitch typography and CTA buttons
- Responsive navigation with smooth scrolling and mobile menu
- About, Skills, Projects, and Contact sections with neon cards and hover states
- Tailwind-based design system with configurable cyberpunk color palette and font tokens
- Contact form with styled inputs and social links ready for integration
- Placeholder assets (logo, skills, projects) sized for easy replacement

## Tech Stack

- [Vite](https://vitejs.dev/) for blazing-fast development and bundling
- [Vue 3](https://vuejs.org/) with the Composition API
- [Tailwind CSS](https://tailwindcss.com/) including custom theme extensions and form styling

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` (default Vite port) to preview the site.

## Build & Preview

```bash
npm run build
npm run preview
```

The production build outputs to the `dist/` directory.

## Project Structure

```
├── AGENTS.md                # Repository-wide contribution guidelines
├── docs/
├── index.html               # Vite entry document with font placeholders
├── package.json             # Scripts and dependencies
├── postcss.config.cjs       # Tailwind + Autoprefixer pipeline
├── src/
│   ├── App.vue              # Single-page layout with all sections
│   ├── components/
│   │   └── SectionHeading.vue
│   ├── assets/              # Placeholder imagery for hero, skills, projects
│   └── main.js              # Vue bootstrap with font CSS variables
├── tailwind.config.cjs      # Theme tokens (colors, fonts, animations)
└── vite.config.js           # Vite configuration with Vue plugin
```

## Customization Notes

- **Fonts:** Replace the commented Google Font `<link>` tags in `index.html` and update the CSS variables in `src/main.js` for your
  chosen typefaces.
- **Colors:** Adjust the cyberpunk palette in `tailwind.config.cjs`. Update documentation if you add or rename tokens.
- **Content:** Swap placeholder text, project links, and imagery in `src/App.vue` and `src/assets/`.
- **Logo:** Replace the `.logo-placeholder` component in `App.vue` with your actual brand asset.

## Deployment

Deploy the generated `dist/` folder to a static hosting provider such as Vercel or Netlify. Both services detect Vite projects and can
run `npm run build` automatically.

## Maintenance Checklist

- Keep documentation synchronized with code changes (see `AGENTS.md`).
- Optimize new imagery for fast load times; prefer modern formats (WebP/SVG).
- Ensure interactive elements remain accessible (labels, alt attributes, focus states).

## License

This project is provided as-is for personal customization.
