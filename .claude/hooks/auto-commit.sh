#!/usr/bin/env bash
# Agent-behavior hook (invoked by the /ship slash command, not wired to
# a lifecycle event by default). Stages and commits changes when a slice
# is marked done, using a signed conventional commit.
#
# Reads arguments: <slice-id> <commit-type>  (e.g. "2.2" "feat")
# Honors VIBE.yaml.workflow.default_slice_completion_behavior:
#   commit-push-and-pause    → commit + push, then stop
#   commit-push-and-continue → commit + push, continue
#   other                    → stage only, don't commit
#
# Exits: 0 success · 1 failure (tests/validation failed, skipping commit)

set -uo pipefail

SLICE_ID="${1:-unknown}"
COMMIT_TYPE="${2:-chore}"

cd "${CLAUDE_PROJECT_DIR:-.}"

# --- Precondition: working tree must have changes ---
if [ -z "$(git status --porcelain)" ]; then
  echo "auto-commit: tree is clean, nothing to commit." >&2
  exit 0
fi

# --- Precondition: validation must pass before we commit ---
if [ -f Makefile ] && grep -qE '^validate:' Makefile; then
  if ! make validate >/dev/null 2>&1; then
    echo "🛑 auto-commit: make validate failed. Refusing to commit." >&2
    exit 1
  fi
fi

# --- Read VIBE.yaml to determine behavior ---
BEHAVIOR="commit-push-and-pause"
if [ -f VIBE.yaml ] && command -v python3 >/dev/null 2>&1; then
  BEHAVIOR=$(python3 -c "
import sys
try:
    import yaml  # type: ignore
    with open('VIBE.yaml') as f:
        data = yaml.safe_load(f)
    print(data.get('workflow', {}).get('default_slice_completion_behavior', 'commit-push-and-pause'))
except Exception:
    print('commit-push-and-pause')
" 2>/dev/null || echo "commit-push-and-pause")
fi

# --- Stage changes ---
git add -A

# --- Compose the commit message ---
SUBJECT="${COMMIT_TYPE}: slice ${SLICE_ID}"
# Best-effort: extract the slice title from TASK_STATE.md
if [ -f TASK_STATE.md ]; then
  TITLE=$(grep -E "^### Slice ${SLICE_ID}" TASK_STATE.md | head -1 | sed -E 's/^### Slice [0-9.]+ *[—-] *//')
  [ -n "$TITLE" ] && SUBJECT="${COMMIT_TYPE}: ${TITLE,} (slice ${SLICE_ID})"
fi

# --- Commit (signed) ---
if ! git commit -S -m "$SUBJECT" >/dev/null 2>&1; then
  echo "🛑 auto-commit: git commit failed. Check signing key." >&2
  exit 1
fi

COMMIT_SHA=$(git rev-parse --short HEAD)
echo "auto-commit: committed $COMMIT_SHA ($SUBJECT)"

# --- Push if policy allows and remote exists ---
case "$BEHAVIOR" in
  commit-push-and-pause|commit-push-and-continue)
    if git remote | grep -q origin; then
      BRANCH=$(git branch --show-current)
      if ! git push origin "$BRANCH" >/dev/null 2>&1; then
        echo "⚠ auto-commit: push failed. Commit is local only." >&2
        exit 1
      fi
      echo "auto-commit: pushed to origin/$BRANCH"
    fi
    ;;
  *)
    echo "auto-commit: policy is '$BEHAVIOR' — commit only, no push."
    ;;
esac

exit 0
