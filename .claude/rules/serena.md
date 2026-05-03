# Serena rules (mandatory session-start protocol + edit discipline)

> Loaded by Claude Code as a project-level rule when present at
> `.claude/rules/serena.md`. Applies to every session in this repo
> regardless of which skills auto-load. Full protocol:
> `~/.claude/skills/serena/references/protocol.md`.

## Mandatory session-start protocol

If `.mcp.json` declares `serena`, the FIRST tool calls in this session
MUST be (in order):

1. `mcp__serena__initial_instructions` — fetches the dynamically-composed
   Serena Instructions Manual for the current context + modes. Do this
   before any other work.
2. `mcp__serena__activate_project` — pass the project name or path.
   Required for first-time project registration. Skip only if Serena
   already reports an active project in step 1's output.
3. `mcp__serena__check_onboarding_performed` — does this project have
   real memories yet?
4. If onboarding not done: `mcp__serena__onboarding`. Follow its prompt
   to gather project purpose, tech stack, code style/conventions
   (naming/type hints/docstrings), task-completion commands
   (lint/format/test), codebase structure, entrypoint commands, system
   utility commands (Darwin/Linux/Windows-aware), and design patterns.
   Write each as a separate memory file via
   `mcp__serena__write_memory` (e.g. `suggested_commands`,
   `style_conventions`, `task_completion`, `codebase_structure`).
   If onboarding done: `mcp__serena__list_memories` and read only the
   memories relevant to the task.
   CRITICAL: If list_memories returns only a placeholder such as
   `this_is_a_test_memory` with no real project content, treat onboarding
   as NOT complete and run `mcp__serena__onboarding` regardless.
5. Write `.claude/serena-initialized` ONLY after all steps above are
   done: `mkdir -p .claude && touch .claude/serena-initialized`.
   Do NOT write this flag after step 1.

**Do NOT touch code with built-in `Read`, `Edit`, `Glob`, or `Grep`
until the above is complete.** Serena's symbolic tools are the default
substrate.

## Edit discipline (during work)

Use the **exploration pyramid**:
`mcp__serena__get_symbols_overview` → `mcp__serena__find_symbol(depth=1, include_body=False)` →
`mcp__serena__find_symbol(include_body=True)`. Going straight to bodies
burns tokens.

Symbolic edits over line-based edits when a symbol is the unit of
change:
- `mcp__serena__replace_symbol_body` for whole-symbol replacement.
- `mcp__serena__insert_before_symbol` / `mcp__serena__insert_after_symbol`
  for additive edits.
- `mcp__serena__rename_symbol` for project-wide rename (LSP-correct).
- `mcp__serena__safe_delete_symbol` to delete with reference safety.

Diagnostics without a build: `mcp__serena__get_diagnostics_for_file` /
`mcp__serena__get_diagnostics_for_symbol`.

Pattern search: `mcp__serena__search_for_pattern` (gitignore-aware,
DOTALL+MULTILINE Python regex). Use `.*?` (non-greedy) between
anchors, never `.*`.

## Memory discipline

- **Project memories** live in `<project>/.serena/memories/`.
  Project-specific state (architecture decisions, in-progress task
  state, gotchas).
- **Global memories** (`global/<topic>` prefix) live in
  `~/.serena/memories/global/` and are shared across all projects.
  Use for: code-style conventions, team-wide rules, agent-behavior
  guidance that applies everywhere.
- Memory names use **underscores**, not spaces. `/` makes filesystem
  subdirectories. No `..` (Serena rejects).
- **Memory-as-handoff**: at end of long-running task, summarize state
  to `tasks/<feature>/state` so the next session can resume. This is
  Serena's documented context-window-exhaustion continuation pattern.
- Read each memory at most once per session — cache content yourself.

## Critical gotchas

These bite repeatedly. Burn them in.

- **Line numbers are 0-based** in every Serena tool. Humans say
  "line 42"; you must use 41.
- **`replace_content` backreferences are `$!1`, NOT `\1`.** Distinct
  from every other regex tool you know.
- **`activate_project` for project-switching is disabled in
  single-project contexts** (`claude-code`, `ide`, `vscode`). But it
  IS required for first-time project registration — call it in the
  init chain if Serena has no active project. To switch projects
  mid-session, restart Serena with `--project <new>`.
- **`onboarding` should be called at most once per conversation.**
  If memories were lost, prefer `list_memories` + targeted
  `write_memory` over re-running the full sweep.

## Forbidden rationalizations

These mirror the rules baked into Serena's own `claude-code` and
`codex` contexts. They apply regardless of harness:

- "I already know the path, so I'll use Read/cat." — no. Use the
  symbol tools; they return structured information your edit tools
  can act on.
- "One Read call is faster than three Serena calls." — no. The
  pyramid keeps cache warm and answers stay relevant longer.
- "The built-in Edit tool description says use Read first." — that
  guidance is harness-internal; Serena's edit tools don't require it.
- "This is a quick fix, I'll grep instead of `find_symbol`." —
  `search_for_pattern` exists and stays inside the project's gitignore
  rules. Use it.
- "I'll Read the whole file once and edit a few times." — fine for
  small files, prohibited for files Serena can navigate symbolically.

## Dashboard

`http://localhost:24282/dashboard/index.html` (port increments if
multiple instances). Shows tool-call history, live logs, edit
memories/config in browser. `mcp__serena__open_dashboard` triggers it.

## See also

- `~/.claude/skills/serena/references/protocol.md` — full agent-agnostic
  protocol with tool inventory, modes, contexts, multi-agent HTTP,
  language-server coverage.
- `~/.claude/skills/agentic-skeleton/references/claude-code-skill-loading.md` — why this
  rules file is the deterministic enforcement (loads from
  `.claude/rules/`) rather than skill-internal docs (don't auto-load).
