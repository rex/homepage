# Tasks — <feature-slug>

> Concrete task list derived from `plan.md`. Each task maps 1:1 to a slice.
> Implementers execute tasks from this file; planners write tasks into it.
> `TASK_STATE.md` at the repo root tracks the ACTIVE slice and handoff state;
> this file is the full task catalog for the feature.

## How to use this file

- Check off tasks as they complete.
- Add `(agent: <name>)` when an agent picks up a task.
- Add `(blocked: <reason>)` if a task blocks.
- Acceptance criteria are EARS-notation copies from `spec.md`.

## Phase 1 — Contract & schema

### S1.1 — Define request/response schemas

- **Files**: `<path>/schemas.py` (new)
- **Files (do NOT edit)**: (none — new file)
- **Acceptance**:
  - [ ] When a client POSTs valid `<Type>Request`, the system shall accept it.
  - [ ] If a field fails validation, then the system shall return 400 with field-level errors.
  - [ ] Tests: `tests/<path>/test_schemas.py::test_valid_request`, `::test_missing_required_field`
  - [ ] ruff + mypy green
- [ ] Complete

### S1.2 — DB migration

- **Files**: `migrations/YYYYMMDD_<slug>.py` (new)
- **Acceptance**:
  - [ ] The migration shall create the `<table>` table with specified columns.
  - [ ] While the migration is running, the system shall acquire no long-held locks.
  - [ ] `alembic upgrade head && alembic downgrade -1 && alembic upgrade head` is lossless
- [ ] Complete

### S1.3 — OpenAPI snapshot

- **Files**: `docs/openapi-snapshot.json` (new)
- **Acceptance**:
  - [ ] Snapshot matches generated OpenAPI spec
  - [ ] CI fails if the snapshot drifts without spec update
- [ ] Complete

## Phase 2 — Implementation

### S2.1 — Repository layer

- **Files**: `<path>/repository.py` (new), `tests/<path>/test_repository.py` (new)
- **Acceptance**:
  - [ ] When `save(<entity>)` is called, the system shall persist it idempotently on `<id>`.
  - [ ] If the DB connection fails, then the system shall raise `RepositoryUnavailable`.
  - [ ] Tests use testcontainers; no mocks for DB behavior
- [ ] Complete

### S2.2 — Service layer

- **Files**: `<path>/service.py` (new), `tests/<path>/test_service.py` (new)
- **Files (do NOT edit)**: `<path>/schemas.py` (frozen)
- **Acceptance**:
  - [ ] When `<operation>` is invoked with valid inputs, the system shall emit domain event `<event>`.
  - [ ] Unit tests stub repository via `app.dependency_overrides`
- [ ] Complete

### S2.3 — Route wiring

- **Files**: `<path>/router.py` (extend)
- **Acceptance**:
  - [ ] When a valid request arrives, the system shall return 200 with the correct schema.
  - [ ] If the service raises `<DomainException>`, then the system shall return the mapped HTTP code.
  - [ ] Integration test uses httpx.AsyncClient against app factory
- [ ] Complete

## Phase 3 — Observability

### S3.1 — Structured logging

- **Acceptance**:
  - [ ] Every log line from this module includes `request_id`, `trace_id`, `<entity>_id`.
- [ ] Complete

### S3.2 — Prometheus metrics

- **Acceptance**:
  - [ ] `<prefix>_request_total` counter is incremented per request.
  - [ ] `<prefix>_request_duration_seconds` histogram is recorded.
- [ ] Complete

### S3.3 — Alert rules + runbook

- **Files**: `alerts/<slug>.yml` (new), `docs/runbooks/<slug>.md` (new)
- **Acceptance**:
  - [ ] Alert fires when error rate >1% for 5m.
  - [ ] Runbook lists: symptom, first-check, escalation.
- [ ] Complete

## Phase 4 — Rollout

### S4.1 — Feature flag

- **Acceptance**:
  - [ ] Where `<flag>` is disabled, the system shall return 404 for the new endpoint.
- [ ] Complete

### S4.2 — Canary

- **Acceptance**:
  - [ ] Canary at 1% for 24h, then 10%, then 100%.
  - [ ] Monitor: error rate, latency, SLO impact.
- [ ] Complete

### S4.3 — Flag removal

- **Acceptance**:
  - [ ] After 7 days at 100% with no regressions, the flag is removed.
- [ ] Complete

## Done when

- [ ] All Phase 1–4 tasks checked.
- [ ] `make check-if-the-agent-can-consider-this-task-completed` green.
- [ ] No open blockers in `TASK_STATE.md` §3.
- [ ] ADR written (if architecture changed).
- [ ] Runbook merged.
- [ ] Feature flag removed.
