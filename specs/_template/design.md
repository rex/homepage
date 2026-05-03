# Design — <feature-slug>

> How we will satisfy `spec.md`. Reference the spec by section number in
> every design decision.

## Architecture overview

```
<ascii diagram: components + dataflow>
```

## Components

### <Component 1>

- **Responsibility**: <one sentence>
- **Inputs**: <types, schemas>
- **Outputs**: <types, schemas>
- **Dependencies**: <other components, external systems>
- **Satisfies**: spec.md §<N>

### <Component 2>

- ...

## Data model

### New tables / types

```sql
CREATE TABLE <name> (
    id UUID PRIMARY KEY,
    ...
);
```

### Changed schemas

- <Existing schema> — add `<field>` (nullable, default <value>)

## API surface

### New endpoints

- `POST /api/<resource>` — <purpose>
  - Request: `<schema>`
  - Response 200: `<schema>`
  - Errors: 400 (validation), 409 (conflict)

### Changed endpoints

- `GET /api/<existing>` — now returns `<new-field>`

## Contracts (freeze in Phase 1)

```python
# Pydantic v2 or Zod schemas here. Once merged, these are frozen
# for the rest of the feature — extending via extra="allow" only.

class <Name>Request(BaseModel):
    ...

class <Name>Response(BaseModel):
    ...
```

## Error handling

| Condition | HTTP | Code | Where raised |
|---|---|---|---|
| <condition> | 400 | `<domain>.validation_error` | `<service>.py` |
| <condition> | 503 | `<domain>.dependency_unavailable` | `<adapter>.py` |

## Observability

- Metrics: `<prefix>_<name>_<unit>` (counter / histogram / gauge)
- Logs: structured fields — <list them>
- Traces: span `<name>` wraps <what>

## Security considerations

- Authentication: <how>
- Authorization: <who can do what>
- Input validation: <where and what>
- Secrets: <how managed>
- Rate limiting: <if applicable>

## Performance considerations

- Hot path: <describe>
- Expected load: <QPS, data volume>
- Caching strategy: <if any>
- Timeouts: <where, values>

## Alternatives considered

### Alternative 1

- **Why considered**: <context>
- **Why rejected**: <reason>
- **Trade-off accepted by rejecting**: <what we give up>

## Open design questions

- (none yet)
