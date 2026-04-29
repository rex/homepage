#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SiteStack } from '../lib/site-stack';
import { CiStack } from '../lib/ci-stack';

const app = new cdk.App();

// CloudFront + ACM (for distributions) require us-east-1.
// Everything else (S3, CF function, IAM, Route 53 records) goes there too
// to keep the stack region-locked and simple.
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const site = new SiteStack(app, 'PiercemooreSiteStack', {
  env,
  description: 'piercemoore.com - S3 + CloudFront + CloudFront Functions + Route 53',
  domainName: 'piercemoore.com',
  vanityDomains: ['piercemoore.cv', 'piercemoore.dev'],
});

new CiStack(app, 'PiercemooreCiStack', {
  env,
  description: 'GitHub Actions OIDC + IAM deploy role for piercemoore.com',
  bucket: site.bucket,
  distribution: site.distribution,
  githubRepo: 'rex/homepage',
  branches: ['main'],
});

app.synth();
