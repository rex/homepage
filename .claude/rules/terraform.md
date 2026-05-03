---
description: Terraform-specific rules (loaded when .tf / .tfvars files are being edited)
globs: ["**/*.tf", "**/*.tfvars"]
---

# Terraform rules

## Safety first

Agents are NEVER permitted to run these commands:

- `terraform apply`
- `terraform destroy`
- `terraform import`
- `terraform taint` / `untaint`
- `terraform force-unlock`
- `terraform state` (any subcommand)
- `terraform workspace delete`

These are blocked by `bash-guard.sh` AND by the `terraform-reviewer`
subagent's `disallowedTools` list. Both layers are required.

## Layout

- **Modules** (`modules/<name>/`) never declare backend or provider config.
  Only `required_providers` in `versions.tf`.
- **Stacks** (`stacks/<name>/`) own state. One state per (stack × env).
- **Environments** (`environments/<env>/`) contain `.tfvars` only — no
  `.tf` logic.
- Pin every module source: `?ref=vX.Y.Z` or `version = "~> 1.2.0"`.

## Variables

- Every `variable` has `description`, `type`, and a `validation {}` block
  when values are constrained.
- Use `sensitive = true` for anything secret-adjacent.

## Outputs

- Stable contract. Breaking changes = MAJOR version bump + CHANGELOG.

## Style

- `terraform fmt -recursive` runs in `auto-lint.sh` after any `.tf` edit.
- `tflint --recursive` on every PR.
- `trivy config .` (replaces deprecated tfsec) for security scanning.
- `checkov -d .` for policy-as-code.

## When planning

Use the `/terraform-plan` slash command. It spawns `terraform-reviewer`,
which is read-only. It will:

- Run `fmt -check`, `validate`, linters, scanners
- Produce a plan
- Report add/change/destroy counts
- List every destroy explicitly
- Flag IAM / SG 0.0.0.0/0 / public S3 / unencrypted volumes / etc.

## Reference

See `~/.claude/skills/agentic-skeleton/references/iac-patches.md`
for the full Terraform layout and allowlist.
