#!/usr/bin/env node
/**
 * Screenshot harvest for portfolio project galleries.
 *
 *   npm run harvest                      # public targets only (works anywhere)
 *   npm run harvest -- --lan             # also hit homelab targets (run on the LAN/VPN)
 *   npm run harvest -- --only=reaper,cheddar
 *   npm run harvest -- --relogin         # ignore cached sessions, log in fresh
 *
 * Sources per target:
 *   url/path  — a live app (public or LAN)
 *   file      — a local design mockup (file://), e.g. a Claude design-system ui_kit
 *
 * Auth: `auth.op` points at a 1Password item in the `agentic` vault. Credentials are
 * read at RUNTIME via the `op` CLI, used once to log in, and the session is cached as a
 * Playwright storageState under .harvest-auth/ (gitignored). Secrets are never
 * hardcoded, never printed, never committed.
 *
 * De-identifying: a shot's `mutate` list rewrites DOM text before capture, so real
 * figures/names can be replaced with obvious demo data.
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jsx': 'text/babel',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.woff': 'font/woff' };

/** Serve a design-kit dir over HTTP — Babel/JSX kits can't fetch over file:// (CORS). */
function startStaticServer(root) {
  return new Promise((resolve) => {
    const srv = createServer((req, res) => {
      const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
      const fp = join(root, rel);
      res.setHeader('Content-Type', MIME[extname(fp).toLowerCase()] ?? 'application/octet-stream');
      createReadStream(fp).on('error', () => { res.statusCode = 404; res.end('nope'); }).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const flags = new Map(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const only = flags.has('only') ? String(flags.get('only')).split(',').map((s) => s.trim()) : null;
const includeLan = flags.has('lan');
const relogin = flags.has('relogin');

const manifest = JSON.parse(await readFile(join(ROOT, 'scripts/screenshot-targets.json'), 'utf8'));
const d = manifest.defaults;
const publicPrefix = manifest.output.replace(/^public\//, '');
const outRoot = join(ROOT, manifest.output);
const authDir = join(ROOT, '.harvest-auth');

/** Read one field from 1Password. The value is never logged or persisted. */
function opRead(ref) {
  try {
    return execFileSync('op', ['read', ref], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    throw new Error(`op read failed for ${ref} (is \`op\` signed in?)`);
  }
}

const SEL = {
  user: 'input[type="email"], input[name="email"], input[name="username"], input[id="username"], input[type="text"]',
  pass: 'input[type="password"]',
  submit: 'button[type="submit"], input[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Enter")',
};

/** Log in once; return a cached storageState path. */
async function ensureSession(browser, target) {
  const statePath = join(authDir, `${target.id}.json`);
  if (!relogin) {
    try { await access(statePath); return statePath; } catch { /* no cached session */ }
  }
  const a = target.auth;
  const user = opRead(`${a.op}/${a.userField ?? 'username'}`);
  const pass = opRead(`${a.op}/${a.passField ?? 'password'}`);
  const ctx = await browser.newContext({ viewport: { width: d.width, height: d.height } });
  const page = await ctx.newPage();
  await page.goto(a.loginUrl, { waitUntil: 'domcontentloaded', timeout: d.timeout });
  await page.waitForTimeout(800);
  await page.locator(a.userSel ?? SEL.user).first().fill(user);
  await page.locator(a.passSel ?? SEL.pass).first().fill(pass);
  await page.locator(a.submitSel ?? SEL.submit).first().click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(a.settleMs ?? 3000);
  if (a.expect) await page.waitForSelector(a.expect, { timeout: 12000 });
  await mkdir(authDir, { recursive: true });
  await ctx.storageState({ path: statePath });
  await ctx.close();
  return statePath;
}

const browser = await chromium.launch();
const results = [];
const suggestions = {};

for (const target of manifest.targets) {
  if (only && !only.includes(target.id)) continue;
  if (target.reachable === 'lan' && !includeLan && !only) {
    results.push(['·', target.id, 'skipped (homelab; pass --lan on the LAN)']);
    continue;
  }
  let storageState;
  if (target.auth) {
    try {
      storageState = await ensureSession(browser, target);
    } catch (err) {
      results.push(['✗', target.id, `auth failed: ${String(err.message).split('\n')[0].slice(0, 110)}`]);
      continue;
    }
  }
  let server;
  if (target.serveRoot) server = await startStaticServer(target.serveRoot);
  for (const shot of target.shots) {
    const label = `${target.id}/${shot.name}`;
    let dest;
    if (server) dest = `http://127.0.0.1:${server.port}/${String(shot.path).replace(/^\//, '')}`;
    else if (target.source === 'file') dest = pathToFileURL(shot.file).href;
    else if (shot.url) dest = shot.url;
    else if (shot.path && target.baseUrl) dest = target.baseUrl.replace(/\/$/, '') + shot.path;
    if (!dest) { results.push(['·', label, 'skipped (no url/file — fill the manifest)']); continue; }

    const rel = `${target.id}/${shot.name}.jpg`;
    const file = join(outRoot, rel);
    await mkdir(dirname(file), { recursive: true });
    const ctx = await browser.newContext({
      viewport: { width: shot.width ?? d.width, height: shot.height ?? d.height },
      deviceScaleFactor: shot.deviceScaleFactor ?? d.deviceScaleFactor,
      colorScheme: (shot.theme ?? d.theme) === 'light' ? 'light' : 'dark',
      ...(storageState ? { storageState } : {}),
    });
    const page = await ctx.newPage();
    try {
      // domcontentloaded (NOT networkidle) — apps with SSE/long-polling never go idle.
      await page.goto(dest, { waitUntil: 'domcontentloaded', timeout: shot.timeout ?? d.timeout });
      if (shot.waitFor) await page.waitForSelector(shot.waitFor, { timeout: 12000 }).catch(() => {});
      await page.waitForTimeout(shot.waitMs ?? d.waitMs);
      // click-through kits/apps: navigate to a screen before capturing
      if (shot.click) {
        await page.locator(shot.click).first().click({ timeout: 8000 });
        await page.waitForTimeout(shot.clickWaitMs ?? 900);
      }
      if (shot.mutate?.length) {
        await page.evaluate((muts) => {
          for (const m of muts) {
            document.querySelectorAll(m.selector).forEach((el, i) => {
              if (m.nth !== undefined && m.nth !== i) return;
              el.textContent = m.text;
            });
          }
        }, shot.mutate);
      }
      // selector-free de-identification: rewrite matching text nodes anywhere on the page
      if (shot.replace?.length) {
        await page.evaluate((reps) => {
          const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          const nodes = [];
          while (walk.nextNode()) nodes.push(walk.currentNode);
          for (const n of nodes) {
            for (const r of reps) {
              if (r.findRegex) {
                const re = new RegExp(r.findRegex, r.flags ?? 'g');
                if (re.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(new RegExp(r.findRegex, r.flags ?? 'g'), r.text);
              } else if (r.find && n.nodeValue.includes(r.find)) {
                n.nodeValue = n.nodeValue.split(r.find).join(r.text);
              }
            }
          }
        }, shot.replace);
      }
      if (shot.mutate?.length || shot.replace?.length) await page.waitForTimeout(250);
      await page.screenshot({ path: file, type: 'jpeg', quality: shot.quality ?? d.quality, fullPage: !!shot.fullPage });
      results.push(['✓', label, shot.mutate?.length ? 'OK (demo data)' : 'OK']);
      (suggestions[target.id] ??= []).push({ src: `/${publicPrefix}/${rel}`, caption: shot.caption ?? target.id });
    } catch (err) {
      results.push(['✗', label, `FAILED: ${String(err.message).split('\n')[0].slice(0, 110)}`]);
    } finally {
      await ctx.close();
    }
  }
  if (server) server.srv.close();
}
await browser.close();

if (Object.keys(suggestions).length) {
  await writeFile(join(ROOT, 'scripts/gallery-suggestions.json'), JSON.stringify(suggestions, null, 2));
}
console.log('\nHarvest results:');
for (const [mark, label, status] of results) console.log(`  ${mark} ${label} — ${status}`);
const ok = results.filter((r) => r[0] === '✓').length;
console.log(`\n${ok} shot(s) captured. Wiring hints → scripts/gallery-suggestions.json`);
console.log('Publish a curated shot explicitly:  git add -f public/projects/<id>/<name>.jpg');
