---
description: Ansible-specific rules (loaded when Ansible files are being edited)
globs: ["ansible/**", "playbooks/**", "roles/**", "inventories/**"]
---

# Ansible rules

## Safety first

- Agents NEVER run without `--check --diff` against prod/staging inventories.
- Agents NEVER run `--limit all` without explicit approval.
- Prod playbook runs are executed by a separate CD pipeline with scoped
  SSH keys the agent does NOT have access to.

## Syntax and linting

- **FQCN everywhere.** `ansible.builtin.copy`, not `copy`. Enforced by
  `ansible-lint` at production profile.
- Every role has `molecule/default/` with `converge.yml` + `verify.yml`.
- CI matrix tests across ≥2 distros.

## Modules

- Dedicated modules over `shell` / `command`.
- If you must use `command`, require `creates:` or `changed_when:`.
- `ansible-lint no-changed-when` rule catches this at production profile.

## Secrets

- `ansible-vault` or external secret manager (never plaintext).
- `no_log: true` on any task touching secrets.

## Layout

```
inventories/
├── dev/
├── staging/
└── prod/
playbooks/
└── site.yml
roles/<role>/
├── README.md          # role contract
├── defaults/main.yml
├── tasks/main.yml
├── handlers/main.yml
├── meta/main.yml
└── molecule/default/
requirements.yml       # collections, pinned
```

## Reference

See `~/.claude/skills/agentic-skeleton/references/iac-patches.md`
for the full Ansible rules.
