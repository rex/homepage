#!/usr/bin/env bash
# SessionStart hook — establishes context on a fresh session.
#
# What this hook does:
# Injects the five standing rules + repo state (branch, recent commits,
# TASK_STATE.md, PROGRESS.md, SESSION_NOTES) so the agent has its
# bearings BEFORE the first user prompt. The model treats
# additionalContext as ambient orientation (same priority as
# system-reminders and config boilerplate), so this is context
# establishment — NOT enforcement.
#
# What this hook does NOT do:
# - Run discovery. The /scaffold and /retrofit slash commands own
#   that. SessionStart cannot pause for input and the model treats
#   "RUN DISCOVERY NOW" injection as ambient signal that loses to
#   foreground task framing. See
#   agentic-skeleton/references/skill-vs-slash-vs-hook.md.
# - Gate Serena initialization. The serena-required.sh
#   UserPromptSubmit hook does that, with a flag file
#   (.claude/serena-initialized) to avoid repetition.
#
# Hook event semantics:
# - SessionStart fires on `startup | resume | clear` exactly once.
# - additionalContext is treated as ambient orientation by the model;
#   compliance with content injected here is SOFT.
# - For per-prompt hard enforcement, use a UserPromptSubmit hook.
#
# References:
# - ~/.claude/skills/agentic-skeleton/references/skill-vs-slash-vs-hook.md (the triad)
# - ~/.claude/skills/agentic-skeleton/references/claude-code-skill-loading.md::§8 (hooks)
# - ~/.claude/skills/serena/references/protocol.md (full Serena protocol)

set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

ctx="## Session orientation\n\n"

# ─── Serena reminder (informational) ───────────────────────────────────
# Per-prompt enforcement is in serena-required.sh; this is just
# orientation in case the user opens a session and starts working
# without having initialized Serena.

if [ -f .mcp.json ] && grep -q '"serena"' .mcp.json 2>/dev/null; then
  if [ ! -f .claude/serena-initialized ]; then
    ctx+="### Serena (not yet initialized this session)\n"
    ctx+="The serena-required UserPromptSubmit hook will warn you on the next prompt with the exact ToolSearch + initialization sequence. You can also run \`/scaffold\` or \`/retrofit\` for a guided setup, or initialize directly per ~/.claude/skills/serena/references/protocol.md. Symbolic edits via Serena are the default substrate; use built-in Read/Edit/Glob/Grep on code only after init.\n\n"
  else
    ctx+="### Serena initialized\n"
    ctx+="Use Serena's symbolic tools (find_symbol, replace_symbol_body, search_for_pattern) as the default substrate for code work.\n\n"
  fi
fi

# ─── Standing rules (always injected — soft compliance) ───────────────

ctx+="### Standing rules\n"
ctx+="Compliance is soft (this is ambient context, not a foreground command), but these are universal:\n"
ctx+="1. **Push every commit.** Commits are atomic with their push. Never leave committed-but-unpushed state. Pushing your commits does NOT push the user's uncommitted files in other paths.\n"
ctx+="2. **No snowflake-hack workarounds.** When a managed system fails (CI, Ansible, deploy script, declarative pipeline), diagnose and fix root cause. Do NOT route around with one-off scripts. Framing a workaround as one of \"three options, your call\" is the SAME anti-pattern.\n"
ctx+="3. **Cross-repo \`git add\` discipline.** When committing in any repo where the user has in-flight work, run \`git status\` first and stage by path (\`git add <specific paths>\`), never \`git add -A\` or \`git add .\`.\n"
ctx+="4. **Grep-verify critical edits.** After editing CI workflows (.github/workflows/*.yml, .gitea/workflows/*.yml), Dockerfiles, deploy configs, or anything under palantir/ / homelab-autodeploy/, grep-verify the change landed before committing. The Edit tool occasionally returns success without persisting; one grep catches it.\n"
ctx+="5. **Operational policy comes from the user explicitly.** When you encounter an unset operational-policy field in VIBE.yaml (slice-completion behavior, stop-gate behavior, autonomy thresholds), use the schema default. Do NOT pick a non-default value because it 'seems right' for the user's situation. Operational policy is the user's call, not yours.\n\n"

# ─── Repo state ───────────────────────────────────────────────────────

ctx+="### Repo state\n"
ctx+="Branch: $(git branch --show-current 2>/dev/null || echo 'detached')\n"
ctx+="Uncommitted: $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') files\n\n"

if command -v git >/dev/null 2>&1; then
  ctx+="### Recent commits\n$(git log --oneline -10 2>/dev/null || echo 'no history')\n\n"
fi

if [ -f TASK_STATE.md ]; then
  ctx+="### Current task\n$(head -80 TASK_STATE.md)\n\n"
fi

if [ -f PROGRESS.md ]; then
  ctx+="### Progress\n$(cat PROGRESS.md)\n\n"
fi

if [ -f .claude/SESSION_NOTES.md ]; then
  ctx+="### Previous session notes\n$(cat .claude/SESSION_NOTES.md)\n"
fi

jq -n --arg c "$ctx" \
  '{hookSpecificOutput:{hookEventName:"SessionStart", additionalContext:$c}}'
