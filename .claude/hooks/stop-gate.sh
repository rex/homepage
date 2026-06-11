#!/usr/bin/env bash
# Stop hook — runs when the agent is about to stop the session. Checks for
# conditions that should prevent a clean stop:
#   1. Standing "continue-until-blocked" directive but no slice marked done/blocked
#   2. Uncommitted changes with autonomous commit policy enabled
#   3. Local-only commits ahead of origin (per F#27 — push every commit)
#   4. Architecture gate — hard per-file line limits + module shape
#      (delegates to check_architecture.py + check_module_rules.py)
#   5. Lint gate — make lint, when quality_gates.lint.required
#   6. Typecheck gate — make typecheck, when quality_gates.typecheck.required
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

cd "${CLAUDE_PROJECT_DIR:-.}" || {
  # Fail closed: if we cannot reach the project root, the gates cannot
  # run — block the stop rather than silently passing.
  jq -n '{decision: "block", reason: "stop-gate: cannot cd to project root — gates cannot run (fail closed)."}'
  exit 0
}

# --- Helpers ---
block() {
  # Emit a Stop-blocking decision and exit. $1 = human-readable reason.
  jq -n --arg reason "$1" '{decision: "block", reason: $reason}'
  exit 0
}

gate_required() {
  # Echo "true"/"false" for VIBE.yaml quality_gates.<$1>.required.
  # Fails safe to "true" — an unreadable policy never disables a gate.
  python3 -c "
import yaml
try:
    d = yaml.safe_load(open('VIBE.yaml')) or {}
    v = (((d.get('quality_gates') or {}).get('$1') or {}).get('required', True))
    print('true' if v else 'false')
except Exception:
    print('true')
" 2>/dev/null || echo "true"
}

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

# --- Check 3: Local-only commits ahead of origin (F#27 — push every commit) ---
# If the current branch tracks a remote and has commits the remote doesn't,
# block the stop. The post-commit auto-push hook should have pushed already;
# this is the safety net for cases where push silently failed (network blip,
# auth issue) or auto-push was bypassed via SKIP_AUTOPUSH.
BRANCH=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo "")
if [ -n "$BRANCH" ] && git rev-parse --abbrev-ref "${BRANCH}@{upstream}" >/dev/null 2>&1; then
  AHEAD=$(git rev-list --count "${BRANCH}@{upstream}..HEAD" 2>/dev/null || echo "0")
  if [ "$AHEAD" -gt 0 ]; then
    jq -n --arg b "$BRANCH" --arg n "$AHEAD" '{
      decision: "block",
      reason: ("\($n) local commit(s) on \($b) ahead of origin. Push before stopping (auto-push hook may have failed): git push origin \($b)")
    }'
    exit 0
  fi
fi

# --- Check 4: Hard per-file line-limit violations (VIBE.yaml) ---
# Delegates to scripts/check_architecture.py — the SINGLE source of truth
# for the architecture gate (the same script `make check-architecture`
# runs). --hard-only because soft overruns are a refactor signal, not a
# stop-blocker. Any non-zero exit — hard violations, a config error, or
# the checker being unrunnable — blocks the stop. A gate that cannot run
# is not a passing gate.
if [ -f VIBE.yaml ]; then
  if [ ! -f scripts/check_architecture.py ]; then
    jq -n '{
      decision: "block",
      reason: "Architecture gate cannot run: scripts/check_architecture.py is missing. Restore it before stopping — re-run the agentic-skeleton bootstrap, or copy scripts/check_architecture.py from the skill. A missing gate is not a passing gate."
    }'
    exit 0
  fi
  ARCH_OUT=""
  ARCH_RC=0
  if command -v uv >/dev/null 2>&1; then
    ARCH_OUT=$(uv run --quiet scripts/check_architecture.py --hard-only --quiet 2>&1)
    ARCH_RC=$?
  elif python3 -c 'import yaml' >/dev/null 2>&1; then
    ARCH_OUT=$(python3 scripts/check_architecture.py --hard-only --quiet 2>&1)
    ARCH_RC=$?
  else
    jq -n '{
      decision: "block",
      reason: "Architecture gate cannot run: neither uv nor a python3 with PyYAML is available. Install uv (https://docs.astral.sh/uv/) before stopping."
    }'
    exit 0
  fi
  if [ "$ARCH_RC" -ne 0 ]; then
    ARCH_REASON="Architecture gate failed (check_architecture.py exit ${ARCH_RC}). Resolve before stopping:

${ARCH_OUT}"
    jq -n --arg reason "$ARCH_REASON" '{
      decision: "block",
      reason: $reason
    }'
    exit 0
  fi

  # Module-shape gate — check_module_rules.py (max public functions).
  if [ ! -f scripts/check_module_rules.py ]; then
    block "Module-shape gate cannot run: scripts/check_module_rules.py is missing. Restore it before stopping — re-run the agentic-skeleton bootstrap. A missing gate is not a passing gate."
  fi
  MOD_OUT=""
  MOD_RC=0
  if command -v uv >/dev/null 2>&1; then
    MOD_OUT=$(uv run --quiet scripts/check_module_rules.py --quiet 2>&1)
    MOD_RC=$?
  elif python3 -c 'import yaml' >/dev/null 2>&1; then
    MOD_OUT=$(python3 scripts/check_module_rules.py --quiet 2>&1)
    MOD_RC=$?
  else
    block "Module-shape gate cannot run: neither uv nor a python3 with PyYAML is available. Install uv (https://docs.astral.sh/uv/) before stopping."
  fi
  if [ "$MOD_RC" -ne 0 ]; then
    block "Module-shape gate failed (check_module_rules.py exit ${MOD_RC}). Resolve before stopping:

${MOD_OUT}"
  fi
fi

# --- Check 5: lint gate (VIBE.yaml quality_gates.lint.required) ---
if [ -f VIBE.yaml ] && [ "$(gate_required lint)" = "true" ]; then
  if [ ! -f Makefile ] || ! command -v make >/dev/null 2>&1; then
    block "Lint gate cannot run: Makefile or 'make' is missing while quality_gates.lint.required is true. A gate that cannot run is not a passing gate — restore the standard Makefile."
  fi
  LINT_OUT=$(make lint 2>&1) || block "Lint gate failed (make lint). quality_gates.lint.required is true — resolve before stopping:

${LINT_OUT}"
fi

# --- Check 6: typecheck gate (VIBE.yaml quality_gates.typecheck.required) ---
if [ -f VIBE.yaml ] && [ "$(gate_required typecheck)" = "true" ]; then
  if [ ! -f Makefile ] || ! command -v make >/dev/null 2>&1; then
    block "Typecheck gate cannot run: Makefile or 'make' is missing while quality_gates.typecheck.required is true. Restore the standard Makefile."
  fi
  TC_OUT=$(make typecheck 2>&1) || block "Typecheck gate failed (make typecheck). quality_gates.typecheck.required is true — resolve before stopping:

${TC_OUT}"
fi

# All clear — allow stop.
exit 0
