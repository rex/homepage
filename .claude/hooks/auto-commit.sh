#!/usr/bin/env bash
# Agent-behavior hook (invoked by the /ship slash command, not wired to
# a lifecycle event by default). Stages and commits changes when a slice
# is marked done, using a signed conventional commit.
#
# Reads arguments: <slice-id> <commit-type> <bump-level>
#   slice-id:    e.g. "2.2"
#   commit-type: feat | fix | docs | chore | refactor | test | style | perf
#   bump-level:  major | minor | patch  (REQUIRED — no default)
#
# Honors VIBE.yaml.workflow.default_slice_completion_behavior:
#   commit-push-and-pause    → commit + push, then stop
#   commit-push-and-continue → commit + push, continue
#   other                    → stage only, don't commit
#
# Versioning contract (non-negotiable):
#   Every commit requires a version bump. Exception: the initial scaffold
#   commit, which establishes the 0.1.0 baseline.
#
# Exits: 0 success · 1 failure (validation, bump missing, or signing)

set -uo pipefail

SLICE_ID="${1:-unknown}"
COMMIT_TYPE="${2:-chore}"
BUMP_LEVEL="${3:-}"

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 1

# --- Precondition: bump level required (unless this is the bootstrap commit) ---
if [ -z "$BUMP_LEVEL" ]; then
  # Bootstrap exemption: no HEAD yet = first-ever commit.
  if git rev-parse HEAD >/dev/null 2>&1; then
    echo "🛑 auto-commit: bump level required (major | minor | patch)." >&2
    echo "   Usage: auto-commit.sh <slice-id> <commit-type> <bump-level>" >&2
    exit 1
  fi
fi

# --- Precondition: working tree must have changes ---
if [ -z "$(git status --porcelain)" ]; then
  echo "auto-commit: tree is clean, nothing to commit." >&2
  exit 0
fi

# --- Precondition: validation must pass before we bump/commit ---
if [ -f Makefile ] && grep -qE '^validate:' Makefile; then
  if ! make validate >/dev/null 2>&1; then
    echo "🛑 auto-commit: make validate failed. Refusing to commit." >&2
    exit 1
  fi
fi

# --- Bump version (before staging) unless this is the bootstrap commit ---
if [ -n "$BUMP_LEVEL" ]; then
  if [ -x scripts/bump_version.py ]; then
    NOTE="slice $SLICE_ID"
    if [ -f TASK_STATE.md ]; then
      TITLE=$(grep -E "^### Slice ${SLICE_ID}" TASK_STATE.md | head -1 | sed -E 's/^### Slice [0-9.]+ *[—-] *//')
      [ -n "$TITLE" ] && NOTE="$TITLE"
    fi
    if ! scripts/bump_version.py "$BUMP_LEVEL" --changelog-note "$NOTE" --agent "Claude"; then
      echo "🛑 auto-commit: version bump failed." >&2
      exit 1
    fi
  else
    echo "⚠ auto-commit: scripts/bump_version.py not found; skipping bump (you must bump manually)." >&2
  fi
fi

# --- Hard gate: VERSION must differ from HEAD (enforced by check_version_bumped.py) ---
if [ -x scripts/check_version_bumped.py ]; then
  if ! scripts/check_version_bumped.py; then
    echo "🛑 auto-commit: version-gate failed. Refusing to commit." >&2
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
