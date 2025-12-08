#!/bin/bash

# CandleStick Deployment Script for AWS Lightsail
# Usage: ./deploy-lightsail.sh [lightsail-ip] [ssh-key-path]

set -e

LIGHTSAIL_IP=$1
SSH_KEY=$2
DEPLOY_USER="ubuntu"
DEPLOY_PATH="/var/www/CandleStick"

if [ -z "$LIGHTSAIL_IP" ]; then
    echo "Error: Lightsail IP address required"
    echo "Usage: ./deploy-lightsail.sh [lightsail-ip] [ssh-key-path]"
    exit 1
fi

if [ -z "$SSH_KEY" ]; then
    echo "Error: SSH key path required"
    echo "Usage: ./deploy-lightsail.sh [lightsail-ip] [ssh-key-path]"
    exit 1
fi

echo "🚀 Deploying CandleStick to Lightsail..."
echo "   IP: $LIGHTSAIL_IP"
echo "   Path: $DEPLOY_PATH"

# Build locally
echo "📦 Building SDK..."
cd packages/sdk
npm install
npm run build
cd ../..

echo "📦 Building Viewer..."
cd packages/viewer
npm install
npm run build
cd ../..

echo "📦 Building Server..."
cd server
npm install
npm run build:mssql
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf candlestick-deploy.tar.gz \
    server/dist \
    server/package.json \
    server/package-lock.json \
    server/.env.production \
    server/sql \
    packages/viewer/dist \
    packages/viewer/package.json \
    packages/sdk/dist

# Upload to Lightsail
echo "📤 Uploading to Lightsail..."
scp -i "$SSH_KEY" candlestick-deploy.tar.gz "$DEPLOY_USER@$LIGHTSAIL_IP:/tmp/"

# Deploy on server
echo "🔧 Deploying on server..."
ssh -i "$SSH_KEY" "$DEPLOY_USER@$LIGHTSAIL_IP" << 'ENDSSH'
    set -e
    
    # Create directory
    sudo mkdir -p /var/www/CandleStick
    sudo chown -R ubuntu:ubuntu /var/www/CandleStick
    
    # Extract files
    cd /var/www/CandleStick
    tar -xzf /tmp/candlestick-deploy.tar.gz
    
    # Install dependencies
    cd server
    npm install --production
    
    cd ../packages/viewer
    npm install --production
    
    # Restart services with PM2
    pm2 restart candlestick-api || pm2 start npm --name "candlestick-api" -- run start:mssql
    pm2 restart candlestick-viewer || pm2 start npm --name "candlestick-viewer" -- run preview
    
    pm2 save
    
    echo "✅ Deployment complete!"
    pm2 status
ENDSSH

# Cleanup
rm candlestick-deploy.tar.gz

echo "✅ Deployment successful!"
echo "   API: http://$LIGHTSAIL_IP:3001"
echo "   Viewer: http://$LIGHTSAIL_IP:3000"
echo ""
echo "Next steps:"
echo "1. Configure Nginx reverse proxy"
echo "2. Set up SSL certificates"
echo "3. Update your MVC app configuration"
