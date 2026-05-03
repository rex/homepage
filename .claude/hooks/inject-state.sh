#!/usr/bin/env bash
# UserPromptSubmit hook — injects the active slice of TASK_STATE.md into
# every user prompt so the agent always knows what it's working on.
#
# Fires on: UserPromptSubmit
# Emits:    JSON with hookSpecificOutput.additionalContext

set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

# Only inject if we're mid-task — skip on empty/missing TASK_STATE.md
if [ ! -f TASK_STATE.md ]; then
  exit 0
fi

# Skip if TASK_STATE.md doesn't mention an active slice (cheap heuristic).
if ! grep -qE '(🟡 in-prog|in-progress|NEXT)' TASK_STATE.md; then
  exit 0
fi

# Extract §0 TL;DR + the first in-progress slice. Cap at 60 lines.
ctx=$(awk '
  /^## 0\./ { in_tldr=1 }
  /^## 1\./ { in_tldr=0 }
  in_tldr { print }
  /^### Slice.*(NEXT|🟡|in-progress)/ { in_slice=1 }
  in_slice { print; if (NR > slice_start + 20) { in_slice=0 } }
' TASK_STATE.md | head -60)

[ -z "$ctx" ] && exit 0

jq -n --arg c "## Active slice context\n$ctx" \
  '{hookSpecificOutput:{hookEventName:"UserPromptSubmit", additionalContext:$c}}'
