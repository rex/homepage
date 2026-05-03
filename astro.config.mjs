import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { execSync } from 'node:child_process';

import cloudflare from "@astrojs/cloudflare";

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

  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    mdx(),
    sitemap(),
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

  adapter: cloudflare()
});