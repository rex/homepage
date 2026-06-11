#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///
"""sync_skeleton.py — keep a repo's skeleton-owned files current.

Scaffolded / retrofitted repos hold COPIES of agentic-skeleton's shared
files: the gate scripts and the whole `.claude/` tooling tree (hooks,
slash commands, subagent definitions, rules). When the skeleton updates
those, the copies drift. This is the propagation engine.

Modes:
  --check (default)  Report which skeleton-owned files differ from the
                     installed skeleton. Exit 0 = in sync, 1 = drift,
                     2 = cannot run (skeleton not found / corrupt).
  --apply            Copy the skeleton's current version of every
                     drifted VERBATIM file into the repo, delete any
                     RETIRED file, stamp `.claude/skeleton-version`, and
                     install the post-commit auto-push git hook when
                     absent (commit = push is part of the toolchain).

File classes:
  VERBATIM  — gate scripts + every file under .claude/{hooks,commands,
              agents,rules}. Pure skeleton property; copied as-is.
  ADVISORY  — Makefile, .pre-commit-config.yaml, .claude/settings.json.
              Skeleton-owned in STRUCTURE but carrying repo-specific
              content; drift is reported, never blind-copied — reconcile
              with judgment (see /agentic-checkup).
  RETIRED   — files the skeleton has dropped; `--apply` removes them.
  ORPHAN    — any other file in a managed .claude/ dir: reported for
              review, never touched (it may be a repo-local addition).

The skeleton is located via --skeleton DIR, else $AGENTIC_SKELETON_HOME,
else ~/.claude/skills/agentic-skeleton, else ~/.codex/skills/agentic-skeleton.
--check fails closed: if the skeleton cannot be found, drift cannot be
ruled out, so it exits non-zero rather than reporting "in sync".

Usage: sync_skeleton.py [--check|--apply] [--skeleton DIR] [--root DIR]
"""

from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import sys
from pathlib import Path
from typing import NoReturn

_TTY = sys.stderr.isatty() and "NO_COLOR" not in os.environ
_R = "\033[31m" if _TTY else ""
_G = "\033[32m" if _TTY else ""
_Y = "\033[33m" if _TTY else ""
_X = "\033[0m" if _TTY else ""

# Verbatim skeleton-owned scripts: pure skeleton property, never repo-
# customized — safe to hash-compare and copy. Synced into repo/scripts/.
VERBATIM_SCRIPTS = (
    "check_architecture.py", "check_module_rules.py", "check_docs.py",
    "check_version_bumped.py", "bump_version.py", "sync_skeleton.py",
)

# Verbatim .claude/ directories: every file the skeleton ships in each
# is skeleton property. greenfield is the canonical source.
#   (skeleton subdir, repo subdir, glob)
VERBATIM_CLAUDE_DIRS = (
    ("templates/greenfield/.claude/hooks", ".claude/hooks", "*.sh"),
    ("templates/greenfield/.claude/commands", ".claude/commands", "*.md"),
    ("templates/greenfield/.claude/agents", ".claude/agents", "*.md"),
    ("templates/greenfield/.claude/rules", ".claude/rules", "*.md"),
)

# Advisory files — skeleton-owned in STRUCTURE but carrying repo-specific
# content (Makefile recipe bodies, extra pre-commit hooks, repo-specific
# settings.json permissions). Drift is reported, never blind-copied.
ADVISORY = {
    "Makefile": "templates/standard/Makefile",
    ".pre-commit-config.yaml": "templates/standard/.pre-commit-config.yaml",
    ".claude/settings.json": "templates/greenfield/.claude/settings.json",
}

# Files the skeleton USED to ship and has since retired. `--apply`
# deletes them from the repo; `--check` reports them. An explicit list,
# never a heuristic — a repo-local file is never deleted by guesswork.
RETIRED = (
    ".claude/hooks/pre-compact.sh",
)

SKELETON_CANDIDATES = (
    "~/.claude/skills/agentic-skeleton",
    "~/.codex/skills/agentic-skeleton",
)


def die(code: int, msg: str) -> NoReturn:
    sys.stderr.write(f"{_R}✗ sync_skeleton:{_X} {msg}\n")
    sys.exit(code)


def find_skeleton(explicit: str | None) -> Path:
    """Locate the agentic-skeleton checkout. Exits 2 if not found."""
    marker = Path("scripts") / "check_architecture.py"
    if explicit:
        p = Path(explicit).expanduser().resolve()
        if not (p / marker).is_file():
            die(2, f"--skeleton {p} is not an agentic-skeleton checkout.")
        return p
    env = os.environ.get("AGENTIC_SKELETON_HOME")
    for cand in ([env] if env else []) + list(SKELETON_CANDIDATES):
        p = Path(cand).expanduser().resolve()
        if (p / marker).is_file():
            return p
    die(2, "could not locate the agentic-skeleton skill. Pass "
           "--skeleton DIR or set AGENTIC_SKELETON_HOME. Drift cannot be "
           "ruled out without it — failing closed.")


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 16), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_pairs(skeleton: Path, repo: Path) -> list[tuple[Path, Path, str]]:
    """Return [(repo_path, skeleton_path, kind), ...] for every
    skeleton-owned file. kind is 'verbatim' or 'advisory'."""
    pairs: list[tuple[Path, Path, str]] = []
    for name in VERBATIM_SCRIPTS:
        pairs.append((repo / "scripts" / name,
                      skeleton / "scripts" / name, "verbatim"))
    for skel_sub, repo_sub, glob in VERBATIM_CLAUDE_DIRS:
        skel_dir = skeleton / skel_sub
        if skel_dir.is_dir():
            for f in sorted(skel_dir.glob(glob)):
                pairs.append((repo / repo_sub / f.name, f, "verbatim"))
    for repo_rel, skel_rel in ADVISORY.items():
        pairs.append((repo / repo_rel, skeleton / skel_rel, "advisory"))
    return pairs


def classify(repo_path: Path, skel_path: Path) -> str:
    """Return ok | drift | missing-repo | missing-skeleton."""
    if not skel_path.is_file():
        return "missing-skeleton"
    if not repo_path.is_file():
        return "missing-repo"
    return "ok" if file_sha(repo_path) == file_sha(skel_path) else "drift"


def find_orphans(repo: Path, pairs: list[tuple[Path, Path, str]]) -> list[Path]:
    """Files in a managed .claude/ dir that the skeleton does not own and
    are not RETIRED — surfaced for human review, never touched."""
    owned = {rp for rp, _sp, _k in pairs}
    retired = {repo / r for r in RETIRED}
    orphans: list[Path] = []
    for _skel_sub, repo_sub, glob in VERBATIM_CLAUDE_DIRS:
        managed = repo / repo_sub
        if managed.is_dir():
            for f in sorted(managed.glob(glob)):
                if f not in owned and f not in retired:
                    orphans.append(f)
    return orphans


def _print_orphans(repo: Path, orphans: list[Path]) -> None:
    print(f"{_Y}• {len(orphans)} orphan file(s) — in a managed .claude/ "
          f"dir but not skeleton-owned (left untouched, review):{_X}")
    for f in orphans:
        print(f"  • {f.relative_to(repo)}")


def autopush_state(repo: Path, skeleton: Path) -> str:
    """State of the post-commit auto-push git hook: installed | missing
    | foreign | worktree | no-git. 'Push every commit' is part of the
    standard toolchain, so --apply installs the hook when absent. The
    hooks dir itself may not exist (e.g. init.templateDir pointing at a
    missing template) — that still counts as missing, never a skip."""
    gitdir = repo / ".git"
    if not gitdir.exists():
        return "no-git"
    if not gitdir.is_dir():
        # .git is a file → linked worktree/submodule; hooks live in the
        # parent repo's gitdir. Surfaced, not auto-installed.
        return "worktree"
    dst = gitdir / "hooks" / "post-commit"
    src = skeleton / "scripts" / "git-hooks" / "post-commit-autopush.sh"
    if not dst.is_file():
        return "missing"
    if src.is_file() and file_sha(dst) == file_sha(src):
        return "installed"
    return "foreign"


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Sync a repo's skeleton-owned files.")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true",
                      help="report drift only (default)")
    mode.add_argument("--apply", action="store_true",
                      help="copy current skeleton verbatim files in")
    ap.add_argument("--skeleton", default=None,
                    help="agentic-skeleton checkout directory")
    ap.add_argument("--root", default=None,
                    help="repo root (default: current directory)")
    args = ap.parse_args()

    repo = Path(args.root).resolve() if args.root else Path.cwd()
    if not repo.is_dir():
        die(2, f"repo root is not a directory: {repo}")
    skeleton = find_skeleton(args.skeleton)
    vfile = skeleton / "VERSION"
    version = vfile.read_text().strip() if vfile.is_file() else "unknown"

    pairs = build_pairs(skeleton, repo)
    verbatim_drift: list[tuple[Path, Path, str]] = []
    advisory_drift: list[tuple[Path, str]] = []
    skel_missing: list[Path] = []
    for repo_path, skel_path, kind in pairs:
        state = classify(repo_path, skel_path)
        if state == "missing-skeleton":
            skel_missing.append(skel_path)
        elif state in ("drift", "missing-repo"):
            if kind == "advisory":
                advisory_drift.append((repo_path, state))
            else:
                verbatim_drift.append((repo_path, skel_path, state))

    if skel_missing:
        for p in skel_missing:
            sys.stderr.write(f"{_R}  skeleton missing:{_X} {p}\n")
        die(2, "the skeleton is missing files it should own — it may be "
               "corrupt or too old. Cannot verify drift.")

    retired_present = [repo / r for r in RETIRED if (repo / r).is_file()]
    orphans = find_orphans(repo, pairs)
    autopush = autopush_state(repo, skeleton)

    print(f"sync_skeleton: {repo.name} vs agentic-skeleton v{version}")
    if (not verbatim_drift and not advisory_drift and not retired_present
            and not (args.apply and autopush == "missing")):
        print(f"{_G}✓ in sync — every skeleton-owned file is current.{_X}")
        if autopush == "missing":
            print(f"{_Y}• post-commit auto-push hook not installed — "
                  f"`--apply` / `make sync-skeleton` installs it.{_X}")
        if orphans:
            _print_orphans(repo, orphans)
        return 0

    if args.apply:
        for repo_path, skel_path, _state in verbatim_drift:
            repo_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(skel_path, repo_path)
            if repo_path.suffix in (".py", ".sh"):
                repo_path.chmod(repo_path.stat().st_mode | 0o111)
            print(f"  {_G}synced{_X}  {repo_path.relative_to(repo)}")
        for retired_path in retired_present:
            retired_path.unlink()
            print(f"  {_R}deleted{_X} {retired_path.relative_to(repo)} "
                  "(retired by the skeleton)")
        if autopush == "missing":
            src = skeleton / "scripts" / "git-hooks" / "post-commit-autopush.sh"
            if src.is_file():
                dst = repo / ".git" / "hooks" / "post-commit"
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
                dst.chmod(dst.stat().st_mode | 0o111)
                print(f"  {_G}installed{_X} .git/hooks/post-commit "
                      "(auto-push: commit = push)")
            else:
                print(f"{_Y}⚠ skeleton has no git-hooks/"
                      f"post-commit-autopush.sh — cannot install.{_X}")
        elif autopush == "foreign":
            print(f"{_Y}⚠ .git/hooks/post-commit exists but is not the "
                  f"skeleton's auto-push hook — left untouched.{_X}")
        elif autopush == "worktree":
            print(f"{_Y}⚠ linked worktree (.git is a file) — install the "
                  f"auto-push hook in the parent repo.{_X}")
        (repo / ".claude").mkdir(exist_ok=True)
        (repo / ".claude" / "skeleton-version").write_text(version + "\n")
        if advisory_drift:
            print(f"{_Y}⚠ {len(advisory_drift)} advisory file(s) differ — "
                  f"reconcile by hand, NOT auto-copied:{_X}")
            for repo_path, state in advisory_drift:
                print(f"    ~ {repo_path.relative_to(repo)} ({state})")
            print("  Makefile / pre-commit / settings.json carry repo-"
                  "specific content — porting needs judgment. "
                  "Run /agentic-checkup.")
        if orphans:
            _print_orphans(repo, orphans)
        print(f"{_G}✓ synced {len(verbatim_drift)} file(s), deleted "
              f"{len(retired_present)} retired, to v{version}.{_X}")
        return 0

    if verbatim_drift:
        print(f"{_R}✗ {len(verbatim_drift)} skeleton-owned file(s) "
              f"drifted from v{version}:{_X}")
        for repo_path, _skel_path, state in verbatim_drift:
            print(f"  ✗ {repo_path.relative_to(repo)} ({state})")
    if retired_present:
        print(f"{_R}✗ {len(retired_present)} retired file(s) still "
              f"present (--apply deletes them):{_X}")
        for retired_path in retired_present:
            print(f"  ✗ {retired_path.relative_to(repo)} (retired)")
    if advisory_drift:
        print(f"{_Y}⚠ {len(advisory_drift)} advisory file(s) differ "
              f"(reconcile by hand):{_X}")
        for repo_path, state in advisory_drift:
            print(f"  ~ {repo_path.relative_to(repo)} ({state})")
    if orphans:
        _print_orphans(repo, orphans)
    if autopush == "missing":
        print(f"{_Y}• post-commit auto-push hook not installed "
              f"(--apply installs it).{_X}")
    print("Run `make sync-skeleton` to pull the verbatim files current.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
