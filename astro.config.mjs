import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { execSync } from 'node:child_process';

let commit = 'dev';
try {
  commit = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  /* no git */
}
const buildDate = new Date().toISOString();

export default defineConfig({
  site: 'https://piercemoore.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    inlineStylesheets: 'auto',
  },
  // /resume is a memorable alias for the canonical HTML résumé at /cv.
  // Astro emits a meta-refresh + canonical-link stub at /resume/ that
  // forwards crawlers and humans to /cv.
  redirects: {
    '/resume': '/cv',
    '/projects': '/portfolio',
  },
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    mdx(),
    sitemap({
      // Pages that exist in the build but should never be discovered
      // by search engines or surfaced in the sitemap.
      filter: (page) => !/(\/animation-lab\/?$|\/admin\/|\/resume\/?$)/.test(page),
    }),
  ],
  vite: {
    define: {
      'import.meta.env.VITE_BUILD_COMMIT': JSON.stringify(commit),
      'import.meta.env.VITE_BUILD_DATE': JSON.stringify(buildDate),
    },
    build: {
      cssCodeSplit: false,
    },
  },
});
