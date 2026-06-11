#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0"]
# ///
"""check_module_rules.py — the module-shape gate. Fails closed.

Enforces VIBE.yaml `architecture.max_public_functions_per_module`. A
module that exposes too many public entry points is a god-module; this
counts public top-level declarations (functions, classes) per source
file with language-aware heuristics and compares against the cap.

Scope is the SAME opt-out universe as check_architecture.py:
`architecture.scope_globs` empty = scan every source file, minus
`exclude_globs`. A missing VIBE.yaml, a malformed `architecture`
block, or a scope_globs matching zero files is a non-zero error — a
gate that cannot run is never a pass. `max_public_functions_per_module:
null` is an explicit, declared opt-out (exit 0 with a notice).

Test files are not counted (many test functions != a god-module);
their line counts are still gated by check_architecture.py. Files in
languages with no heuristic are reported as a declared coverage
boundary, never silently passed.

Exit codes: 0 clean / 1 violation / 2 config error / 3 no PyYAML.
Usage: check_module_rules.py [--root DIR] [--quiet]
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path
from typing import NoReturn

try:
    import yaml
except ModuleNotFoundError:
    sys.stderr.write(
        "check_module_rules: PyYAML unavailable. Run via "
        "`uv run check_module_rules.py` or `pip install pyyaml`.\n"
    )
    sys.exit(3)


_TTY = sys.stderr.isatty() and "NO_COLOR" not in os.environ
_R = "\033[31m" if _TTY else ""
_G = "\033[32m" if _TTY else ""
_Y = "\033[33m" if _TTY else ""
_X = "\033[0m" if _TTY else ""


# Source extensions — the opt-out universe (same set as the line-limit
# gate). LANG_RULES below is the countable subset.
CODE_EXTS = frozenset({
    ".py", ".pyi", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".go", ".rs", ".rb", ".php", ".java", ".kt", ".kts", ".scala",
    ".swift", ".m", ".mm", ".c", ".h", ".cc", ".cpp", ".cxx", ".hpp",
    ".cs", ".sh", ".bash", ".zsh", ".lua", ".pl", ".r", ".ex", ".exs",
    ".vue", ".svelte", ".astro", ".sql", ".tf", ".gradle",
})

# Directories never walked: VCS, dependencies, build output, caches.
PRUNE_DIRS = frozenset({
    ".git", ".hg", ".svn", "node_modules", ".venv", "venv", "env",
    "__pycache__", ".mypy_cache", ".ruff_cache", ".pytest_cache",
    ".tox", "dist", "build", "out", ".next", ".nuxt", ".svelte-kit",
    "target", "vendor", "Pods", "Carthage", ".terraform", ".serena",
    ".claude", "coverage", ".idea", ".gradle", ".dart_tool",
})

# A test module with many test functions is not a god-module — skip
# test files for the entry-point count (line limits still apply).
_TEST_RE = re.compile(
    r"(^|/)(tests?|__tests__|specs?)(/)"
    r"|(test_[^/]+|[^/]+_test|[^/]+\.test|[^/]+\.spec)\.[^/.]+$"
)

# Per-language regex matching ONE public, top-level declaration.
# Heuristic and line-based — not a parser, but enough to catch a
# module that has sprouted far too many public entry points.
_PY = re.compile(r"^(?:async\s+def|def|class)\s+(?!_)[A-Za-z0-9]")
_TS = re.compile(
    r"^export\s+(?:default\s+)?(?:async\s+)?"
    r"(?:function\b|class\b|abstract\s+class\b"
    r"|const\s+[A-Za-z]|let\s+[A-Za-z]|var\s+[A-Za-z])"
)
_GO = re.compile(r"^func\s+(?:\([^)]*\)\s*)?[A-Z]")
_KT = re.compile(
    r"^(?!private\b|internal\b)(?:public\s+|open\s+|abstract\s+|"
    r"sealed\s+|data\s+|final\s+)*(?:fun|class|object|interface)\s"
)
_SWIFT = re.compile(
    r"^(?:public|open)\s+(?:final\s+)?(?:func|class|struct|enum|"
    r"protocol|extension|actor)\b"
)

LANG_RULES = {
    ".py": _PY, ".pyi": _PY,
    ".ts": _TS, ".tsx": _TS, ".js": _TS, ".jsx": _TS,
    ".mjs": _TS, ".cjs": _TS,
    ".go": _GO, ".kt": _KT, ".kts": _KT, ".swift": _SWIFT,
}


def die(code: int, msg: str) -> NoReturn:
    sys.stderr.write(f"{_R}✗ check_module_rules:{_X} {msg}\n")
    sys.exit(code)


def _string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str) and item]


def load_policy(repo: Path) -> dict:
    """Read + validate the module-rule policy. Exits 2 on any defect."""
    vibe = repo / "VIBE.yaml"
    if not vibe.is_file():
        die(2, f"no VIBE.yaml at {vibe}. The module-rules gate requires "
               "a policy file and will not pass without one.")
    try:
        doc = yaml.safe_load(vibe.read_text(encoding="utf-8"))
    except (yaml.YAMLError, OSError) as exc:
        die(2, f"cannot read VIBE.yaml: {exc}")
    if not isinstance(doc, dict):
        die(2, "VIBE.yaml did not parse to a mapping.")
    arch = doc.get("architecture")
    if not isinstance(arch, dict):
        die(2, "VIBE.yaml has no `architecture:` block — module rules "
               "are undefined. Add one per the agentic-skeleton schema.")
    cap = arch.get("max_public_functions_per_module", 8)
    if cap is not None and not (
        isinstance(cap, int) and not isinstance(cap, bool) and cap > 0
    ):
        die(2, "`architecture.max_public_functions_per_module` must be "
               f"a positive integer or null; got {cap!r}.")
    return {
        "cap": cap,
        "scope_globs": _string_list(arch.get("scope_globs")),
        "exclude_globs": _string_list(arch.get("exclude_globs")),
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
    """Resolve in-scope files. Exits 2 on a misconfigured scope."""
    excluded = _glob_files(repo, policy["exclude_globs"])
    if policy["scope_globs"]:
        candidate = _glob_files(repo, policy["scope_globs"])
        if not candidate:
            die(2, "architecture.scope_globs matched zero files — an "
                   "allowlist that matches nothing disables the gate. "
                   "Fix the globs or remove scope_globs (opt-out is the "
                   "safer default).")
        targets = candidate - excluded
    else:
        targets = source_universe(repo) - excluded
    return sorted(p for p in targets if not _TEST_RE.search(p.as_posix()))


def count_public(path: Path) -> int:
    """Count public top-level declarations using the language rule."""
    rule = LANG_RULES[path.suffix.lower()]
    total = 0
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            if rule.match(line):
                total += 1
    return total


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Module-shape gate — enforce VIBE.yaml "
                    "architecture.max_public_functions_per_module.")
    parser.add_argument("--root", default=None,
                        help="repo root (default: parent of scripts/)")
    parser.add_argument("--quiet", action="store_true",
                        help="suppress the scan summary; print only "
                             "violations")
    args = parser.parse_args()

    repo = (Path(args.root).resolve() if args.root
            else Path(__file__).resolve().parent.parent)
    if not repo.is_dir():
        die(2, f"repo root is not a directory: {repo}")

    policy = load_policy(repo)
    cap = policy["cap"]
    if cap is None:
        if not args.quiet:
            print(f"{_G}✓ check_module_rules:{_X} "
                  "max_public_functions_per_module is null — module "
                  "entry-point counting is a declared opt-out.")
        return 0

    targets = select_targets(repo, policy)
    countable = [p for p in targets if p.suffix.lower() in LANG_RULES]
    uncovered = sorted({p.suffix.lower() for p in targets
                        if p.suffix.lower() not in LANG_RULES})

    violations: list[tuple[Path, int]] = []
    for path in countable:
        try:
            found = count_public(path)
        except OSError as exc:
            die(2, f"cannot read in-scope file {path}: {exc}")
        if found > cap:
            violations.append((path, found))

    if not args.quiet:
        print(f"check_module_rules: scanned {len(countable)} countable "
              f"source file(s) (cap={cap} public entry points/module)")
        if uncovered:
            print(f"{_Y}  note:{_X} no public-entry-point heuristic for "
                  f"{', '.join(uncovered)} — those files not counted.")

    if violations:
        violations.sort(key=lambda item: (-item[1], str(item[0])))
        print(f"{_R}✗ {len(violations)} module(s) over the "
              f"{cap}-public-entry-point limit:{_X}")
        for path, found in violations:
            print(f"  ✗  {path.relative_to(repo)} — {found} public "
                  f"entry points ({found - cap} over)")
        print("Split each module by responsibility — one resource or "
              "one operation-family per file. If a file is genuinely "
              "irreducible, add it to architecture.exclude_globs in "
              "VIBE.yaml and note the exception in CHANGELOG.")
        return 1

    if not args.quiet:
        print(f"{_G}✓ check_module_rules:{_X} all {len(countable)} "
              f"module(s) within the {cap}-entry-point limit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
