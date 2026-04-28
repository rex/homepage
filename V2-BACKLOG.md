# V2 backlog

Things deliberately out of v1 per `claude-code-prompt.md` §15. Captured here so they don't pile up in the head.

## Big rocks

- **`/ask` query interface** — model-backed Q&A, replacing the FAQ as the primary "what i think" surface. Stub returns 501 from `functions/api/ask.ts`.
- **Postmortems** — MDX content under `src/content/postmortems/`. Template route at `src/pages/postmortems/[slug].astro` is built but `getStaticPaths()` returns `[]` until content lands.
- **Knowledge section** — technology-scoped runbooks (kubernetes, etcd, longhorn, observability). Different shape from postmortems; closer to "small reference cards."
- **Tools / projects showcase** — the rancher mcp server, the homelab observability stack, the nfc fossil dig station. Each gets a card with status, repo link, postmortem link.
- **Reaper migration to `eye/` org** — separate concern; tracking here so it doesn't get folded into v2 site work.

## Mediums

- **RSS feed** — once postmortems exist.
- **PWA / service worker** — would let `humans.txt` and `cv` work offline. Defer until there's a reason.
- **Real Astro custom-domain middleware** — replace the Cloudflare bulk-redirect rules with a server-side check, *if* there's a reason to (currently there isn't).
- **Email newsletter / mailing list** — only if someone actually wants the postmortems delivered.
- **Comments on postmortems** — open question whether to host them at all; webmentions vs. github-issues vs. nothing.
- **Search** — pointless until there's content to search.
- **Authentication** — no plan, no need.

## Smalls

- **Real Fraunces italic** — currently synthesized; drop in `Fraunces-Italic.woff2` and a second `@font-face` in `src/styles/fonts.css`.
- **Dark-only OG image variant** — for the few clients that render OG dark.
- **Print stylesheet refinements on `/cv`** — once a real `resume.pdf` is in place, audit the print pagination.
- **`.well-known/humans.txt`** alongside `/humans.txt` — purely cosmetic.

## Architectural deviations from v1 spec (worth revisiting)

- **`functions/api/ask.ts` instead of `src/pages/api/ask.ts`** — the spec listed the API stub under Astro's `pages/`, which would force a server adapter for one route. Cloudflare Pages Functions is the cleaner path for a 99% static site. Move it back to Astro if the API ever grows beyond stubs.
- **No `BootController.tsx` React island** — the boot-sequence sessionStorage gate is a 14-line inline `<script is:inline>` in `BaseLayout.astro`. Ship more state into the boot orchestration in v2 if it ever needs it.
- **Career log expand has fade transition only**, not the spec's smoother height animation. Native `<details>` doesn't animate height portably; the trade-off is worth a v2 polish pass with `interpolate-size` once browser support is universal.
