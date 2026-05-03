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
                      CloudFront Distribution
                              ↓
                    CloudFront Function (edge.js — routing/redirects)
                              ↓
                         Route 53 (piercemoore.com)
```

## Files

- `bin/homepage.ts` — CDK app entry point
- `lib/site-stack.ts` — S3 + CloudFront + Route 53 stack
- `lib/ci-stack.ts` — OIDC role for GitHub Actions deploy
- `functions/edge.js` — CloudFront Function for routing + custom error pages

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