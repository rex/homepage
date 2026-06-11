#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0"]
# ///
"""check_docs.py — the required-collaboration-files gate. Fails closed.

Enforces VIBE.yaml `docs.*_required`. When a doc is required, the file
must exist; CLAUDE.md, when required, must additionally be a symlink to
AGENTS.md (the agent-cross-tool convention). A missing VIBE.yaml or a
malformed `docs` block is a non-zero error — a gate that cannot run is
never a pass.

Exit codes: 0 clean / 1 a required doc is missing / 2 config error /
3 no PyYAML.
Usage: check_docs.py [--root DIR] [--quiet]
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import NoReturn

try:
    import yaml
except ModuleNotFoundError:
    sys.stderr.write(
        "check_docs: PyYAML unavailable. Run via `uv run check_docs.py` "
        "or `pip install pyyaml`.\n"
    )
    sys.exit(3)


_TTY = sys.stderr.isatty() and "NO_COLOR" not in os.environ
_R = "\033[31m" if _TTY else ""
_G = "\033[32m" if _TTY else ""
_X = "\033[0m" if _TTY else ""


# VIBE.yaml docs flag -> (filename, symlink-target-or-None). The flag
# default is True: absence means "required", never "disabled".
DOC_RULES = (
    ("agents_md_required", "AGENTS.md", None),
    ("claude_md_required", "CLAUDE.md", "AGENTS.md"),
    ("task_state_required", "TASK_STATE.md", None),
    ("vibe_yaml_required", "VIBE.yaml", None),
)


def die(code: int, msg: str) -> NoReturn:
    sys.stderr.write(f"{_R}✗ check_docs:{_X} {msg}\n")
    sys.exit(code)


def load_docs_policy(repo: Path) -> dict:
    """Read + validate the docs policy. Exits 2 on any defect."""
    vibe = repo / "VIBE.yaml"
    if not vibe.is_file():
        die(2, f"no VIBE.yaml at {vibe}. The docs gate requires a "
               "policy file and will not pass without one.")
    try:
        doc = yaml.safe_load(vibe.read_text(encoding="utf-8"))
    except (yaml.YAMLError, OSError) as exc:
        die(2, f"cannot read VIBE.yaml: {exc}")
    if not isinstance(doc, dict):
        die(2, "VIBE.yaml did not parse to a mapping.")
    docs = doc.get("docs")
    if docs is None:
        docs = {}
    if not isinstance(docs, dict):
        die(2, "VIBE.yaml `docs:` is present but is not a mapping.")
    for key, _name, _link in DOC_RULES:
        if not isinstance(docs.get(key, True), bool):
            die(2, f"VIBE.yaml `docs.{key}` must be true or false; "
                   f"got {docs.get(key)!r}.")
    return docs


def check_symlink(path: Path, expected: str) -> bool:
    """True if path is a symlink whose target basename == expected."""
    if not path.is_symlink():
        return False
    try:
        return Path(os.readlink(path)).name == expected
    except OSError:
        return False


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Docs gate — enforce VIBE.yaml docs.*_required.")
    parser.add_argument("--root", default=None,
                        help="repo root (default: parent of scripts/)")
    parser.add_argument("--quiet", action="store_true",
                        help="suppress the pass summary")
    args = parser.parse_args()

    repo = (Path(args.root).resolve() if args.root
            else Path(__file__).resolve().parent.parent)
    if not repo.is_dir():
        die(2, f"repo root is not a directory: {repo}")

    docs = load_docs_policy(repo)
    failures: list[str] = []
    checked = 0

    for key, name, link_target in DOC_RULES:
        if not docs.get(key, True):
            continue
        checked += 1
        path = repo / name
        if not path.exists() and not path.is_symlink():
            failures.append(f"{name} is required (docs.{key}) but is "
                            "missing.")
            continue
        if link_target is not None and not check_symlink(path, link_target):
            failures.append(f"{name} must be a symlink to "
                            f"{link_target} (agent-cross-tool "
                            "convention); it is not.")

    if failures:
        print(f"{_R}✗ {len(failures)} required-docs violation(s):{_X}")
        for line in failures:
            print(f"  ✗  {line}")
        print("Create the missing collaboration files — they are how "
              "agents carry context across sessions. See the "
              "agentic-skeleton templates.")
        return 1

    if not args.quiet:
        print(f"{_G}✓ check_docs:{_X} all {checked} required "
              "collaboration file(s) present.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
