#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///
"""bump_version.py — rewrite VERSION + seed a CHANGELOG header.

Behavior:
  1. Reads VERSION (default "0.1.0" if missing).
  2. Computes the new version per semver rules:
       major: X+1.0.0
       minor: X.Y+1.0
       patch: X.Y.Z+1
  3. Writes the new VERSION.
  4. Inserts a new `## [X.Y.Z] — YYYY-MM-DD — Agent: <name>` header
     above the FIRST existing `## [` heading in CHANGELOG.md — semver or
     date-based alike, fenced code examples excluded (creates CHANGELOG
     if missing). If --changelog-note is given, places a matching bullet
     under "### Changed" (or Fixed/Added/Removed if the note starts with
     a recognized keyword).
  5. Stages VERSION and CHANGELOG.md if a git repo is present.

Exit codes:
  0  ok
  1  malformed VERSION
  2  invalid arguments
  3  changelog write failed

Intended callers:
  - `make bump-{patch|minor|major}` Makefile targets
  - `auto-commit.sh` hook
  - Humans at the CLI
"""

from __future__ import annotations

import argparse
import datetime
import os
import re
import subprocess
import sys
from pathlib import Path


_TTY = sys.stderr.isatty() and "NO_COLOR" not in os.environ
_R = "\033[31m" if _TTY else ""
_G = "\033[32m" if _TTY else ""
_Y = "\033[33m" if _TTY else ""
_X = "\033[0m" if _TTY else ""

SEMVER_RE = re.compile(r"^([0-9]+)\.([0-9]+)\.([0-9]+)$")

CHANGELOG_HEADER = """\
# Changelog

All notable changes to this project are documented here. This project
follows [Semantic Versioning](https://semver.org/) and
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

"""


def _err(msg: str) -> None:
    print(f"{_R}ERROR:{_X} {msg}", file=sys.stderr)


def _warn(msg: str) -> None:
    print(f"{_Y}WARN:{_X} {msg}", file=sys.stderr)


def _ok(msg: str) -> None:
    print(f"{_G}✓{_X} {msg}")


def bump(current: str, level: str) -> str:
    m = SEMVER_RE.match(current)
    if not m:
        _err(f"VERSION file has non-semver content: {current}")
        sys.exit(1)
    major, minor, patch = (int(g) for g in m.groups())
    if level == "major":
        return f"{major + 1}.0.0"
    if level == "minor":
        return f"{major}.{minor + 1}.0"
    if level == "patch":
        return f"{major}.{minor}.{patch + 1}"
    _err(f"unknown bump level: {level}")
    sys.exit(2)


def _section_for_note(note: str) -> str:
    """Choose a Keep-a-Changelog section based on note's leading verb."""
    if not note:
        return "Changed"
    head = note.split()[0].lower()
    if head.startswith(("fix", "bug", "revert")):
        return "Fixed"
    if head.startswith(("add", "new", "introduc")):
        return "Added"
    if head.startswith(("remov", "delet", "drop")):
        return "Removed"
    if head.startswith("deprecat"):
        return "Deprecated"
    return "Changed"


def _first_entry_offset(text: str) -> int | None:
    """Offset of the first `## [` heading outside fenced code, else None.

    Any bracketed heading counts — semver (`## [1.2.3]`) or date-based
    (`## [2026-07-09]`), hyphen or em-dash after — so repos whose
    CHANGELOGs use date headers get new entries at the TOP rather than
    appended to the bottom. Fence tracking is what keeps the literal
    `## [X.Y.Z]` template inside the code-fence example some CHANGELOGs
    carry from matching (a bare regex would insert INSIDE the fence).
    """
    offset = 0
    in_fence = False
    for line in text.splitlines(keepends=True):
        if line.lstrip().startswith(("```", "~~~")):
            in_fence = not in_fence
        elif not in_fence and line.startswith("## ["):
            return offset
        offset += len(line)
    return None


def _insert_changelog_block(changelog_path: Path, header: str, section: str, note: str) -> None:
    if changelog_path.is_file():
        text = changelog_path.read_text()
    else:
        text = CHANGELOG_HEADER

    block_lines = [header, f"### {section}"]
    block_lines.append(f"- {note}" if note else "- _(fill in — what changed in this version)_")
    block_lines.append("")
    block = "\n".join(block_lines) + "\n"

    pos = _first_entry_offset(text)
    if pos is not None:
        text = text[:pos] + block + text[pos:]
    else:
        if not text.endswith("\n"):
            text += "\n"
        text += "\n" + block

    changelog_path.write_text(text)


def _bump_package_json(new_version: str) -> Path | None:
    """Update package.json's top-level "version" field if present.

    Returns the path that was rewritten, or None if package.json is
    absent / has no version field. Only the FIRST `"version": "x.y.z"`
    occurrence is replaced — that's the top-level project version.
    """
    pkg_path = Path("package.json")
    if not pkg_path.is_file():
        return None
    text = pkg_path.read_text()
    new_text, n = re.subn(
        r'("version"\s*:\s*)"[0-9]+\.[0-9]+\.[0-9]+"',
        rf'\1"{new_version}"',
        text,
        count=1,
    )
    if n == 0:
        _warn("package.json present but has no semver version field — skipping")
        return None
    pkg_path.write_text(new_text)
    return pkg_path


def _stage_in_git(*paths: Path) -> bool:
    try:
        subprocess.run(
            ["git", "rev-parse", "--git-dir"],
            capture_output=True, check=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False
    subprocess.run(["git", "add", *(str(p) for p in paths)], check=False)
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Bump VERSION + seed a CHANGELOG entry.")
    parser.add_argument("level", choices=["major", "minor", "patch"], help="bump level")
    parser.add_argument("--changelog-note", default="",
                        help="one-line description for the CHANGELOG bullet")
    parser.add_argument("--agent", default=os.environ.get("AGENT_NAME", "Claude"),
                        help="who's bumping (defaults to $AGENT_NAME or 'Claude')")
    args = parser.parse_args()

    version_file = Path("VERSION")
    if not version_file.is_file():
        version_file.write_text("0.1.0\n")
        _warn("VERSION file missing — seeded at 0.1.0")

    current = version_file.read_text().strip()
    new = bump(current, args.level)
    version_file.write_text(f"{new}\n")
    _ok(f"VERSION: {current} → {new}")

    today = datetime.date.today().isoformat()
    header = f"## [{new}] — {today} — Agent: {args.agent}"
    section = _section_for_note(args.changelog_note)
    changelog = Path("CHANGELOG.md")
    _insert_changelog_block(changelog, header, section, args.changelog_note)
    _ok(f"CHANGELOG: wrote header {header}")

    pkg = _bump_package_json(new)
    if pkg is not None:
        _ok(f"package.json: version → {new}")

    staged_paths = [version_file, changelog]
    if pkg is not None:
        staged_paths.append(pkg)
    if _stage_in_git(*staged_paths):
        names = " + ".join(p.name for p in staged_paths)
        _ok(f"staged {names}")

    print(f"\n{_G}New version:{_X} {new}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
