---
description: Security rules — hard stops. Applies everywhere.
globs: ["**/*"]
---

# Security rules (hard stops)

These are non-negotiable. Agents that violate them fail review.

## Secrets

- No secrets committed. Ever. `detect-secrets` + `gitleaks` enforce at pre-commit.
- No secrets in `AGENTS.md`, `CLAUDE.md`, `TASK_STATE.md`, or any markdown file.
- `.env` stays local; `.env.example` is the documented template.
- Environment variables are the only source of truth for credentials.

## SQL / Injection

- Parameterized queries only. No string interpolation into SQL.
- Raw `text()` in SQLAlchemy requires an ADR.
- Input validation via Pydantic/Zod at the boundary. Never trust user input.

## Authentication / Authorization

- No home-rolled crypto. Use library primitives (PyJWT, jose, etc.).
- Tokens verified before any trust is placed in their claims.
- Authorization checked at service layer, not routes (routes should be thin).
- Rate limit sensitive endpoints.

## Logging

- NEVER log secrets, tokens, passwords, API keys, session IDs, PII, or
  full request bodies on sensitive endpoints (payments, auth, health data).
- Bind `request_id`, `trace_id`, `user_id` (when safe) at middleware.

## Network / IAM

- No wildcard IAM (`*:*`). No public S3 buckets. No `0.0.0.0/0` ingress
  except 443 on ALBs.
- Use VPC endpoints for AWS service calls when available.
- Security groups: principle of least privilege.

## Dependencies

- No unpinned dependencies. Lockfiles committed.
- `uv sync --frozen` / `pnpm install --frozen-lockfile` in CI.
- Renovate or Dependabot for patch updates.

## Code review escalation

For any of these paths, escalate reviewer to Opus:

- Auth / session / token code
- Crypto / encryption code
- IAM policy changes
- Payment handling
- Data retention / deletion
- Admin-only endpoints

## Incident response

- If a secret leaks: rotate, don't `git revert`. History is public the moment
  it's pushed.
- If a vulnerability is found mid-work: STOP. Write an ADR, fix, disclose.
