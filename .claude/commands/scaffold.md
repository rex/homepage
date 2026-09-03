---
description: Scaffold a fresh, agent-ready repo from scratch (greenfield bootstrap).
---

# /scaffold — fresh agent-ready repo bootstrap

This command runs the full greenfield bootstrap top-to-bottom in this
session. The user invoking it IS the consent — proceed without any
"are we doing this?" check.

## Step 0 — Detect git environment

Slash commands assume nothing about the working tree. Detect first:

```bash
git rev-parse --is-inside-work-tree 2>/dev/null   # is this even a git repo?
git symbolic-ref --short HEAD 2>/dev/null         # current branch (empty = detached)
git worktree list 2>/dev/null                     # main checkout vs worktree?
git config --get remote.origin.url 2>/dev/null    # remote URL (empty = no remote)
```

What matters:

- **Detached HEAD or git worktree:** every PR's `git checkout -b chore/...`
  step will fail with "already used by worktree" or create an orphan branch.
  Adapt: skip the branch-creation step in each CHECKLIST and push with
  `git push origin HEAD:<trunk>` (where `<trunk>` is `main`, `master`,
  or whatever VIBE.yaml says).
- **No remote:** push steps no-op silently. Surface that and ask the user
  to add a remote, or proceed without push.
- **Trunk-based development:** if `VIBE.yaml.workflow.branch_strategy: trunk`
  exists, skip ALL `git checkout -b` steps and commit directly on the
  current branch.

Scaffolding a fresh dir? You'll `git init` later in Step 2 — none of the
above applies yet.

## Step 1 — Discovery (inline)

Ask only what you can't answer from context (fresh dir = ask all of
Q1–Q5). Persist answers to `.claude/session-context.md` at the end.

### Q1 — required: what's the goal of this session?

- a) **Quick task / single edit** — exit `/scaffold`, do the small
  thing.
- b) **Just a question / chat** — exit `/scaffold`, answer.
- c) **Iterate on existing agent-collab project** — read existing
  `VIBE.yaml`, skip to Step 3.
- d) **Retrofit existing repo** — exit `/scaffold`; tell user to run
  `/retrofit`.
- e) **New greenfield project** — continue with Q2–Q5.
- f) **Other / write-in** — parse free-text, propose a mode, confirm.

If **a, b, d, or f** → exit and proceed conversationally.

### Q2 — primary stack (Q1 = e)

Python / FastAPI; TypeScript / Next.js (lang-react); Vue 3;
Go (lang-go); Kotlin / Android (lang-kotlin-android); MCP server
(lang-mcp); Browser extension (lang-browser-extension); Other
(write-in).

### Q3 — cloud (Q1 = e)

None / local-only; AWS; GCP; Azure; Homelab (rke2 / k3s); Other.

### Q3a — visibility (Q1 = e)

`public-oss` (default GHCR, `ubuntu-latest` runners, public release
notes) | `internal-homelab` (Gitea registry at `git.thelab.host`,
`helms-deep` runner, no public notes) | `mixed` (rare, both
registries, explicit choice).

Wrong default here is expensive — shipping a homelab dashboard's
container to public GHCR exposes infra topology.

### Q4 — autonomy mode

`interactive` (default — ask between non-trivial steps) |
`continue-until-blocked` (autonomous within scope, stop on hard
blockers / explicit pauses / irreversible decisions).

Default from `VIBE.yaml.workflow.default_autonomy_mode` if a
`VIBE.yaml` exists; otherwise schema default `interactive`.

### Q5 — anything else? (free-text, optional)

Captures one-off context: deadlines, prior decisions, external
constraints.

### Persist

Write `.claude/session-context.md`:

```markdown
# Session context
mode: greenfield
stack: <q2>
cloud: <q3>
visibility: <q3a>
autonomy: <q4>
created: <ISO timestamp>
updated: <ISO timestamp>
fast_path: false

## Q5 freeform notes
<q5 if provided>
```

## Step 2 — Run the bootstrap script

```
~/.claude/skills/agentic-skeleton/scripts/bootstrap_greenfield.py <target-dir>
```

The script handles steps 2–13 + 21 of the 22-step bootstrap sequence
(see `~/.claude/skills/agentic-skeleton/references/bootstrap-sequence.md`):
directory structure, root AGENTS.md + VIBE.yaml + CLAUDE.md/GEMINI.md
symlinks, TASK_STATE.md, README.md, CHANGELOG.md, VERSION, Makefile,
.gitignore (universal tooling stub — see `.gitignore` handling in
Step 4), .claude/ config (hooks chmod +x, settings.json, .mcp.json,
agents, commands, rules), scripts/mcp/op-headers.sh (chmod +x — the
`headersHelper` both remote MCP servers call).

If the target dir already has files, the script merges rather than
overwriting; review the diff before committing. `maybe_seed_gitignore`
is idempotent — running it against a target that already has a
`.gitignore` (e.g. one a lang-* skill wrote first) appends only the
missing universal tooling lines, never duplicates.

## Step 3 — Hand-edits (the things scripts can't do)

Walk the user through the agent-decision steps the script can't
automate (steps 1, 14, 15, 19, 20, 22):

- `.env.example` → `.env` (use Q5 values where applicable; never
  commit `.env`).
- `AGENTS.md` §1 (project snapshot) — what this project IS, in 3–5
  sentences.
- `AGENTS.md` §9 (gotchas) — start empty; populate as you discover.
- `VIBE.yaml.project.name` confirmation; leave operational-policy
  fields at schema defaults unless the user explicitly directs
  otherwise (per `~/.claude/skills/agentic-skeleton/references/agent-behavior.md::Operational
  policy comes from the user explicitly`).
- **Ask about testing** — pytest / vitest / etc. If approved, set
  `VIBE.yaml.quality_gates.tests.mode: required` and wire the
  harness. If declined, leave at `deferred`.
- **Ask about Dockerfile** — if approved, generate from
  `lang-docker` patterns. If declined, set
  `VIBE.yaml.deployment.dockerized: false`.

## Step 4 — Layer in stack-specific scaffolding

Based on Q2:
- Python / FastAPI → invoke `lang-python` patterns: `pyproject.toml`
  with `uv` + `ruff` + `pyright`, `app/{main,routes,services,models}/`
  layout, `/api/health` endpoint.
- React / Next.js → invoke `lang-react` patterns: ESLint flat config,
  `tsconfig.json` strict, project layout.
- Vue 3 → `lang-vue`.
- Go → `lang-go`: stdlib HTTP + pgx + zerolog patterns.
- Kotlin / Android → `lang-kotlin-android`.
- MCP server → `lang-mcp`.
- Browser extension → `lang-browser-extension`.

Stack-specific skills load via description-match on the conversation
content (e.g. mentioning `pyproject.toml` triggers `lang-python`).
If a stack skill doesn't load, suggest the slash invocation
(`/lang-python`) explicitly.

**`.gitignore` discipline.** Step 2 lays down the universal tooling
stub (`.task_state_history/`) from `templates/greenfield/.gitignore`.
When a lang-* skill contributes stack-specific entries (Python
`__pycache__/`, Node `node_modules/`, etc.), **append to the existing
`.gitignore` — never overwrite it**. The universal stanza must remain
or local tooling output shows up as untracked and trips `stop-gate.sh`
(Check 2 blocks on any dirty tree). If you accidentally clobber the
file, re-run
`bootstrap_greenfield.py` against the target — its `maybe_seed_gitignore`
step is idempotent and will re-append any missing universal lines.

## Step 5 — First commit + push

```
git add -A
git commit -S -m "chore: scaffold agent-ready infrastructure"
git push -u origin <branch>
```

Per `~/.claude/skills/agentic-skeleton/references/agent-behavior.md::Push
every commit you author`, push immediately. Don't leave
committed-but-unpushed state.

**Heredoc commit-message gotcha:** `bash-guard.sh` blocks the entire
`git commit -m "$(cat <<EOF...EOF)"` invocation if the heredoc body
contains a blocked pattern (e.g. mentioning `rm -rf /` in a PR
description). The hook can't distinguish a string-in-a-heredoc from a
command being run. Workaround:

```bash
cat > /tmp/commit-msg <<'EOF'
chore: scaffold agent-ready infrastructure

Description that mentions blocked patterns like rm -rf / safely.
EOF
git commit -S -F /tmp/commit-msg
rm /tmp/commit-msg
```

`git commit -F <file>` reads the message from the file; bash-guard sees
only the file path, not the message contents.

## Step 6 — Verify

- `make validate` passes.
- `make check-if-the-agent-can-consider-this-task-completed` passes.
- A fresh session in the new repo answers "what's the setup
  command?" from AGENTS.md §2 without rediscovery.

## See also

- `~/.claude/skills/agentic-skeleton/references/bootstrap-sequence.md` — full 22-step
  greenfield order with script-vs-agent ownership column.
- `~/.claude/skills/agentic-skeleton/references/skill-vs-slash-vs-hook.md` — why this
  is a slash command, not a skill cascade.
- `~/.claude/skills/agentic-skeleton/references/ask-first-checklist.md` — when ASKING
  is the right call (steps 1, 19, 20 above).
