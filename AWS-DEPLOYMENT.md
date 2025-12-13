# CandleStick AWS Deployment Guide

## Overview

Multiple AWS deployment options for CandleStick session tracking system:

1. **🚀 AWS App Runner** (Easiest - Recommended)
2. **🐳 ECS Fargate** (Container-based)
3. **⚡ Lambda + API Gateway** (Serverless)
4. **🖥️ EC2** (Traditional VMs)
5. **🎯 Elastic Beanstalk** (Platform-as-a-Service)

## Option 1: AWS App Runner (Recommended)

**Best for**: Quick deployment, auto-scaling, minimal configuration

### Setup Steps

1. **Prepare the code**:
```bash
# Already done - your repo is ready!
git clone https://github.com/heidebrink/CandleStick.git
```

2. **Create App Runner service**:
   - Go to AWS App Runner console
   - Click "Create service"
   - Source: "Source code repository"
   - Connect to GitHub: `heidebrink/CandleStick`
   - Build settings: Use `apprunner.yaml` (created below)

3. **Environment variables**:
```
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://yourapp.com
```

**Cost**: ~$25-50/month for small apps

---

## Option 2: ECS Fargate (Container)

**Best for**: Microservices, scalability, container expertise

### Setup Steps

1. **Build and push Docker image**:
```bash
# Build
docker build -t candlestick-api -f docker/Dockerfile.aws .

# Tag for ECR
docker tag candlestick-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/candlestick-api:latest

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/candlestick-api:latest
```

2. **Deploy with CDK** (see `aws-cdk/` folder)

**Cost**: ~$30-100/month depending on usage

---

## Option 3: Lambda + API Gateway (Serverless)

**Best for**: Low traffic, cost optimization, event-driven

### Setup Steps

1. **Deploy with Serverless Framework**:
```bash
cd aws-lambda
npm install
serverless deploy
```

2. **Configure DynamoDB** (auto-created)

**Cost**: ~$5-20/month for small apps (pay per request)

---

## Option 4: EC2 (Traditional)

**Best for**: Full control, existing infrastructure, hybrid setups

### Setup Steps

1. **Launch EC2 instance** (t3.micro for testing)
2. **Install dependencies**:
```bash
# Connect via SSH
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# Clone and setup
git clone https://github.com/heidebrink/CandleStick.git
cd CandleStick/server
npm install
npm run build
```

3. **Setup PM2 and nginx** (see detailed steps below)

**Cost**: ~$10-50/month depending on instance size

---

## Option 5: Elastic Beanstalk

**Best for**: Traditional web apps, easy deployment, AWS integration

### Setup Steps

1. **Create application**:
```bash
eb init candlestick-api
eb create production
eb deploy
```

**Cost**: ~$20-60/month

---

## Database Options

### Option A: RDS PostgreSQL (Recommended)
- Managed, scalable, backup included
- Cost: ~$15-50/month

### Option B: DynamoDB (Serverless)
- Pay per request, auto-scaling
- Cost: ~$1-10/month for small apps

### Option C: RDS MySQL
- Familiar, cost-effective
- Cost: ~$15-40/month

---

## CDN & Static Assets

### CloudFront + S3
- Host SDK files on S3
- Distribute via CloudFront
- Cost: ~$1-5/month

---

## Complete Architecture Examples

### Small App (< 1000 sessions/day)
```
App Runner + RDS PostgreSQL + CloudFront
Total: ~$40-70/month
```

### Medium App (< 10k sessions/day)
```
ECS Fargate + RDS + CloudFront + ElastiCache
Total: ~$100-200/month
```

### Large App (> 100k sessions/day)
```
ECS Fargate (multi-AZ) + Aurora + CloudFront + ElastiCache
Total: ~$300-800/month
```

---

## Security Checklist

- [ ] Use HTTPS only (ALB with SSL certificate)
- [ ] Configure proper CORS origins
- [ ] Set up VPC with private subnets
- [ ] Use IAM roles (no hardcoded keys)
- [ ] Enable CloudTrail logging
- [ ] Set up CloudWatch monitoring
- [ ] Configure backup strategy
- [ ] Use AWS Secrets Manager for sensitive data

---

## Monitoring & Alerts

### CloudWatch Dashboards
- API response times
- Error rates
- Database connections
- Storage usage

### Alerts
- High error rate (> 5%)
- Response time > 2 seconds
- Database CPU > 80%
- Storage > 80% full

---

## Backup Strategy

### RDS Automated Backups
- 7-day retention
- Point-in-time recovery
- Cross-region snapshots

### S3 Session Data
- Versioning enabled
- Lifecycle policies
- Cross-region replication

---

## Cost Optimization

1. **Use Reserved Instances** for predictable workloads
2. **Enable auto-scaling** to handle traffic spikes
3. **Set up lifecycle policies** for old session data
4. **Use CloudWatch** to monitor and optimize resources
5. **Consider Spot Instances** for non-critical workloads

---

## Getting Started (Quick)

**For immediate deployment, choose App Runner**:

1. Fork the repository
2. Go to AWS App Runner console
3. Create service from GitHub
4. Set environment variables
5. Deploy!

Your API will be available at: `https://xxx.us-east-1.awsapprunner.com`

---

## Detailed Deployment Instructions

### Option 1: App Runner (Recommended for Beginners)

```bash
# 1. Ensure your code is pushed to GitHub
git push origin main

# 2. Go to AWS Console > App Runner > Create Service
# 3. Choose "Source code repository"
# 4. Connect to GitHub and select your repository
# 5. Use these settings:
#    - Runtime: Node.js 18
#    - Build command: (uses apprunner.yaml)
#    - Start command: (uses apprunner.yaml)
# 6. Set environment variables:
#    NODE_ENV=production
#    PORT=8080
#    CORS_ORIGIN=https://yourdomain.com
```

### Option 2: ECS Fargate with CDK

```bash
# 1. Install CDK
npm install -g aws-cdk

# 2. Configure AWS credentials
aws configure

# 3. Deploy infrastructure
cd aws-cdk
npm install
cdk bootstrap
cdk deploy

# 4. Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker build -t candlestick-api -f docker/Dockerfile.aws .
docker tag candlestick-api:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/candlestick-api:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/candlestick-api:latest
```

### Option 3: Lambda Serverless

```bash
# 1. Install Serverless Framework
npm install -g serverless

# 2. Configure AWS credentials
aws configure

# 3. Deploy Lambda function
cd aws-lambda
npm install
serverless deploy

# Your API will be available at the provided endpoint
```

### Option 4: EC2 Traditional

```bash
# 1. Launch EC2 instance (Amazon Linux 2)
# 2. Connect via SSH
ssh -i your-key.pem ec2-user@your-instance-ip

# 3. Run setup script
curl -fsSL https://raw.githubusercontent.com/heidebrink/CandleStick/main/deployment/ec2-setup.sh | bash
```

### Option 5: Docker Compose (Local/VPS)

```bash
# 1. Clone repository
git clone https://github.com/heidebrink/CandleStick.git
cd CandleStick

# 2. Start services
cd deployment
docker-compose up -d

# 3. Check status
docker-compose ps
```

---

## Environment Configuration

Create `.env` files for each environment:

### Production (.env.production)
```env
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/candlestick
```

### Staging (.env.staging)
```env
NODE_ENV=staging
PORT=8080
CORS_ORIGIN=https://staging.yourdomain.com
DATABASE_URL=postgresql://user:pass@staging-host:5432/candlestick
```

---

## SSL Certificate Setup

### Option A: AWS Certificate Manager (ACM)
```bash
# Request certificate in ACM
aws acm request-certificate \
    --domain-name yourdomain.com \
    --subject-alternative-names *.yourdomain.com \
    --validation-method DNS
```

### Option B: Let's Encrypt (EC2/VPS)
```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com
```

---

## Monitoring Setup

### CloudWatch Dashboards
```bash
# Create custom dashboard
aws cloudwatch put-dashboard \
    --dashboard-name "CandleStick-Monitoring" \
    --dashboard-body file://monitoring/dashboard.json
```

### Alerts
```bash
# High error rate alert
aws cloudwatch put-metric-alarm \
    --alarm-name "CandleStick-HighErrorRate" \
    --alarm-description "Alert when error rate > 5%" \
    --metric-name "4XXError" \
    --namespace "AWS/ApplicationELB" \
    --statistic "Sum" \
    --period 300 \
    --threshold 5 \
    --comparison-operator "GreaterThanThreshold"
```

---

## CI/CD Pipeline

### GitHub Actions (Recommended)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # App Runner deployment
      - name: Deploy to App Runner
        run: |
          # App Runner auto-deploys on git push
          echo "Deployment triggered automatically"
      
      # Or ECS deployment
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster candlestick-cluster \
            --service candlestick-service \
            --force-new-deployment
```

---

## Database Migration

### PostgreSQL Setup
```sql
-- Run this on your RDS instance
CREATE DATABASE candlestick;
CREATE USER candlestick WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE candlestick TO candlestick;
```

### DynamoDB Setup (Lambda)
```bash
# Tables are auto-created by serverless.yml
# No manual setup required
```

---

## Performance Optimization

### CDN Setup
```bash
# Upload SDK to S3
aws s3 cp packages/sdk/dist/ s3://your-cdn-bucket/ --recursive

# Create CloudFront distribution
aws cloudfront create-distribution \
    --distribution-config file://cdn-config.json
```

### Caching Strategy
- API responses: 5 minutes
- SDK files: 1 year
- Session data: No cache

---

## Security Checklist

- [ ] HTTPS only (SSL certificate configured)
- [ ] CORS properly configured
- [ ] API rate limiting enabled
- [ ] Database credentials in AWS Secrets Manager
- [ ] VPC with private subnets
- [ ] Security groups restrict access
- [ ] CloudTrail logging enabled
- [ ] Regular security updates

---

## Troubleshooting

### Common Issues

**App Runner build fails:**
```bash
# Check apprunner.yaml syntax
# Ensure Node.js 18 compatibility
# Verify build commands
```

**ECS task fails to start:**
```bash
# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/ecs/candlestick"
```

**Lambda timeout:**
```bash
# Increase timeout in serverless.yml
# Check DynamoDB throttling
# Optimize cold start performance
```

**Database connection issues:**
```bash
# Check security groups
# Verify connection string
# Test from EC2 instance in same VPC
```

---

## Cost Optimization Tips

1. **Use Reserved Instances** for predictable workloads
2. **Enable auto-scaling** to handle traffic spikes
3. **Set up lifecycle policies** for old session data
4. **Monitor with AWS Cost Explorer**
5. **Use Spot Instances** for non-critical environments

---

## Next Steps

1. Choose your deployment option
2. Set up monitoring and alerts
3. Configure custom domain and SSL
4. Implement CI/CD pipeline
5. Set up backup and disaster recovery
6. Performance testing and optimization

Each option includes detailed setup files in the respective folders.