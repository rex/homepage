#!/usr/bin/env bash
# UserPromptSubmit hook — gates session start on Serena initialization.
#
# Why this hook exists:
# Serena's MCP tools are deferred in Claude Code (their JSONSchema
# definitions aren't preloaded — calling them requires running
# ToolSearch first). The system-reminder block that asks Claude to
# call initial_instructions is "ambient" — it competes with foreground
# task signal and reliably loses (see the brownfield-retrofit failure
# captured in agentic-skeleton/_meta/2026-05-01-*-retrofit-this-repo-
# for-agent-collaboration.txt and the architecture diagnosis in
# references/skill-vs-slash-vs-hook.md).
#
# UserPromptSubmit fires on every user message. This hook prepends a
# warning to the prompt as long as .claude/serena-initialized is
# absent. The model writes that flag file once init completes; the
# warning then disappears for the rest of the session.
#
# Mechanism:
# - If .mcp.json doesn't declare serena, no-op (nothing to enforce).
# - If .claude/serena-initialized exists, no-op (already initialized).
# - Otherwise emit JSON with hookSpecificOutput.additionalContext that
#   prepends the bring-up sequence.
#
# To re-arm: rm .claude/serena-initialized

set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

# Serena not configured — nothing to enforce.
if [ ! -f .mcp.json ] || ! grep -q '"serena"' .mcp.json 2>/dev/null; then
  exit 0
fi

# Already initialized this session — nothing to enforce.
if [ -f .claude/serena-initialized ]; then
  exit 0
fi

read -r -d '' WARNING <<'EOF' || true
## Serena not initialized — REQUIRED FIRST ACTION

Before responding to the prompt above, initialize Serena. The Serena
tools are deferred — schemas aren't preloaded, so two steps are
required: ToolSearch first, then the tool call.

Run this:

```
ToolSearch(query="select:mcp__serena__initial_instructions,mcp__serena__check_onboarding_performed,mcp__serena__list_memories,mcp__serena__onboarding,mcp__serena__write_memory,mcp__serena__activate_project,mcp__serena__find_symbol,mcp__serena__get_symbols_overview,mcp__serena__search_for_pattern,mcp__serena__replace_symbol_body,mcp__serena__insert_before_symbol,mcp__serena__insert_after_symbol")
```

Then in order:

1. `mcp__serena__initial_instructions` — fetches the dynamically-
   composed Serena Instructions Manual.
2. `mcp__serena__activate_project` — pass the project name or path
   (e.g. the repo name or `.`). Required for first-time project
   registration. Skip only if Serena already reports an active project.
3. `mcp__serena__check_onboarding_performed`.
4. If not onboarded: `mcp__serena__onboarding`, then write each
   prompted memory via `mcp__serena__write_memory`.
   If onboarded: `mcp__serena__list_memories`, read what's relevant.
   CRITICAL: If list_memories returns only a placeholder such as
   `this_is_a_test_memory` with no real project content, treat
   onboarding as NOT complete and run `mcp__serena__onboarding`.
5. Write the flag file ONLY after ALL steps above are complete:

```
mkdir -p .claude && touch .claude/serena-initialized
```

Do NOT write the flag after step 1. Do NOT proceed with the user's
request until all five steps are done. This is a hard gate, not a
suggestion. Full protocol:
`~/.claude/skills/serena/references/protocol.md`. Why this hook
exists: `~/.claude/skills/agentic-skeleton/references/skill-vs-slash-vs-hook.md`.
EOF

jq -n --arg c "$WARNING" \
  '{hookSpecificOutput:{hookEventName:"UserPromptSubmit", additionalContext:$c}}'
