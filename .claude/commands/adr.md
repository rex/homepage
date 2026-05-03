---
description: Draft a new Architectural Decision Record from the current discussion
argument-hint: <short title>
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(ls:*)
model: sonnet
---

Draft ADR: **$ARGUMENTS**

1. Determine the next ADR number by listing `docs/adr/` and finding the highest existing `NNNN-*.md`.
2. Copy `docs/adr/template.md` to `docs/adr/NNNN-<slug>.md` (slug from title).
3. Fill in:
   - `status: proposed`
   - `date: <today>`
   - Context and Problem Statement (synthesize from the current conversation)
   - Decision Drivers
   - Considered Options (at least 2, ideally 3)
   - Decision Outcome — leave the chosen option blank for the human to fill
   - Consequences
4. Append a row to `docs/adr/README.md` index.
5. Summary: ADR filename + 2-line description + link to review.

Do NOT set status to `accepted` — that happens when the PR merges.
