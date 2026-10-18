import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface StatusWriterStackProps extends StackProps {
  /** Site bucket - the writer may PUT under `prefix/` here and nothing else. */
  bucket: s3.IBucket;
  /** Key prefix, without slashes (e.g. "status"). */
  prefix: string;
}

/**
 * The homelab status beacon's writer (rex/halifirien, rex/homepage#17).
 *
 * halifirien runs in the homelab's isengard ring. Every 15 minutes it PUTs
 * status/status.json, which the /homelab page reads from the same origin.
 * The lab has no OIDC trust to AWS, so it authenticates as this IAM user
 * with one access key.
 *
 * The key is minted OUTSIDE CloudFormation (`aws iam create-access-key`
 * piped straight into 1Password, see infra/README.md), so the secret never
 * lands in a template, a stack output or the CDK asset bucket. The ring
 * reads it from 1Password through ExternalSecrets.
 *
 * Its only permission is s3:PutObject on <bucket>/<prefix>/*. It cannot
 * read, list or delete anything, and it cannot invalidate the
 * distribution: the object's own Cache-Control (max-age=60) keeps
 * CloudFront fresh.
 */
export class StatusWriterStack extends Stack {
  public readonly user: iam.User;

  constructor(scope: Construct, id: string, props: StatusWriterStackProps) {
    super(scope, id, props);

    this.user = new iam.User(this, 'StatusWriter', {
      userName: 'halifirien-status-writer',
    });

    this.user.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject'],
        resources: [props.bucket.arnForObjects(`${props.prefix}/*`)],
      }),
    );

    new CfnOutput(this, 'StatusWriterUserName', {
      value: this.user.userName,
      description: 'IAM user halifirien authenticates as. Its key lives only in 1Password (agentic vault).',
    });
  }
}
