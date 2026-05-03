---
description: Run the terraform-reviewer subagent on the current Terraform diff
argument-hint: (optional) stack path to scope the plan
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(terraform:*), Task
model: sonnet
---

## Context

- Branch: !`git branch --show-current`
- Terraform files changed: !`git diff --name-only HEAD | grep -E '\.(tf|tfvars)$' || echo 'none'`

## Plan

Spawn `terraform-reviewer` subagent.

If `$ARGUMENTS` is set, scope to that stack (e.g. `stacks/platform-network`).
Otherwise review every changed `*.tf`/`*.tfvars` file.

`terraform-reviewer` is read-only. It will:

- Run `fmt -check`, `validate`, `tflint`, `trivy`, `checkov`
- Run `terraform init -backend=false` and `plan -out=tfplan`
- Parse the plan and report: add/change/destroy counts, every destroy
  explicitly, IAM/SG/S3/KMS risks
- Refuse any mutating command

If the reviewer identifies any destroys or wildcard IAM, STOP and escalate
to the human for explicit approval before anything proceeds.
