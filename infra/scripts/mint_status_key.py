#!/usr/bin/env python3
"""Mint halifirien's S3 writer key straight into 1Password. The secret is never printed.

`make mint-status-key` (rex/homepage#17). The IAM user comes from PiercemooreStatusWriterStack
(`make deploy-status`). This script:

  1. refuses if the user already has a key or the 1Password item already exists
     (rotation: delete the old key and item first, then run this again);
  2. runs `aws iam create-access-key`, holding the result in memory only;
  3. pipes a 1Password item template to `op item create` on stdin (not argv, so the
     secret never appears in the process list);
  4. if 1Password refuses, deletes the key it just made, so no key exists that
     nothing holds.

It prints the item title, the field names, and the last four characters of the
access key id. The ring reads the fields as op://agentic/<item>/access-key-id and
op://agentic/<item>/secret-access-key.

Needs AWS credentials that can manage IAM (the same ones `make deploy` uses) and a
signed-in `op` CLI.
"""

from __future__ import annotations

import json
import subprocess
import sys

USER = "halifirien-status-writer"
VAULT = "agentic"
ITEM = "svc-aws-halifirien-status-writer"
REGION = "us-east-1"
PURPOSE = (
    "halifirien (rex/halifirien) PUTs status/status.json to the piercemoore.com bucket. "
    "IAM policy: s3:PutObject on <site-bucket>/status/* only (PiercemooreStatusWriterStack)."
)


def _run(args: list[str], stdin: str | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, input=stdin, capture_output=True, text=True, check=False)


def _fail(message: str) -> int:
    print(f"mint-status-key: {message}", file=sys.stderr)
    return 1


def main() -> int:
    keys = _run(["aws", "iam", "list-access-keys", "--user-name", USER, "--output", "json"])
    if keys.returncode != 0:
        return _fail(f"cannot list {USER}'s keys (deployed? `make deploy-status`): {keys.stderr.strip()}")
    if json.loads(keys.stdout).get("AccessKeyMetadata"):
        return _fail(f"{USER} already has a key; delete it (and the 1Password item) to rotate")
    if _run(["op", "item", "get", ITEM, "--vault", VAULT, "--format", "json"]).returncode == 0:
        return _fail(f"1Password item {ITEM} already exists in {VAULT}; delete it to rotate")

    created = _run(["aws", "iam", "create-access-key", "--user-name", USER, "--output", "json"])
    if created.returncode != 0:
        return _fail(f"create-access-key failed: {created.stderr.strip()}")
    key = json.loads(created.stdout)["AccessKey"]
    key_id = key["AccessKeyId"]

    template = {
        "title": ITEM,
        "category": "API_CREDENTIAL",
        "fields": [
            {"id": "notesPlain", "type": "STRING", "purpose": "NOTES", "label": "notesPlain", "value": PURPOSE},
            {"label": "access-key-id", "type": "STRING", "value": key_id},
            {"label": "secret-access-key", "type": "CONCEALED", "value": key["SecretAccessKey"]},
            {"label": "region", "type": "STRING", "value": REGION},
            {"label": "iam-user", "type": "STRING", "value": USER},
            {"label": "purpose", "type": "STRING", "value": PURPOSE},
        ],
    }
    stored = _run(["op", "item", "create", "--vault", VAULT, "--format", "json", "-"], json.dumps(template))
    del key, template
    if stored.returncode != 0:
        _run(["aws", "iam", "delete-access-key", "--user-name", USER, "--access-key-id", key_id])
        return _fail(f"1Password refused the item, so the new key was deleted: {stored.stderr.strip()}")

    print(f"created 1Password item {VAULT}/{ITEM} for {USER} (key ...{key_id[-4:]})")
    print("fields: access-key-id, secret-access-key, region, iam-user, purpose")
    return 0


if __name__ == "__main__":
    sys.exit(main())
