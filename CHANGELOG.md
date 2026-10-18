# Changelog

## [1.1.0] — 2026-10-18 — Agent: Claude Opus 5.5
### Added
- **Homelab status writer** (#17, rex/halifirien#1): `PiercemooreStatusWriterStack` creates the
  IAM user `halifirien-status-writer`, whose only permission is `s3:PutObject` on
  `<site-bucket>/status/*`. Its key was minted with `make mint-status-key`, straight into
  1Password `agentic/svc-aws-halifirien-status-writer`, and never printed. Before the deploy,
  `cdk diff` showed no differences in PiercemooreSiteStack or PiercemooreCiStack.
### Changed
- The site deploy's `--delete` sync excludes `status/*`, so a deploy no longer removes the
  beacon's `status/status.json` (it would have come back on the next 15-minute cycle).

## Archived from TASK_STATE.md — 2026-06-06

### Resolved blockers

- ✅ Planning-required blocker lifted 2026-05-11 — Pierce granted broad workspace authority.

### Completed decisions (as of archival)

- 2026-05-11 — Pierce lifted the workspace fences: agent can manage the homepage end-to-end
  as long as changes are in version control and revertible; explicit approval still required
  for destructive / DNS / money / security-sensitive operations.
- 2026-05-11 — `/resume.pdf` retired (commit `ca70edd`); `/cv` is canonical résumé route,
  `/resume` is a redirect alias.
- 2026-05-11 — Email obfuscation landed (commit `9bd39cd`): MailLink component +
  `hello@piercemoore.com` alias replaces primary email everywhere.
- 2026-05-03 — Feature confirmed by Pierce: "Adding Navigation to homepage"

### Archived handoff notes

2026-05-03 (Claude): All 5 retrofit PRs merged. Navigation feature is specced but NOT ready
to implement — Pierce wants more planning before Slice 1.1 starts. Do not begin implementation
without explicit direction from Pierce.

2026-05-03 (Codex): Added an independent `/animation-lab` experiment route for subtle homepage
motion studies. This did not start or change the pending navigation work.
