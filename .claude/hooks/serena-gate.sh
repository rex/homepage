#!/usr/bin/env bash
# PreToolUse hook — blocks Read/Edit/Write/MultiEdit on code files.
#
# Purpose:
# Agents default to built-in Read/Edit over Serena's symbolic tools even
# when explicitly instructed not to. This hook makes the bad path impossible
# (not just discouraged) by hard-blocking those tools on code file extensions
# once Serena is initialized.
#
# Mechanism:
# - If .claude/serena-initialized is absent → exit 0 (Serena init still in
#   progress; native tools needed to explore the project).
# - If file_path is empty or not a code extension → exit 0 (config/docs are
#   fine to read with native tools).
# - Otherwise → exit 2 (tool call rejected, stderr shown to model with
#   explicit redirect to the correct Serena tool).
#
# Bash escape hatch: this hook does NOT intercept Bash(cat/grep/…). An agent
# that deliberately routes around it via Bash can still do so — that's a
# separate enforcement problem. This closes the easy path.
#
# To temporarily disarm: rm .claude/serena-initialized
#   (re-arms automatically once the agent re-completes the init chain)

set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

# Gate 1: Serena not yet initialized — allow everything.
[[ -f .claude/serena-initialized ]] || exit 0

# Gate 2: Parse the tool input.
INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

# No file_path in this tool call — not a file operation.
[[ -n "$FILE_PATH" ]] || exit 0

# Gate 3: Only block code file extensions where Serena has an advantage.
# Config/docs/templates (json, yaml, toml, md, txt, env) are fine with
# native tools — Serena's LSP adds no value there.
if printf '%s' "$FILE_PATH" | grep -qE '\.(py|pyi|ts|tsx|js|jsx|mjs|cjs|go|rs|java|kt|kts|rb|cs|cpp|cxx|cc|c|h|hpp|swift|php|lua|scala|dart|ex|exs|hs|clj|cljs|ml|mli|fs|fsx|elm|cr|nim|zig|v|sol)$'; then
  TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name')
  {
    echo "🔴 SERENA GATE: '$TOOL' on code files is blocked."
    echo ""
    echo "Use Serena's symbolic tools instead:"
    echo "  Read    → mcp__serena__get_symbols_overview(file)"
    echo "            then mcp__serena__find_symbol(name, include_body=true)"
    echo "  Edit    → mcp__serena__replace_symbol_body(name, new_body)"
    echo "            or  mcp__serena__replace_content(path, pattern, replacement)"
    echo "  Write   → mcp__serena__create_text_file(path, content)"
    echo "  Search  → mcp__serena__search_for_pattern(pattern)"
    echo ""
    echo "If Serena tools are not yet loaded, run:"
    echo "  ToolSearch(query=\"select:mcp__serena__get_symbols_overview,mcp__serena__find_symbol,mcp__serena__replace_symbol_body,mcp__serena__replace_content,mcp__serena__search_for_pattern\")"
    echo ""
    echo "To bypass (read a non-code file, or Serena unavailable):"
    echo "  Use Bash(cat <path>) — hooks do not intercept Bash."
  } >&2
  exit 2
fi

exit 0
