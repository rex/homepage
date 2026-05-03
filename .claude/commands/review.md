---
description: Run the reviewer subagent on the current working-tree diff
argument-hint: (optional) file path to scope the review
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*), Bash(git status:*), Task
model: sonnet
---

## Context

- Branch: !`git branch --show-current`
- Status: !`git status --short`
- Diff summary: !`git diff --stat HEAD`

## Review

Spawn `reviewer` subagent on the current working-tree diff.

If `$ARGUMENTS` is set, scope the review to that path. Otherwise review
everything in `git diff HEAD`.

Escalate to Opus (`reviewer` with `model: opus`) if the diff touches any
of: auth code, crypto, IAM, security-sensitive paths, critical-path
performance.
