#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["ruamel.yaml>=0.18"]
# ///
"""stamp_skill.py — record that a skill was applied to this repo.

Upserts an entry into the `skills:` provenance list of a repo's VIBE.yaml
(or a workspace's WORKSPACE.yaml), preserving comments and layout via a
ruamel round-trip. One entry per skill id: re-stamping updates the
existing entry in place instead of appending a duplicate.

The skill version is resolved in order:
  1. --version X.Y.Z (explicit), else
  2. <search-path>/<skill-id>/VERSION from an installed skills dir.

This generalizes `.claude/skeleton-version` (a single-skill stamp) to
every skill that shapes a repo — lang-*, tool-*, agentic-*, incl.
agentic-skeleton itself.

Usage:
  stamp_skill.py lang-react
  stamp_skill.py agentic-skeleton --version 0.42.0 --source sync
  stamp_skill.py agentic-workspace --file WORKSPACE.yaml
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from datetime import date
from pathlib import Path

from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap, CommentedSeq
from ruamel.yaml.scalarstring import DoubleQuotedScalarString as DQ

SEMVER_RE = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")
DEFAULT_SEARCH = "~/.claude/skills:~/.codex/skills"
SOURCES = ("scaffold", "skill-apply", "sync", "transcript-backfill", "manual")

_TTY = sys.stderr.isatty() and "NO_COLOR" not in os.environ
_R = "\033[31m" if _TTY else ""
_G = "\033[32m" if _TTY else ""
_Y = "\033[33m" if _TTY else ""
_X = "\033[0m" if _TTY else ""


def _die(msg: str, code: int = 2) -> None:
    print(f"{_R}✗ stamp_skill:{_X} {msg}", file=sys.stderr)
    sys.exit(code)


def _resolve_version(skill_id: str, explicit: str | None, search: list[str]) -> str:
    if explicit:
        v = explicit.strip()
    else:
        v = None
        for raw in search:
            vf = Path(raw).expanduser() / skill_id / "VERSION"
            if vf.is_file():
                v = vf.read_text().strip()
                break
        if v is None:
            _die(
                f"cannot resolve version for '{skill_id}': no VERSION found under "
                f"{', '.join(search)}. Pass --version X.Y.Z explicitly."
            )
    if not SEMVER_RE.match(v):
        _die(f"version for '{skill_id}' is not semver: '{v}'")
    return v


def _find_target(file_arg: str | None, root: Path) -> Path:
    if file_arg:
        p = (root / file_arg) if not os.path.isabs(file_arg) else Path(file_arg)
        if not p.is_file():
            _die(f"target file not found: {p}")
        return p
    for name in ("VIBE.yaml", "WORKSPACE.yaml"):
        p = root / name
        if p.is_file():
            return p
    _die(f"no VIBE.yaml or WORKSPACE.yaml under {root} (pass --file)")


def stamp(target: Path, skill_id: str, version: str, applied: str, source: str) -> str:
    """Upsert one provenance entry. Returns 'added' or 'updated'."""
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.indent(mapping=2, sequence=4, offset=2)
    data = yaml.load(target.read_text())
    if not isinstance(data, dict):
        _die(f"{target} did not parse as a mapping")
    skills = data.get("skills")
    if skills is None:
        skills = CommentedSeq()
        data["skills"] = skills
    if not isinstance(skills, list):
        _die(f"{target}: `skills:` exists but is not a list")

    outcome = "added"
    for entry in skills:
        if isinstance(entry, dict) and entry.get("id") == skill_id:
            entry["version"] = DQ(version)
            entry["applied"] = applied
            entry["source"] = source
            outcome = "updated"
            break
    else:
        item = CommentedMap()
        item["id"] = skill_id
        item["version"] = DQ(version)
        item["applied"] = applied
        item["source"] = source
        skills.append(item)

    with target.open("w") as fh:
        yaml.dump(data, fh)
    return outcome


def main() -> int:
    ap = argparse.ArgumentParser(description="Stamp applied-skill provenance into VIBE.yaml / WORKSPACE.yaml.")
    ap.add_argument("skill_id", help="skill directory name, e.g. lang-react")
    ap.add_argument("--version", help="skill version (else resolved from installed VERSION)")
    ap.add_argument("--applied", default=date.today().isoformat(), help="ISO date (default: today)")
    ap.add_argument("--source", default="skill-apply", choices=SOURCES)
    ap.add_argument("--file", help="target file (default: VIBE.yaml then WORKSPACE.yaml under --root)")
    ap.add_argument("--root", default=None, help="repo/workspace root (default: cwd)")
    ap.add_argument("--skill-search-paths", default=DEFAULT_SEARCH)
    args = ap.parse_args()

    root = Path(args.root).resolve() if args.root else Path.cwd()
    search = [p for p in args.skill_search_paths.split(":") if p]
    version = _resolve_version(args.skill_id, args.version, search)
    target = _find_target(args.file, root)
    outcome = stamp(target, args.skill_id, version, args.applied, args.source)
    print(f"{_G}✓ stamp_skill:{_X} {outcome} {args.skill_id}@{version} "
          f"({args.source}) → {target.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
