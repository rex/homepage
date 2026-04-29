# piercemoore.com — infra

CDK app provisioning the AWS-side hosting for [piercemoore.com](../README.md).

## What it creates

| Resource | Purpose |
|---|---|
| `SiteStack` ‧ S3 bucket | Holds the Astro `dist/` output. Private, OAC-only. |
| `SiteStack` ‧ CloudFront distribution | TLS, edge cache, custom domains. PriceClass 100, HTTP/2 + HTTP/3, IPv6. |
| `SiteStack` ‧ CloudFront Function | URL rewriting, www→apex canonical, vanity-domain 301s, POST /api/ask 501. Source: [`functions/edge.js`](functions/edge.js). |
| `SiteStack` ‧ ACM certificate (us-east-1) | SAN cert covering `piercemoore.com`, `www.piercemoore.com`, `piercemoore.cv`, `piercemoore.dev`. DNS-validated across all three Route 53 zones. |
| `SiteStack` ‧ Route 53 records | A + AAAA ALIAS records on each apex (and `www` for the canonical domain). |
| `CiStack` ‧ GitHub OIDC provider | One-time integration with `token.actions.githubusercontent.com`. |
| `CiStack` ‧ Deploy role | IAM role assumed by GitHub Actions. Permissions: ReadWrite on the site bucket + CreateInvalidation on the distribution. **Nothing else.** |

Region-locked to `us-east-1` because CloudFront ACM certs must live there.

## One-time bootstrap

You need admin AWS credentials in your shell for these two steps. **After that, your admin creds are not used again** — GitHub Actions uses the limited deploy role, and you use the same role (or admin if you're making infra changes) to run `cdk deploy` for stack updates.

```sh
cd infra
npm install

# 1. Bootstrap CDK in your account/region (idempotent — safe to re-run).
npx cdk bootstrap aws://<ACCOUNT_ID>/us-east-1

# 2. Deploy both stacks. First run takes 20-40 minutes (ACM DNS validation
#    + CloudFront propagation). Subsequent infra changes are faster.
npm run deploy
```

CDK prints three outputs you'll need to add as GitHub Actions secrets:

```
PiercemooreSiteStack.SiteBucketName        = piercemooresitestack-sitebucketXXXX-XXXX
PiercemooreSiteStack.DistributionId        = EXXXXXXXXXXXX
PiercemooreCiStack.DeployRoleArn           = arn:aws:iam::123456789012:role/piercemoore-com-deploy
```

In `github.com/rex/homepage` → **Settings → Secrets and variables → Actions**, add:

- `AWS_SITE_BUCKET` ← `SiteBucketName`
- `AWS_DISTRIBUTION_ID` ← `DistributionId`
- `AWS_DEPLOY_ROLE_ARN` ← `DeployRoleArn`

## Day-to-day

- **Content / code change** → push to `main` → GitHub Actions builds Astro, syncs to S3, invalidates CloudFront. No CDK involvement. See [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).
- **Infra change** → edit a stack file, `npm run diff` to preview, `npm run deploy` to apply. Run locally with admin or the deploy role.
- **Tear down** (don't): `npm run destroy`. The S3 bucket is `RemovalPolicy.RETAIN`, so it survives. Empty + delete it manually if you really mean it.

## Caching strategy

Configured in the GitHub Actions workflow, not the stack:

- `_astro/*` and `fonts/*` → `Cache-Control: public, max-age=31536000, immutable` (Astro fingerprints these filenames; safe to lock for a year).
- Everything else → `Cache-Control: public, max-age=600` (HTML, sitemap, robots, favicons, OG image). 10-minute browser cache, plus `aws cloudfront create-invalidation /*` after every deploy clears the CDN edges.

## Why this shape

- **Why not Cloudflare Pages?** Apex CNAME flattening requires Cloudflare nameservers (DNS migration) or Business+ tier. Pierce's DNS lives on Route 53 and isn't moving.
- **Why CloudFront Function vs. Lambda@Edge?** CF Functions cost ~$0.10/M requests (free tier 1M/mo), execute in <1ms at the edge, and handle 100% of our edge logic (string compare, redirect, body-write). Lambda@Edge is ~6× more expensive, slower to deploy, and unnecessary unless you need full Node.js.
- **Why two stacks?** `SiteStack` outputs feed `CiStack` inputs. Splitting them lets you destroy/recreate CI without touching the site, and keeps the CI stack's IAM scope visible at a glance instead of buried in 200 lines of distribution config.
- **Why `RemovalPolicy.RETAIN` on the bucket?** A `cdk destroy` accident shouldn't take the site files with it. If you really want to start over, empty the bucket manually first.
