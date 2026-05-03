---
description: Decompose a feature into slices in TASK_STATE.md and specs/<slug>/
argument-hint: <feature description>
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(git:*), Task
model: opus
---

Plan: **$ARGUMENTS**

1. Spawn `planner` subagent with the feature + `AGENTS.md` context.
2. Before finalizing, spawn 2–3 `research-agent` in PARALLEL for affected modules.
3. Pass findings back to `planner`.
4. `planner` writes/updates `specs/<slug>/spec.md`, `design.md`, `plan.md`, `tasks.md`.
5. `planner` updates `TASK_STATE.md` with the first active slice.
6. Summary: slice count, estimated LOC, risks.

Do NOT implement. This command only plans.
