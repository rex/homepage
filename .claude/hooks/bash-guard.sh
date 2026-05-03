#!/usr/bin/env bash
# PreToolUse hook for Bash — the one that saves you from disaster.
# Blocks destructive commands before they run. `sudo` triggers an ask-confirm.
#
# Fires on: PreToolUse (matcher: Bash)
# Reads:    JSON tool_input from stdin
# Exits:    0 allow · 2 block (message to stderr) · JSON for ask-confirm
#
# Known false-positive: heredoc commit messages
#   `git commit -m "$(cat <<EOF ... rm -rf / ... EOF)"` is blocked because
#   the matched pattern (e.g. `rm -rf /`) appears in the command line, even
#   though it's the heredoc body, not a command being run. The hook can't
#   parse bash to distinguish quoted-string-in-heredoc from invocation.
#   Workaround: write the message to a temp file and use `git commit -F`:
#     cat > /tmp/commit-msg <<'EOF'
#     <message body, including any blocked-pattern strings>
#     EOF
#     git commit -S -F /tmp/commit-msg && rm /tmp/commit-msg
#   `-F <file>` puts only the file path on the command line; the body
#   never reaches the hook's regex.

set -uo pipefail

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# If no command, allow.
if [ -z "$CMD" ]; then
  exit 0
fi

DENY_PATTERNS=(
  'rm[[:space:]]+-rf?[[:space:]]+/'
  'rm[[:space:]]+-rf?[[:space:]]+~'
  'rm[[:space:]]+-rf?[[:space:]]+\*'
  ':\(\)\{.*:\|:.*\};:'
  'dd[[:space:]]+if=.*of=/dev/(sda|nvme|disk)'
  'mkfs\.'
  '>[[:space:]]*/dev/sda'
  'chmod[[:space:]]+-R[[:space:]]+777[[:space:]]+/'
  'curl[[:space:]]+.*\|[[:space:]]*(sudo[[:space:]]+)?(bash|sh|zsh)'
  'wget[[:space:]]+.*\|[[:space:]]*(sudo[[:space:]]+)?(bash|sh|zsh)'
  'terraform[[:space:]]+destroy'
  'terraform[[:space:]]+apply[[:space:]]+.*-auto-approve.*prod'
  'terraform[[:space:]]+state[[:space:]]+(rm|push|replace-provider)'
  'terraform[[:space:]]+force-unlock'
  'terraform[[:space:]]+(import|taint|untaint)'
  'kubectl[[:space:]]+delete[[:space:]]+(ns|namespace)[[:space:]]+(prod|production)'
  'DROP[[:space:]]+(DATABASE|TABLE|SCHEMA)'
  'TRUNCATE[[:space:]]+TABLE'
  'aws[[:space:]]+s3[[:space:]]+rb[[:space:]]+.*--force'
  'aws[[:space:]]+rds[[:space:]]+delete-db-instance'
  'git[[:space:]]+push[[:space:]]+.*--force.*origin[[:space:]]+(main|master)'
  'git[[:space:]]+push[[:space:]]+.*-f[[:space:]]+origin[[:space:]]+(main|master)'
  'ansible-playbook.*--limit[[:space:]]+all'
  'ansible-playbook[[:space:]]+.*prod.*(-i|--inventory)'
)

for pat in "${DENY_PATTERNS[@]}"; do
  if echo "$CMD" | grep -iE "$pat" >/dev/null 2>&1; then
    echo "🛑 BLOCKED by bash-guard: matches '$pat'" >&2
    echo "Run it yourself outside Claude if genuinely needed." >&2
    exit 2
  fi
done

# sudo → ask for confirmation (non-blocking, lets Claude Code prompt the human)
if echo "$CMD" | grep -E '^[[:space:]]*sudo[[:space:]]' >/dev/null 2>&1; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: "sudo — confirm before running"
    }
  }'
fi

exit 0
