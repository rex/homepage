import * as path from 'node:path';
import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
  CfnOutput,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

export interface SiteStackProps extends StackProps {
  /** Canonical domain — gets the apex + www records and serves all paths. */
  domainName: string;
  /** Vanity domains that 301-redirect to specific paths on the canonical domain. */
  vanityDomains: string[];
}

/**
 * Hosts piercemoore.com on AWS:
 *   - S3 bucket (private, OAC-only access from CloudFront)
 *   - ACM certificate covering apex + www + every vanity domain
 *   - CloudFront distribution with a viewer-request Function that handles
 *     URL rewriting for clean URLs, www→apex canonical redirects,
 *     vanity-domain 301s, and the POST /api/ask 501 stub
 *   - Route 53 A + AAAA ALIAS records on every hosted zone
 *
 * The S3 bucket is filled by GitHub Actions on push to main — the stack
 * never deploys site content itself. That keeps infra changes (rare) and
 * content changes (constant) on different paths.
 */
export class SiteStack extends Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: SiteStackProps) {
    super(scope, id, props);

    const { domainName, vanityDomains } = props;
    const wwwDomain = `www.${domainName}`;

    // 1. Hosted zones — must already exist in Route 53.
    const canonicalZone = route53.HostedZone.fromLookup(this, 'CanonicalZone', {
      domainName,
    });
    const vanityZones = vanityDomains.map((d, i) =>
      route53.HostedZone.fromLookup(this, `VanityZone${i}`, { domainName: d }),
    );

    // 2. Site bucket — private, encrypted, retained on stack delete.
    this.bucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // 3. ACM certificate (us-east-1, required by CloudFront).
    //    SAN cert: apex + www + each vanity domain. DNS validation across
    //    the matching hosted zone for each name.
    const validationMap: Record<string, route53.IHostedZone> = {
      [domainName]: canonicalZone,
      [wwwDomain]: canonicalZone,
    };
    vanityDomains.forEach((d, i) => {
      validationMap[d] = vanityZones[i];
    });

    const certificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName,
      subjectAlternativeNames: [wwwDomain, ...vanityDomains],
      validation: acm.CertificateValidation.fromDnsMultiZone(validationMap),
    });

    // 4. CloudFront viewer-request function.
    //    JS 2.0 runtime — supports response bodies up to 40KB and
    //    most ES6+ syntax. ES5 compat still required for some constructs.
    const edgeFunctionPath = path.join(__dirname, '..', 'functions', 'edge.js');
    const edgeFunction = new cloudfront.Function(this, 'EdgeFunction', {
      code: cloudfront.FunctionCode.fromFile({ filePath: edgeFunctionPath }),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      comment: 'piercemoore.com — URL rewrite + canonical/vanity redirects + /api/ask stub',
    });

    // 5. CloudFront distribution.
    //    OAC origin (the modern, non-deprecated S3 access pattern).
    //    PriceClass 100 = North America + Europe; ample for our audience and ~30% cheaper than ALL.
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(this.bucket);

    const defaultBehavior: cloudfront.BehaviorOptions = {
      origin: s3Origin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      compress: true,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      functionAssociations: [
        {
          function: edgeFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        },
      ],
    };

    // /api/* needs POST allowed and no cache. The function intercepts
    // before the request ever reaches S3, but the distribution still has
    // to permit POST or it 405s the request itself.
    const apiBehavior: cloudfront.BehaviorOptions = {
      origin: s3Origin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
      compress: false,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      functionAssociations: [
        {
          function: edgeFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        },
      ],
    };

    this.distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultRootObject: 'index.html',
      certificate,
      domainNames: [domainName, wwwDomain, ...vanityDomains],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      enableIpv6: true,
      defaultBehavior,
      additionalBehaviors: {
        '/api/*': apiBehavior,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: Duration.minutes(5),
        },
        {
          httpStatus: 500,
          responseHttpStatus: 500,
          responsePagePath: '/500.html',
          ttl: Duration.seconds(0),
        },
        {
          httpStatus: 502,
          responseHttpStatus: 500,
          responsePagePath: '/500.html',
          ttl: Duration.seconds(0),
        },
        {
          httpStatus: 503,
          responseHttpStatus: 500,
          responsePagePath: '/500.html',
          ttl: Duration.seconds(0),
        },
      ],
      comment: 'piercemoore.com',
    });

    // 6. Route 53 records — A + AAAA ALIAS to the distribution.
    const cfTarget = route53.RecordTarget.fromAlias(
      new targets.CloudFrontTarget(this.distribution),
    );

    // Plain ARecord/AaaaRecord. If a name+type collides with a
    // pre-existing record, the deploy fails — the operator surgically
    // deletes the colliding record out-of-band, then re-runs the deploy.
    // We do NOT use deleteExisting (deprecated, dangerous on partial
    // deploy failures).

    // Canonical zone: apex + www
    new route53.ARecord(this, 'CanonicalApexA', {
      zone: canonicalZone,
      recordName: domainName,
      target: cfTarget,
    });
    new route53.AaaaRecord(this, 'CanonicalApexAAAA', {
      zone: canonicalZone,
      recordName: domainName,
      target: cfTarget,
    });
    new route53.ARecord(this, 'CanonicalWwwA', {
      zone: canonicalZone,
      recordName: wwwDomain,
      target: cfTarget,
    });
    new route53.AaaaRecord(this, 'CanonicalWwwAAAA', {
      zone: canonicalZone,
      recordName: wwwDomain,
      target: cfTarget,
    });

    // Vanity zones: apex only.
    vanityDomains.forEach((d, i) => {
      new route53.ARecord(this, `VanityApexA${i}`, {
        zone: vanityZones[i],
        recordName: d,
        target: cfTarget,
      });
      new route53.AaaaRecord(this, `VanityApexAAAA${i}`, {
        zone: vanityZones[i],
        recordName: d,
        target: cfTarget,
      });
    });

    // 7. Outputs — used by GitHub Actions secrets.
    new CfnOutput(this, 'SiteBucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket holding the built site. Set as AWS_SITE_BUCKET in GitHub secrets.',
    });
    new CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID. Set as AWS_DISTRIBUTION_ID in GitHub secrets.',
    });
    new CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront default domain (xxxx.cloudfront.net). For sanity-checking before DNS cuts over.',
    });
  }
}
