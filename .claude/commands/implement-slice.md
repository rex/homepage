---
description: Execute one slice from TASK_STATE.md
argument-hint: <slice-id, e.g. 2.2>
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, Task
model: sonnet
---

Execute slice **$ARGUMENTS**.

1. Read `TASK_STATE.md`, locate the slice.
2. If not found, or if prior required slices are unchecked → STOP.
3. Spawn `implementer` subagent with the slice ID.
4. Then spawn `test-runner` to verify.
5. If tests pass, spawn `reviewer` on the diff.
6. Report all three outputs (implementer summary, test result, review verdict).

Do NOT proceed to the next slice. Each slice gets its own invocation.
