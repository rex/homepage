#!/usr/bin/env node
/**
 * Screenshot harvest for portfolio project galleries.
 *
 *   npm run harvest                 # public targets only (works anywhere)
 *   npm run harvest -- --lan        # also hit homelab (thelab.host) targets — run this on the LAN/VPN
 *   npm run harvest -- --only=lattice,specimen
 *   npm run harvest -- --theme=light
 *
 * Reads scripts/screenshot-targets.json, writes JPEGs to public/projects/<id>/<name>.jpg
 * (JPEG + quality keeps them under the repo's added-large-file gate), and writes
 * scripts/gallery-suggestions.json — paste those `gallery:` blocks under a project's
 * `detail:` in the tier YAML to wire them into its case page.
 */
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const flags = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const only = flags.has('only') ? String(flags.get('only')).split(',').map((s) => s.trim()) : null;
const includeLan = flags.has('lan');
const themeOverride = flags.get('theme');

const manifest = JSON.parse(await readFile(join(ROOT, 'scripts/screenshot-targets.json'), 'utf8'));
const d = manifest.defaults;
const publicPrefix = manifest.output.replace(/^public\//, '');
const outRoot = join(ROOT, manifest.output);

const browser = await chromium.launch();
const results = [];
const suggestions = {};

for (const target of manifest.targets) {
  if (only && !only.includes(target.id)) continue;
  if (target.reachable === 'lan' && !includeLan && !only) {
    results.push(['·', `${target.id}`, 'skipped (homelab; pass --lan on the LAN)']);
    continue;
  }
  for (const shot of target.shots) {
    const label = `${target.id}/${shot.name}`;
    if (!shot.url) {
      results.push(['·', label, 'skipped (no url — fill the manifest)']);
      continue;
    }
    const rel = `${target.id}/${shot.name}.jpg`;
    const file = join(outRoot, rel);
    await mkdir(dirname(file), { recursive: true });
    const ctx = await browser.newContext({
      viewport: { width: shot.width ?? d.width, height: shot.height ?? d.height },
      deviceScaleFactor: shot.deviceScaleFactor ?? d.deviceScaleFactor,
      colorScheme: (themeOverride ?? shot.theme ?? d.theme) === 'light' ? 'light' : 'dark',
    });
    const page = await ctx.newPage();
    try {
      await page.goto(shot.url, { waitUntil: 'networkidle', timeout: shot.timeout ?? 20000 });
      if (shot.waitFor) await page.waitForSelector(shot.waitFor, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(shot.waitMs ?? d.waitMs);
      await page.screenshot({ path: file, type: 'jpeg', quality: shot.quality ?? d.quality, fullPage: !!shot.fullPage });
      results.push(['✓', label, 'OK']);
      (suggestions[target.id] ??= []).push({ src: `/${publicPrefix}/${rel}`, caption: shot.caption ?? target.id });
    } catch (err) {
      const msg = String(err && err.message ? err.message : err).split('\n')[0];
      results.push(['✗', label, `FAILED: ${msg}`]);
    } finally {
      await ctx.close();
    }
  }
}
await browser.close();

if (Object.keys(suggestions).length) {
  await writeFile(join(ROOT, 'scripts/gallery-suggestions.json'), JSON.stringify(suggestions, null, 2));
}

console.log('\nHarvest results:');
for (const [mark, label, status] of results) console.log(`  ${mark} ${label} — ${status}`);
const ok = results.filter((r) => r[0] === '✓').length;
console.log(`\n${ok} shot(s) captured. Wiring hints → scripts/gallery-suggestions.json`);
console.log('Add a captured gallery under a project’s `detail:` like:\n' +
  '    detail:\n      gallery:\n        - { src: "/projects/<id>/<name>.jpg", caption: "..." }');
