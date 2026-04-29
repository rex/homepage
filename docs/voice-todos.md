# Voice TODOs — content that needs Pierce's actual words

The site shipped with a working layout. Some content blocks need Pierce's real
voice replacing AI-written placeholder copy or AI-buffed Pierce copy. Pierce's
rule: **empty > slop**. Anything called out here renders blank until he writes it.

Listed in priority order (worst offenders first). Mark items DONE as you finish.

---

## Hard blocks — currently rendering empty until Pierce writes

These are explicitly flagged as AI slop and have been blanked. The site
gracefully omits them while empty.

- [ ] **Off-the-clock VOLUNTEERING paragraph** — `src/content/off-the-clock.yaml` :: `volunteer.body`. About the DFW Curling Club Director of Communications work, 2022 – 2024. Significant to Pierce; will be again.
- [ ] **Off-the-clock intro paragraph** — `src/content/off-the-clock.yaml` :: `intro`. The "rest of life is where the patterns come from" framing. Previous AI version invented "lake houses I'm thinking about how to wire" — gone.
- [ ] **FAQ intro paragraph** — `src/content/faq.yaml` :: `intro`. Previous version was "Questions recruiters and hiring managers actually ask. This is the static version; a live query interface is planned for v2." — flagged as AI slop. Currently rendering nothing.

---

## Borderline — Pierce-review pass needed

These were either AI-generated, AI-edited from Pierce's original notes, or
written by Pierce in the original spec and shipped as-is. Voice may be off.

### Hero
- [ ] **Bio paragraph** (`src/content/hero.yaml` :: `bio`) — current version has been corrected for the Topgolf-duration mistake (5 years, not a decade) and de-duped against the signal sentence. Verify it reads as Pierce.
- [ ] **Signal sentence** (`src/content/hero.yaml` :: `signal_sentence`) — Pierce-original from the spec; probably fine but verify.
- [ ] **Status pill, tagline, short_tagline, meta_description** — Pierce-original from spec.

### Practice Areas (`src/content/practice-areas.yaml`)
- [ ] **9 tile `expanded` descriptions** — multi-sentence body for each tile. Originally from Pierce's spec but verify each reads as Pierce voice, not AI buff.
- [ ] **9 tile `recent` lines** — short, less risk, but verify.
- [ ] **9 tile `tools` lists** — Pierce-original, low risk.

### Career Log (`src/content/career-log.yaml`)
- [ ] **9 entry `summary` lines** — some are 1 sentence (probably fine), some are multi-sentence (verify voice).
- [ ] **vol/22 (DFW Curling Club) `summary`** — currently a one-line factual stub. Real voice goes here once Pierce drafts it.

### FAQ (`src/content/faq.yaml`)
- [ ] **12 Q&A pairs** — Pierce wrote these originally in the spec; some may have been polished. Read through.
- [x] **Linus answer** — edited per Pierce's exact words 2026-04-29.

### Other
- [ ] **/writing in-flight piece list** (`src/pages/writing/index.astro`) — bullet list of postmortem topics. Pierce-approved at first; verify.
- [ ] **/ask page copy** — short, shouldn't be slop, but verify.
- [ ] **/cv page intro** (uses hero bio + signal) — derived from above.
- [ ] **/404 + /500 copy** (`src/content/error-pages.yaml`) — Pierce-original from spec; probably fine.
- [ ] **humans.txt body** (`src/content/contact.yaml` :: `humans_txt`) — Pierce-original.

---

## Process

- Open the YAML file or component listed above.
- Replace slop with Pierce voice. If no time / no idea, **leave the field empty** — empty renders gracefully, slop doesn't.
- Move items from "Hard blocks" to "Done" once written.
- Move items from "Borderline" to "Done" once reviewed and either kept-as-is or replaced.
- Site rebuilds on push to `main`.

---

## Done

(Empty for now.)
