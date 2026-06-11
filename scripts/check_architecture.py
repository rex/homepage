#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0"]
# ///
"""check_architecture.py — the architecture gate. Fails closed.

Enforces VIBE.yaml `architecture.max_lines_per_file` across a repo's
source files. Exits 0 ONLY when every in-scope file is within the hard
limit (or the repo has no source files). A missing VIBE.yaml, a
malformed `architecture` policy, or a `scope_globs` matching zero files
is a non-zero error — a gate that cannot run is never a pass.

Scope is OPT-OUT: with no `architecture.scope_globs` the repo's whole
source tree is scanned (minus exclude_globs); `scope_globs` only
NARROWS, and one that matches zero files fails the gate. Line counts
match `wc -l` (newline bytes).

Exit codes: 0 clean / 1 hard violation / 2 config error / 3 no PyYAML.
Usage: check_architecture.py [--root DIR] [--hard-only] [--quiet]
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
        "check_architecture: PyYAML unavailable. Run via "
        "`uv run check_architecture.py` (the PEP 723 header installs "
        "it) or `pip install pyyaml`.\n"
    )
    sys.exit(3)


_TTY = sys.stderr.isatty() and "NO_COLOR" not in os.environ
_R = "\033[31m" if _TTY else ""
_G = "\033[32m" if _TTY else ""
_Y = "\033[33m" if _TTY else ""
_X = "\033[0m" if _TTY else ""


# Source-code extensions — the opt-out universe. Docs/data files
# (.md/.json/.yaml/...) are intentionally absent: a long Markdown file
# is not a god-file problem.
CODE_EXTS = frozenset({
    ".py", ".pyi", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".go", ".rs", ".rb", ".php", ".java", ".kt", ".kts", ".scala",
    ".swift", ".m", ".mm", ".c", ".h", ".cc", ".cpp", ".cxx", ".hpp",
    ".cs", ".sh", ".bash", ".zsh", ".lua", ".pl", ".r", ".ex", ".exs",
    ".vue", ".svelte", ".astro", ".sql", ".tf", ".gradle",
})

# Directories never walked: VCS, dependencies, build output, caches,
# agent config. Pruned before exclude_globs is even consulted.
PRUNE_DIRS = frozenset({
    ".git", ".hg", ".svn", "node_modules", ".venv", "venv", "env",
    "__pycache__", ".mypy_cache", ".ruff_cache", ".pytest_cache",
    ".tox", "dist", "build", "out", ".next", ".nuxt", ".svelte-kit",
    "target", "vendor", "Pods", "Carthage", ".terraform", ".serena",
    ".claude", "coverage", ".idea", ".gradle", ".dart_tool",
})


def die(code: int, msg: str) -> NoReturn:
    sys.stderr.write(f"{_R}✗ check_architecture:{_X} {msg}\n")
    sys.exit(code)


def _positive_int(value: object) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


def _string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str) and item]


def load_policy(repo: Path) -> dict:
    """Read and validate architecture policy. Exits 2 on any defect."""
    vibe = repo / "VIBE.yaml"
    if not vibe.is_file():
        die(2, f"no VIBE.yaml at {vibe}. The architecture gate requires a "
               "policy file and will not pass without one.")
    try:
        doc = yaml.safe_load(vibe.read_text(encoding="utf-8"))
    except (yaml.YAMLError, OSError) as exc:
        die(2, f"cannot read VIBE.yaml: {exc}")
    if not isinstance(doc, dict):
        die(2, "VIBE.yaml did not parse to a mapping.")
    arch = doc.get("architecture")
    if not isinstance(arch, dict):
        die(2, "VIBE.yaml has no `architecture:` block — line limits are "
               "undefined. Add one per the agentic-skeleton schema.")
    caps = arch.get("max_lines_per_file")
    if not isinstance(caps, dict):
        die(2, "VIBE.yaml `architecture.max_lines_per_file` is missing.")
    hard = caps.get("hard")
    if not _positive_int(hard):
        die(2, f"`architecture.max_lines_per_file.hard` must be a positive "
               f"integer; got {hard!r}.")
    soft = caps.get("soft")
    if not _positive_int(soft) or soft > hard:
        soft = hard
    return {
        "scope_globs": _string_list(arch.get("scope_globs")),
        "exclude_globs": _string_list(arch.get("exclude_globs")),
        "soft": int(soft),
        "hard": int(hard),
    }


def _glob_files(repo: Path, patterns: list[str]) -> set[Path]:
    matched: set[Path] = set()
    for pattern in patterns:
        try:
            hits = repo.glob(pattern)
        except (ValueError, OSError):
            continue
        for path in hits:
            if path.is_file():
                matched.add(path.resolve())
    return matched


def source_universe(repo: Path) -> set[Path]:
    """Every source file in the repo by extension, minus pruned dirs."""
    found: set[Path] = set()
    for dirpath, dirnames, filenames in os.walk(repo):
        dirnames[:] = [d for d in dirnames if d not in PRUNE_DIRS]
        for name in filenames:
            if os.path.splitext(name)[1].lower() in CODE_EXTS:
                found.add((Path(dirpath) / name).resolve())
    return found


def select_targets(repo: Path, policy: dict) -> list[Path]:
    """Resolve files to check. Exits 2 on a misconfigured scope."""
    excluded = _glob_files(repo, policy["exclude_globs"])
    if policy["scope_globs"]:
        candidate = _glob_files(repo, policy["scope_globs"])
        if not candidate:
            die(2, "architecture.scope_globs matched zero files. An "
                   "allowlist that matches nothing disables the gate "
                   "silently. Fix the globs, or remove scope_globs to "
                   "scan all source (opt-out is the safer default).")
        targets = candidate - excluded
        if not targets:
            die(2, "every architecture.scope_globs file is also matched "
                   "by exclude_globs — the gate would scan nothing.")
        return sorted(targets)
    return sorted(source_universe(repo) - excluded)


def count_lines(path: Path) -> int:
    """Newline-byte count — matches `wc -l`."""
    total = 0
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 16), b""):
            total += chunk.count(b"\n")
    return total


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Architecture gate — enforce VIBE.yaml line limits.")
    parser.add_argument("--root", default=None,
                        help="repo root (default: parent of scripts/)")
    parser.add_argument("--hard-only", action="store_true",
                        help="report only hard violations (the Stop hook)")
    parser.add_argument("--quiet", action="store_true",
                        help="suppress the scan summary; print only violations")
    args = parser.parse_args()

    repo = (Path(args.root).resolve() if args.root
            else Path(__file__).resolve().parent.parent)
    if not repo.is_dir():
        die(2, f"repo root is not a directory: {repo}")

    policy = load_policy(repo)
    targets = select_targets(repo, policy)
    soft, hard = policy["soft"], policy["hard"]

    if not targets:
        if not args.quiet:
            print(f"{_G}✓ check_architecture:{_X} no source files "
                  "detected — nothing to check.")
        return 0

    soft_hits: list[tuple[Path, int]] = []
    hard_hits: list[tuple[Path, int]] = []
    for path in targets:
        try:
            count = count_lines(path)
        except OSError as exc:
            die(2, f"cannot read in-scope file {path}: {exc}")
        if count > hard:
            hard_hits.append((path, count))
        elif count > soft:
            soft_hits.append((path, count))

    if not args.quiet:
        print(f"check_architecture: scanned {len(targets)} source "
              f"file(s) (soft={soft}, hard={hard})")

    if soft_hits and not args.hard_only:
        soft_hits.sort(key=lambda item: (-item[1], str(item[0])))
        print(f"{_Y}⚠ {len(soft_hits)} soft warning(s) — refactor signal, "
              f"not a failure:{_X}")
        for path, count in soft_hits:
            print(f"  ⚠  {path.relative_to(repo)} — {count} lines "
                  f"(soft limit {soft})")

    if hard_hits:
        hard_hits.sort(key=lambda item: (-item[1], str(item[0])))
        print(f"{_R}✗ {len(hard_hits)} HARD violation(s) — over the "
              f"{hard}-line hard limit:{_X}")
        for path, count in hard_hits:
            print(f"  ✗  {path.relative_to(repo)} — {count} lines "
                  f"({count - hard} over)")
        print("Refactor each file to the hard limit or below: split by "
              "responsibility, one concern per file. If a file is "
              "genuinely irreducible (generated code, a large static "
              "table), add it to architecture.exclude_globs in VIBE.yaml "
              "and note the exception in CHANGELOG.")
        return 1

    if not args.quiet:
        print(f"{_G}✓ check_architecture:{_X} all {len(targets)} file(s) "
              f"within the {hard}-line hard limit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
