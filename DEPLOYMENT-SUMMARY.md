# CandleStick AWS Deployment - Complete Guide

## 🎯 Quick Start

The fastest way to deploy CandleStick to AWS:

```bash
# 1. Choose your deployment method
./deploy-aws.sh --method apprunner --domain api.yourdomain.com

# 2. Or use the interactive script
./deploy-aws.sh
```

## 📁 Deployment Files Overview

### Core Infrastructure
- `AWS-DEPLOYMENT.md` - Comprehensive deployment guide
- `deploy-aws.sh` - Quick deployment script
- `apprunner.yaml` - App Runner configuration

### Container Deployment
- `docker/Dockerfile.aws` - Production Docker image
- `deployment/docker-compose.yml` - Local/VPS deployment
- `deployment/nginx.conf` - Reverse proxy configuration

### Serverless (Lambda)
- `aws-lambda/` - Complete Lambda function
- `aws-lambda/serverless.yml` - Serverless Framework config
- `aws-lambda/src/lambda.ts` - Lambda handler

### Infrastructure as Code (ECS)
- `aws-cdk/` - CDK infrastructure code
- `aws-cdk/lib/candlestick-stack.ts` - Main stack definition

### Traditional Server (EC2)
- `deployment/ec2-setup.sh` - Automated EC2 setup
- `deploy-lightsail.sh` - Lightsail deployment

### Monitoring & CI/CD
- `monitoring/dashboard.json` - CloudWatch dashboard
- `monitoring/alerts.yml` - CloudFormation alerts
- `.github/workflows/deploy-aws.yml` - GitHub Actions

## 🚀 Deployment Options Comparison

| Method | Complexity | Cost | Scalability | Best For |
|--------|------------|------|-------------|----------|
| **App Runner** | ⭐ | $25-50/mo | Auto | Beginners, MVP |
| **Lambda** | ⭐⭐ | $5-20/mo | Infinite | Low traffic, cost-sensitive |
| **ECS Fargate** | ⭐⭐⭐ | $30-100/mo | High | Production, microservices |
| **EC2** | ⭐⭐⭐⭐ | $10-50/mo | Manual | Full control, existing infra |
| **Lightsail** | ⭐⭐ | $10-40/mo | Limited | Simple, predictable |

## 🎯 Recommended Deployment Path

### For Beginners (App Runner)
```bash
# 1. Push code to GitHub
git push origin main

# 2. Deploy with script
./deploy-aws.sh --method apprunner

# 3. Follow console instructions
# 4. Your API will be live in ~5 minutes
```

### For Production (ECS + CDK)
```bash
# 1. Configure AWS credentials
aws configure

# 2. Deploy infrastructure
./deploy-aws.sh --method ecs --domain api.yourdomain.com

# 3. Set up monitoring
aws cloudformation deploy --template-file monitoring/alerts.yml --stack-name candlestick-alerts --parameter-overrides NotificationEmail=admin@yourdomain.com

# 4. Configure CI/CD
# Add secrets to GitHub Actions
```

### For Cost Optimization (Lambda)
```bash
# 1. Deploy serverless
./deploy-aws.sh --method lambda

# 2. Configure DynamoDB auto-scaling
# 3. Set up CloudWatch cost alerts
```

## 🔧 Configuration

### Environment Variables
```env
# Required
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://yourdomain.com

# Optional
DATABASE_URL=postgresql://user:pass@host:5432/candlestick
DATA_DIR=/app/data
```

### Domain Setup
1. **Purchase domain** (Route 53 or external)
2. **Request SSL certificate** (ACM)
3. **Configure DNS** (CNAME/A record)
4. **Update CORS_ORIGIN** in deployment

### Database Options
- **File-based** (default) - Good for testing
- **PostgreSQL** (RDS) - Recommended for production
- **DynamoDB** (Lambda) - Serverless option

## 📊 Monitoring Setup

### CloudWatch Dashboard
```bash
# Deploy monitoring dashboard
aws cloudwatch put-dashboard --dashboard-name "CandleStick" --dashboard-body file://monitoring/dashboard.json
```

### Alerts
```bash
# Deploy alert stack
aws cloudformation deploy \
  --template-file monitoring/alerts.yml \
  --stack-name candlestick-alerts \
  --parameter-overrides NotificationEmail=admin@yourdomain.com
```

### Key Metrics to Monitor
- API response time (< 2 seconds)
- Error rate (< 5%)
- CPU usage (< 80%)
- Memory usage (< 80%)
- Database connections
- Storage usage

## 🔒 Security Checklist

- [ ] **HTTPS only** - SSL certificate configured
- [ ] **CORS configured** - Restrict to your domains
- [ ] **Rate limiting** - Prevent abuse
- [ ] **VPC setup** - Private subnets for database
- [ ] **IAM roles** - No hardcoded credentials
- [ ] **Security groups** - Minimal access
- [ ] **Backup strategy** - Regular snapshots
- [ ] **Update strategy** - Security patches

## 💰 Cost Optimization

### Immediate Savings
1. **Use t3.micro** for testing (free tier eligible)
2. **Enable auto-scaling** to handle traffic spikes
3. **Set up lifecycle policies** for old session data
4. **Use Reserved Instances** for predictable workloads

### Long-term Optimization
1. **Monitor with Cost Explorer**
2. **Set up billing alerts**
3. **Review and optimize monthly**
4. **Consider Spot Instances** for dev/staging

## 🚨 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Rebuild dependencies
rm -rf node_modules package-lock.json
npm install
```

**Deployment Failures**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check region
aws configure get region

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name YourStackName
```

**Runtime Errors**
```bash
# Check CloudWatch logs
aws logs describe-log-groups
aws logs tail /aws/lambda/candlestick-api --follow

# Check ECS logs
aws ecs describe-services --cluster candlestick-cluster --services candlestick-service
```

### Getting Help
1. **Check logs** in CloudWatch
2. **Review AWS documentation**
3. **Check GitHub issues**
4. **AWS Support** (if you have a support plan)

## 🎯 Next Steps After Deployment

### Immediate (Day 1)
1. ✅ Verify deployment works
2. ✅ Test API endpoints
3. ✅ Configure monitoring
4. ✅ Set up alerts

### Short-term (Week 1)
1. 🔒 Configure SSL certificate
2. 🌐 Set up custom domain
3. 📊 Review monitoring data
4. 🔄 Set up CI/CD pipeline

### Long-term (Month 1)
1. 📈 Performance optimization
2. 💰 Cost optimization review
3. 🔐 Security audit
4. 📋 Backup and disaster recovery
5. 📚 Documentation updates

## 📞 Support

- **Documentation**: See `AWS-DEPLOYMENT.md` for detailed instructions
- **Scripts**: Use `deploy-aws.sh` for automated deployment
- **Monitoring**: Check `monitoring/` folder for CloudWatch configs
- **Issues**: Create GitHub issues for bugs or questions

---

**🕯️ CandleStick is now ready for AWS deployment!**

Choose your deployment method and follow the guides above. Each option is production-ready and includes monitoring, security, and scalability considerations.