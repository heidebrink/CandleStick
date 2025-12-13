#!/bin/bash

# CandleStick AWS Quick Deploy Script
# Supports multiple deployment methods

set -e

DEPLOYMENT_METHOD=""
AWS_REGION="us-east-1"
DOMAIN_NAME=""
ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "🕯️  CandleStick AWS Deployment"
    echo "================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -m, --method METHOD     Deployment method (apprunner|ecs|lambda|ec2)"
    echo "  -r, --region REGION     AWS region (default: us-east-1)"
    echo "  -d, --domain DOMAIN     Custom domain name (optional)"
    echo "  -e, --env ENVIRONMENT   Environment (dev|staging|production)"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --method apprunner --domain api.myapp.com"
    echo "  $0 --method lambda --region us-west-2"
    echo "  $0 --method ecs --domain api.myapp.com --env staging"
}

check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js 18 or later."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install npm."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

deploy_apprunner() {
    echo "🚀 Deploying to AWS App Runner..."
    
    # Check if repository is pushed
    if ! git remote get-url origin &> /dev/null; then
        print_error "No git remote found. Please push your code to GitHub first."
        exit 1
    fi
    
    REPO_URL=$(git remote get-url origin)
    print_warning "Make sure your code is pushed to: $REPO_URL"
    
    echo ""
    echo "Next steps:"
    echo "1. Go to AWS App Runner console: https://console.aws.amazon.com/apprunner/"
    echo "2. Click 'Create service'"
    echo "3. Choose 'Source code repository'"
    echo "4. Connect to GitHub and select your repository"
    echo "5. Use these settings:"
    echo "   - Runtime: Node.js 18"
    echo "   - Build settings: Use apprunner.yaml"
    echo "6. Set environment variables:"
    echo "   - NODE_ENV=$ENVIRONMENT"
    echo "   - PORT=8080"
    echo "   - CORS_ORIGIN=${DOMAIN_NAME:-'*'}"
    echo ""
    print_success "App Runner configuration ready!"
}

deploy_lambda() {
    echo "⚡ Deploying to AWS Lambda..."
    
    # Check Serverless Framework
    if ! command -v serverless &> /dev/null; then
        echo "Installing Serverless Framework..."
        npm install -g serverless
    fi
    
    cd aws-lambda
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Deploy
    echo "🚀 Deploying Lambda function..."
    serverless deploy --region $AWS_REGION --stage $ENVIRONMENT
    
    cd ..
    print_success "Lambda deployment complete!"
}

deploy_ecs() {
    echo "🐳 Deploying to ECS Fargate..."
    
    # Check CDK
    if ! command -v cdk &> /dev/null; then
        echo "Installing AWS CDK..."
        npm install -g aws-cdk
    fi
    
    cd aws-cdk
    
    # Install dependencies
    echo "📦 Installing CDK dependencies..."
    npm install
    
    # Bootstrap CDK (if needed)
    echo "🔧 Bootstrapping CDK..."
    cdk bootstrap --region $AWS_REGION || true
    
    # Deploy
    echo "🚀 Deploying ECS infrastructure..."
    cdk deploy --region $AWS_REGION --require-approval never
    
    cd ..
    
    echo ""
    print_warning "Don't forget to:"
    echo "1. Build and push Docker image to ECR"
    echo "2. Update the image URI in the CDK stack"
    echo "3. Redeploy the stack"
    
    print_success "ECS infrastructure deployed!"
}

deploy_ec2() {
    echo "🖥️  EC2 deployment requires manual setup..."
    
    echo ""
    echo "Steps to deploy on EC2:"
    echo "1. Launch an Amazon Linux 2 instance"
    echo "2. Connect via SSH"
    echo "3. Run this command:"
    echo "   curl -fsSL https://raw.githubusercontent.com/heidebrink/CandleStick/main/deployment/ec2-setup.sh | bash"
    echo ""
    print_success "EC2 deployment instructions provided!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--method)
            DEPLOYMENT_METHOD="$2"
            shift 2
            ;;
        -r|--region)
            AWS_REGION="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN_NAME="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
print_header

# Validate deployment method
if [[ -z "$DEPLOYMENT_METHOD" ]]; then
    print_error "Deployment method is required"
    show_usage
    exit 1
fi

case $DEPLOYMENT_METHOD in
    apprunner|app-runner)
        check_prerequisites
        deploy_apprunner
        ;;
    lambda|serverless)
        check_prerequisites
        deploy_lambda
        ;;
    ecs|fargate)
        check_prerequisites
        deploy_ecs
        ;;
    ec2)
        deploy_ec2
        ;;
    *)
        print_error "Invalid deployment method: $DEPLOYMENT_METHOD"
        echo "Valid methods: apprunner, lambda, ecs, ec2"
        exit 1
        ;;
esac

echo ""
print_success "Deployment process completed!"
echo ""
echo "📚 For detailed instructions, see: AWS-DEPLOYMENT.md"
echo "🔧 For troubleshooting, check the deployment logs"
echo "📊 Set up monitoring and alerts for production use"