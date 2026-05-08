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

## Daily analytics workflow + protected dashboard

`.github/workflows/analytics.yml` runs on a daily cron and:

1. Pulls CloudFront access logs from `LogBucket`
2. Runs goaccess against them (`--anonymize-ip`)
3. Writes the HTML report to `s3://<SiteBucket>/admin/stats/index.html`
4. Writes a daily rollup JSON to `s3://<SiteBucket>/admin/data/daily/YYYY-MM-DD.json`
   (raw logs auto-expire at 30 days; rollups live forever — that's the
   "longitudinal data without keeping per-request data" tradeoff)
5. Reads every historical daily rollup from S3 and renders a
   trends page (sparkline + table) at
   `s3://<SiteBucket>/admin/trends/index.html`
6. Invalidates `/admin/*` on CloudFront

Three pages live behind the admin gate:

- <https://piercemoore.com/admin/stats/> — most recent goaccess report
  generated from the last 30 days of raw logs
- <https://piercemoore.com/admin/trends/> — longitudinal view: all
  historical daily rollups as a sparkline + table
- <https://piercemoore.com/admin/data/latest.json> — raw JSON of the
  most recent rollup (also exposed at `daily/YYYY-MM-DD.json` per day)

The CloudFront Function gates everything under `/admin/*` behind HTTP
Basic Auth.

### Configuring the admin password

Before `cdk deploy`, set one of the following env-var pairs in your
shell:

```sh
# Option A: full Authorization header value (you've pre-encoded it)
export PIERCEMOORE_ADMIN_AUTH='Basic dXNlcjpzb21lcGFzc3dvcmQ='

# Option B: plaintext user + pass (CDK will base64-encode)
export PIERCEMOORE_ADMIN_USER='admin'
export PIERCEMOORE_ADMIN_PASS='something-long-and-random'
```

CDK substitutes the resolved value into the CloudFront Function source
at synth time. The value ends up in the synthesized CloudFormation
template, the CDK assets bucket, and the deployed CF function source —
all admin-only access paths in the AWS account. Acceptable for a
personal stats page; rotate by re-deploying with a new value.

If neither env var is set at deploy time, the placeholder remains and
the function returns 503 for every `/admin/*` request — admin is
locked-by-default. There is no way to "open" admin without redeploying
with credentials.

### Required GitHub secrets (analytics workflow)

In addition to the deploy secrets (`AWS_DEPLOY_ROLE_ARN`,
`AWS_SITE_BUCKET`, `AWS_DISTRIBUTION_ID`), add:

- `AWS_LOG_BUCKET` — the CFn output `PiercemooreSiteStack.LogBucketName`

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