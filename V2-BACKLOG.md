# Alpha → v1 backlog

Things deliberately out of v0.1.0. Captured here so they don't pile up in the head. (Originally numbered "v2" against the spec; this site is alpha-launched at v0.1.0 — v1.0.0 is reserved for "actually finished.")

## Awaiting Pierce

- **Off-the-clock VOLUNTEERING paragraph** — currently a placeholder in [`src/content/off-the-clock.yaml`](src/content/off-the-clock.yaml) under `volunteer.body`. Pierce explicitly asked to be reminded; this is the reminder. The DFW Curling Club work was significant to him over 2022–2024 and deserves a real paragraph, not a stub.

## Big rocks

- **`/ask` query interface** — model-backed Q&A, replacing the FAQ as the primary "what i think" surface. Stub returns 501 from the CloudFront Function in [`infra/functions/edge.js`](infra/functions/edge.js).
- **Postmortems** — MDX content under `src/content/postmortems/`. Template route at `src/pages/postmortems/[slug].astro` is built but `getStaticPaths()` returns `[]` until content lands.
- **Knowledge section** — technology-scoped runbooks (kubernetes, etcd, longhorn, observability). Different shape from postmortems; closer to "small reference cards."
- **Tools / projects showcase** — the rancher mcp server, the homelab observability stack, the nfc fossil dig station. Each gets a card with status, repo link, postmortem link.
- **Boot-sequence Linus grace note** — Pierce loves the idea of a tiny Linus fading in at the end of boot for one subtle pulse, then settling. Approved in concept; gated on getting the motion *exactly* right (not cheesy, must be intentional). Specific design TBD.
- **HeroNudge motion** — the cursor-pull effect is parked. `src/components/HeroNudge.tsx` is retained; `<HeroNudge client:idle />` is commented out in `Hero.astro`. Pierce wants to revisit motion with a better idea, not the v0.1.0 implementation.
- **Reaper migration to `eye/` org** — separate concern; tracking here so it doesn't get folded into site work.

## Mediums

- **RSS feed** — once postmortems exist.
- **PWA / service worker** — would let `humans.txt` and `cv` work offline. Defer until there's a reason.
- **Email newsletter / mailing list** — only if someone actually wants the postmortems delivered.
- **Comments on postmortems** — open question whether to host them at all; webmentions vs. github-issues vs. nothing.
- **Search** — pointless until there's content to search.
- **Authentication** — no plan, no need.

## Smalls

- **Dark-only OG image variant** — for the few clients that render OG dark.
- **Print stylesheet refinements on `/cv`** — once a real `resume.pdf` is in place, audit the print pagination.
- **`.well-known/humans.txt`** alongside `/humans.txt` — purely cosmetic.
- **www variants for the vanity domains** (`www.piercemoore.cv`, `www.piercemoore.dev`) — the CDK SAN cert and Route 53 records currently cover the apexes only; the CloudFront Function still 301s the `www.` versions if Route 53 sends them in, but they're not wired into the cert. Add SANs + records if anyone ever types `www.piercemoore.cv` and complains.

## Architectural deviations from v1 spec (worth revisiting)

- **CloudFront Function (`infra/functions/edge.js`) instead of `src/pages/api/ask.ts`** — the spec listed the API stub under Astro's `pages/`, which would force a server adapter for one route. The edge-function path keeps the Astro build pure-static and runs the redirect/stub logic at the CDN edge in <1ms. Move `/api/ask` into Astro server routes if the API ever grows beyond stubs.
- **No `BootController.tsx` React island** — the boot-sequence sessionStorage gate is a small inline `<script is:inline>` in `BaseLayout.astro`. Ship more state into the boot orchestration if it ever needs it.
- **Career log expand has fade transition only**, not the spec's smoother height animation. Native `<details>` doesn't animate height portably; the trade-off is worth a polish pass with `interpolate-size` once browser support is universal.
- **Status pill is the only status indicator** — earlier passes had a separate small `● SEEKING SENIOR PLATFORM ROLE` pinned top-right of the hero. Reverted to the spec layout (single pill below the tagline) to match the design probe.

## Hosting history (for context)

This repo briefly targeted Cloudflare Workers (`wrangler.jsonc` + `src/worker.ts`). Removed when we discovered that apex CNAME flattening on Cloudflare Pages/Workers requires either Cloudflare-managed nameservers or a Business+ tier. DNS is on Route 53 and isn't moving, so the AWS-native path (CDK in `infra/`, S3 + CloudFront + CloudFront Functions + Route 53 ALIAS) is the supported deploy. Git history retains the Worker code if we ever want to flip back.
