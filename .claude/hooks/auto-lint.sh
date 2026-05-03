#!/usr/bin/env bash
# PostToolUse hook for Edit/MultiEdit/Write — runs formatters and linters
# on the file that was just touched. Deterministic style enforcement so the
# agent doesn't have to remember.
#
# Fires on: PostToolUse (matcher: Edit|MultiEdit|Write)
# Reads:    JSON tool_input.file_path from stdin
# Exits:    0 always (linters are advisory here; pre-commit is the hard gate)

set -uo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Nothing to lint? Silent exit.
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

case "$FILE" in
  *.py)
    command -v ruff >/dev/null 2>&1 && {
      ruff check --fix --quiet "$FILE" 2>&1 || true
      ruff format --quiet "$FILE" 2>&1 || true
    }
    # mypy in background; don't block the agent on type checks
    if command -v mypy >/dev/null 2>&1; then
      (mypy --no-error-summary "$FILE" > /tmp/mypy.$$.out 2>&1 && rm /tmp/mypy.$$.out) &
    fi
    ;;
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs)
    command -v npx >/dev/null 2>&1 && {
      npx --no-install prettier --write --log-level=warn "$FILE" 2>/dev/null || true
      npx --no-install eslint --fix --quiet "$FILE" 2>/dev/null || true
    }
    ;;
  *.go)
    command -v gofmt >/dev/null 2>&1 && gofmt -w "$FILE"
    command -v goimports >/dev/null 2>&1 && goimports -w "$FILE" 2>/dev/null || true
    ;;
  *.rs)
    command -v rustfmt >/dev/null 2>&1 && rustfmt --quiet "$FILE" 2>/dev/null || true
    ;;
  *.tf|*.tfvars)
    command -v terraform >/dev/null 2>&1 && terraform fmt "$FILE" >/dev/null 2>&1 || true
    ;;
  *.yml|*.yaml)
    if echo "$FILE" | grep -qE '(ansible|roles/|playbooks/|inventories/)' 2>/dev/null; then
      command -v ansible-lint >/dev/null 2>&1 && ansible-lint --fix "$FILE" 2>/dev/null || true
    fi
    ;;
  *.sh)
    command -v shellcheck >/dev/null 2>&1 && shellcheck -q "$FILE" 2>/dev/null || true
    ;;
esac

exit 0
