# AGENTS.md

## 1. Project snapshot

- **What**: Pierce Moore's personal homepage — portfolio site for a Senior DevOps Engineer
- **Runtime**: Astro 5 (static output), TypeScript strict, Tailwind CSS 3, React (islands only)
- **Owner**: Pierce Moore (solo project — pierce@piercemoore.com)
- **Non-goals**: No CMS, no client-side analytics, no client-side router

## 2. Setup

```bash
nvm use           # Node 22+
npm install
npm run dev       # http://localhost:4321
```

## 3. Commands the agent MUST run before declaring done

- `npm run build`  — runs `astro check` (type-check) then `astro build`

## 4. Repo layout

```
src/pages/      — routes (.astro per route, [slug].astro for dynamic)
src/components/ — Hero, Footer, ThemeToggle, Sparkline, StatusDot, etc.
src/layouts/    — BaseLayout.astro, PrintLayout.astro (CV)
src/content/    — *.yaml typed content (hero, practice-areas, career-log, faq)
src/styles/     — globals.css (tokens+base), fonts.css, boot.css
src/lib/        — build-info.ts, sparkline.ts, content.ts
public/         — fonts, favicons, OG image, robots.txt, site.webmanifest
infra/          — CDK app (TypeScript) — S3 + CloudFront + Route 53
.github/        — deploy.yml (build → S3 sync → CF invalidate)
```

## 5. Code style

- All content lives in `src/content/*.yaml` — never hardcode copy in .astro files
- Footer version is dynamic from package.json via `PACKAGE_VERSION` in `src/lib/build-info.ts`
- Tailwind is a utility layer over the custom token system in `src/styles/globals.css`

## 6. Testing policy

- Deferred — see VIBE.yaml. `npm run build` (astro check) is the correctness gate.

## 7. Security (hard stops)

- No secrets committed. Build-time env vars only: `VITE_BUILD_COMMIT`, `VITE_BUILD_DATE`
- No runtime env vars — this is a fully static site
- AWS deploy role is scoped to S3 bucket + one CloudFront distribution only

## 8. Architectural decisions

- Decision log: VIBE.yaml `decisions:` (none yet)

## 9. Things agents get wrong here

- (none yet)

## 10. Workflow

1. Read this file.
2. Read `CONVENTIONS.md` (if present) before editing code.
3. Check `MAP.md` (if present) for the module you're touching.
4. If `.mcp.json` declares `serena`: the FIRST tool calls of the session
   are `mcp__serena__initial_instructions` →
   `mcp__serena__check_onboarding_performed` →
   (`mcp__serena__onboarding` OR `mcp__serena__list_memories`). Use
   Serena's symbolic tools (`find_symbol`, `replace_symbol_body`,
   `search_for_pattern`) over built-in `Read`/`Edit`/`Glob`/`Grep` for
   code work. Full protocol: `.claude/rules/serena.md`.
5. Run §3 commands before declaring a task done.

## 11. When ending a session

- If `TASK_STATE.md` exists, update §6 (Handoff note).
- Propose AGENTS.md updates for durable new facts — don't accumulate
  tribal knowledge in auto-memory.

## 12. Subdirectory AGENTS.md (precedence: nearest wins)

- (none yet)
