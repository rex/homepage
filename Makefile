# ╔══════════════════════════════════════════════════════════════════════╗
# ║          piercemoore.com — Makefile                                  ║
# ║          Astro 5 + TypeScript (static)                              ║
# ╚══════════════════════════════════════════════════════════════════════╝
#
# Usage: make <target>
# Run `make help` for a full list of available targets.
#
# Stack recipes (install/dev/build/start/typecheck/...) are wired to this
# repo's real Astro + npm toolchain. The gate targets (check-architecture,
# check-docs, check-precommit, check-skeleton, sync-skeleton) and the
# completion gate are skeleton-standard and fail closed.

.PHONY: help help-stack install env env-check setup validate update info \
        dev build start lint typecheck check-architecture check-docs \
        check-precommit check-skeleton sync-skeleton fix test \
        bump-patch bump-minor bump-major check-version-bumped version \
        clean clean-all \
        docker-build docker-run docker-stop docker-clean \
        serena-index serena-cache-copy serena-dashboard \
        check-if-the-agent-can-consider-this-task-completed

# ─── Configuration ────────────────────────────────────────────────────
# Prefer Homebrew zsh on macOS, then any zsh on PATH, then /bin/bash as
# a CI-runner fallback (most CI runners don't ship zsh by default;
# without this third fallback SHELL resolves to '' and `make: -c: No
# such file or directory` fires on the first recipe). Keep recipes
# POSIX-compatible — no `[[ ]]`, no `${var//foo/bar}` substitution, no
# zsh globbing — so /bin/bash works as a true fallback.
SHELL       := $(or $(wildcard /opt/homebrew/bin/zsh),$(shell command -v zsh),/bin/bash)
APP_NAME    ?= piercemoore
PORT        ?= 4321
NODE_ENV    ?= development
DOCKER_IMAGE := $(APP_NAME):latest

# Colors for output
CYAN   := $(shell printf '\033[36m')
GREEN  := $(shell printf '\033[32m')
YELLOW := $(shell printf '\033[33m')
RED    := $(shell printf '\033[31m')
RESET  := $(shell printf '\033[0m')
BOLD   := $(shell printf '\033[1m')

# ─── Help ─────────────────────────────────────────────────────────────

## help: Display this help message with all available targets
help:
	@echo ""
	@echo "$(BOLD)$(CYAN)$(APP_NAME)$(RESET)"
	@echo "$(CYAN)════════════════════════════════════════════════════$(RESET)"
	@echo ""
	@echo "$(BOLD)Setup & Installation$(RESET)"
	@echo "  $(GREEN)make install$(RESET)              Install dependencies (npm ci)"
	@echo "  $(GREEN)make env$(RESET)                  Create .env from template"
	@echo "  $(GREEN)make env-check$(RESET)            Verify required env vars"
	@echo "  $(GREEN)make setup$(RESET)                Full setup: install + env + typecheck"
	@echo ""
	@echo "$(BOLD)Development$(RESET)"
	@echo "  $(GREEN)make dev$(RESET)                  Start Astro dev server (port $(PORT))"
	@echo "  $(GREEN)make build$(RESET)                Build production bundle (astro check + build)"
	@echo "  $(GREEN)make start$(RESET)                Preview the production build"
	@echo "  $(GREEN)make lint$(RESET)                 Run linter (not wired — see VIBE.yaml)"
	@echo "  $(GREEN)make typecheck$(RESET)            Run type checker (astro check)"
	@echo "  $(GREEN)make check-architecture$(RESET)   Run repo-native architecture checks"
	@echo "  $(GREEN)make fix$(RESET)                  Auto-fix lint issues (not wired)"
	@echo "  $(GREEN)make test$(RESET)                 Run tests (when testing is enabled)"
	@echo "  $(GREEN)make validate$(RESET)             Run aggregate validation: lint + typecheck + architecture"
	@echo ""
	@echo "$(BOLD)Versioning$(RESET)"
	@echo "  $(GREEN)make version$(RESET)              Print current version (package.json)"
	@echo "  $(YELLOW)(this repo pins its version in package.json as a product-display$(RESET)"
	@echo "  $(YELLOW) constant — it is not per-commit-bumped; see VIBE.yaml versioning)$(RESET)"
	@echo ""
	@echo "$(BOLD)Docker$(RESET)"
	@echo "  $(GREEN)make docker-build$(RESET)         Build Docker image"
	@echo "  $(GREEN)make docker-run$(RESET)           Run container (port $(PORT))"
	@echo "  $(GREEN)make docker-stop$(RESET)          Stop container"
	@echo "  $(GREEN)make docker-clean$(RESET)         Remove image and container"
	@echo ""
	@echo "$(BOLD)Maintenance$(RESET)"
	@echo "  $(GREEN)make clean$(RESET)                Remove build cache"
	@echo "  $(GREEN)make clean-all$(RESET)            Remove build cache + deps (destructive!)"
	@echo "  $(GREEN)make update$(RESET)               Update dependencies"
	@echo "  $(GREEN)make info$(RESET)                 Show project info"
	@echo ""
	@echo "$(BOLD)Serena (agent code intelligence)$(RESET)"
	@echo "  $(GREEN)make serena-index$(RESET)         Pre-cache symbols for this project"
	@echo "  $(GREEN)make serena-cache-copy$(RESET)    Copy .serena/cache to a worktree (WORKTREE=<path>)"
	@echo "  $(GREEN)make serena-dashboard$(RESET)     Print dashboard URL"
	@echo ""
	@echo "$(BOLD)Completion$(RESET)"
	@echo "  $(GREEN)make check-if-the-agent-can-consider-this-task-completed$(RESET)"
	@echo "    Final verification gate (required before declaring a task complete)"
	@echo ""
	@echo "$(BOLD)Variables$(RESET)"
	@echo "  PORT=$(PORT)  (override: make dev PORT=3000)"
	@echo ""

# ─── Setup & Installation ────────────────────────────────────────────

## install: Install dependencies (npm ci against the committed lockfile)
install:
	@echo "$(CYAN)Installing dependencies (npm ci)...$(RESET)"
	@if [ -f package-lock.json ]; then \
		npm ci; \
	else \
		echo "$(YELLOW)  no package-lock.json — falling back to npm install$(RESET)"; \
		npm install; \
	fi
	@echo "$(GREEN)Done.$(RESET)"

## env: Create .env from template if missing
env:
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			echo "$(YELLOW)Creating .env from .env.example...$(RESET)"; \
			cp .env.example .env; \
			echo "$(GREEN).env created. Configure before running.$(RESET)"; \
		else \
			echo "$(RED)No .env.example to copy from.$(RESET)"; exit 1; \
		fi \
	else \
		echo "$(YELLOW).env already exists, skipping.$(RESET)"; \
	fi

## env-check: Verify required env vars are set
env-check:
	@if [ ! -f .env ]; then echo "$(RED).env missing — run 'make env'.$(RESET)"; exit 1; fi
	@echo "$(GREEN).env present.$(RESET)"

## setup: Full project setup
setup: install env typecheck
	@echo ""
	@echo "$(GREEN)$(BOLD)Setup complete!$(RESET)"
	@echo "  Run $(CYAN)make dev$(RESET) to start developing."

## validate: Run the repo's aggregate validation flow
validate: lint typecheck check-architecture
	@echo "$(GREEN)Validation complete.$(RESET)"

# ─── Versioning ───────────────────────────────────────────────────────
# This repo does NOT use the skeleton's VERSION-file + per-commit-bump
# model. Its version is pinned in package.json as a product-display
# constant (rendered in the footer via PACKAGE_VERSION; see AGENTS.md §5
# and VIBE.yaml versioning). bump-* / check-version-bumped are therefore
# intentionally not part of the validate / completion flow here.

## version: Print current version (from package.json)
version:
	@node -p "require('./package.json').version" 2>/dev/null || echo "(package.json version unreadable)"

# ─── Development ──────────────────────────────────────────────────────

## dev: Start the Astro dev server
dev:
	@echo "$(CYAN)Starting Astro dev server on port $(PORT)...$(RESET)"
	@npm run dev

## build: Build production bundle (astro check + astro build)
build:
	@echo "$(CYAN)Building (astro check + astro build)...$(RESET)"
	@npm run build

## start: Preview the production build
start:
	@echo "$(CYAN)Previewing production build on port $(PORT)...$(RESET)"
	@npm run preview

## lint: Run linter (not wired for this repo — VIBE.yaml quality_gates.lint.required=false)
lint:
	@echo "$(CYAN)Running linter...$(RESET)"
	@echo "$(YELLOW)  No linter is wired for this repo (no eslint/prettier/biome$(RESET)"
	@echo "$(YELLOW)  config, no lint script). Astro's correctness check runs via$(RESET)"
	@echo "$(YELLOW)  'make typecheck' (astro check). VIBE.yaml marks lint not$(RESET)"
	@echo "$(YELLOW)  required, so this is a documented no-op, not a skipped gate.$(RESET)"

## typecheck: Run the type checker (astro check — the repo's correctness gate)
typecheck:
	@echo "$(CYAN)Type-checking (astro check)...$(RESET)"
	@npm run astro -- check

## check-architecture: Enforce VIBE.yaml line limits + module shape (fails closed)
check-architecture:
	@echo "$(CYAN)Checking architecture (line limits + module shape)...$(RESET)"
	@for s in check_architecture.py check_module_rules.py; do \
		if [ ! -f "scripts/$$s" ]; then \
			echo "$(RED)  scripts/$$s is MISSING — the architecture gate$(RESET)"; \
			echo "$(RED)  cannot run. Hard failure, never a skip. Restore it:$(RESET)"; \
			echo "$(RED)  re-run the agentic-skeleton bootstrap.$(RESET)"; \
			exit 1; \
		fi; \
	done
	@if command -v uv >/dev/null 2>&1; then \
		uv run scripts/check_architecture.py && uv run scripts/check_module_rules.py; \
	elif python3 -c 'import yaml' >/dev/null 2>&1; then \
		python3 scripts/check_architecture.py && python3 scripts/check_module_rules.py; \
	else \
		echo "$(RED)  Architecture gate cannot run: no 'uv', and no$(RESET)"; \
		echo "$(RED)  python3 with PyYAML. Install uv: https://docs.astral.sh/uv/$(RESET)"; \
		exit 1; \
	fi

## fix: Auto-fix lint issues (not wired — no formatter configured)
fix:
	@echo "$(CYAN)Auto-fixing...$(RESET)"
	@echo "$(YELLOW)  No formatter/linter is wired for this repo — nothing to fix.$(RESET)"

## test: Run tests — VIBE.yaml quality_gates.tests.mode decides (fails closed when required)
test:
	@echo "$(CYAN)Running tests...$(RESET)"
	@MODE=$$(python3 -c "import yaml;d=yaml.safe_load(open('VIBE.yaml'));print((((d or {}).get('quality_gates') or {}).get('tests') or {}).get('mode') or 'deferred')" 2>/dev/null) \
		|| MODE=$$(uv run --with pyyaml python3 -c "import yaml;d=yaml.safe_load(open('VIBE.yaml'));print((((d or {}).get('quality_gates') or {}).get('tests') or {}).get('mode') or 'deferred')" 2>/dev/null) \
		|| MODE=unknown; \
	case "$$MODE" in \
		required) \
			echo "$(RED)  tests.mode='required' but no test runner is wired —$(RESET)"; \
			echo "$(RED)  overlay a lang-* skill (make help-stack). Failing closed.$(RESET)"; \
			exit 1 ;; \
		deferred|not_applicable) \
			echo "$(YELLOW)  tests.mode='$$MODE' — tests not run, NOT claimed as passing.$(RESET)" ;; \
		*) \
			echo "$(RED)  Could not read quality_gates.tests.mode from VIBE.yaml —$(RESET)"; \
			echo "$(RED)  failing closed.$(RESET)"; \
			exit 1 ;; \
	esac

# ─── Docker ───────────────────────────────────────────────────────────

## docker-build: Build Docker image with version metadata
docker-build:
	@echo "$(CYAN)Building Docker image $(DOCKER_IMAGE)...$(RESET)"
	docker build \
		--build-arg APP_VERSION=$$(git describe --tags --always 2>/dev/null || echo "dev") \
		--build-arg GITHUB_SHA=$$(git rev-parse HEAD 2>/dev/null || echo "unknown") \
		--build-arg BUILD_DATE=$$(date -u +%Y-%m-%dT%H:%M:%SZ) \
		-t $(DOCKER_IMAGE) .

## docker-run: Run container on port $(PORT)
docker-run:
	@docker run -d --rm --name $(APP_NAME) -p $(PORT):$(PORT) --env-file .env $(DOCKER_IMAGE)
	@echo "$(GREEN)Container running on port $(PORT).$(RESET)"

## docker-stop: Stop container
docker-stop:
	@docker stop $(APP_NAME) 2>/dev/null || true
	@echo "$(GREEN)Container stopped.$(RESET)"

## docker-clean: Remove image and container
docker-clean: docker-stop
	@docker rmi -f $(DOCKER_IMAGE) 2>/dev/null || true
	@echo "$(GREEN)Image removed.$(RESET)"

# ─── Maintenance ──────────────────────────────────────────────────────

## clean: Remove build cache
clean:
	@echo "$(CYAN)Cleaning build cache...$(RESET)"
	@rm -rf build/ dist/ .next/ .turbo/ .astro/ __pycache__/ .pytest_cache/ .mypy_cache/ .ruff_cache/
	@echo "$(GREEN)Clean.$(RESET)"

## clean-all: Remove build cache + dependencies (destructive — requires confirmation)
clean-all:
	@echo "$(YELLOW)WARNING: This will remove all dependencies and build artifacts.$(RESET)"
	@read -p "Are you sure? [y/N] " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		rm -rf build/ dist/ .next/ .turbo/ .astro/ __pycache__/ .pytest_cache/ \
			.mypy_cache/ .ruff_cache/ node_modules/ .venv/ uv.lock; \
		echo "$(GREEN)Deep clean complete.$(RESET)"; \
	else \
		echo "$(YELLOW)Cancelled.$(RESET)"; \
	fi

## update: Update dependencies
update:
	@echo "$(CYAN)Updating dependencies (npm update)...$(RESET)"
	@npm update

## info: Show project state
info:
	@echo "$(BOLD)$(CYAN)Project Info$(RESET)"
	@echo "──────────────────────────────"
	@echo "  Project: $(APP_NAME)"
	@echo "  Branch:  $$(git branch --show-current 2>/dev/null || echo 'N/A')"
	@echo "  Commit:  $$(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
	@echo "  Tree:    $$(git status --porcelain | wc -l | tr -d ' ') uncommitted changes"
	@echo "  Port:    $(PORT)"

# ─── Serena (agent code intelligence) ────────────────────────────────
# Wraps the Serena MCP server's project-level commands so agents and
# operators can pre-warm caches and reach the dashboard without
# remembering the full uvx invocation. See
# serena/references/protocol.md for full details.

## serena-index: Pre-cache symbols for the current project
serena-index:
	@echo "$(CYAN)Indexing project for Serena...$(RESET)"
	@uvx --from git+https://github.com/oraios/serena serena project index . \
		|| { echo "$(RED)Serena index failed — is uvx installed?$(RESET)"; exit 1; }
	@echo "$(GREEN)Index ready at .serena/cache/$(RESET)"

## serena-cache-copy: Copy .serena/cache to a worktree (avoids re-indexing)
serena-cache-copy:
	@if [ -z "$(WORKTREE)" ]; then \
		echo "$(RED)Usage: make serena-cache-copy WORKTREE=<path>$(RESET)"; \
		exit 1; \
	fi
	@if [ ! -d ".serena/cache" ]; then \
		echo "$(YELLOW)No .serena/cache here — run 'make serena-index' first.$(RESET)"; \
		exit 1; \
	fi
	@if [ ! -d "$(WORKTREE)" ]; then \
		echo "$(RED)Worktree path '$(WORKTREE)' does not exist.$(RESET)"; \
		exit 1; \
	fi
	@mkdir -p "$(WORKTREE)/.serena"
	@cp -r .serena/cache "$(WORKTREE)/.serena/cache"
	@echo "$(GREEN)Cache copied → $(WORKTREE)/.serena/cache$(RESET)"

## serena-dashboard: Print Serena dashboard URL (default localhost:24282)
serena-dashboard:
	@echo "$(CYAN)Serena dashboard:$(RESET) http://localhost:24282/dashboard/index.html"
	@echo "$(YELLOW)(port increments if multiple instances are running)$(RESET)"

# ─── Required-files + commit-surface gates ──────────────────────────

## check-docs: Enforce VIBE.yaml docs.*_required (fails closed)
check-docs:
	@echo "$(CYAN)Checking required collaboration files (VIBE.yaml docs)...$(RESET)"
	@if [ ! -f scripts/check_docs.py ]; then \
		echo "$(RED)  scripts/check_docs.py is MISSING — the docs gate$(RESET)"; \
		echo "$(RED)  cannot run. Hard failure. Re-run the bootstrap.$(RESET)"; \
		exit 1; \
	fi
	@if command -v uv >/dev/null 2>&1; then \
		uv run scripts/check_docs.py; \
	elif python3 -c 'import yaml' >/dev/null 2>&1; then \
		python3 scripts/check_docs.py; \
	else \
		echo "$(RED)  docs gate cannot run: no 'uv', no python3 + PyYAML.$(RESET)"; \
		exit 1; \
	fi

## check-precommit: Verify the pre-commit hook is installed (fails closed)
check-precommit:
	@echo "$(CYAN)Checking the pre-commit enforcement surface...$(RESET)"
	@if [ ! -f .pre-commit-config.yaml ]; then \
		echo "$(RED)  .pre-commit-config.yaml is MISSING — the commit-time$(RESET)"; \
		echo "$(RED)  enforcement surface is absent. Re-run the bootstrap.$(RESET)"; \
		exit 1; \
	fi
	@if ! command -v pre-commit >/dev/null 2>&1; then \
		echo "$(RED)  pre-commit is not installed — it is MANDATORY, not$(RESET)"; \
		echo "$(RED)  optional. Install it: uv tool install pre-commit$(RESET)"; \
		exit 1; \
	fi
	@HOOK=$$(git rev-parse --git-path hooks/pre-commit 2>/dev/null); \
	if [ -z "$$HOOK" ] || [ ! -f "$$HOOK" ] || ! grep -q pre-commit "$$HOOK" 2>/dev/null; then \
		echo "$(RED)  the pre-commit git hook is NOT installed. Run:$(RESET)"; \
		echo "$(RED)    pre-commit install$(RESET)"; \
		echo "$(RED)  A .pre-commit-config.yaml with no installed hook$(RESET)"; \
		echo "$(RED)  enforces nothing — fail closed.$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)  pre-commit hook installed.$(RESET)"

## check-skeleton: Report drift vs the installed agentic-skeleton
check-skeleton:
	@echo "$(CYAN)Checking skeleton-owned files for drift...$(RESET)"
	@if [ ! -f scripts/sync_skeleton.py ]; then \
		echo "$(RED)  scripts/sync_skeleton.py is MISSING — cannot check$(RESET)"; \
		echo "$(RED)  skeleton drift. Re-run the agentic-skeleton bootstrap.$(RESET)"; \
		exit 1; \
	fi
	@if command -v uv >/dev/null 2>&1; then \
		uv run scripts/sync_skeleton.py --check; \
	else \
		python3 scripts/sync_skeleton.py --check; \
	fi

## sync-skeleton: Pull current skeleton-owned files into this repo
sync-skeleton:
	@if [ ! -f scripts/sync_skeleton.py ]; then \
		echo "$(RED)  scripts/sync_skeleton.py is MISSING.$(RESET)"; \
		exit 1; \
	fi
	@if command -v uv >/dev/null 2>&1; then \
		uv run scripts/sync_skeleton.py --apply; \
	else \
		python3 scripts/sync_skeleton.py --apply; \
	fi

# ─── Completion Gate ──────────────────────────────────────────────────
# NOTE: the skeleton-standard completion gate also runs check-version-bumped
# via `validate`. This repo intentionally does NOT use the VERSION-file
# bump model (see Versioning section above), so `validate` here is
# lint + typecheck + check-architecture, and the completion gate adds
# check-docs + check-precommit + test.

## check-if-the-agent-can-consider-this-task-completed: Final verification gate
check-if-the-agent-can-consider-this-task-completed: validate check-docs check-precommit test

## help-stack: Show which lang-* skill should fill in stub targets
help-stack:
	@echo "$(BOLD)$(CYAN)Stack recipes for this repo$(RESET)"
	@echo ""
	@echo "This repo's stub targets are already wired to its Astro + npm"
	@echo "toolchain (install / dev / build / start / typecheck / update)."
	@echo "lint / fix are documented no-ops — no linter is configured."
	@echo ""
	@echo "Astro / static site — see the project README and AGENTS.md."
	@echo ""

.DEFAULT_GOAL := help
