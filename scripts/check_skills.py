#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0"]
# ///
"""check_skills.py — advisory provenance + drift report for a repo.

Reads the `skills:` block of a VIBE.yaml (or WORKSPACE.yaml) and reports
two things, both ADVISORY by default (exit 0):

  1. DRIFT — for each recorded skill, compare the recorded version to the
     installed skill's current VERSION. `behind` = the skill moved on
     since this repo applied it. Unlike skeleton file-drift this cannot
     be auto-synced: the repo's code was written under the old guidance,
     so it is a heads-up, not a failure.

  2. UNSTAMPED — a repo that carries a composable skill's namespace block
     (e.g. `react:`, `docker:`) but has no matching `skills:` entry: the
     skill shaped this repo but was never recorded. Fix: `make
     stamp-skill SKILL=<id>`.

`--strict` promotes any drift/unstamped finding to a non-zero exit for
repos that want it as a hard gate.

Usage:
  check_skills.py
  check_skills.py --file WORKSPACE.yaml --strict
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

import yaml

DEFAULT_SEARCH = "~/.claude/skills:~/.codex/skills"

_TTY = sys.stderr.isatty() and "NO_COLOR" not in os.environ
_R = "\033[31m" if _TTY else ""
_G = "\033[32m" if _TTY else ""
_Y = "\033[33m" if _TTY else ""
_X = "\033[0m" if _TTY else ""


def _semver_tuple(v: str) -> tuple[int, ...] | None:
    if not re.match(r"^[0-9]+\.[0-9]+\.[0-9]+$", v or ""):
        return None
    return tuple(int(x) for x in v.split("."))


def _load(path: Path) -> dict:
    data = yaml.safe_load(path.read_text()) or {}
    if not isinstance(data, dict):
        print(f"{_R}✗ check_skills:{_X} {path} is not a mapping", file=sys.stderr)
        sys.exit(2)
    return data


def _installed(search: list[str]) -> tuple[dict[str, str], dict[str, str]]:
    """Return (skill_id -> installed VERSION, namespace -> owning skill_id)."""
    versions: dict[str, str] = {}
    ns_owner: dict[str, str] = {}
    for raw in search:
        root = Path(raw).expanduser()
        if not root.is_dir():
            continue
        for skill_md in sorted(root.glob("*/SKILL.md")):
            sid = skill_md.parent.name
            vf = skill_md.parent / "VERSION"
            if sid not in versions and vf.is_file():
                versions[sid] = vf.read_text().strip()
            m = re.match(r"^---\n(.*?)\n---\n", skill_md.read_text(), re.DOTALL)
            if not m:
                continue
            fm = yaml.safe_load(m.group(1)) or {}
            for ns in (fm.get("vibe_yaml_namespaces") or []):
                ns_owner.setdefault(ns, sid)
    return versions, ns_owner


def _report_drift(recorded: list[dict], versions: dict[str, str]) -> list[str]:
    findings = []
    for e in recorded:
        sid, rec = e.get("id"), str(e.get("version", ""))
        inst = versions.get(sid)
        if inst is None:
            print(f"  {_Y}?{_X} {sid}: recorded {rec}, not installed locally")
            continue
        rt, it = _semver_tuple(rec), _semver_tuple(inst)
        if rt is None or it is None or rt == it:
            print(f"  {_G}✓{_X} {sid}: {rec} (current)")
        elif rt < it:
            msg = f"{sid}: applied {rec}, installed {inst} — skill moved on"
            print(f"  {_Y}↑{_X} {msg}")
            findings.append(msg)
        else:
            print(f"  {_Y}↓{_X} {sid}: recorded {rec} newer than installed {inst}")
    return findings


def _report_unstamped(data: dict, recorded_ids: set[str], ns_owner: dict[str, str]) -> list[str]:
    findings = []
    for ns, owner in sorted(ns_owner.items()):
        if ns in data and owner not in recorded_ids:
            msg = f"{ns}: block present but {owner} not in skills: — run `make stamp-skill SKILL={owner}`"
            print(f"  {_Y}!{_X} {msg}")
            findings.append(msg)
    return findings


def main() -> int:
    ap = argparse.ArgumentParser(description="Advisory applied-skill provenance + drift report.")
    ap.add_argument("--file", help="target file (default: VIBE.yaml then WORKSPACE.yaml under --root)")
    ap.add_argument("--root", default=None)
    ap.add_argument("--skill-search-paths", default=DEFAULT_SEARCH)
    ap.add_argument("--strict", action="store_true", help="exit non-zero on any drift/unstamped finding")
    args = ap.parse_args()

    root = Path(args.root).resolve() if args.root else Path.cwd()
    target = None
    if args.file:
        target = Path(args.file) if os.path.isabs(args.file) else root / args.file
    else:
        for name in ("VIBE.yaml", "WORKSPACE.yaml"):
            if (root / name).is_file():
                target = root / name
                break
    if target is None or not target.is_file():
        print(f"{_G}✓ check_skills:{_X} no VIBE.yaml/WORKSPACE.yaml — skipped")
        return 0

    data = _load(target)
    recorded = [e for e in (data.get("skills") or []) if isinstance(e, dict)]
    search = [p for p in args.skill_search_paths.split(":") if p]
    versions, ns_owner = _installed(search)

    print(f"check_skills: {target.name} — {len(recorded)} recorded skill(s)")
    findings = _report_drift(recorded, versions)
    findings += _report_unstamped(data, {e.get("id") for e in recorded}, ns_owner)

    if not findings:
        print(f"{_G}✓ provenance current — nothing to reconcile.{_X}")
        return 0
    print(f"{_Y}• {len(findings)} advisory finding(s) above.{_X}")
    return 1 if args.strict else 0


if __name__ == "__main__":
    sys.exit(main())
