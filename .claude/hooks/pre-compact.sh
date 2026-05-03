#!/usr/bin/env bash
# PreCompact hook — fires before Claude Code compacts the conversation.
# Dumps TASK_STATE.md + PROGRESS.md + CLAUDE.md so they're in the pre-compact
# window and show up in the summary. This is the third layer of compaction
# defense (first is on-disk files, second is SessionStart re-inject).
#
# Fires on: PreCompact
# Emits:    JSON with hookSpecificOutput.additionalContext

set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

ctx="## Pre-compact snapshot\n\n"

if [ -f TASK_STATE.md ]; then
  ctx+="### TASK_STATE.md (full)\n"
  ctx+="$(cat TASK_STATE.md)\n\n"
fi

if [ -f PROGRESS.md ]; then
  ctx+="### PROGRESS.md\n"
  ctx+="$(cat PROGRESS.md)\n\n"
fi

# Don't dump AGENTS.md/CLAUDE.md in full — they're re-loaded on session start
# anyway, and inclusion here would balloon the pre-compact context.
ctx+="### Note\n"
ctx+="AGENTS.md and CLAUDE.md are re-loaded by SessionStart hook after compaction.\n"

jq -n --arg c "$ctx" \
  '{hookSpecificOutput:{hookEventName:"PreCompact", additionalContext:$c}}'
