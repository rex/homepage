#!/usr/bin/env bash
# Agent-behavior hook (invoked by the /ship slash command). Appends an
# agent-attributed entry to CHANGELOG.md when a slice is marked done.
#
# Reads arguments: <agent-name> <section> <description>
#   agent-name:  "Claude" | "Codex" | "Gemini" | etc.
#   section:     "Added" | "Changed" | "Fixed" | "Removed" | "Deprecated"
#   description: one-line imperative description of the change
#
# Exits: 0 success · 1 failure

set -uo pipefail

AGENT="${1:-Claude}"
SECTION="${2:-Changed}"
DESC="${3:-}"

if [ -z "$DESC" ]; then
  echo "changelog-append: description required." >&2
  exit 1
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

if [ ! -f CHANGELOG.md ]; then
  # Bootstrap CHANGELOG if missing
  cat > CHANGELOG.md <<'EOF'
# Changelog

All notable changes to this project are documented here.

EOF
fi

DATE=$(date -u +%Y-%m-%d)
ENTRY=$(mktemp)

# Find the first existing entry for today+agent to collapse into it; otherwise new header
if grep -qE "^## \[${DATE}\] — Agent: ${AGENT}\$" CHANGELOG.md; then
  # Append under existing header in the named section, or add the section
  python3 - "$DATE" "$AGENT" "$SECTION" "$DESC" <<'PYEOF'
import re
import sys

date, agent, section, desc = sys.argv[1:5]
path = "CHANGELOG.md"
with open(path) as f:
    txt = f.read()

header_re = re.compile(rf"(^## \[{re.escape(date)}\] — Agent: {re.escape(agent)}\n)",
                       re.MULTILINE)
m = header_re.search(txt)
if not m:
    print("header lookup failed", file=sys.stderr)
    sys.exit(1)

start = m.end()
# Find the next "## " (next entry) to scope our section search
next_entry = re.search(r"^## ", txt[start:], re.MULTILINE)
block_end = start + (next_entry.start() if next_entry else len(txt) - start)
block = txt[start:block_end]

section_re = re.compile(rf"^### {re.escape(section)}$", re.MULTILINE)
ms = section_re.search(block)
if ms:
    insert_at = start + ms.end() + 1  # after "### Section\n"
    new_block = f"- {desc}\n"
    txt = txt[:insert_at] + new_block + txt[insert_at:]
else:
    # Add a new section at the start of the block
    new_section = f"### {section}\n- {desc}\n\n"
    txt = txt[:start] + new_section + txt[start:]

with open(path, "w") as f:
    f.write(txt)
PYEOF
else
  # Create a new dated+attributed entry at the top of the "history" block
  cat > "$ENTRY" <<EOF
## [${DATE}] — Agent: ${AGENT}
### ${SECTION}
- ${DESC}

EOF
  # Insert after the "# Changelog" header and any intro paragraph
  python3 - "$ENTRY" <<'PYEOF'
import sys

entry_path = sys.argv[1]
with open(entry_path) as f:
    entry = f.read()

path = "CHANGELOG.md"
with open(path) as f:
    txt = f.read()

# Find the first "## [" header; insert our new entry before it
import re
m = re.search(r"^## \[", txt, re.MULTILINE)
if m:
    txt = txt[:m.start()] + entry + txt[m.start():]
else:
    # No prior entries — append to end
    if not txt.endswith("\n"):
        txt += "\n"
    txt += entry

with open(path, "w") as f:
    f.write(txt)
PYEOF
fi

rm -f "$ENTRY"
echo "changelog-append: $AGENT / $SECTION — $DESC"
exit 0
