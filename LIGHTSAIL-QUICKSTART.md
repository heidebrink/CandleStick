## CandleStick Lightsail Deployment - Quick Start

Fast deployment guide for AWS Lightsail with SQL Server.

### Prerequisites Checklist

- [ ] AWS Lightsail instance running
- [ ] SQL Server installed on Lightsail
- [ ] Node.js 18+ installed
- [ ] SSH access to Lightsail
- [ ] SQL Server credentials

### 1. Setup SQL Server (5 minutes)

SSH into Lightsail and run:

```bash
# Connect to SQL Server
sqlcmd -S localhost -U sa -P 'YourSAPassword'
```

Then paste and run the setup script:

```bash
# Download and run setup script
cd /tmp
curl -O https://raw.githubusercontent.com/heidebrink/CandleStick/main/server/sql/setup.sql
sqlcmd -S localhost -U sa -P 'YourSAPassword' -i setup.sql
```

Or manually:
1. Copy contents of `server/sql/setup.sql`
2. Run in SQL Server Management Studio or sqlcmd

### 2. Deploy CandleStick (10 minutes)

#### Option A: Automated Deployment

From your local machine:

```bash
chmod +x deploy-lightsail.sh
./deploy-lightsail.sh YOUR_LIGHTSAIL_IP path/to/your-key.pem
```

#### Option B: Manual Deployment

```bash
# 1. Upload files
scp -i your-key.pem -r CandleStick ubuntu@YOUR_IP:/home/ubuntu/

# 2. SSH into Lightsail
ssh -i your-key.pem ubuntu@YOUR_IP

# 3. Move to web directory
sudo mv /home/ubuntu/CandleStick /var/www/
cd /var/www/CandleStick

# 4. Install dependencies
cd server
npm install
cd ../packages/viewer
npm install
cd ../packages/sdk
npm install
npm run build

# 5. Configure environment
cd /var/www/CandleStick/server
cp .env.example .env.production
nano .env.production
```

Edit `.env.production`:

```env
PORT=3001
NODE_ENV=production
DB_SERVER=localhost
DB_DATABASE=CandleStick
DB_USER=sa
DB_PASSWORD=YourSAPassword
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
CORS_ORIGIN=https://qa.yourapp.com
```

```bash
# 6. Start services
pm2 start npm --name "candlestick-api" -- run start:mssql
pm2 start npm --name "candlestick-viewer" -- run preview
pm2 save
pm2 startup
```

### 3. Configure Nginx (5 minutes)

```bash
sudo apt-get install -y nginx

# API config
sudo nano /etc/nginx/sites-available/candlestick-api
```

Paste:

```nginx
server {
    listen 80;
    server_name candlestick-api.yourapp.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
}
```

```bash
# Enable and restart
sudo ln -s /etc/nginx/sites-available/candlestick-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Update Your MVC App

In your MVC app's `appsettings.json`:

```json
{
  "CandleStick": {
    "ApiEndpoint": "http://YOUR_LIGHTSAIL_IP:3001/api",
    "Enabled": true,
    "OptInMode": true
  }
}
```

Or with domain:

```json
{
  "CandleStick": {
    "ApiEndpoint": "https://candlestick-api.yourapp.com/api",
    "Enabled": true,
    "OptInMode": true
  }
}
```

### 5. Test It!

```bash
# Check services
pm2 status

# Test API
curl http://localhost:3001/api/health

# View logs
pm2 logs candlestick-api
```

From your browser:
- API: `http://YOUR_LIGHTSAIL_IP:3001/api/health`
- Viewer: `http://YOUR_LIGHTSAIL_IP:3000`

### Troubleshooting

**API won't start:**
```bash
pm2 logs candlestick-api --lines 50
```

**SQL connection failed:**
```bash
# Test connection
sqlcmd -S localhost -U sa -P 'YourPassword' -Q "SELECT @@VERSION"

# Check if SQL Server is running
sudo systemctl status mssql-server
```

**Port already in use:**
```bash
sudo netstat -tulpn | grep 3001
sudo kill -9 [PID]
```

### Lightsail Firewall Configuration

In AWS Lightsail Console → Your Instance → Networking tab:

**Add these firewall rules:**
- HTTP (TCP 80)
- HTTPS (TCP 443)
- SSH (TCP 22) - should already exist

**Don't expose Node.js ports directly** - use Nginx reverse proxy instead.

### Production Checklist

- [ ] Lightsail firewall rules configured (ports 80, 443, 22)
- [ ] Instance UFW firewall enabled
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] SQL Server backups scheduled
- [ ] PM2 auto-restart enabled (`pm2 startup`)
- [ ] Nginx configured as reverse proxy
- [ ] CORS properly set
- [ ] Strong SQL passwords
- [ ] Monitoring set up

### Useful Commands

```bash
# Restart services
pm2 restart all

# View logs
pm2 logs

# Monitor
pm2 monit

# Update deployment
cd /var/www/CandleStick
git pull
cd server && npm install
pm2 restart candlestick-api

# Database backup
sqlcmd -S localhost -U sa -Q "BACKUP DATABASE CandleStick TO DISK = '/var/opt/mssql/backup/candlestick.bak'"
```

### Support

- Full guide: [DEPLOYMENT-LIGHTSAIL.md](DEPLOYMENT-LIGHTSAIL.md)
- Issues: GitHub Issues
- SQL setup: [server/sql/setup.sql](server/sql/setup.sql)
