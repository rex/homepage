# infra

AWS CDK TypeScript app. Provisions S3 + CloudFront + Route 53 for piercemoore.com.

## Status

🟢 Production · Owner: Pierce Moore · **Do not edit without reviewing `cdk diff` first.**

> **📌 Shared module — agents: treat this as infrastructure-as-code. Any change affects live DNS and CDN. Always run `npx cdk diff` before `npx cdk deploy`. Open an ADR for structural changes.**

## Why this exists

Cloudflare Pages requires apex-CNAME flattening (moving nameservers), which wasn't viable with existing Route 53 setup. CDK gives reproducible infra with least-privilege IAM.

## Architecture

```
GitHub Actions (OIDC) → Deploy Role (S3 + CF only)
                              ↓
                         S3 Bucket (site assets, versioned)
                              ↓
                      CloudFront Distribution ──→ Log Bucket (30-day TTL)
                              ↓
                    CloudFront Function (edge.js — routing/redirects)
                              ↓
                         Route 53 (piercemoore.com)
```

## Files

- `bin/homepage.ts` — CDK app entry point
- `lib/site-stack.ts` — S3 + CloudFront + Route 53 + access-log bucket
- `lib/ci-stack.ts` — OIDC role for GitHub Actions deploy
- `functions/edge.js` — CloudFront Function for routing + custom error pages

## Access logs

CloudFront writes standard access logs to a separate `LogBucket` (output:
`LogBucketName`) under the `cf-logs/` prefix. One row per request. Format
documented at <https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html#LogFileFormat>.

Cookies are excluded (`logIncludesCookies: false`). Raw logs auto-expire
at 30 days via lifecycle rule. Long-term analytics retention is handled
by daily/monthly rollups written to the site bucket under `admin/data/`
by the `analytics.yml` GitHub Actions workflow (Phase 2).

### Reading the logs locally

```sh
# Sync recent logs to local
aws s3 sync s3://<LogBucketName>/cf-logs/ ./logs/

# Render an HTML report (install: brew install goaccess)
zcat logs/*.gz | goaccess - \
  --log-format=CLOUDFRONT \
  --anonymize-ip \
  --output=report.html

open report.html
```

`--anonymize-ip` zero-pads the last octet so the report stays useful
without surfacing identifying IPs.

## Invariants

- Deploy role is scoped to one bucket + one distribution — never widen scope
- ACM cert must be in `us-east-1` (CloudFront requirement)

## Common tasks

- **Day-to-day deploy**: push to `main` — GitHub Actions handles it (no CDK needed)
- **Infra change**: `cd infra && npm install && npx cdk diff` → review → `npx cdk deploy` (admin creds)
- **First bootstrap**: see root `README.md §Deploying to AWS`

## Gotchas

- First deploy takes 20–40 min (ACM DNS validation + CF propagation)
- `cdk.out/` and `.cdk.staging/` are gitignored — do not commit them