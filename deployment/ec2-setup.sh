#!/bin/bash

# CandleStick EC2 Setup Script
# Run this on a fresh Amazon Linux 2 instance

set -e

echo "🕯️  Setting up CandleStick on EC2..."

# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# Install PM2 globally
sudo npm install -g pm2

# Install nginx
sudo amazon-linux-extras install nginx1 -y

# Create app user
sudo useradd -m -s /bin/bash candlestick

# Switch to app user for app setup
sudo -u candlestick bash << 'EOF'
cd /home/candlestick

# Clone repository
git clone https://github.com/heidebrink/CandleStick.git
cd CandleStick/server

# Install dependencies
npm ci --production

# Build application
npm run build

# Create data directory
mkdir -p /home/candlestick/data

# Create environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3001
CORS_ORIGIN=*
DATA_DIR=/home/candlestick/data
ENVEOF

EOF

# Create PM2 ecosystem file
sudo -u candlestick cat > /home/candlestick/CandleStick/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'candlestick-api',
    script: '/home/candlestick/CandleStick/server/dist/index.js',
    cwd: '/home/candlestick/CandleStick/server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/home/candlestick/logs/err.log',
    out_file: '/home/candlestick/logs/out.log',
    log_file: '/home/candlestick/logs/combined.log',
    time: true
  }]
};
EOF

# Create log directory
sudo -u candlestick mkdir -p /home/candlestick/logs

# Start application with PM2
sudo -u candlestick bash << 'EOF'
cd /home/candlestick/CandleStick
pm2 start ecosystem.config.js
pm2 save
EOF

# Setup PM2 startup script
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u candlestick --hp /home/candlestick

# Configure nginx
sudo tee /etc/nginx/conf.d/candlestick.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
sudo yum install -y firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

echo "✅ CandleStick setup complete!"
echo ""
echo "🌐 Your API is available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "🔍 Health check: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/health"
echo ""
echo "📊 Monitor with: sudo -u candlestick pm2 monit"
echo "📝 View logs: sudo -u candlestick pm2 logs"
echo ""
echo "🔒 Next steps:"
echo "1. Configure SSL certificate"
echo "2. Set up custom domain"
echo "3. Configure monitoring"
echo "4. Set up backups"