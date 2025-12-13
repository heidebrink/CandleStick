import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export class CandlestickStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'CandlestickVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // RDS Database
    const database = new rds.DatabaseInstance(this, 'CandlestickDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      credentials: rds.Credentials.fromGeneratedSecret('candlestick-admin'),
      multiAz: false,
      allocatedStorage: 20,
      storageEncrypted: true,
      deletionProtection: false, // Set to true in production
      databaseName: 'candlestick',
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'CandlestickCluster', {
      vpc,
      containerInsights: true,
    });

    // Fargate Service
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'CandlestickService', {
      cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 2,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('your-account.dkr.ecr.region.amazonaws.com/candlestick-api:latest'),
        containerPort: 8080,
        environment: {
          NODE_ENV: 'production',
          PORT: '8080',
        },
        secrets: {
          DATABASE_URL: ecs.Secret.fromSecretsManager(database.secret!, 'connectionString'),
        },
      },
      publicLoadBalancer: true,
      listenerPort: 443,
      protocol: ecsPatterns.ApplicationProtocol.HTTPS,
      domainName: 'api.yourdomain.com', // Replace with your domain
      domainZone: undefined, // Add your hosted zone here
    });

    // Allow ECS to connect to RDS
    database.connections.allowFrom(fargateService.service, ec2.Port.tcp(5432));

    // S3 Bucket for SDK files
    const sdkBucket = new s3.Bucket(this, 'CandlestickSDK', {
      bucketName: 'candlestick-sdk-files',
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      cors: [{
        allowedMethods: [s3.HttpMethods.GET],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'CandlestickCDN', {
      defaultBehavior: {
        origin: new origins.S3Origin(sdkBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
    });

    new cdk.CfnOutput(this, 'CDNDomain', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'SDKBucket', {
      value: sdkBucket.bucketName,
    });
  }
}