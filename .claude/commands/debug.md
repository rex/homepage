---
description: Root-cause a failing test or bug via the debugger subagent
argument-hint: <error description, test name, or issue link>
allowed-tools: Read, Edit, Bash, Grep, Glob, Task
model: sonnet
---

Debug: **$ARGUMENTS**

1. If a failing test was given, run it and capture the exact output first.
2. Spawn `debugger` subagent with the error, repro steps, and relevant file paths.
3. `debugger` returns: symptom / root cause / evidence / fix / verification.
4. If `debugger` can't find root cause in 5 hypotheses, STOP and report.
5. If the fix is applied, spawn `test-runner` to verify.

Escalate to Opus (`debugger` with `model: opus`) if the repro fails twice.

Never fix symptoms. If the fix is "catch the exception" or "skip the test,"
stop and ask the human.
