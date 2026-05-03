---
description: Python-specific code rules (loaded when .py files are being edited)
globs: ["**/*.py"]
---

# Python rules

> Most of these are enforced by `ruff` and `mypy`. These notes exist for
> the things the linter can't catch automatically.

## Idioms that are NOT in the linter

- Use `Annotated[T, Depends()]` form for FastAPI deps; no bare `Depends()`.
- Pydantic v2 `model_config = ConfigDict(...)` — not v1 `class Config:`.
- SQLAlchemy 2.0 async `select()` queries, not legacy `Query` API.
- `async def` throughout. Sync code wraps via `anyio.to_thread.run_sync`.
- Never block the event loop inside `async def`.
- `from __future__ import annotations` at the top of every module.

## Error handling

- Raise domain exceptions from `<domain>/exceptions.py`.
- Single exception handler in `app/main.py` translates to HTTP.
- Never bare `except Exception:` without a re-raise or structured log.
- Don't swallow; log with `exc_info=True` then re-raise if appropriate.

## Testing

- `pytest + pytest-asyncio` (strict mode).
- `httpx.AsyncClient` for route tests (not `TestClient`).
- `app.dependency_overrides` to stub deps; never monkeypatch internals.
- `factory-boy` for domain fixtures, not hand-rolled dicts.

## What NOT to do

- Don't add `requirements.txt` if the repo uses `uv` + `pyproject.toml`.
- Don't run `alembic revision --autogenerate` unreviewed.
- Don't import from `app.adapters` inside `app.domain` (import-linter enforced).

## Reference

For deep patterns, see the `lang-python` skill.
