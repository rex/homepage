---
description: Refresh skill-sourced .claude/ files from the installed agentic-skeleton templates.
---

# /sync-skills — pull updated infrastructure files from skills

Run this when the upstream agentic-skeleton skill has been updated and
you need to bring this repo's `.claude/` infrastructure files in sync.
Covers hooks, rules, commands, and agents — not repo-specific content.

## Source directories

Brownfield source (prefer this for retrofitted repos):
```
~/.claude/skills/agentic-skeleton/templates/brownfield/PR5-delegation-hooks/files/
```

Greenfield source (fallback for files not found above):
```
~/.claude/skills/agentic-skeleton/templates/greenfield/
```

## What to sync

For every file under `.claude/` in this repo, check whether a
matching file exists in the brownfield source (same relative path).
If yes: read the source and overwrite the local file.
If not in brownfield source: check the greenfield source.
If not in either source: leave the local file untouched.

Directories in scope: `.claude/hooks/`, `.claude/rules/`,
`.claude/commands/`, `.claude/agents/`.

## What NOT to touch

- `.claude/settings.json` — wires hooks and permissions; repo-specific,
  can't be safely overwritten. Update manually if needed.
- `VIBE.yaml` — repo policy, repo-specific.
- `AGENTS.md` — repo-specific.
- `.mcp.json` — repo-specific.
- Any file under `.claude/` that has NO matching source file.

## Procedure

1. Confirm the skill source exists:
   ```bash
   ls ~/.claude/skills/agentic-skeleton/templates/brownfield/PR5-delegation-hooks/files/.claude/
   ```
   If missing, stop and tell the user to run `make sync-links` in the
   agent-skills repo.

2. For each local file in `.claude/hooks/`, `.claude/rules/`,
   `.claude/commands/`, `.claude/agents/`: find the corresponding
   source file in brownfield (falling back to greenfield), read it,
   and write the local copy.

3. Show a summary of which files were updated and which were unchanged
   (diff at a glance — filenames only, not full diffs).

4. If any files changed, commit:
   ```
   chore: sync .claude/ infrastructure from agentic-skeleton
   ```
   No PR needed — this is a maintenance update, not a feature branch.

## After syncing

If `serena-required.sh` was updated, delete the session flag so the
updated instructions take effect on the next prompt:
```bash
rm -f .claude/serena-initialized
```
