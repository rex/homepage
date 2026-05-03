---
description: Pre-merge pipeline — test, review, update TASK_STATE, stage
allowed-tools: Read, Write, Edit, Bash(git:*), Bash(make:*), Task
model: sonnet
---

## Context

- Branch: !`git branch --show-current`
- Status: !`git status --short`
- Ahead of main: !`git rev-list --count origin/main..HEAD 2>/dev/null || echo 'unknown'`

## Pipeline

1. Spawn `test-runner` — if any failures, STOP and report.
2. Spawn `reviewer` — if verdict is REQUEST-CHANGES or BLOCK, STOP and report.
3. Run `make check-if-the-agent-can-consider-this-task-completed` — if non-zero exit, STOP.
4. Update `TASK_STATE.md`:
   - Check boxes for completed slices
   - Set status to `done` if all slices are complete
   - Fill in §6 Handoff note
5. Compose a conventional commit message from the diff (feat/fix/chore/refactor/docs/test).
6. Run `git add -A && git status` and show what will be committed.

Per `VIBE.yaml.workflow.default_slice_completion_behavior`:

- `commit-push-and-pause` → commit + push, then STOP for human review.
- `commit-push-and-continue` → commit + push, then resume the next slice.
- Anything else → STOP; human commits.

Respect signed-commit policy (`signed_commits_required: true`).
