import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

export interface CiStackProps extends StackProps {
  /** Site bucket - granted ReadWrite on this role. */
  bucket: s3.IBucket;
  /** Distribution - granted CreateInvalidation on this role only. */
  distribution: cloudfront.IDistribution;
  /** GitHub repository in `owner/repo` form. */
  githubRepo: string;
  /** Branches allowed to assume this role (e.g. ["main"]). */
  branches: string[];
}

/**
 * GitHub Actions OIDC integration. The role assumed by the deploy
 * workflow has only:
 *   - ReadWrite on the site bucket (so `aws s3 sync --delete` works)
 *   - CreateInvalidation on the specific distribution (path /*)
 *
 * No long-lived AWS keys are stored anywhere. The OIDC token from
 * GitHub Actions is exchanged for short-lived STS credentials at deploy
 * time. Trust policy locks to the specific repo + branches.
 */
export class CiStack extends Stack {
  constructor(scope: Construct, id: string, props: CiStackProps) {
    super(scope, id, props);

    // OIDC provider for token.actions.githubusercontent.com.
    // Singleton per account - if you have other GitHub-OIDC roles in
    // the same account, refactor to use a shared provider.
    const provider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    // Trust policy: only the listed branches of the listed repo can assume.
    const subClaims = props.branches.map(
      (b) => `repo:${props.githubRepo}:ref:refs/heads/${b}`,
    );

    const role = new iam.Role(this, 'DeployRole', {
      roleName: 'piercemoore-com-deploy',
      assumedBy: new iam.FederatedPrincipal(
        provider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
          StringLike: {
            'token.actions.githubusercontent.com:sub': subClaims,
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      description: `Deploy role for ${props.githubRepo} (${props.branches.join(',')}) - site sync + CF invalidation only`,
      maxSessionDuration: Stack.of(this).node.tryGetContext('maxSessionDurationSeconds')
        ? undefined
        : undefined,
    });

    // Permission 1: read/write on the site bucket. Includes List, Get, Put,
    // Delete, MultipartUpload - everything `aws s3 sync --delete` needs.
    props.bucket.grantReadWrite(role);
    props.bucket.grantDelete(role);

    // Permission 2: invalidate this specific distribution only.
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudfront:CreateInvalidation',
          'cloudfront:GetInvalidation',
          'cloudfront:ListInvalidations',
        ],
        resources: [
          `arn:aws:cloudfront::${this.account}:distribution/${props.distribution.distributionId}`,
        ],
      }),
    );

    new CfnOutput(this, 'DeployRoleArn', {
      value: role.roleArn,
      description: 'GitHub Actions assumes this role via OIDC. Set as AWS_DEPLOY_ROLE_ARN in GitHub secrets.',
    });
  }
}
