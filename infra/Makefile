# piercemoore.com infrastructure -- convenience targets
#
# One-time setup:
#   cp .env.example .env   # then fill in real values
#
# Routine use:
#   make diff              # preview pending changes (read-only, safe)
#   make deploy            # deploy all stacks (sources .env first)
#   make deploy-site       # deploy only PiercemooreSiteStack
#   make deploy-ci         # deploy only PiercemooreCiStack
#
# .env is gitignored at the repo root. Never commit it.
#
# Compatible with macOS-bundled GNU Make 3.81 (no .ONESHELL).

SHELL    := /bin/bash
ENV_FILE := .env
CDK      := npx cdk
LOAD_ENV := set -a; . ./$(ENV_FILE); set +a

.PHONY: help check-env diff deploy deploy-site deploy-ci synth bootstrap

help: ## Show available targets
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

check-env:
	@if [ ! -f $(ENV_FILE) ]; then \
	    echo "ERROR: $(ENV_FILE) is missing. Run: cp .env.example .env and fill in values."; \
	    exit 1; \
	fi

diff: check-env ## Show CDK diff for all stacks (read-only)
	@$(LOAD_ENV); $(CDK) diff

deploy: check-env ## Deploy all stacks
	@$(LOAD_ENV); $(CDK) deploy --all

deploy-site: check-env ## Deploy only PiercemooreSiteStack (S3 + CF + Route 53)
	@$(LOAD_ENV); $(CDK) deploy PiercemooreSiteStack

deploy-ci: check-env ## Deploy only PiercemooreCiStack (deploy role + OIDC)
	@$(LOAD_ENV); $(CDK) deploy PiercemooreCiStack

synth: check-env ## Synth CloudFormation without deploying
	@$(LOAD_ENV); $(CDK) synth

bootstrap: check-env ## Bootstrap CDK in this account/region (idempotent)
	@$(LOAD_ENV); $(CDK) bootstrap
