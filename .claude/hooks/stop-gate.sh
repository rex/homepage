#!/usr/bin/env bash
# Stop hook — runs when the agent is about to stop the session. Checks for
# conditions that should prevent a clean stop:
#   1. Uncommitted changes with autonomous commit policy disabled
#   2. TASK_STATE.md says "continue-until-blocked" but current slice is
#      not marked done or blocked
#   3. Tests failing and no note in TASK_STATE.md explaining why
#
# Fires on: Stop
# Reads:    JSON from stdin (includes stop_hook_active to prevent loops)
# Emits:    JSON with decision=block + reason, OR exits 0 to allow stop

set -uo pipefail

INPUT=$(cat)

# CRITICAL: prevent infinite loops. If we've already fired once this stop,
# just let it go through.
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_ACTIVE" = "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# --- Check 1: Standing "continue-until-blocked" directive ---
if [ -f TASK_STATE.md ]; then
  if grep -qiE 'continue.until.blocked|do not stop|continue iterating' TASK_STATE.md; then
    # Check if current slice is done or blocked
    if ! grep -qE '(✅ done|🔴 blocked|Status: done|Status: blocked)' TASK_STATE.md; then
      jq -n '{
        decision: "block",
        reason: "TASK_STATE.md has a standing continue-until-blocked directive and no slice is marked done/blocked. Resume the next slice instead of stopping."
      }'
      exit 0
    fi
  fi
fi

# --- Check 2: Uncommitted changes with autonomous commit policy ---
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  BEHAVIOR="commit-push-and-pause"
  if [ -f VIBE.yaml ] && command -v python3 >/dev/null 2>&1; then
    BEHAVIOR=$(python3 -c "
try:
    import yaml
    with open('VIBE.yaml') as f:
        data = yaml.safe_load(f)
    print(data.get('workflow', {}).get('default_slice_completion_behavior', 'commit-push-and-pause'))
except Exception:
    print('commit-push-and-pause')
" 2>/dev/null || echo "commit-push-and-pause")
  fi

  case "$BEHAVIOR" in
    commit-push-and-pause|commit-push-and-continue)
      jq -n --arg b "$BEHAVIOR" '{
        decision: "block",
        reason: ("Uncommitted changes remain and VIBE.yaml default_slice_completion_behavior is \($b). Run auto-commit.sh or commit manually before stopping.")
      }'
      exit 0
      ;;
  esac
fi

# All clear — allow stop.
exit 0
