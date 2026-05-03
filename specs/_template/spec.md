# Spec — <feature-slug>

> Requirements in EARS notation (Easy Approach to Requirements Syntax).
> This file is the canonical source of truth. `plan.md` and `tasks.md`
> derive from it. When they drift, fix the plan, not the spec.

## Summary

<2–4 sentences. What is being built and why. Link to ticket/incident.>

## Goals

- <user-visible goal 1>
- <user-visible goal 2>

## Non-goals

- <what this feature explicitly does NOT do>
- <adjacent scope we are deferring>

## Acceptance criteria (EARS notation)

Use these five EARS templates. Prefer `when`/`while`/`if` over freeform.

### Ubiquitous requirements (always true)

- The system shall <behavior>.
- The system shall <behavior>.

### Event-driven (`when`)

- When a user submits a payment, the system shall record a ledger entry
  within 500ms.
- When the webhook delivery fails, the system shall enqueue it for retry
  with exponential backoff.

### State-driven (`while`)

- While the database is in read-only mode, the system shall reject write
  endpoints with 503.
- While the user has an active session, the system shall refresh the JWT
  every 10 minutes.

### Unwanted-behavior (`if`/`then`)

- If the webhook signature does not verify, then the system shall reject
  the request with 401 and log the failure.
- If the downstream dependency is unreachable, then the system shall fail
  open to a cached response no more than 60 seconds stale.

### Optional features (`where`)

- Where the feature flag `dark-mode` is enabled, the system shall render
  the UI in dark-mode-first Tailwind classes.

## Success metrics

- <metric 1 — how we know it's working>
- <metric 2>
- SLO: <latency / availability target>

## Open questions

- (none yet)

## References

- Ticket: <link>
- Incident / runbook: <link>
- Related ADRs: <ADR-NNNN>
