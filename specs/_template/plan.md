# Plan — <feature-slug>

> Phased implementation plan. Derives from `spec.md` + `design.md`.
> The planner subagent writes this; the implementer subagent executes it
> slice by slice.

## Phases

### Phase 1 — Contract & schema (freeze)

**Exit criteria**: Pydantic/Zod schemas merged; OpenAPI locked; DB migration
applied in all envs.

Slices:
- [ ] S1.1 — Define request/response schemas in `<path>/schemas.py`
- [ ] S1.2 — Write DB migration for new tables
- [ ] S1.3 — Generate OpenAPI snapshot and commit

### Phase 2 — Implementation

**Exit criteria**: All endpoints return correct shapes; integration tests green.

Slices:
- [ ] S2.1 — Repository layer for `<entity>`
- [ ] S2.2 — Service layer for `<operation>`
- [ ] S2.3 — Route wiring + error handlers

### Phase 3 — Observability

**Exit criteria**: Metrics, logs, traces visible in dashboards; alerts defined.

Slices:
- [ ] S3.1 — Add structured logging with bound context
- [ ] S3.2 — Emit Prometheus metrics from service layer
- [ ] S3.3 — Define alert rules + runbook

### Phase 4 — Rollout

**Exit criteria**: Feature behind flag in prod; metrics show expected shape.

Slices:
- [ ] S4.1 — Feature flag + kill switch
- [ ] S4.2 — Canary rollout + monitor
- [ ] S4.3 — Full rollout + flag removal after bake time

## Slice discipline

- Each slice ≤150 LOC diff.
- Each slice independently revertable.
- Each slice has its own test(s) listed in `tasks.md`.
- If a phase exceeds 8 slices, split the phase.

## Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| <risk> | low/med/high | low/med/high | <action> |

## Dependencies

- <external dep or team> — <what we need, by when>

## Estimated effort

- Phase 1: <~X slices, Y days>
- Phase 2: <...>
- Phase 3: <...>
- Phase 4: <...>
- **Total**: <rough total>

## Frozen decisions (do not re-plan)

Once this document is merged and implementation starts, these are fixed:

- <frozen decision 1>
- <frozen decision 2>

Changes to frozen decisions require an ADR + spec update + plan update
before implementation continues.
